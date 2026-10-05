import {getDecisionEngineHealth,runDecision} from '@/lib/decision-engine/client';
type Health={status:'operational'|'degraded'|'unknown';checkedAt:string;scope:string;detail:string};
const result=(status:Health['status'],scope:string,detail:string):Health=>({status,scope,detail,checkedAt:new Date().toISOString()});
export async function decisionHealth():Promise<Health>{
 const scope='synthetic_computation';
 try{
 const health=await getDecisionEngineHealth();
 if(health.status!=='up')return result(health.status==='not_configured'?'unknown':'degraded',scope,'Decision Engine readiness could not be verified.');
 const run=await runDecision({engine:'combined',scenario:{simulation:{tasks:[{id:'check-a',duration:3},{id:'check-b',duration:2}],capacity:1,cost_per_time:10},risk:{mean:10,standard_deviation:2,deadline:12,samples:100,seed:42},optimization:{costs:[[10,1],[2,10]]}}});
 const s=run.result?.simulation as Record<string,unknown>|undefined,r=run.result?.risk as Record<string,unknown>|undefined,o=run.result?.optimization as Record<string,unknown>|undefined;
 const valid=run.status==='completed'&&run.engine==='combined'&&s?.completion_time===5&&s.busy_time_cost===50&&o?.total_cost===3&&o.optimal===true&&r?.samples===100&&typeof r.p95==='number'&&Number.isFinite(r.p95)&&typeof r.probability_of_delay==='number'&&r.probability_of_delay>=0&&r.probability_of_delay<=1;
 return result(valid?'operational':'degraded',scope,valid?'Simulation, risk, and optimization passed bounded synthetic computations. Client scenarios and saved run history are not tested.':'Decision Engine synthetic computations did not pass.');
 }catch{return result('unknown',scope,'Decision Engine computation could not be verified.');}
}
export async function databaseHealth(requestFetch:typeof fetch=fetch):Promise<Health>{
 const scope='database_and_auth_services';
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,''),anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!service)return result('unknown',scope,'Database and authentication monitoring is not configured.');
 try{
 const [db,auth]=await Promise.all([
 requestFetch(`${url}/rest/v1/organizations?select=id&limit=0`,{headers:{apikey:service,Authorization:`Bearer ${service}`},signal:AbortSignal.timeout(8000),cache:'no-store'}),
 requestFetch(`${url}/auth/v1/settings`,{headers:{apikey:anon},signal:AbortSignal.timeout(8000),cache:'no-store'})]);
 if(!db.ok||!auth.ok)return result('degraded',scope,'Database query or authentication service check failed.');
 const [rows,settings]=await Promise.all([db.json(),auth.json()]);
 const valid=Array.isArray(rows)&&rows.length===0&&settings&&typeof settings.external==='object'&&settings.external!==null&&typeof settings.mailer_autoconfirm==='boolean';
 return result(valid?'operational':'unknown',scope,valid?'Application database query and authentication configuration endpoint verified. User sign-in, MFA, and tenant permissions are not tested.':'Database and authentication response could not be verified.');
 }catch{return result('unknown',scope,'Database and authentication checks could not complete.');}
}
