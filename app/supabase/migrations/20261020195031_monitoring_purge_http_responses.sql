-- Uptime monitor: drop each pg_net response once its check is resolved.
-- pg_net keeps every response body for pg_net.ttl (6 hours). Polling ten
-- endpoints every minute, two of which serve ~1.2 MB homepages, left ~930 MB
-- in net._http_response and pushed the database past the Free Plan's 0.5 GB.
-- The monitoring schema was applied directly (cloud_performance_monitoring),
-- so skip cleanly on databases that don't have it.
do $migration$
begin
  if to_regnamespace('monitoring') is null then
    return;
  end if;

  execute $sql$
create or replace function monitoring.resolve_checks()
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  with resolved as (
    update monitoring.checks c set
      status_code = r.status_code,
      error = coalesce(r.error_msg, case when r.timed_out then 'timeout' end),
      state = case
        when r.timed_out or r.error_msg is not null then 'down'
        when r.status_code not between 200 and 399 then 'down'
        when e.expect_json_status is not null
          and monitoring.json_status(r.content) is distinct from e.expect_json_status then 'down'
        else 'up'
      end
    from net._http_response r, monitoring.endpoints e
    where c.state = 'pending' and r.id = c.request_id and e.id = c.endpoint_id
    returning c.request_id
  )
  delete from net._http_response r
  using resolved
  where r.id = resolved.request_id;

  update monitoring.checks set state = 'gap', error = 'no response recorded by monitor'
  where state = 'pending' and checked_at < now() - interval '10 minutes';
end $function$;
$sql$;
end $migration$;
