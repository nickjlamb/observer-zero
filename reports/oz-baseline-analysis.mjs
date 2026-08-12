// Self-contained re-implementation of Observer Zero's L2 detector, with a
// parametrised baseline window. No repo imports and no repo writes, so the
// frozen analysis code is untouched. Validated by reproducing the committed
// s2-arm*/benchmark.json numbers at baseline=10.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const SIGMAS = 2.5;
const mean = xs => xs.reduce((a,b)=>a+b,0)/xs.length;

function seriesFromEvents(events){
  const byInst = new Map();
  for (const e of events){
    if (e.type !== "experiment_result") continue;
    const id = String(e.payload["instrumentId"]);
    if (!byInst.has(id)) byInst.set(id,{instrumentId:id,kind:id.startsWith("pendulum")?"pendulum":"resonator",byDay:new Map()});
    const s = byInst.get(id);
    if (!s.byDay.has(e.day)) s.byDay.set(e.day,[]);
    s.byDay.get(e.day).push(Number(e.payload["observedValue"]));
  }
  return [...byInst.values()];
}

function runDetector(series, BASELINE_DAYS){
  const baseline=[], postByDay=[];
  for (const [day,vals] of [...series.byDay.entries()].sort((a,b)=>a[0]-b[0])){
    if (day <= BASELINE_DAYS) baseline.push(...vals); else postByDay.push({day,vals});
  }
  if (baseline.length < 3 || postByDay.length === 0)
    return {kind:series.kind, detectedOnDay:null, finalAbsZ:0};
  const bMean = mean(baseline);
  const bVar = baseline.reduce((a,x)=>a+(x-bMean)**2,0)/(baseline.length-1);
  let detectedOnDay=null; const post=[];
  for (const {day,vals} of postByDay){
    post.push(...vals);
    if (post.length < 3) continue;
    const pMean = mean(post);
    const se = Math.sqrt(bVar/baseline.length + bVar/post.length);
    if (detectedOnDay===null && se>0 && Math.abs(pMean-bMean) > SIGMAS*se) detectedOnDay=day;
  }
  const pMean = mean(post);
  const se = Math.sqrt(bVar/baseline.length + bVar/post.length);
  return {kind:series.kind, detectedOnDay, finalAbsZ: se>0 ? Math.abs(pMean-bMean)/se : 0};
}

function summarise(verdicts){
  const p = verdicts.filter(v=>v.kind==="pendulum");
  const r = verdicts.filter(v=>v.kind==="resonator");
  const days = p.map(v=>v.detectedOnDay).filter(d=>d!==null);
  return {
    maxPendulumAbsZ: p.length ? Math.max(...p.map(v=>v.finalAbsZ)) : 0,
    earliestDetectionDay: days.length ? Math.min(...days) : null,
    resonatorFalseAlarmRate: r.length ? r.filter(v=>v.detectedOnDay!==null).length/r.length : null,
    maxResonatorAbsZ: r.length ? Math.max(...r.map(v=>v.finalAbsZ)) : 0,
  };
}

function loadRuns(dir){
  const out=[];
  for (const f of readdirSync(dir).filter(f=>f.endsWith(".json")).sort()){
    let parsed; try { parsed = JSON.parse(readFileSync(`${dir}/${f}`,"utf8")); } catch { continue; }
    if (!Array.isArray(parsed.events) || typeof parsed.config?.name !== "string") continue;
    out.push({file:f.replace(/\.json$/,""), scenario:parsed.config.name, seed:parsed.config.seed,
              n:(parsed.agents??[]).length, events:parsed.events});
  }
  return out;
}

const dirs = process.argv.slice(2);
const BASELINES = [6,8,10,12,14];
const report = {};

for (const dir of dirs){
  if (!existsSync(dir)) { console.log(`MISSING ${dir}`); continue; }
  const runs = loadRuns(dir);
  if (!runs.length) { console.log(`NO ARTIFACTS ${dir}`); continue; }

  // validation against committed benchmark.json at baseline 10, where present
  let val = null;
  const bpath = `${dir}/benchmark.json`;
  if (existsSync(bpath)){
    const committed = JSON.parse(readFileSync(bpath,"utf8"));
    const byRun = new Map(committed.rows.map(r=>[r.run, r.asProduced.maxPendulumAbsZ]));
    let checked=0, maxDiff=0;
    for (const run of runs){
      if (!byRun.has(run.file)) continue;
      const mine = summarise(seriesFromEvents(run.events).map(s=>runDetector(s,10))).maxPendulumAbsZ;
      maxDiff = Math.max(maxDiff, Math.abs(mine - byRun.get(run.file)));
      checked++;
    }
    val = {checked, maxDiff};
  }

  const byScenario = new Map();
  for (const run of runs){
    if (!byScenario.has(run.scenario)) byScenario.set(run.scenario, []);
    byScenario.get(run.scenario).push(run);
  }

  const entry = {n: runs[0].n, runs: runs.length, validation: val, scenarios:{}};
  for (const [scenario, rs] of byScenario){
    const cells = {};
    for (const b of BASELINES){
      const sums = rs.map(r=>summarise(seriesFromEvents(r.events).map(s=>runDetector(s,b))));
      cells[b] = {
        meanZ: mean(sums.map(s=>s.maxPendulumAbsZ)),
        flagged: sums.filter(s=>s.earliestDetectionDay!==null).length,
        medianDay: (()=>{ const d=sums.map(s=>s.earliestDetectionDay).filter(x=>x!==null).sort((a,b)=>a-b);
                          return d.length ? d[Math.floor(d.length/2)] : null; })(),
        resFA: mean(sums.map(s=>s.resonatorFalseAlarmRate ?? 0)),
        meanResZ: mean(sums.map(s=>s.maxResonatorAbsZ)),
      };
    }
    entry.scenarios[scenario] = {runs: rs.length, cells};
  }
  report[dir] = entry;
}
console.log(JSON.stringify(report, null, 1));
