/**
 * Tactic counter-play — the Arena 93 Response ↔ Decisiveness rock-paper-
 * scissors, and the Decisiveness tactic's live first-strike edge.
 *
 * Canon (Sir Boyd, "The Striking Style", Arena 93):
 *   "Decise tactic has advantage over no tactic or any tactic other than
 *    Response. Any tactic other than Decise has advantage over Response
 *    tactic. Response tactic has advantage over Decise tactic."
 *
 * Engine mapping: Decisiveness's `decBonus` becomes a live initiative edge
 * (first strike is what decise IS) — suppressed when the defender stands
 * responsive; Responsiveness seizes extra tempo against a decisive attack
 * and is a wasted read against anything else.
 */
import { describe, it, expect } from 'vitest';
import { resolveTacticCounters } from '@/engine/combat/resolution/tacticCounter';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { resolveInitiativePhase } from '@/engine/combat/resolution/initiativePhase';
import type { ResolvedTactics } from '@/engine/combat/resolution/tactics';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  type OffensiveMods,
  type DefensiveMods,
} from '@/engine/combat/mechanics/tacticResolution';
import { RESPONSE_COUNTER_INI } from '@/constants/combat';
import { FightingStyle } from '@/types/shared.types';
import { simulateFight } from '@/engine/simulate';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { makeWarrior, makePlan } from './_helpers';

const ST = FightingStyle.StrikingAttack;

const tacts = (
  offTactic: ResolvedTactics['offTactic'],
  defTactic: ResolvedTactics['defTactic'] = 'none'
): ResolvedTactics => ({ offTactic, defTactic, target: 'Any' });

const offMods = (tactic: ResolvedTactics['offTactic'], style = ST): OffensiveMods =>
  getOffensiveTacticMods(tactic, style);
const defMods = (tactic: ResolvedTactics['defTactic'], style = ST): DefensiveMods =>
  getDefensiveTacticMods(tactic, style);

const counter = (
  aOff: ResolvedTactics['offTactic'],
  dDef: ResolvedTactics['defTactic'],
  aDef: ResolvedTactics['defTactic'] = 'none',
  dOff: ResolvedTactics['offTactic'] = 'none'
) =>
  resolveTacticCounters({
    tactA: tacts(aOff, aDef),
    tactD: tacts(dOff, dDef),
    offModsA: offMods(aOff),
    offModsD: offMods(dOff),
    defModsA: defMods(aDef),
    defModsD: defMods(dDef),
  });

describe('resolveTacticCounters — canon Response↔Decise RPS', () => {
  it('decise attacker beats every defense except Response: keeps its decBonus edge', () => {
    for (const def of ['none', 'Dodge', 'Parry', 'Riposte'] as const) {
      const c = counter('Decisiveness', def);
      expect(c.tacticIniA, `Decise vs ${def} should keep the edge`).toBe(offMods('Decisiveness').decBonus);
      expect(c.tacticIniA).toBeGreaterThan(0);
    }
  });

  it('Response suppresses the decise edge and seizes tempo', () => {
    const c = counter('Decisiveness', 'Responsiveness');
    expect(c.tacticIniA).toBe(0);
    expect(c.defIniBonusD).toBe(defMods('Responsiveness').iniBonus + RESPONSE_COUNTER_INI);
  });

  it('Response is a wasted read vs any non-Decise attack', () => {
    for (const off of ['none', 'Lunge', 'Slash', 'Bash'] as const) {
      const c = counter(off, 'Responsiveness');
      expect(c.tacticIniA, `${off} attacker gets no decise edge`).toBe(0);
      expect(c.defIniBonusD, `Response vs ${off} should be wasted`).toBe(0);
    }
  });

  it('non-Response defenders keep their iniBonus untouched', () => {
    const c = counter('Lunge', 'Dodge');
    expect(c.defIniBonusD).toBe(defMods('Dodge').iniBonus);
    expect(c.defIniBonusA).toBe(defMods('none').iniBonus);
  });

  it('is symmetric — the D-side decise is countered by the A-side Response', () => {
    const c = counter('none', 'none', 'Responsiveness', 'Decisiveness');
    expect(c.tacticIniD).toBe(0);
    expect(c.defIniBonusA).toBe(defMods('Responsiveness').iniBonus + RESPONSE_COUNTER_INI);
  });

  it('mutual Response vs mutual Decise cancels both edges and boosts both reads', () => {
    const c = counter('Decisiveness', 'Responsiveness', 'Responsiveness', 'Decisiveness');
    expect(c.tacticIniA).toBe(0);
    expect(c.tacticIniD).toBe(0);
    expect(c.defIniBonusA).toBe(defMods('Responsiveness').iniBonus + RESPONSE_COUNTER_INI);
    expect(c.defIniBonusD).toBe(defMods('Responsiveness').iniBonus + RESPONSE_COUNTER_INI);
  });
});

