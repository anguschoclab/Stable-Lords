/**
 * PR kill-desire riposte gate — canon (Blackhawk, Arena 93 ripper article):
 * a ripper run at low kill desire "passed up attack, via riposte,
 * opportunities" vs the same plan at KD 5. The engine discounts the
 * defender's riposte skill check by their effective kill desire when the
 * defender is a Parry-Riposte (defense.ts, both riposte call sites).
 */
import { describe, it, expect } from 'vitest';
import { resolveCombatOffenseDefense } from '@/engine/combat/resolution/offenseDefense';
import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import { resolveEffectiveTactics } from '@/engine/combat/resolution/tactics';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
} from '@/engine/combat/mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getDynamicTraitMods } from '@/engine/traits';
import { makeExchangeState, runCommit } from '@/engine/combat/resolution/exchangeSubPhases';
import { makeResolutionContext } from '@/test/_fixtures/factories';
import { makeCombatFighter } from '@/test/_fixtures/combatFighter';
import { SeededRNG } from '@/utils/random';

const PHASE_KEY = 'opening' as const;

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
  const fA = makeCombatFighter({
    style: FightingStyle.StrikingAttack,
    skills: { ATT: 12, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
  });
  const fD = makeCombatFighter({
    label: 'D',
    style: defenderStyle,
    skills: { ATT: 5, PAR: 18, DEF: 14, INI: 10, RIP: 12, DEC: 10 },
    activePlan: defPlan,
    plan: defPlan,
  });
  const ctx = makeResolutionContext({ rng: () => rng.next() });
  const events: CombatEvent[] = [];
  const es = makeExchangeState();

  const tactA = resolveEffectiveTactics(fA.activePlan, PHASE_KEY);
  const tactD = resolveEffectiveTactics(fD.activePlan, PHASE_KEY);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);
  const passiveCtx = (f: FighterState, opp: FightingStyle) => ({
    phase: 'OPENING' as const,
    exchange: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: f.hp / f.maxHp,
    endRatio: f.endurance / f.maxEndurance,
    opponentStyle: opp,
  });
  const passA = getStylePassive(fA.style, passiveCtx(fA, fD.style));
  const passD = getStylePassive(fD.style, passiveCtx(fD, fA.style));
  const dynCtx = (f: FighterState) => ({
    phase: 'OPENING' as const,
    hpRatio: f.hp / f.maxHp,
    endRatio: f.endurance / f.maxEndurance,
    consecutiveHits: 0,
  });
  const dynTraitsA = getDynamicTraitMods(fA, dynCtx(fA));
  const dynTraitsD = getDynamicTraitMods(fD, dynCtx(fD));
  const psych = { attMod: 0, defMod: 0, parMod: 0, iniMod: 0 };
  const attCommit = runCommit(fA, fA.activePlan.OE);
  const defCommit = runCommit(fD, fD.activePlan.OE);
  es.recoveryDebtToWriteA = attCommit.debtToWrite;
  es.recoveryDebtToWriteD = defCommit.debtToWrite;

  resolveCombatOffenseDefense({
    ctx,
    fA,
    fD,
    aGoesFirst: true,
    OE_A: fA.activePlan.OE,
    AL_A: fA.activePlan.AL,
    OE_D: fD.activePlan.OE,
    AL_D: fD.activePlan.AL,
    fatA: 0,
    fatD: 0,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
    passA,
    passD,
    biasAttA: 0,
    biasDefA: 0,
    biasAttD: 0,
    biasDefD: 0,
    tactA,
    tactD,
    psychA: psych,
    psychD: psych,
    dynTraitsA,
    dynTraitsD,
    feintAttBonus: 0,
    feintDefBonus: 0,
    attCommit,
    defCommit,
    es,
    phaseKey: PHASE_KEY,
    stylePhase: 'OPENING',
    events,
  });
  return events;
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
