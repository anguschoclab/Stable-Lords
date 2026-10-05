/**
 * Offense/defense resolution — shared context + arg bags.
 * Extracted from phaseResolvers.ts for SRP separation.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { PsychStateMod } from '../../mechanics/conditionEngine';
import { type Phase as StylePhase } from '../../../stylePassives';
import type { StylePassiveResult } from '../../../stylePassives';
import type { DynamicTraitMods } from '../../../traits';
import { type OffensiveMods, type DefensiveMods } from '../../mechanics/tacticResolution';
import type { CommitResult, ExchangeState } from '../exchangeSubPhases';
import type { FighterState, ResolutionContext } from '../types';
import type { ResolvedTactics } from '../tactics';

/**
 * Bundled inputs + resolved per-side ("current attacker/defender") view for a
 * single offense/defense resolution. Built once in {@link resolveCombatOffenseDefense}
 * and threaded to the branch handlers to avoid passing 30+ positional args.
 */
export interface OffenseDefenseCtx {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  aGoesFirst: boolean;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  offModsA: OffensiveMods;
  offModsD: OffensiveMods;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
  passA: StylePassiveResult;
  passD: StylePassiveResult;
  biasDefA: number;
  biasDefD: number;
  tactA: ResolvedTactics;
  tactD: ResolvedTactics;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
  feintDefBonus: number;
  defCommit: CommitResult;
  attCommit: CommitResult;
  phaseKey: 'opening' | 'mid' | 'late';
  stylePhase: StylePhase;
  events: CombatEvent[];
  att: FighterState;
  def: FighterState;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  curAttOE: number;
  curAttAL: number;
  curOffMods: OffensiveMods;
  curPassA: StylePassiveResult;
  defWeaponRangeMod: number;
  defDynTraitPar: number;
  defDynTraitDef: number;
}

/**
 * All raw inputs to a single offense/defense resolution — kept as a bag so the
 * attacker/defender derivation + attack-check prelude can live apart from the
 * branch dispatch without 30+ positional args.
 */
export interface OffenseDefenseArgs {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  aGoesFirst: boolean;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  offModsA: OffensiveMods;
  offModsD: OffensiveMods;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
  passA: StylePassiveResult;
  passD: StylePassiveResult;
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
  tactA: ResolvedTactics;
  tactD: ResolvedTactics;
  psychA: PsychStateMod;
  psychD: PsychStateMod;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
  feintAttBonus: number;
  feintDefBonus: number;
  attCommit: CommitResult;
  defCommit: CommitResult;
  es: ExchangeState;
  phaseKey: 'opening' | 'mid' | 'late';
  stylePhase: StylePhase;
  events: CombatEvent[];
}

/**
 *
 */
export interface ResolveCombatOffenseDefenseArgs {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  aGoesFirst: boolean;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  offModsA: OffensiveMods;
  offModsD: OffensiveMods;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
  passA: StylePassiveResult;
  passD: StylePassiveResult;
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
  tactA: ResolvedTactics;
  tactD: ResolvedTactics;
  psychA: PsychStateMod;
  psychD: PsychStateMod;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
  feintAttBonus: number;
  feintDefBonus: number;
  attCommit: CommitResult;
  defCommit: CommitResult;
  es: ExchangeState;
  phaseKey: 'opening' | 'mid' | 'late';
  stylePhase: StylePhase;
  events: CombatEvent[];
}