describe('tactic counters — exchange wiring', () => {
  const exchange = (aOff: string, dDef: string) => {
    const ctx = makeResolutionContext();
    const fA = makeFighterState({
      style: ST,
      activePlan: { style: ST, OE: 7, AL: 6, offensiveTactic: aOff } as never,
      plan: { style: ST, OE: 7, AL: 6, offensiveTactic: aOff } as never,
    });
    const fD = makeFighterState({
      label: 'D',
      style: ST,
      activePlan: { style: ST, OE: 5, AL: 5, defensiveTactic: dDef } as never,
      plan: { style: ST, OE: 5, AL: 5, defensiveTactic: dDef } as never,
    });
    return prepareExchange(ctx, fA, fD, []);
  };

  it('prepareExchange carries the decise edge on tacticIniA', () => {
    const s = exchange('Decisiveness', 'none');
    expect(s.tacticIniA).toBe(offMods('Decisiveness').decBonus);
    expect(s.tacticIniD).toBe(0);
  });

  it('prepareExchange suppresses the edge and boosts the responder vs Decise', () => {
    const s = exchange('Decisiveness', 'Responsiveness');
    expect(s.tacticIniA).toBe(0);
    expect(s.defModsD.iniBonus).toBe(defMods('Responsiveness').iniBonus + RESPONSE_COUNTER_INI);
  });

  it('prepareExchange wastes the Response read vs non-Decise', () => {
    const s = exchange('Bash', 'Responsiveness');
    expect(s.tacticIniA).toBe(0);
    expect(s.defModsD.iniBonus).toBe(0);
  });

  it('resolveInitiativePhase adds tacticIni into the initiative sum', () => {
    const ctx = makeResolutionContext();
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const s = prepareExchange(ctx, fA, fD, []);
    const base = {
      ctx,
      fA,
      fD,
      OE_A: s.OE_A,
      AL_A: s.AL_A,
      OE_D: s.OE_D,
      AL_D: s.AL_D,
      fatA: s.fatA,
      fatD: s.fatD,
      defModsA: s.defModsA,
      defModsD: s.defModsD,
      passA: s.passA,
      passD: s.passD,
      psychA: s.psychA,
      psychD: s.psychD,
      dynTraitsA: s.dynTraitsA,
      dynTraitsD: s.dynTraitsD,
    };
    const flat = resolveInitiativePhase({ ...base, tacticIniA: 0, tacticIniD: 0 });
    const edged = resolveInitiativePhase({ ...base, tacticIniA: 6, tacticIniD: 0 });
    expect(edged.iniA - flat.iniA).toBe(6);
    expect(edged.iniD - flat.iniD).toBe(0);
  });
});

describe('simulateFight — decise is live and Response counters it', () => {
  const trials = 30;
  const striker = () => makeWarrior('Striker', ST, { SP: 15, WT: 14, DF: 14 });
  const responder = () => makeWarrior('Responder', ST, { SP: 14, WT: 14, DF: 14 });

  const winsFor = (
    side: 'A' | 'D',
    planA: Parameters<typeof simulateFight>[0]['planA'],
    planD: Parameters<typeof simulateFight>[0]['planD']
  ) => {
    let wins = 0;
    for (let seed = 1; seed <= trials; seed++) {
      const r = simulateFight({
        planA,
        planD,
        warriorA: striker(),
        warriorD: responder(),
        providedRng: seed,
      });
      if (r.winner === side) wins++;
    }
    return wins;
  };

  it('Decisiveness is a real edge: a decise striker beats the same striker without it', () => {
    const deciseWins = winsFor(
      'A',
      makePlan(ST, { OE: 8, AL: 7, offensiveTactic: 'Decisiveness' }),
      makePlan(ST, { OE: 8, AL: 7 })
    );
    const noneWins = winsFor(
      'A',
      makePlan(ST, { OE: 8, AL: 7 }),
      makePlan(ST, { OE: 8, AL: 7 })
    );
    expect(deciseWins).toBeGreaterThan(noneWins);
  });

  it('Response counters Decise: responder wins more vs decise than vs a plain attack', () => {
    const responsePlan = makePlan(ST, { OE: 6, AL: 6, defensiveTactic: 'Responsiveness' });
    const vsDecise = winsFor(
      'D',
      makePlan(ST, { OE: 8, AL: 7, offensiveTactic: 'Decisiveness' }),
      responsePlan
    );
    const vsNone = winsFor('D', makePlan(ST, { OE: 8, AL: 7 }), responsePlan);
    expect(vsDecise).toBeGreaterThan(vsNone);
  });
});
