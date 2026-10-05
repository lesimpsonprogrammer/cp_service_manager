import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({org:vi.fn(), db:vi.fn()}));
vi.mock('@/lib/org/getCurrentOrg', () => ({getCurrentOrg:mocks.org}));
vi.mock('@/lib/supabase/admin', () => ({createAdminClient:mocks.db}));
import { POST, GET } from '@/app/api/decision-center/runs/route';
const input = {requestId:'00000000-0000-4000-8000-000000000001',name:'Sample',engine:'simulation',scenario:{tasks:[{id:'a',duration:3}],capacity:1,cost_per_time:10}};
function request(origin = 'https://cpsm.test') { return new Request('https://cpsm.test/api/decision-center/runs',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)}); }
function database(results: unknown[]) {
  const query: Record<string,unknown> = {};
  for(const method of ['select','eq','gte','insert']) query[method] = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => results.shift());
  query.then = (resolve: (value:unknown) => unknown) => Promise.resolve(results.shift()).then(resolve);
  return {from:vi.fn(() => query)};
}
beforeEach(() => { vi.clearAllMocks(); mocks.org.mockResolvedValue({orgId:'org-a',userId:'user-a',role:'admin'}); });
describe('Organization decision queue submission', () => {
  it('requires authentication', async () => {mocks.org.mockResolvedValue(null);expect((await POST(request())).status).toBe(401);expect((await GET(new Request('https://cpsm.test'))).status).toBe(401);expect(mocks.db).not.toHaveBeenCalled();});
  it('blocks non-administrators and cross-origin submissions', async () => {mocks.org.mockResolvedValue({role:'member'});expect((await POST(request())).status).toBe(403);mocks.org.mockResolvedValue({role:'admin'});expect((await POST(request('https://other.test'))).status).toBe(403);expect(mocks.db).not.toHaveBeenCalled();});
  it('does not accept work when storage is unavailable', async () => {mocks.db.mockReturnValue(database([{error:{message:'unavailable'},data:null}]));expect((await POST(request())).status).toBe(503);});
  it('returns an existing in-flight run without inserting twice', async () => {const db=database([{data:{id:input.requestId,status:'queued'},error:null}]);mocks.db.mockReturnValue(db);expect((await POST(request())).status).toBe(409);expect(db.from).toHaveBeenCalledTimes(1);});
  it('persists a job and acknowledges before executing it', async () => {const db=database([{data:null,error:null},{count:0,error:null},{error:null}]);mocks.db.mockReturnValue(db);const res=await POST(request());expect(res.status).toBe(202);expect((await res.json()).run.status).toBe('queued');});
});
