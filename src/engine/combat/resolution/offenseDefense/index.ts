/**
 * Offense/defense resolution — attack check, whiff riposte, contested defense.
 * Extracted from phaseResolvers.ts for SRP separation.
 */
import { prepareOffenseDefense } from './prepare';
import { resolveContestedDefense, resolveWhiffRiposte } from './defense';
import type { ResolveCombatOffenseDefenseArgs } from './types';

export type {
  OffenseDefenseArgs,
  OffenseDefenseCtx,
  ResolveCombatOffenseDefenseArgs,
} from './types';
export { resolveContestedDefense, resolveWhiffRiposte } from './defense';

/**
 * Resolve the attack and defense checks, including ripostes and successful hits.
 */
export function resolveCombatOffenseDefense(args: ResolveCombatOffenseDefenseArgs): void {
  const { ctx, fA, fD, aGoesFirst, OE_A } = args;
  const { AL_A, OE_D, AL_D, fatA, fatD } = args;
  const { offModsA, offModsD, defModsA, defModsD, passA } = args;
  const { passD, biasAttA, biasDefA, biasAttD, biasDefD } = args;
  const { tactA, tactD, psychA, psychD, dynTraitsA } = args;
  const { dynTraitsD, feintAttBonus, feintDefBonus, attCommit, defCommit } = args;
  const { es, phaseKey, stylePhase, events } = args;
  const { s, attSucc } = prepareOffenseDefense({
    ctx,
    fA,
    fD,
    aGoesFirst,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    fatA,
    fatD,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
    passA,
    passD,
    biasAttA,
    biasDefA,
    biasAttD,
    biasDefD,
    tactA,
    tactD,
    psychA,
    psychD,
    dynTraitsA,
    dynTraitsD,
    feintAttBonus,
    feintDefBonus,
    attCommit,
    defCommit,
    es,
    phaseKey,
    stylePhase,
    events,
  });

  if (!attSucc) {
    resolveWhiffRiposte(s);
  } else {
    resolveContestedDefense(s);
  }
}
