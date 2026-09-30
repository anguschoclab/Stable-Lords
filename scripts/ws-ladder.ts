/**
 * Throwaway diagnostic: fixture ladder. Same archetype-attr population, add one
 * production ingredient per rung, and watch where WALL OF STEEL falls off.
 *
 *   bun run scripts/ws-ladder.ts [fightsPerCell=300]
 */
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { generateArchetypeAttrs, ARCHETYPE_STAT_WEIGHTS } from '@/engine/factories/statGeneration';
import { SeededRNGService } from '@/utils/random';
import { PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';
import { FightingStyle, type Attributes } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';

const N = Number(process.argv[2] ?? 300);
const POP = 40;
const styles = Object.values(FightingStyle) as FightingStyle[];

type Rung = {
  name: string;
  build: (style: FightingStyle, rng: SeededRNGService) => Warrior;
  plan: (w: Warrior, opp: Warrior, i: number) => FightPlan;
};

const PERSONALITIES = ['Aggressive', 'Methodical', 'Showman', 'Pragmatic', 'Tactician'] as const;
const PHILOSOPHIES = Object.keys(PHILOSOPHY_PLAN_MODS);

const plain = (style: FightingStyle, rng: SeededRNGService) =>
  makeWarrior(undefined, 'x', style, generateArchetypeAttrs(style, rng));
const real = (style: FightingStyle, rng: SeededRNGService) =>
  makeWarrior(undefined, 'x', style, generateArchetypeAttrs(style, rng), {}, rng);
const dflt = (w: Warrior) => defaultPlanForWarrior(w);
const ai = (w: Warrior, opp: Warrior, i: number) =>
  aiPlanForWarrior(
    w,
    PERSONALITIES[i % PERSONALITIES.length] as never,
    PHILOSOPHIES[(i * 7) % PHILOSOPHIES.length]!,
    opp.style
  );

/** Tank archetype with WT promoted out of `low` (candidate lever from the ledger). */
function withTankWeights<T>(w: (typeof ARCHETYPE_STAT_WEIGHTS)['tank'], fn: () => T): T {
  const orig = ARCHETYPE_STAT_WEIGHTS.tank;
  ARCHETYPE_STAT_WEIGHTS.tank = w;
  try {
    return fn();
  } finally {
    ARCHETYPE_STAT_WEIGHTS.tank = orig;
  }
}

function run(rung: Rung, tank?: (typeof ARCHETYPE_STAT_WEIGHTS)['tank']) {
  const rng = new SeededRNGService(4242);
  const build = () => {
    const pop = {} as Record<FightingStyle, Warrior[]>;
    for (const s of styles) pop[s] = Array.from({ length: POP }, () => rung.build(s, rng));
    return pop;
  };
  const pop = tank ? withTankWeights(tank, build) : build();
  const wins: Record<string, number> = {};
  const tot: Record<string, number> = {};
  const vs: Record<string, [number, number]> = {};
  let seed = 1;
  for (const a of styles)
    for (const d of styles) {
      if (a === d) continue;
      for (let i = 0; i < N; i++) {
        const wA = pop[a][i % POP]!;
        const wD = pop[d][(i * 13 + 5) % POP]!;
        const o = simulateFight(rung.plan(wA, wD, i), rung.plan(wD, wA, i + 3), wA, wD, seed++ * 7919, undefined, 'Clear', undefined, undefined, true);
        if (o.winner == null) continue;
        const [w, l] = o.winner === 'A' ? [a, d] : [d, a];
        wins[w] = (wins[w] ?? 0) + 1;
        tot[w] = (tot[w] ?? 0) + 1;
        tot[l] = (tot[l] ?? 0) + 1;
        if (a === FightingStyle.WallOfSteel || d === FightingStyle.WallOfSteel) {
          const opp = a === FightingStyle.WallOfSteel ? d : a;
          const c = (vs[opp] ??= [0, 0]);
          c[1]++;
          if (w === FightingStyle.WallOfSteel) c[0]++;
        }
      }
    }
  const avgAttr = (s: FightingStyle, k: keyof Attributes) => (pop[s].reduce((x, w) => x + w.attributes[k], 0) / POP).toFixed(1);
  const avgSk = (s: FightingStyle) =>
    (['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'] as const).map((k) => (pop[s].reduce((x, w) => x + (w.baseSkills?.[k] ?? 0), 0) / POP).toFixed(1)).join('/');
  console.log(`\n## ${rung.name}`);
  console.log(styles.map((s) => `${s.slice(0, 9)} ${((100 * (wins[s] ?? 0)) / (tot[s] || 1)).toFixed(1)}`).join(' | '));
  const ws = FightingStyle.WallOfSteel;
  const tp = FightingStyle.TotalParry;
  console.log(`WS attrs ST${avgAttr(ws, 'ST')} CN${avgAttr(ws, 'CN')} SZ${avgAttr(ws, 'SZ')} WT${avgAttr(ws, 'WT')} WL${avgAttr(ws, 'WL')} SP${avgAttr(ws, 'SP')} DF${avgAttr(ws, 'DF')}  skills ATT/PAR/DEF/INI/RIP/DEC ${avgSk(ws)}   (TP skills ${avgSk(tp)})`);
  console.log('WS vs: ' + Object.entries(vs).map(([o, c]) => `${o.slice(0, 9)} ${((100 * c[0]) / c[1]).toFixed(0)}`).join(' | '));
}


import { STYLE_PENALTIES } from '@/engine/warrior/skillBreakpoints';
const WS = FightingStyle.WallOfSteel;
const T = ARCHETYPE_STAT_WEIGHTS.tank;
type W = (typeof ARCHETYPE_STAT_WEIGHTS)['tank'];
/** WS-only attribute shape (TP keeps the tank weights). */
const wsShape = (w: W) => (style: FightingStyle, rng: SeededRNGService) => {
  if (style !== WS) return real(style, rng);
  ARCHETYPE_STAT_WEIGHTS.tank = w;
  try { return real(style, rng); } finally { ARCHETYPE_STAT_WEIGHTS.tank = T; }
};
const flat = (style: FightingStyle, rng: SeededRNGService) =>
  makeWarrior(undefined, 'x', style, { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 });
function withPen(pen: number[], fn: () => void) {
  const orig = [...STYLE_PENALTIES[WS]];
  STYLE_PENALTIES[WS].splice(0, 6, ...pen);
  try { fn(); } finally { STYLE_PENALTIES[WS].splice(0, 6, ...orig); }
}
console.log('WS penalties now:', JSON.stringify(STYLE_PENALTIES[WS]));
run({ name: 'C. production-like baseline', build: real, plan: ai });
run({ name: 'S. harness analog: flat 15s, default plan', build: flat, plan: dflt });
for (const [label, w] of [
  ['high ST,CN,WL / mid SZ', { high: ['ST', 'CN', 'WL'], mid: ['SZ'], low: ['WT', 'SP', 'DF'] }],
  ['high CN,WL,ST / mid DF', { high: ['CN', 'WL', 'ST'], mid: ['DF'], low: ['WT', 'SP', 'SZ'] }],
  ['high CN,WL,DF / mid ST', { high: ['CN', 'WL', 'DF'], mid: ['ST'], low: ['WT', 'SP', 'SZ'] }],
  ['high WL,ST,DF / mid CN', { high: ['WL', 'ST', 'DF'], mid: ['CN'], low: ['WT', 'SP', 'SZ'] }],
] as const) run({ name: `C + WS-only shape: ${label}`, build: wsShape(w as never), plan: ai });
for (const pen of [
  [-8, -2, -7, 0, -4, -2],
  [-4, -6, -10, 0, -4, -2],
  [-4, -2, -7, 0, -2, -2],
]) withPen(pen, () => {
  run({ name: `C + WS penalties ${JSON.stringify(pen)}`, build: real, plan: ai });
  run({ name: `S + WS penalties ${JSON.stringify(pen)}`, build: flat, plan: dflt });
});
