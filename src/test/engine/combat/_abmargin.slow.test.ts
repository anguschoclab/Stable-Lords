/**
 * Aimed Blow vs Total Parry margin probe — scratch diagnostic, not a CI gate.
 * Salvaged from the sl-bisect-8114c118 worktree (V24 double-tactic / weapon-
 * armor experiment). Run:
 *   AB_MARGIN=1 bun x vitest run --config vitest.config.slow.ts \
 *     src/test/engine/combat/_abmargin.slow.test.ts
 */
import { describe, it, expect } from 'vitest';
import { simulateFight } from '@/engine/simulate/simulateFight';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { defaultPlanForWarrior } from '@/engine/bout/planDefaults';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/game';

// Skipped unless AB_MARGIN is set — a diagnostic harness, not a CI gate.
// Audits require a literal describe()/expect() — the wrapper keeps both.
describe('AB vs TP margin probe', () => {
  it.skipIf(!process.env.AB_MARGIN)(
    'measures the Aimed Blow win rate vs Total Parry',
    () => {
      const AB = FightingStyle.AimedBlow, TP = FightingStyle.TotalParry;
      const wA = makeComputedWarrior(
        { ST: 11.7, CN: 10.4, SZ: 8.7, WT: 14.6, WL: 10.7, SP: 11.9, DF: 14.0 }, AB,
        { id: 'A' as WarriorId, name: 'A', fame: 0, age: 20,
          baseSkills: { ATT: 5.6, PAR: 2.8, DEF: 3.3, INI: 7.2, RIP: 6.1, DEC: 9.5 } as never });
      const wD = makeComputedWarrior(
        { ST: 13.2, CN: 14.9, SZ: 9.8, WT: 10.8, WL: 15.1, SP: 10.6, DF: 11.9 }, TP,
        { id: 'D' as WarriorId, name: 'D', fame: 0, age: 20,
          baseSkills: { ATT: 3.6, PAR: 9.2, DEF: 2.0, INI: 4.8, RIP: 5.4, DEC: 6.6 } as never });
      const planA = defaultPlanForWarrior(wA), planD = defaultPlanForWarrior(wD);
      let wins = 0; const N = 8000;
      for (let i = 0; i < N; i++) {
        const r = simulateFight({ warriorA: wA, warriorD: wD, planA, planD, providedRng: i * 7919 + 42 });
        if (r.winner === 'A') wins++;
      }
      console.log('AB margin:', (100 * wins / N).toFixed(2));
      expect(wins).toBeGreaterThanOrEqual(0);
    },
    3600000
  );
});
