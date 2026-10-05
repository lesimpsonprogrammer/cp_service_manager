# Decision Center cloud worker

The API saves a queued job and returns HTTP 202. A separate Railway worker
claims jobs atomically from Supabase, calls the private Python engine, and saves
results. The browser polls the selected job; closing it does not cancel work.

Apply `supabase/migrations/20261005232054_decision_runs.sql` to the **CPSM**
database first, not the separately connected Knowledge Base project.

Create a Railway service from this repository, root `/app`, with build command
`npm ci` and start command `npm run decision:worker`. Use Node 24 (minimum
22.13). This service needs no public domain. Configure private variables:

- `NEXT_PUBLIC_SUPABASE_URL`: the same CPSM database as the app
- `SUPABASE_SERVICE_ROLE_KEY`: private CPSM service role credential
- `DECISION_ENGINE_URL`: the existing Python engine URL
- `DECISION_ENGINE_API_KEY`: the existing private engine credential
- `DECISION_ENGINE_TIMEOUT_MS`: optional; capped at 15000 ms

The app also needs its existing service-role credential. Never put either private
key in a NEXT_PUBLIC variable or source control.

Claims use row locks and SKIP LOCKED, two-minute leases and worker ownership
tokens. Interrupted work is recovered after lease expiration. Failed calls retry
up to three attempts with a delay. Computation is at-least-once: a crash after
computation but before saving can repeat the calculation. These engines calculate
results only; do not add external business mutations without engine idempotency.

Acceptance: submit the sample simulation, close the browser, reopen history and
confirm completion time 5 and busy-time cost 50. Submit assignment costs 10,1 /
2,10 and confirm total cost 3. Stop a worker mid-run, restart it, and confirm lease
recovery. Verify a second organization cannot read the first organization's runs
and members cannot submit runs. These production checks have not been performed.

Rollback: stop the worker and revert the application commit. Preserve the history
table and results; do not drop tenant data to roll back UI changes.

LOCATION: Decision Center workbench and API; Jaren conversation pane and prompt.
SCOPE: local component styles; no global CSS changes.
RISK: worker deployment and migration required before jobs can complete; limits
are per-organization and advisory under concurrent submissions.
ROLLBACK: revert this feature commit; retain stored results.
