/**
 * Shared offense/defense exchange harness — builds the full
 * ResolveCombatOffenseDefenseArgs bag (tactics, tactic mods, style passives,
 * dynamic traits, psych, commit) for a single exchange and runs it. Shared by
 * offenseDefense.test.ts and prKillDesireRiposte.test.ts.
 */
import { resolveCombatOffenseDefense } from '@/engine/combat/resolution/offenseDefense';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import { resolveEffectiveTactics } from '@/engine/combat/resolution/tactics';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
} from '@/engine/combat/mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getDynamicTraitMods } from '@/engine/traits';
import {
  makeExchangeState,
  runCommit,
  type ExchangeState,
} from '@/engine/combat/resolution/exchangeSubPhases';
import { makeResolutionContext } from '@/test/_fixtures/factories';
import { makeCombatFighter } from '@/test/_fixtures/combatFighter';

const makeFighter = makeCombatFighter;
const makeCtx = makeResolutionContext;

/** Fully-resolved inputs for one offense/defense exchange call. */
export interface SetupResult {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  es: ExchangeState;
  events: CombatEvent[];
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  offModsA: ReturnType<typeof getOffensiveTacticMods>;
  offModsD: ReturnType<typeof getOffensiveTacticMods>;
  defModsA: ReturnType<typeof getDefensiveTacticMods>;
  defModsD: ReturnType<typeof getDefensiveTacticMods>;
  passA: ReturnType<typeof getStylePassive>;
  passD: ReturnType<typeof getStylePassive>;
  dynTraitsA: ReturnType<typeof getDynamicTraitMods>;
  dynTraitsD: ReturnType<typeof getDynamicTraitMods>;
  psychA: any;
  psychD: any;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
}

/** Builds a schema-valid exchange setup; defender defaults to Parry-Riposte. */
export function setupExchange(
  overrides: {
    fA?: Partial<FighterState>;
    fD?: Partial<FighterState>;
    ctx?: Partial<ResolutionContext>;
    aGoesFirst?: boolean;
  } = {}
): SetupResult {
  const fA = makeFighter({ ...overrides.fA });
  const fD = makeFighter({ label: 'D', style: FightingStyle.ParryRiposte, ...overrides.fD });
  const ctx = makeCtx(overrides.ctx);
  const events: CombatEvent[] = [];
  const es = makeExchangeState();

  const phaseKey = 'opening';
  const tactA = resolveEffectiveTactics(fA.activePlan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.activePlan, phaseKey);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);

  const passA = getStylePassive(fA.style, {
    phase: 'OPENING',
    exchange: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    opponentStyle: fD.style,
  });
  const passD = getStylePassive(fD.style, {
    phase: 'OPENING',
    exchange: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    opponentStyle: fA.style,
  });

  const dynTraitsA = getDynamicTraitMods(fA, {
    phase: 'OPENING',
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    consecutiveHits: 0,
  });
  const dynTraitsD = getDynamicTraitMods(fD, {
    phase: 'OPENING',
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    consecutiveHits: 0,
  });

  const OE_A = fA.activePlan.OE;
  const AL_A = fA.activePlan.AL;
  const OE_D = fD.activePlan.OE;
  const AL_D = fD.activePlan.AL;
  const fatA = 0;
  const fatD = 0;
  const biasAttA = 0;
  const biasDefA = 0;
  const biasAttD = 0;
  const biasDefD = 0;
  const psychA = { attMod: 0, defMod: 0, parMod: 0, iniMod: 0 };
  const psychD = { attMod: 0, defMod: 0, parMod: 0, iniMod: 0 };

  const attCommit = runCommit(fA, OE_A);
  const defCommit = runCommit(fD, OE_D);
  es.recoveryDebtToWriteA = attCommit.debtToWrite;
  es.recoveryDebtToWriteD = defCommit.debtToWrite;

  return {
    ctx,
    fA,
    fD,
    es,
    events,
    tactA,
    tactD,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
    passA,
    passD,
    dynTraitsA,
    dynTraitsD,
    psychA,
    psychD,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    fatA,
    fatD,
    biasAttA,
    biasDefA,
    biasAttD,
    biasDefD,
  };
}

/** Runs a single offense/defense exchange over the setup, mutating s.events. */
export function callResolveCombatOffenseDefense(s: SetupResult, aGoesFirst: boolean) {
  const attCommit = runCommit(aGoesFirst ? s.fA : s.fD, aGoesFirst ? s.OE_A : s.OE_D);
  const defCommit = runCommit(aGoesFirst ? s.fD : s.fA, aGoesFirst ? s.OE_D : s.OE_A);
  resolveCombatOffenseDefense({
    ctx: s.ctx,
    fA: s.fA,
    fD: s.fD,
    aGoesFirst: aGoesFirst,
    OE_A: s.OE_A,
    AL_A: s.AL_A,
    OE_D: s.OE_D,
    AL_D: s.AL_D,
    fatA: s.fatA,
    fatD: s.fatD,
    offModsA: s.offModsA,
    offModsD: s.offModsD,
    defModsA: s.defModsA,
    defModsD: s.defModsD,
    passA: s.passA,
    passD: s.passD,
    biasAttA: s.biasAttA,
    biasDefA: s.biasDefA,
    biasAttD: s.biasAttD,
    biasDefD: s.biasDefD,
    tactA: s.tactA,
    tactD: s.tactD,
    psychA: s.psychA,
    psychD: s.psychD,
    dynTraitsA: s.dynTraitsA,
    dynTraitsD: s.dynTraitsD,
    feintAttBonus: 0,
    feintDefBonus: 0,
    attCommit: attCommit,
    defCommit: defCommit,
    es: s.es,
    phaseKey: 'opening',
    stylePhase: 'OPENING',
    events: s.events,
  });
}
