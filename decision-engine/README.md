# CPSM Decision Engine

Proprietary CPSM service. Keep in the existing private repository.

## Scope

Version 1 supports independent FIFO tasks sharing a capacity pool (SimPy), lognormal duration uncertainty from supplied mean/deviation (PyMC), and minimum-cost one-worker-per-task assignment (OR-Tools CP-SAT). Combined mode executes the three supplied scenario sections independently; it does not automatically feed one engine's output to another. Custom objectives/constraints are rejected instead of silently ignored. No database access or automatic client actions. CPSM remains responsible for tenant authorization, approved inputs, and durable run history. Service logs contain run ID, engine and timing only, never scenarios or credentials.

## Railway deployment

Use repo `lesimpsonprogrammer/cp_service_manager`, branch `feature/cpsm-python-decision-service`, service root `/decision-engine`, Dockerfile `Dockerfile`, config file `/decision-engine/railway.toml`. Healthcheck `/ready` is public and reveals readiness only; `/health` and run endpoints require Bearer authentication. Set `DECISION_ENGINE_API_KEY` to a cryptographically random secret at least 32 characters long. Expose HTTPS for CPSM if CPSM runs outside Railway. Keep one worker and bounded concurrency; no database required.

Set on the CPSM deployment serving app2, then redeploy:

- `DECISION_ENGINE_URL`: engine HTTPS base URL (no endpoint suffix)
- `DECISION_ENGINE_API_KEY`: the same shared secret
- `DECISION_ENGINE_TIMEOUT_MS`: `15000`

These variables must remain server-only. Do not prefix them with NEXT_PUBLIC_.

## Requests

`GET /health`, `POST /v1/decisions/run`: `Authorization: Bearer <secret>`.

Simulation:
```json
{"engine":"simulation","scenario":{"tasks":[{"id":"payroll-review","duration":3},{"id":"validation","duration":2}],"capacity":1,"cost_per_time":10}}
```
Time and cost units are caller-defined and must be consistent. Tasks start at `arrival` (default 0); IDs must be unique. Cost is total busy task time multiplied by cost_per_time, not elapsed project time.

Risk:
```json
{"engine":"risk","scenario":{"mean":10,"standard_deviation":2,"deadline":12,"samples":2000,"seed":42}}
```
This is assumption-based sampling, not posterior learning. Outputs include mean, p50, p95 and probability of duration exceeding deadline.

Optimization:
```json
{"engine":"optimization","scenario":{"costs":[[10,1],[2,10]]}}
```
Rows are workers, columns tasks. Every task gets one worker; each worker gets at most one task. Integer costs; maximum 30x30. Solver is limited to 5 seconds; feasible results indicate whether optimality is proven.

Combined: use `engine: combined` and `scenario` containing the three keys `simulation`, `risk`, `optimization`, each holding its schema above. Response matches CPSM's runId/status/engine/result/warnings/metrics contract. No persistence is implied by runId.

## Local verification

Python 3.12:
```sh
python -m venv .venv
.venv/bin/pip install -r requirements.txt
PYTENSOR_FLAGS=cxx= .venv/bin/python -m pytest tests -q
```

Rollback: remove the three CPSM variables and redeploy CPSM, then stop the engine service. Existing CPSM features do not depend on this service.
