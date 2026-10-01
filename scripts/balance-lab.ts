/**
 * Balance lab — fast two-surface read of style balance.
 *
 *   FLAT  the certified guardrail fixture (all-15s, default plans) — same
 *         seeds as src/test/engine/economy/balance.slow.test.ts.
 *   SNAP  a developed world population (warriors dumped from a world run by
 *         `SNAP=<file> bun run scripts/world-diag.ts`), re-skilled under the
 *         CURRENT penalties and fought with AI plans. Proxy for the world
 *         win rates without paying for a 1000-week simulation.
 *
 *   bun run scripts/balance-lab.ts [snapshot.json ...]
 *   LAB_FIGHTS=40000 bun run scripts/balance-lab.ts snap.json
 */
import { readFileSync } from 'fs';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';
import { refitWeapon } from '@/engine/equipment/loadoutFitting';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

import { applyLabOverrides, STYLE_CODE, tweakPlan } from './lab-overrides';

applyLabOverrides();
const styles = Object.values(FightingStyle) as FightingStyle[];
const abbr = (s: string) => (STYLE_CODE[s as FightingStyle] ?? s).padEnd(3);
const pct = (n: number, d: number) => ((100 * n) / Math.max(1, d)).toFixed(1).padStart(5);

type Tally = {
  w: Record<string, number>;
  n: Record<string, number>;
  kills: number;
  fights: number;
  by: Record<string, number>;
  mm: Record<string, Record<string, [number, number]>>;
};
const tally = (): Tally => ({ w: {}, n: {}, kills: 0, fights: 0, by: {}, mm: {} });
function record(
  t: Tally,
  a: string,
  d: string,
  o: { winner: 'A' | 'D' | null; by: string | null }
) {
  t.fights++;
  t.n[a] = (t.n[a] ?? 0) + 1;
  t.n[d] = (t.n[d] ?? 0) + 1;
  t.by[o.by ?? '?'] = (t.by[o.by ?? '?'] ?? 0) + 1;
  if (o.by === 'Kill') t.kills++;
  const cellA = ((t.mm[a] ??= {})[d] ??= [0, 0]);
  const cellD = ((t.mm[d] ??= {})[a] ??= [0, 0]);
  if (a !== d) {
    cellA[1]++;
    cellD[1]++;
  }
  if (o.winner === 'A') {
    t.w[a] = (t.w[a] ?? 0) + 1;
    if (a !== d) cellA[0]++;
  } else if (o.winner === 'D') {
    t.w[d] = (t.w[d] ?? 0) + 1;
    if (a !== d) cellD[0]++;
  }
}
function report(name: string, t: Tally, matrix = false) {
  const rates = styles.map((s) => (100 * (t.w[s] ?? 0)) / Math.max(1, t.n[s] ?? 0));
  console.log(
    `${name.padEnd(5)} ` +
      styles.map((s, i) => `${abbr(s)}${rates[i]!.toFixed(1).padStart(5)}`).join('  ') +
      `  | kill ${pct(t.kills, t.fights)}%  spread ${Math.min(...rates).toFixed(1)}–${Math.max(...rates).toFixed(1)}`
  );
  if (matrix) {
    console.log(
      '      by: ' +
        Object.entries(t.by)
          .sort((x, y) => y[1] - x[1])
          .map(([k, v]) => `${k} ${pct(v, t.fights).trim()}%`)
          .join('  ')
    );
    console.log('      ' + ''.padEnd(4) + styles.map((s) => abbr(s).padStart(5)).join(''));
    for (const a of styles)
      console.log(
        '      ' +
          abbr(a).padEnd(4) +
          styles
            .map((d) =>
              a === d
                ? '    -'
                : pct(t.mm[a]?.[d]?.[0] ?? 0, t.mm[a]?.[d]?.[1] ?? 0)
                    .slice(0, 5)
                    .replace(/\.\d$/, '')
                    .padStart(5)
            )
            .join('')
      );
  }
}

const MATRIX = !!process.env.LAB_MATRIX;

// ── FLAT ────────────────────────────────────────────────────────────────────
{
  const STD = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const mk = (style: FightingStyle, id: string) =>
    makeComputedWarrior(STD, style, { id: id as never, name: id, fame: 0, age: 20 });
  const t = tally();
  const mirror: string[] = [];
  for (const [ia, a] of styles.entries())
    for (const [id, d] of styles.entries()) {
      const wA = mk(a, `A_${a}`);
      const wD = mk(d, `D_${d}`);
      let aw = 0;
      for (let i = 0; i < 100; i++) {
        const o = simulateFight(
          defaultPlanForWarrior(wA),
          defaultPlanForWarrior(wD),
          wA,
          wD,
          (ia * 10 + id) * 100000 + i * 7919 + 42,
          undefined,
          'Clear',
          undefined,
          undefined,
          true
        );
        record(t, a, d, o);
        if (o.winner === 'A') aw++;
      }
      if (a === d && Math.abs(aw - 50) > 10) mirror.push(`${abbr(a).trim()} ${aw}`);
    }
  console.log(`FLAT  mirror drift >10: ${mirror.join(', ') || 'none'}`);
  report('FLAT', t, MATRIX);
}

// ── SNAP ────────────────────────────────────────────────────────────────────
const files = process.argv.slice(2);
if (files.length) {
  type Entry = { w: Warrior; personality: string; philosophy: string };
  const pool: Entry[] = files.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as Entry[]);
  for (const e of pool) {
    Object.assign(e.w, computeWarriorStats(e.w.attributes, e.w.style));
    // LAB_FIT=1: preview requirement-aware weapon fitting on a pre-fit snapshot.
    if (process.env.LAB_FIT && e.w.equipment)
      e.w.equipment = refitWeapon(e.w.style, e.w.attributes, e.w.equipment);
  }
  const N = Number(process.env.LAB_FIGHTS ?? 30000);
  const rng = new SeededRNGService(99);
  const t = tally();
  for (let i = 0; i < N; i++) {
    const A = pool[Math.floor(rng.next() * pool.length)]!;
    const D = pool[Math.floor(rng.next() * pool.length)]!;
    if (A === D || A.w.stableId === D.w.stableId) continue;
    const pA = tweakPlan(aiPlanForWarrior(A.w, A.personality as never, A.philosophy, D.w.style));
    const pD = tweakPlan(aiPlanForWarrior(D.w, D.personality as never, D.philosophy, A.w.style));
    record(
      t,
      A.w.style,
      D.w.style,
      simulateFight(pA, pD, A.w, D.w, i * 7919 + 13, undefined, 'Clear', undefined, undefined, true)
    );
  }
  report('SNAP', t, MATRIX);
}
