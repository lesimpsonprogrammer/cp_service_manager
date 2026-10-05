import os
os.environ['DECISION_ENGINE_API_KEY'] = 'test-only-key-' + 'x'*32
from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
headers = {'Authorization': 'Bearer '+os.environ['DECISION_ENGINE_API_KEY']}

def call(engine, scenario, **kwargs):
    return client.post('/v1/decisions/run', headers=headers, json={'engine': engine, 'scenario': scenario, **kwargs})

def test_auth_and_health():
    assert client.get('/health').status_code == 401
    assert client.get('/health', headers={'Authorization':'Bearer wrong'}).status_code == 401
    assert len(client.get('/health', headers=headers).json()['engines']) == 3

def test_missing_config(monkeypatch):
    monkeypatch.delenv('DECISION_ENGINE_API_KEY')
    assert client.get('/ready').status_code == 503
    assert client.get('/health', headers=headers).status_code == 503

def test_simulation_queue():
    r = call('simulation', {'tasks':[{'id':'a','duration':3},{'id':'b','duration':2}], 'cost_per_time':10})
    assert r.status_code == 200
    result = r.json()['result']
    assert result['completion_time'] == 5
    assert result['tasks'][1]['wait'] == 3
    assert result['busy_time_cost'] == 50

def test_parallel_simulation():
    r = call('simulation', {'tasks':[{'id':'a','duration':3},{'id':'b','duration':2}], 'capacity':2})
    assert r.json()['result']['completion_time'] == 3

def test_risk_reproducible():
    s = {'mean':10,'standard_deviation':2,'deadline':10}
    a,b = call('risk',s),call('risk',s)
    assert a.status_code == 200
    assert a.json()['result'] == b.json()['result']
    assert 9 < a.json()['result']['mean'] < 11
    assert 0 < a.json()['result']['probability_of_delay'] < 1

def test_optimal_assignment():
    r = call('optimization', {'costs':[[10,1],[2,10]]})
    assert r.status_code == 200
    assert r.json()['result']['total_cost'] == 3
    assert r.json()['result']['optimal']

def test_bad_scenarios():
    for engine,s in [('simulation',{'tasks':[]}),('risk',{'mean':10,'standard_deviation':0,'deadline':10}),
                     ('optimization',{'costs':[[1,2],[3]]}),('optimization',{'costs':[[1,2]]}),
                     ('combined',{})]:
        assert call(engine,s).status_code == 422
    assert call('simulation',{'tasks':[{'id':'a','duration':1}]}, constraints=[{'unknown':1}]).status_code == 422

def test_combined():
    r = call('combined', {'simulation':{'tasks':[{'id':'a','duration':1}]},
                         'risk':{'mean':10,'standard_deviation':2,'deadline':12},
                         'optimization':{'costs':[[1]]}})
    assert r.status_code == 200
    assert set(r.json()['result']) == {'simulation','risk','optimization'}
