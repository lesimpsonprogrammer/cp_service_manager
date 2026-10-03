"""CPSM decision service: bounded scenario computations; no database access."""
import logging
import os
import secrets
import time
from typing import Literal
from uuid import uuid4

import numpy as np
import pymc as pm
import simpy
from fastapi import Depends, FastAPI, Header, HTTPException
from ortools.sat.python import cp_model
from pydantic import BaseModel, ConfigDict, Field, ValidationError

app = FastAPI(title='CPSM Decision Engine', docs_url=None, redoc_url=None, openapi_url=None)
logger = logging.getLogger('cpsm.decision')

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)

class Task(StrictModel):
    id: str = Field(min_length=1, max_length=80)
    duration: float = Field(gt=0, le=1000000)
    arrival: float = Field(default=0, ge=0, le=1000000)

class Simulation(StrictModel):
    tasks: list[Task] = Field(min_length=1, max_length=200)
    capacity: int = Field(default=1, ge=1, le=100)
    cost_per_time: float = Field(default=0, ge=0, le=1000000)

class Risk(StrictModel):
    mean: float = Field(gt=0, le=1000000)
    standard_deviation: float = Field(gt=0, le=1000000)
    deadline: float = Field(gt=0, le=1000000)
    samples: int = Field(default=2000, ge=100, le=10000)
    seed: int = Field(default=42, ge=0, le=2147483647)

class Optimization(StrictModel):
    costs: list[list[int]] = Field(min_length=1, max_length=30)

class DecisionRequest(StrictModel):
    engine: Literal['simulation', 'risk', 'optimization', 'combined']
    scenario: dict
    objective: dict | None = None
    constraints: list[dict] | None = None
    metadata: dict | None = None


def authorize(authorization: str | None = Header(default=None)):
    key = os.getenv('DECISION_ENGINE_API_KEY', '')
    if len(key) < 32:
        raise HTTPException(503, 'Service authentication is not configured.')
    expected = 'Bearer ' + key
    if not authorization or not secrets.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(401, 'Invalid service credentials.', headers={'WWW-Authenticate': 'Bearer'})

@app.get('/ready')
def ready():
    if len(os.getenv('DECISION_ENGINE_API_KEY', '')) < 32:
        raise HTTPException(503, 'Service authentication is not configured.')
    return {'status': 'ready'}

@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'status': 'up', 'version': '1.0.0', 'detail': 'All three computational engines are loaded.',
            'engines': [{'name': name, 'available': True, 'implementation': impl} for name, impl in
                        [('simulation', 'SimPy'), ('risk', 'PyMC'), ('optimization', 'OR-Tools / CP-SAT')]]}


def simulate(data):
    scenario = Simulation.model_validate(data)
    if len({t.id for t in scenario.tasks}) != len(scenario.tasks):
        raise ValueError('Task IDs must be unique.')
    env = simpy.Environment()
    resource = simpy.Resource(env, capacity=scenario.capacity)
    records = []
    def process(task):
        yield env.timeout(task.arrival)
        with resource.request() as request:
            yield request
            start = env.now
            yield env.timeout(task.duration)
            records.append({'id': task.id, 'start': start, 'finish': env.now, 'wait': start-task.arrival})
    for task in scenario.tasks:
        env.process(process(task))
    env.run()
    return {'tasks': records, 'completion_time': env.now,
            'busy_time_cost': sum(t.duration for t in scenario.tasks)*scenario.cost_per_time}


def risk(data):
    scenario = Risk.model_validate(data)
    # Lognormal parameters preserve the caller's arithmetic mean and standard deviation.
    sigma = float(np.sqrt(np.log1p((scenario.standard_deviation/scenario.mean)**2)))
    mu = float(np.log(scenario.mean) - sigma*sigma/2)
    values = pm.draw(pm.LogNormal.dist(mu=mu, sigma=sigma), draws=scenario.samples, random_seed=scenario.seed)
    return {'mean': float(np.mean(values)), 'p50': float(np.quantile(values, .5)),
            'p95': float(np.quantile(values, .95)), 'probability_of_delay': float(np.mean(values > scenario.deadline)),
            'samples': scenario.samples, 'seed': scenario.seed,
            'assumption': 'Lognormal duration from supplied mean and deviation; no posterior fitting.'}


def optimize(data):
    scenario = Optimization.model_validate(data)
    costs = scenario.costs
    columns = len(costs[0])
    if not 1 <= columns <= 30 or any(len(row) != columns for row in costs):
        raise ValueError('Costs must be a rectangular matrix with 1 to 30 columns.')
    if len(costs) < columns:
        raise ValueError('At least one distinct worker per task is required.')
    if any(abs(v) > 1000000 for row in costs for v in row):
        raise ValueError('Cost magnitude must be at most 1000000.')
    model = cp_model.CpModel()
    assignments = [[model.new_bool_var(f'x_{w}_{t}') for t in range(columns)] for w in range(len(costs))]
    for t in range(columns):
        model.add_exactly_one(assignments[w][t] for w in range(len(costs)))
    for row in assignments:
        model.add_at_most_one(row)
    model.minimize(sum(costs[w][t]*assignments[w][t] for w in range(len(costs)) for t in range(columns)))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    solver.parameters.num_search_workers = 1
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise ValueError('No feasible assignment found within the time limit.')
    return {'assignments': [{'worker': w, 'task': t, 'cost': costs[w][t]} for w in range(len(costs))
                            for t in range(columns) if solver.value(assignments[w][t])],
            'total_cost': solver.objective_value, 'optimal': status == cp_model.OPTIMAL}

@app.post('/v1/decisions/run', dependencies=[Depends(authorize)])
def run(request: DecisionRequest):
    started = time.monotonic()
    run_id = str(uuid4())
    if request.objective or request.constraints:
        raise HTTPException(422, 'This version supports only the documented built-in objectives and constraints.')
    engines = {'simulation': simulate, 'risk': risk, 'optimization': optimize}
    try:
        if request.engine == 'combined':
            if set(request.scenario) != set(engines):
                raise ValueError('Combined scenarios require simulation, risk, and optimization sections.')
            result = {name: fn(request.scenario[name]) for name, fn in engines.items()}
        else:
            result = engines[request.engine](request.scenario)
    except (ValidationError, ValueError, TypeError) as error:
        # Do not return Pydantic input values or log scenario/client data.
        detail = 'Scenario does not match the documented schema.' if isinstance(error, ValidationError) else str(error)
        raise HTTPException(422, detail) from None
    elapsed = (time.monotonic()-started)*1000
    logger.warning('decision_run run_id=%s engine=%s status=completed elapsed_ms=%.1f', run_id, request.engine, elapsed)
    warnings = ['Risk estimates depend on supplied assumptions.'] if request.engine in ('risk', 'combined') else []
    if request.engine == 'optimization' and not result['optimal']:
        warnings.append('Feasible assignment returned; optimality is not proven.')
    return {'runId': run_id, 'status': 'completed', 'engine': request.engine,
            'result': result, 'warnings': warnings, 'metrics': {'durationMs': elapsed}}
