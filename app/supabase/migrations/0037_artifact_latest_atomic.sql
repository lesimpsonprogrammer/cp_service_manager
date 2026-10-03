-- Artifact Management follow-up: make "which version is latest" atomic.
--
-- 0036 promoted the latest version of a key with separate clear/set updates
-- from the app, so two uploads of the same key finalized at the same moment
-- could interleave and leave two `is_latest` rows (or an older one marked
-- latest). This moves promotion into one function that serializes per
-- bucket/key with a transaction-scoped advisory lock, and backs it with a
-- unique partial index so a second latest row can never be written.

-- Repair any key that already has more than one latest row (keep the newest).
update public.artifacts a
set is_latest = false
where a.is_latest
  and exists (
    select 1 from public.artifacts b
    where b.bucket_id = a.bucket_id
      and b.key = a.key
      and b.is_latest
      and b.version > a.version
  );

drop index if exists public.artifacts_bucket_latest_idx;

create unique index artifacts_bucket_key_latest_uidx
  on public.artifacts (bucket_id, key)
  where is_latest;

-- SECURITY INVOKER: callers' RLS still applies (dashboard users can only touch
-- their own org's rows; the API path runs as the service role after its own
-- org check).
create or replace function public.refresh_artifact_latest(p_bucket_id uuid, p_key text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  newest_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_bucket_id::text || '/' || p_key, 0));

  select id into newest_id
  from public.artifacts
  where bucket_id = p_bucket_id
    and key = p_key
    and status = 'available'
  order by version desc
  limit 1;

  update public.artifacts
  set is_latest = false
  where bucket_id = p_bucket_id
    and key = p_key
    and is_latest
    and id is distinct from newest_id;

  if newest_id is not null then
    update public.artifacts
    set is_latest = true
    where id = newest_id
      and not is_latest;
  end if;
end;
$$;

revoke execute on function public.refresh_artifact_latest(uuid, text) from public, anon;
grant execute on function public.refresh_artifact_latest(uuid, text) to authenticated, service_role;
