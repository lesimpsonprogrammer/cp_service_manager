import { describe, expect, it } from 'vitest';
import { simulationSchema, optimizationSchema, riskSchema } from '@/lib/decision-engine/scenarios';
describe('Decision scenario workload boundaries', () => {
  it('rejects duplicate task identifiers', () => {
    expect(simulationSchema.safeParse({ tasks: [{id:'a',duration:1},{id:'a',duration:2}], capacity:1,cost_per_time:0 }).success).toBe(false);
  });
  it('defaults missing arrivals to zero', () => {
    expect(simulationSchema.parse({tasks:[{id:'a',duration:1}],capacity:1,cost_per_time:0}).tasks[0]!.arrival).toBe(0);
  });
  it('rejects ragged and undersupplied assignment matrices', () => {
    expect(optimizationSchema.safeParse({costs:[[1,2],[3]]}).success).toBe(false);
    expect(optimizationSchema.safeParse({costs:[[1,2]]}).success).toBe(false);
    expect(optimizationSchema.safeParse({costs:[[1,2],[3,4]]}).success).toBe(true);
  });
  it('bounds probabilistic sample workload', () => {
    expect(riskSchema.safeParse({mean:10,standard_deviation:2,deadline:12,samples:10001,seed:42}).success).toBe(false);
  });
});
