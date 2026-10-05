/**
 * Style probe — per-style exchange anatomy on a world snapshot: who wins
 * initiative, how often attacks land / get parried, damage per hit, and how
 * fights end. Explains WHY a style wins or loses, not just how often.
 *
 *   bun run scripts/style-probe.ts snap.json [...]   (snapshots: SNAP=… scripts/world-diag.ts)
 */
import { readFileSync } from 'fs';
import { simulateFight } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { createFighterState } from '@/engine/bout/fighterState';
import { SeededRNGService } from '@/utils/random';
import { refitWeapon } from '@/engine/equipment/loadoutFitting';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { applyLabOverrides, STYLE_CODE, tweakPlan } from './lab-overrides';

applyLabOverrides();
(globalThis as Record<string, unknown>).__AI_DEBUG = true;
const styles = Object.values(FightingStyle) as FightingStyle[];
type Entry = { w: Warrior; personality: string; philosophy: string };
const pool: Entry[] = process.argv
  .slice(2)
  .flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as Entry[]);
const gear: Record<string, Record<string, number>> = {};
for (const e of pool) {
  Object.assign(e.w, computeWarriorStats(e.w.attributes, e.w.style));
  if (process.env.LAB_FIT && e.w.equipment)
    e.w.equipment = refitWeapon(e.w.style, e.w.attributes, e.w.equipment);
  const g = (gear[e.w.style] ??= {});
  g[e.w.equipment?.weapon ?? '?'] = (g[e.w.equipment?.weapon ?? '?'] ?? 0) + 1;
}

const z = () => ({
  fights: 0,
  wins: 0,
  ex: 0,
  ini: 0,
  att: 0,
  attOk: 0,
  landed: 0,
  dmg: 0,
  defd: 0,
  defOk: 0,
  rip: 0,
  oe: 0,
  al: 0,
  kd: 0,
  eATT: 0,
  ePAR: 0,
  eDEF: 0,
  eINI: 0,
  eRIP: 0,
  hp: 0,
  end: 0,
  dcls: 0,
  by: {} as Record<string, number>,
  lossBy: {} as Record<string, number>,
});
const S: Record<string, ReturnType<typeof z>> = {};
for (const s of styles) S[s] = z();

const N = Number(process.env.LAB_FIGHTS ?? 20000);
const rng = new SeededRNGService(99);
for (let i = 0; i < N; i++) {
  const A = pool[Math.floor(rng.next() * pool.length)]!;
  const D = pool[Math.floor(rng.next() * pool.length)]!;
  if (A === D || A.w.stableId === D.w.stableId) continue;
  const pA = tweakPlan(
    aiPlanForWarrior({ w: A.w, personality: A.personality as never, philosophy: A.philosophy, opponentStyle: D.w.style })
  );
  const pD = tweakPlan(
    aiPlanForWarrior({ w: D.w, personality: D.personality as never, philosophy: D.philosophy, opponentStyle: A.w.style })
  );
  const o = simulateFight({
    planA: pA,
    planD: pD,
    warriorA: A.w,
    warriorD: D.w,
    providedRng: i * 7919 + 13,
    weather: 'Clear',
    headless: true,
  });
  for (const [side, e, plan] of [
    ['A', A, pA],
    ['D', D, pD],
  ] as const) {
    const s = S[e.w.style]!;
    const f = createFighterState(side, plan, e.w);
    s.fights++;
    s.oe += plan.OE;
    s.al += plan.AL;
    s.kd += plan.killDesire ?? 5;
    s.eATT += f.skills.ATT;
    s.ePAR += f.skills.PAR;
    s.eDEF += f.skills.DEF;
    s.eINI += f.skills.INI;
    s.eRIP += f.skills.RIP;
    s.hp += f.maxHp;
    s.end += f.maxEndurance;
    s.dcls += f.derived.damage;
    const by = String(o.by);
    if (o.winner === side) {
      s.wins++;
      s.by[by] = (s.by[by] ?? 0) + 1;
    } else if (o.winner) s.lossBy[by] = (s.lossBy[by] ?? 0) + 1;
    for (const x of o.exchangeLog ?? []) {
      s.ex++;
      if (x.iniWinner === side) {
        s.ini++;
        s.att++;
        if (x.attResult === 'hit' || x.attResult === 'crit') {
          s.attOk++;
          s.landed++;
          s.dmg += x.damage ?? 0;
        } else if (x.parResult === 'success' || x.defResult === 'dodge') s.attOk++;
      } else if (x.iniWinner) {
        if (x.parResult === 'success' || x.defResult === 'dodge') {
          s.defd++;
          s.defOk++;
        } else if (x.attResult === 'hit' || x.attResult === 'crit') s.defd++;
        if (x.ripResult === 'hit') s.rip++;
      }
    }
  }
}
const f = (n: number, d: number, p = 1) => (n / Math.max(1, d)).toFixed(p).padStart(6);
console.log(
  '     win%  exch  ini%  atk✓%  def✓%  hits/f  rip/f dmg/hit |  eATT  ePAR  eDEF  eINI  eRIP    hp   end  dcls |   OE    AL    KD | wins by / losses by'
);
for (const st of styles) {
  const s = S[st]!;
  const top = (r: Record<string, number>) =>
    Object.entries(r)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        ([k, v]) =>
          `${k.slice(0, 4)} ${Math.round((100 * v) / Object.values(r).reduce((x, y) => x + y, 0))}`
      )
      .join(' ');
  console.log(
    `${STYLE_CODE[st]}  ${f(100 * s.wins, s.fights)}${f(s.ex, s.fights)}${f(100 * s.ini, s.ex)}${f(100 * s.attOk, s.att)} ${f(100 * s.defOk, s.defd)} ${f(s.landed, s.fights, 2)} ${f(s.rip, s.fights, 2)} ${f(s.dmg, s.landed)}  |` +
      `${f(s.eATT, s.fights)}${f(s.ePAR, s.fights)}${f(s.eDEF, s.fights)}${f(s.eINI, s.fights)}${f(s.eRIP, s.fights)}${f(s.hp, s.fights)}${f(s.end, s.fights)}${f(s.dcls, s.fights)} |${f(s.oe, s.fights)}${f(s.al, s.fights)}${f(s.kd, s.fights)} | ${top(s.by)} / ${top(s.lossBy)}`
  );
}

console.log('\nweapons carried:');
for (const st of styles)
  console.log(
    STYLE_CODE[st],
    Object.entries(gear[st] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k} ${v}`)
      .join('  ')
  );
