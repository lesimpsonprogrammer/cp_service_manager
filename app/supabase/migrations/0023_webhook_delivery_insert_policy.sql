-- webhook_deliveries only ever got a SELECT policy (0001_init.sql), so
-- dispatchEvent()'s insert -- run with the caller's session-scoped client on
-- every dashboard-triggered pipeline run, not the admin client -- was
-- silently rejected by RLS. Outbound webhook delivery logs stayed empty for
-- any run that didn't go through the API-key/admin-client path.

create policy "org members can log webhook deliveries"
  on webhook_deliveries for insert
  with check (public.is_org_member(org_id));
