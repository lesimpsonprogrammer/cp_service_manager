import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('@/lib/decision-engine/client',()=>({getDecisionEngineHealth:vi.fn(),runDecision:vi.fn()}));
import {getDecisionEngineHealth,runDecision} from '@/lib/decision-engine/client';
import {decisionHealth,databaseHealth} from '@/lib/status/platform-health';
const env={...process.env};
afterEach(()=>{process.env={...env};vi.resetAllMocks()});
describe('GLASS platform monitoring',()=>{
 it('verifies all three computations',async()=>{
 vi.mocked(getDecisionEngineHealth).mockResolvedValue({status:'up',engines:[],detail:'private detail'});
 vi.mocked(runDecision).mockResolvedValue({runId:'id',status:'completed',engine:'combined',result:{simulation:{completion_time:5,busy_time_cost:50},optimization:{total_cost:3,optimal:true},risk:{samples:100,p95:14,probability_of_delay:.2}}});
 expect((await decisionHealth()).status).toBe('operational');
 });
 it('rejects an incorrect computation',async()=>{
 vi.mocked(getDecisionEngineHealth).mockResolvedValue({status:'up',engines:[],detail:''});
 vi.mocked(runDecision).mockResolvedValue({runId:'id',status:'completed',engine:'combined',result:{}});
 expect((await decisionHealth()).status).toBe('degraded');
 });
 it('does not expose provider diagnostics',async()=>{
 vi.mocked(getDecisionEngineHealth).mockRejectedValue(new Error('secret internal URL'));
 expect(JSON.stringify(await decisionHealth())).not.toContain('secret');
 });
 it('checks database and auth without reading records or signing in',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='secret';
 const f=vi.fn().mockResolvedValueOnce(Response.json([])).mockResolvedValueOnce(Response.json({external:{email:true},mailer_autoconfirm:false}));
 const h=await databaseHealth(f);expect(h.status).toBe('operational');expect(f.mock.calls[0]![0]).toContain('limit=0');expect(f.mock.calls[1]![0]).toContain('/auth/v1/settings');expect(JSON.stringify(h)).not.toContain('secret');
 });
 it('does not treat malformed database replies as healthy',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='secret';
 expect((await databaseHealth(vi.fn().mockResolvedValue(Response.json({})))).status).toBe('unknown');
 });
});
