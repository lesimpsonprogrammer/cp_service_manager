"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { decisionSubmissionSchema, type DecisionResponse, type RunEngine, type SavedDecisionRun } from "@/lib/decision-engine/scenarios";

type Summary = Pick<SavedDecisionRun, "id" | "name" | "engine" | "status" | "created_at" | "finished_at">;
const inputClass = "mt-1 w-full rounded-[1.5px] border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";
const examples = { tasks: "payroll-review,3,0\nvalidation,2,0", costs: "10,1\n2,10" };

function numeric(value: string, name: string) {
  if (!value.trim() || !Number.isFinite(Number(value))) throw new Error(`${name} must be a number.`);
  return Number(value);
}
function matrix(value: string) {
  return value.trim().split(/\n/).map((row, i) => row.split(",").map(v => numeric(v, `Cost in row ${i + 1}`)));
}
const object = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
function format(value: unknown) { return typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"; }

function EngineResult({ engine, value }: { engine: string; value: unknown }) {
  const result = object(value);
  const metrics = engine === "simulation" ? [["Completion time", result.completion_time], ["Busy-time cost", result.busy_time_cost]] : engine === "risk" ? [["Sample mean", result.mean], ["Median (p50)", result.p50], ["95th percentile", result.p95], ["Probability of delay", typeof result.probability_of_delay === "number" ? `${(result.probability_of_delay * 100).toFixed(2)}%` : "—"]] : [["Total cost", result.total_cost], ["Optimality", result.optimal === true ? "Proven optimal" : "Feasible; not proven optimal"]];
  const rows = engine === "simulation" ? result.tasks : engine === "optimization" ? result.assignments : null;
  return <section className="space-y-3"><h3 className="font-medium capitalize">{engine}</h3>
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">{metrics.map(([label, metric]) => <div key={String(label)} className="border border-border p-3"><dt className="text-xs text-muted">{String(label)}</dt><dd className="mt-1 font-medium">{typeof metric === "string" ? metric : format(metric)}</dd></div>)}</dl>
    {Array.isArray(rows) && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{engine === "simulation" ? "Task schedule" : "Worker assignments"}</caption><thead><tr>{(engine === "simulation" ? ["Task", "Start", "Finish", "Wait"] : ["Worker", "Task", "Cost"]).map(label => <th key={label} scope="col" className="border-b border-border py-2 pr-4">{label}</th>)}</tr></thead><tbody>{rows.map((value, i) => { const row = object(value); const cells = engine === "simulation" ? [String(row.id ?? i), format(row.start), format(row.finish), format(row.wait)] : [typeof row.worker === "number" ? row.worker + 1 : "—", typeof row.task === "number" ? row.task + 1 : "—", format(row.cost)]; return <tr key={i}>{cells.map((cell, j) => <td key={j} className="border-b border-border py-2 pr-4">{cell}</td>)}</tr>; })}</tbody></table></div>}
    {engine === "risk" && <p className="text-xs text-muted">{String(result.assumption ?? "Estimates depend on the supplied assumptions.")} Samples: {format(result.samples)}; seed: {format(result.seed)}.</p>}
  </section>;
}

export default function DecisionWorkbench({ ready }: { ready: boolean }) {
  const [engine, setEngine] = useState<RunEngine>("simulation"), [name, setName] = useState("Payroll workflow test");
  const [tasks, setTasks] = useState(examples.tasks), [capacity, setCapacity] = useState("1"), [cost, setCost] = useState("10");
  const [mean, setMean] = useState("10"), [deviation, setDeviation] = useState("2"), [deadline, setDeadline] = useState("12"), [samples, setSamples] = useState("2000"), [seed, setSeed] = useState("42"), [costs, setCosts] = useState(examples.costs);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [historyError, setHistoryError] = useState(""), [historyBusy, setHistoryBusy] = useState(true);
  const [runs, setRuns] = useState<Summary[]>([]), [selected, setSelected] = useState<SavedDecisionRun | null>(null), [response, setResponse] = useState<DecisionResponse | null>(null), [saved, setSaved] = useState(false);
  const submission = useRef<{ key: string; id: string } | null>(null);
  const selection = useRef(0);
  const refreshHistory = useCallback(async () => {
    setHistoryBusy(true); setHistoryError("");
    try { const res = await fetch("/api/decision-center/runs", { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Run history could not load."); setRuns(data.runs); }
    catch (error) { setHistoryError(error instanceof Error ? error.message : "Run history could not load."); }
    finally { setHistoryBusy(false); }
  }, []);
  useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  useEffect(() => {
    if (!selected || !["queued", "running"].includes(selected.status)) return;
    const id = selected.id;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/decision-center/runs?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setSelected(data.run); setResponse(data.run.response);
        if (!["queued", "running"].includes(data.run.status)) {
          setMessage(data.run.error || `Run ${data.run.status}; saved to organization history.`);
          submission.current = null; void refreshHistory();
        }
      } catch { /* Keep the stored run visible; the next poll can recover. */ }
    }, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selected?.id, selected?.status, refreshHistory]);
  async function openRun(id: string) {
    const revision = ++selection.current; setMessage("Loading saved run…");
    try { const res = await fetch(`/api/decision-center/runs?id=${encodeURIComponent(id)}`, { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Run could not load."); if (revision !== selection.current) return; setSelected(data.run); setResponse(data.run.response); setSaved(true); setMessage(data.run.error || (["queued", "running"].includes(data.run.status) ? "This run is queued or processing in the cloud. You can close this page and return to history for the result." : "Saved run loaded.")); }
    catch (error) { if (revision === selection.current) setMessage(error instanceof Error ? error.message : "Run could not load."); }
  }
  async function run(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage(""); ++selection.current;
    try {
      const simulation = () => ({ tasks: tasks.trim().split(/\n/).map((line, index) => { const fields = line.split(","); if (fields.length < 2 || fields.length > 3) throw new Error(`Task row ${index + 1}: use ID,duration,arrival.`); return { id: fields[0]!.trim(), duration: numeric(fields[1]!, "Duration"), arrival: fields.length === 3 ? numeric(fields[2]!, "Arrival") : 0 }; }), capacity: numeric(capacity, "Capacity"), cost_per_time: numeric(cost, "Cost per time unit") });
      const risk = () => ({ mean: numeric(mean, "Mean"), standard_deviation: numeric(deviation, "Standard deviation"), deadline: numeric(deadline, "Deadline"), samples: numeric(samples, "Samples"), seed: numeric(seed, "Seed") });
      const optimization = () => ({ costs: matrix(costs) });
      const scenario = engine === "simulation" ? simulation() : engine === "risk" ? risk() : engine === "optimization" ? optimization() : { simulation: simulation(), risk: risk(), optimization: optimization() };
      const key = JSON.stringify({ name: name.trim(), engine, scenario });
      if (!submission.current || submission.current.key !== key) submission.current = { key, id: crypto.randomUUID() };
      const parsed = decisionSubmissionSchema.safeParse({ requestId: submission.current.id, name, engine, scenario });
      if (!parsed.success) throw new Error(parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(" "));
      setSelected(null); setResponse(null); setSaved(false);
      const res = await fetch("/api/decision-center/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await res.json();
      if (!res.ok) { if (data.run) { setSelected(data.run); setResponse(data.run.response); setSaved(true); } throw new Error(data.error || "The run did not complete."); }
      setSelected(data.run || null); setResponse(data.run?.response || data.response || null); setSaved(data.saved === true);
      setMessage(data.error || (data.saved ? `Run ${data.run.status}; saved to organization history.` : "Result is not saved."));
      if (!["queued", "running"].includes(data.run?.status)) submission.current = null;
    } catch (error) { setMessage(error instanceof Error ? error.message : "The run could not complete. Retry the same inputs to check its status without starting it twice."); }
    finally { setBusy(false); void refreshHistory(); }
  }
  function download() {
    const blob = new Blob([JSON.stringify(selected || { saved: false, response }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `decision-run-${selected?.id || "unsaved"}.json`; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="my-6 space-y-6">
    <Card><CardHeader><CardTitle>Run a scenario</CardTitle></CardHeader><CardContent>
      <p className="mb-4 text-sm text-muted">Inputs use your chosen time and cost units. Each run saves its inputs and results in your organization’s history. Combined mode runs three independent scenarios.</p>
      {!ready && <p className="mb-4 text-sm text-warning" role="status">The engine is not fully ready. Check the service connection before running.</p>}
      <form onSubmit={run}><fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Decision scenario inputs</legend>
        <div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Run name<input value={name} onChange={e => setName(e.target.value)} maxLength={120} required className={inputClass}/></label><label className="text-sm">Engine<select value={engine} onChange={e => setEngine(e.target.value as RunEngine)} className={inputClass}><option value="simulation">Simulation</option><option value="risk">Risk</option><option value="optimization">Optimization</option><option value="combined">Combined</option></select></label></div>
        {(engine === "simulation" || engine === "combined") && <section className="space-y-3"><h3 className="font-medium">Simulation inputs</h3><label className="block text-sm">Tasks<textarea aria-describedby="task-help" value={tasks} onChange={e => setTasks(e.target.value)} rows={4} required className={inputClass}/></label><p id="task-help" className="text-xs text-muted">One task per line: ID,duration,arrival. Arrival is optional and defaults to 0. IDs must be unique. Example: payroll-review,3,0. Maximum 200 tasks.</p><div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Capacity<input type="number" min={1} max={100} step={1} value={capacity} onChange={e => setCapacity(e.target.value)} required className={inputClass}/></label><label className="text-sm">Cost per busy time unit<input type="number" min={0} max={1000000} step="any" value={cost} onChange={e => setCost(e.target.value)} required className={inputClass}/></label></div></section>}
        {(engine === "risk" || engine === "combined") && <section className="space-y-3"><h3 className="font-medium">Risk inputs</h3><p className="text-xs text-muted">Samples follow a lognormal duration distribution derived from your mean and standard deviation. This is assumption-based sampling.</p><div className="grid gap-4 md:grid-cols-3">{[{ label: "Mean duration", value: mean, set: setMean, min: 0.000001, max: 1000000, step: "any" }, { label: "Standard deviation", value: deviation, set: setDeviation, min: 0.000001, max: 1000000, step: "any" }, { label: "Deadline", value: deadline, set: setDeadline, min: 0.000001, max: 1000000, step: "any" }, { label: "Samples", value: samples, set: setSamples, min: 100, max: 10000, step: "1" }, { label: "Random seed", value: seed, set: setSeed, min: 0, max: 2147483647, step: "1" }].map(field => <label key={field.label} className="text-sm">{field.label}<input type="number" value={field.value} onChange={e => field.set(e.target.value)} min={field.min} max={field.max} step={field.step} required className={inputClass}/></label>)}</div></section>}
        {(engine === "optimization" || engine === "combined") && <section className="space-y-3"><h3 className="font-medium">Optimization inputs</h3><label className="block text-sm">Worker/task cost matrix<textarea aria-describedby="matrix-help" value={costs} onChange={e => setCosts(e.target.value)} rows={4} required className={inputClass}/></label><p id="matrix-help" className="text-xs text-muted">One worker per row; one task per comma-separated column. Use integers and equal row lengths. Each task gets one worker, and each worker gets at most one task. Maximum 30 × 30; workers must equal or exceed tasks. Worker/task labels in results start at 1.</p></section>}
        <Button type="submit" disabled={busy || !ready} className="rounded-[1.5px]">{busy ? "Submitting…" : "Submit scenario"}</Button>
      </fieldset></form>
      <p role="status" aria-live="polite" className="mt-4 text-sm">{message}</p>
    </CardContent></Card>
    {(response || selected) && <Card><CardHeader><CardTitle>{selected ? selected.name : "Run result"}</CardTitle></CardHeader><CardContent className="space-y-5">
      <p className="text-sm text-muted">{saved ? `Saved run: ${selected?.id}. Status: ${selected?.status}.` : "This result has not been saved."}</p>
      {response && <>{response.engine === "combined" ? ["simulation", "risk", "optimization"].map(engine => <EngineResult key={engine} engine={engine} value={response.result[engine]}/>) : <EngineResult engine={response.engine} value={response.result}/>}
        {response.warnings?.map((warning, i) => <p key={i} className="text-sm text-warning">{warning}</p>)}
        <p className="text-xs text-muted">Engine run ID: {response.runId} · Duration: {format(response.metrics?.durationMs)} ms</p></>}
      {selected?.error && <p className="text-sm text-danger">{selected.error}</p>}
      <details><summary className="cursor-pointer text-sm">Saved inputs and full result</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words border border-border p-3 text-xs">{JSON.stringify(selected || response, null, 2)}</pre></details>
      <Button type="button" variant="secondary" onClick={download} className="rounded-[1.5px]">Download run JSON</Button>
    </CardContent></Card>}
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Saved run history</CardTitle><Button type="button" variant="secondary" onClick={refreshHistory} disabled={historyBusy || busy} className="rounded-[1.5px]">{historyBusy ? "Refreshing…" : "Refresh history"}</Button></div></CardHeader><CardContent>
      {historyError && <p role="alert" className="mb-3 text-sm text-danger">{historyError}</p>}
      {!historyBusy && !historyError && !runs.length && <p className="text-sm text-muted">No saved runs yet. Run the sample simulation to create the first one.</p>}
      {runs.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-3 text-left text-xs text-muted">Latest 25 runs in your organization. Open a run to review its stored inputs and results.</caption><thead><tr>{["Run", "Engine", "Status", "Created", "Action"].map(label => <th key={label} scope="col" className="border-b border-border py-2 pr-4">{label}</th>)}</tr></thead><tbody>{runs.map(row => <tr key={row.id}><td className="border-b border-border py-3 pr-4">{row.name}</td><td className="border-b border-border py-3 pr-4 capitalize">{row.engine}</td><td className="border-b border-border py-3 pr-4">{row.status}</td><td className="border-b border-border py-3 pr-4">{new Date(row.created_at).toLocaleString()}</td><td className="border-b border-border py-3"><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => openRun(row.id)} aria-label={`Open run ${row.name}`} className="rounded-[1.5px]">Open</Button></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>;
}
