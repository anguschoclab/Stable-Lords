/**
 * Phase 4 ship-gate benchmark — sequential (pool=1) vs distributed (pool=N)
 * wall-clock on a multi-week headless run. Emits scripts/out/parallel-bench.json.
 *
 * Run: bun run scripts/parallel-bench.mjs [--weeks N] [--seed N] [--pool N]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { runSimulation } from '../src/scripts/simulation-harness.ts';
import {
  configureEnginePool,
  shutdownEnginePool,
  getEnginePool,
} from '../src/engine/pool/enginePool.ts';

const args = process.argv.slice(2);
const argVal = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const WEEKS = argVal('--weeks', 52);
const SEED = argVal('--seed', 20260919);
const POOL_SIZE = argVal('--pool', 4);

console.log(`[bench] ${WEEKS} weeks, seed=${SEED}, pool=1 vs pool=${POOL_SIZE}`);

async function timedRun(poolSize) {
  configureEnginePool(poolSize);
  shutdownEnginePool();
  const t0 = performance.now();
  const result = await runSimulation({
    weeks: WEEKS,
    seed: SEED,
    logFrequency: 0,
    ignoreBankruptcy: true,
  });
  const ms = performance.now() - t0;
  const effectiveSize = getEnginePool().size;
  shutdownEnginePool();
  configureEnginePool(1);
  return { poolSize, effectiveSize, ms, finalState: result.finalState };
}

const seq = await timedRun(1);
const par = await timedRun(POOL_SIZE);

const speedup = seq.ms / par.ms;
const gate = speedup >= 1.3;

const out = {
  weeks: WEEKS,
  seed: SEED,
  sequential: { ms: Math.round(seq.ms) },
  parallel: { poolSize: POOL_SIZE, ms: Math.round(par.ms) },
  speedup: Math.round(speedup * 100) / 100,
  shipGate: gate ? 'PASS (>=1.30x)' : 'FAIL (<1.30x)',
  generatedAt: new Date().toISOString(),
};
mkdirSync(new URL('./out', import.meta.url).pathname, { recursive: true });
const path = new URL('./out/parallel-bench.json', import.meta.url).pathname;
writeFileSync(path, JSON.stringify(out, null, 2));

console.log(`  pool=1             : ${seq.ms.toFixed(0)} ms`);
console.log(`  pool=${POOL_SIZE} (eff ${par.effectiveSize}) : ${par.ms.toFixed(0)} ms`);
console.log(`  speedup            : ${speedup.toFixed(2)}x  → ${out.shipGate}`);
console.log(`Wrote ${path}`);
