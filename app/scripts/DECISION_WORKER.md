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

## Built-in mode (no worker, no Python service)

Set `DECISION_ENGINE_MODE=builtin` on a CPSM deployment to run the three
computations inside CPSM (`src/lib/decision-engine/builtin.ts`) instead of
calling the Python engine. Runs are computed when submitted and saved already
finished, so that deployment needs no worker and no `DECISION_ENGINE_URL` or
`DECISION_ENGINE_API_KEY`. Leave the variable unset to keep the external
engine and this worker; deployments without it behave exactly as before.

Simulation and optimization return the same answers as the Python engine.
Risk uses the same lognormal model and seeds, but a different random-number
generator, so individual sampled values differ slightly from the Python
engine's for the same seed.
