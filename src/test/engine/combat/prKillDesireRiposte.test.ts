/**
 * PR kill-desire riposte gate — canon (Blackhawk, Arena 93 ripper article):
 * a ripper run at low kill desire "passed up attack, via riposte,
 * opportunities" vs the same plan at KD 5. The engine discounts the
 * defender's riposte skill check by their effective kill desire when the
 * defender is a Parry-Riposte (defense.ts, both riposte call sites).
 */
import { describe, it, expect } from 'vitest';
import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import { SeededRNG } from '@/utils/random';
import {
  setupExchange,
  callResolveCombatOffenseDefense,
} from '@/test/_fixtures/exchangeSetup';

function defenderPlan(
  style: FightingStyle,
  kd: number,
  openingKd?: number
): FighterState['activePlan'] {
  return {
    style,
    OE: 5,
    AL: 5,
    killDesire: kd,
    target: 'Any',
    ...(openingKd !== undefined
      ? { phases: { opening: { OE: 5, AL: 5, killDesire: openingKd } } }
      : {}),
  } as FighterState['activePlan'];
}

/** Runs one offense/defense exchange: ST attacker vs the given defender. */
function runExchange(
  defenderStyle: FightingStyle,
  defPlan: FighterState['activePlan'],
  seed: number
): CombatEvent[] {
  const rng = new SeededRNG(seed);
  const s = setupExchange({
    fA: {
      style: FightingStyle.StrikingAttack,
      skills: { ATT: 12, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    },
    fD: {
      style: defenderStyle,
      skills: { ATT: 5, PAR: 18, DEF: 14, INI: 10, RIP: 12, DEC: 10 },
      activePlan: defPlan,
      plan: defPlan,
    },
    ctx: { rng: () => rng.next() },
  });
  callResolveCombatOffenseDefense(s, true);
  return s.events;
}

const countRipostes = (events: CombatEvent[]) =>
  events.filter((e) => e.type === 'DEFENSE' && e.result === 'RIPOSTE').length;

/** Total riposte events across a seeded sample of exchanges. */
function sampleRipostes(
  defenderStyle: FightingStyle,
  kd: number,
  openingKd?: number
): number {
  const plan = defenderPlan(defenderStyle, kd, openingKd);
  let n = 0;
  for (let seed = 1; seed <= 100; seed++) {
    for (let rep = 0; rep < 8; rep++) {
      n += countRipostes(runExchange(defenderStyle, plan, seed * 1000 + rep));
    }
  }
  return n;
}

describe('PR kill-desire riposte gate — canon low-KD suppression', () => {
  it('a Parry-Riposte defender produces strictly fewer ripostes at KD 2 than KD 5', () => {
    const low = sampleRipostes(FightingStyle.ParryRiposte, 2);
    const high = sampleRipostes(FightingStyle.ParryRiposte, 5);
    expect(high).toBeGreaterThan(0);
    expect(low).toBeLessThan(high);
  });

  it('does not gate non-PR defenders — Total Parry riposte rate is KD-independent', () => {
    const low = sampleRipostes(FightingStyle.TotalParry, 2);
    const high = sampleRipostes(FightingStyle.TotalParry, 5);
    expect(high).toBeGreaterThan(0);
    expect(low).toBeGreaterThanOrEqual(high);
  });

  it('reads the phase-level killDesire override when present', () => {
    // Base KD 7 but the opening phase drops to KD 2 → the gate applies.
    const phased = sampleRipostes(FightingStyle.ParryRiposte, 7, 2);
    const flat = sampleRipostes(FightingStyle.ParryRiposte, 7);
    expect(flat).toBeGreaterThan(0);
    expect(phased).toBeLessThan(flat);
  });
});
