import { createClient } from '@supabase/supabase-js';
import { runDecision } from '../src/lib/decision-engine/client.ts';
import { decisionResponseSchema } from '../src/lib/decision-engine/scenarios.ts';

for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DECISION_ENGINE_URL', 'DECISION_ENGINE_API_KEY']) {
  if (!process.env[name]) throw new Error(`Missing required worker configuration: ${name}`);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
while (!stopping) {
  const { data, error } = await db.rpc('claim_decision_run');
  if (error) {
    console.error('Decision queue claim failed; verify migration and database connectivity.');
    await new Promise(resolve => setTimeout(resolve, 5000));
    continue;
  }
  const job = data?.[0];
  if (!job) { await new Promise(resolve => setTimeout(resolve, 2000)); continue; }
  let update;
  try {
    const response = decisionResponseSchema.parse(await runDecision({ engine: job.engine, scenario: job.scenario }));
    if (response.engine !== job.engine) throw new Error('Unexpected engine response');
    update = { status: response.status, response, finished_at: new Date().toISOString(), error: null };
  } catch {
    const failed = job.attempts >= 3;
    update = { status: failed ? 'failed' : 'queued',
      error: failed ? 'The Decision Engine could not complete this run after three attempts.' : 'Engine unavailable; queued for retry.',
      available_at: new Date(Date.now() + 10000 * job.attempts).toISOString(),
      finished_at: failed ? new Date().toISOString() : null };
  }
  const { error: saveError } = await db.from('decision_runs')
    .update({ ...update, lease_until: null, worker_token: null })
    .eq('id', job.id).eq('worker_token', job.worker_token).eq('status', 'running');
  if (saveError) console.error('Decision result persistence failed; lease recovery will retry this run.');
}
