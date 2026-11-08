/**
 * Canon: attack skill feeds the critical-hit chance — skilled strikers find
 * vitals more often (Noblish Island doctrine). RED — effectiveCritChance in
 * damage.ts ignores skills.ATT.
 */
import { describe, it, expect } from 'vitest';
import { applyHitAndCounters } from '@/engine/combat/resolution/exchangeHelpers/execution/hitExecution/damage';
import { makeFighterState } from '@/test/_fixtures/factories';
import { getStylePassive } from '@/engine/stylePassives';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';

const skills = (ATT: number): FighterState['skills'] => ({
  ATT,
  PAR: 10,
  DEF: 10,
  INI: 10,
  RIP: 10,
  DEC: 10,
});

const critsIn = (att: number, trials: number) => {
  let crits = 0;
  for (let seed = 1; seed <= trials; seed++) {
    const rng = new SeededRNG(seed);
    const attacker = makeFighterState({ style: FightingStyle.TotalParry, skills: skills(att) });
    const defender = makeFighterState({ label: 'D' });
    const attPassive = getStylePassive(attacker.style, {
      phase: 'OPENING',
      exchange: 0,
      hitsLanded: 0,
      hitsTaken: 0,
      ripostes: 0,
      consecutiveHits: 0,
      hpRatio: 1,
      endRatio: 1,
      opponentStyle: defender.style,
    });
    const events: CombatEvent[] = [];
    const { isCrit } = applyHitAndCounters({
      events,
      rng: () => rng.next(),
      rawDamage: 10,
      hitLoc: 'chest',
      attacker,
      defender,
      attPassive,
      attLabel: 'A',
      defLabel: 'D',
    });
    if (isCrit) crits++;
  }
  return crits / trials;
};

describe('ATT skill feeds critical chance (canon)', () => {
  it('an elite attacker crits materially more than a novice', () => {
    const trials = 400;
    const elite = critsIn(25, trials);
    const novice = critsIn(5, trials);
    expect(elite).toBeGreaterThan(novice);
    expect(elite - novice).toBeGreaterThan(0.03);
  });
});
