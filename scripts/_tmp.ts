import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { generateRecruitAttrs } from '@/engine/owner/roster/recruitGenerator';
import { generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import { STYLE_CODE } from './lab-overrides';
const ALL = Object.values(FightingStyle);
const PH = ['Brute Force', 'Speed Kills', 'Iron Defense', 'Balanced', 'Spectacle', 'Cunning', 'Endurance', 'Specialist'];
for (const [label, gen, fit] of [
  ['recruitAttrs unfitted (old block)', (p: string, r: SeededRNGService, s: FightingStyle) => generateRecruitAttrs(p, r, s), false],
  ['recruitAttrs fitted', (p: string, r: SeededRNGService, s: FightingStyle) => generateRecruitAttrs(p, r, s), true],
  ['archetypeAttrs fitted', (_p: string, r: SeededRNGService, s: FightingStyle) => generateArchetypeAttrs(s, r), true],
] as const) {
  const pools: Record<string, any[]> = {};
  for (const s of ALL) pools[s] = [];
  for (const [pi, ph] of PH.entries()) for (const [si, style] of ALL.entries()) {
    const attrs = gen(ph, new SeededRNGService(1000 + pi * 97 + si), style);
    pools[style]!.push(makeComputedWarrior(attrs, style, { id: `real_${style}_${pi}` as never, name: `real_${style}_${pi}`, fame: 0, age: 20, ...(fit ? { equipment: getFittedLoadout(style, attrs) } : {}) }));
  }
  for (const N of [30, 100]) {
    const w: Record<string, number> = {}, n: Record<string, number> = {}; let kills = 0, tot = 0;
    for (const [ai, a] of ALL.entries()) for (const [di, d] of ALL.entries()) for (let i = 0; i < N; i++) {
      const wA = pools[a]![i % 8]!, wD = pools[d]![i % 8]!;
      const o = simulateFight(defaultPlanForWarrior(wA), defaultPlanForWarrior(wD), wA, wD, (ai * 10 + di) * 30011 + i * 104729 + 7, undefined, 'Clear', undefined, undefined, true);
      n[a] = (n[a] ?? 0) + 1; n[d] = (n[d] ?? 0) + 1; tot++;
      if (o.winner === 'A') w[a] = (w[a] ?? 0) + 1; else if (o.winner === 'D') w[d] = (w[d] ?? 0) + 1;
      if (o.by === 'Kill') kills++;
    }
    console.log(label.padEnd(34), `N=${N}`.padEnd(6), ALL.map((s) => `${STYLE_CODE[s]} ${((100 * (w[s] ?? 0)) / n[s]!).toFixed(0)}`).join(' '), `kill ${((100 * kills) / tot).toFixed(1)}%`);
  }
}
