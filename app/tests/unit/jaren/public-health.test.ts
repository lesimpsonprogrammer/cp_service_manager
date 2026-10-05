import {afterEach, describe, expect, it, vi} from 'vitest';
import {checkPublicJarenConnection} from '@/lib/jaren/public-health';
afterEach(() => vi.unstubAllGlobals());
describe('public Jaren connection check', () => {
  it('does not call OpenAI without a credential', async () => {
    const fetcher = vi.fn();
    expect((await checkPublicJarenConnection(undefined, 'gpt-5', fetcher)).status).toBe('degraded');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('checks generated response without exposing model details', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({status:'completed',output:[{content:[{type:'output_text',text:'OK'}]}]}));
    const result = await checkPublicJarenConnection('secret', 'gpt-5', fetcher);
    expect(result.status).toBe('operational');
    expect(fetcher.mock.calls[0]![0]).toBe('https://api.openai.com/v1/responses');
    expect(fetcher.mock.calls[0]![1].method).toBe('POST');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('gpt-5');
  });
  it('reports rejected connection as degraded without upstream errors', async () => {
    const result = await checkPublicJarenConnection('secret','gpt-5',vi.fn().mockResolvedValue(Response.json({error:{message:'private provider detail'}},{status:401})));
    expect(result.status).toBe('degraded');
    expect(JSON.stringify(result)).not.toContain('private provider detail');
  });
  it('reports an invalid successful payload as unknown', async () => {
    const result = await checkPublicJarenConnection('secret','gpt-5',vi.fn().mockResolvedValue(Response.json({})));
    expect(result.status).toBe('unknown');
  });
  it('reports timeouts as unknown', async () => {
    const result = await checkPublicJarenConnection('secret','gpt-5',vi.fn().mockRejectedValue(new Error('timeout')));
    expect(result.status).toBe('unknown');
  });
});
