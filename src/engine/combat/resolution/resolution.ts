/**
 * Combat Resolution - main orchestrator for exchange resolution.
 * Phase resolver functions extracted to phaseResolvers.ts for SRP separation.
 * Pre-exchange setup extracted to exchangePrep.ts.
 * Style riposte bonuses extracted to styleRiposteBonus.ts.
 */
import { applyEnduranceCosts } from './exchangeHelpers';
import type { CombatEvent } from '@/types/combat.types';
import { FEINT_FAILED_DEF_BONUS } from '@/constants/combat';
import {
  makeExchangeState,
  runApproach,
  runFeint,
  runCommit,
  runRecovery,
  type ExchangeState,
} from './exchangeSubPhases';
import { tickBleed } from './bleed';
import { resolveInitiativePhase, resolveCombatOffenseDefense } from './phaseResolvers';
import { prepareExchange, type ExchangeSetup } from './exchangePrep';
import type { FighterState, ResolutionContext } from './types';
import { type Phase as StylePhase } from '../../stylePassives';

// Re-export from split modules
export type { FighterState, ResolutionContext } from './types';
export { resolveEffectiveTactics, applyAggressionBias } from './tactics';
export { DECISION_HIT_MARGIN, getMatchupBonus } from '@/constants/combat';
export { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
export { applySpecialtyMods } from './specialtyMods';
export {
  resolveInitiativePhase,
  resolveWhiffRiposte,
  resolveContestedDefense,
  resolveCombatOffenseDefense,
} from './phaseResolvers';
export type { OffenseDefenseCtx } from './phaseResolvers';
export { styleRiposteBonus } from './styleRiposteBonus';

/**
 *
 */
export function resolveExchange(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState
): CombatEvent[] {
  const events: CombatEvent[] = [];
  const { rng, phase } = ctx;
  const phaseKey = phase === 'OPENING' ? 'opening' : phase === 'MID' ? 'mid' : 'late';

  // ── Pre-exchange setup: recovery, conditions, psych, tactics, fatigue, passives, traits ──
  const s = prepareExchange(ctx, fA, fD, events);

  // ── Spatial Sub-Phases ──
  const es = makeExchangeState();

  // Sub-phase 1: Approach — contest distance, update ctx.range
  runApproach({ rng: rng, fA: fA, fD: fD, OE_A: s.OE_A, OE_D: s.OE_D, ctx: ctx, es: es });
  events.push(...es.events.splice(0));

  // 2. Initiative Phase
  const { aGoesFirst, event: iniEvent } = resolveInitiativePhase(
    { ctx: ctx, fA: fA, fD: fD, OE_A: s.OE_A, AL_A: s.AL_A, OE_D: s.OE_D, AL_D: s.AL_D, fatA: s.fatA, fatD: s.fatD, defModsA: s.defModsA, defModsD: s.defModsD, passA: s.passA, passD: s.passD, psychA: s.psychA, psychD: s.psychD, dynTraitsA: s.dynTraitsA, dynTraitsD: s.dynTraitsD }
  );
  events.push(iniEvent);

  // Sub-phases 2–4: Feint → Commit → Attack/Defense → Endurance costs
  runAttackExchange({ ctx: ctx, fA: fA, fD: fD, s: s, es: es, aGoesFirst: aGoesFirst, phaseKey: phaseKey, events: events });

  // Sub-phase 5: Recovery — write debt, handle zone transitions
  runRecovery({ fA: fA, fD: fD, debtToWriteA: es.recoveryDebtToWriteA, debtToWriteD: es.recoveryDebtToWriteD, events: events, ctx: ctx });

  updateTacticStreaks(ctx, s.tactA.offTactic, s.tactD.offTactic);
  tickBleedOnFighters(fA, fD, events);

  return events;
}

interface RunAttackExchangeArgs {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  s: ExchangeSetup;
  es: ExchangeState;
  aGoesFirst: boolean;
  phaseKey: 'opening' | 'mid' | 'late';
  events: CombatEvent[];
}

/**
 * Sub-phases 2–4: attacker feint, commit levels, offense/defense check, and
 * endurance costs. Writes recovery debt into `es` for the recovery sub-phase.
 */
function runAttackExchange(args: RunAttackExchangeArgs): void {
  const { ctx, fA, fD, s, es } = args;
  const { aGoesFirst, phaseKey, events } = args;
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  // Sub-phase 2: Feint (attacker only)
  const feintResult = runFeint(ctx.rng, att, def);
  events.push(...feintResult.events);
  const feintAttBonus = feintResult.feintBonus;
  const feintDefBonus = feintResult.feintFailed ? FEINT_FAILED_DEF_BONUS : 0;

  // Sub-phase 3: Commit — determine CommitLevel for attacker and defender
  const attCommit = runCommit(att, aGoesFirst ? s.OE_A : s.OE_D);
  const defCommit = runCommit(def, aGoesFirst ? s.OE_D : s.OE_A);
  es.recoveryDebtToWriteA = aGoesFirst ? attCommit.debtToWrite : defCommit.debtToWrite;
  es.recoveryDebtToWriteD = aGoesFirst ? defCommit.debtToWrite : attCommit.debtToWrite;

  // Sub-phase 4: Attack & Defense Check
  resolveCombatOffenseDefense(
    { ctx: ctx, fA: fA, fD: fD, aGoesFirst: aGoesFirst, OE_A: s.OE_A, AL_A: s.AL_A, OE_D: s.OE_D, AL_D: s.AL_D, fatA: s.fatA, fatD: s.fatD, offModsA: s.offModsA, offModsD: s.offModsD, defModsA: s.defModsA, defModsD: s.defModsD, passA: s.passA, passD: s.passD, biasAttA: s.biasAttA, biasDefA: s.biasDefA, biasAttD: s.biasAttD, biasDefD: s.biasDefD, tactA: s.tactA, tactD: s.tactD, psychA: s.psychA, psychD: s.psychD, dynTraitsA: s.dynTraitsA, dynTraitsD: s.dynTraitsD, feintAttBonus: feintAttBonus, feintDefBonus: feintDefBonus, attCommit: attCommit, defCommit: defCommit, es: es, phaseKey: phaseKey, stylePhase: ctx.phase as StylePhase, events: events }
  );

  applyExchangeEndurance({ events: events, ctx: ctx, fA: fA, fD: fD, s: s, aGoesFirst: aGoesFirst });
}

interface ApplyExchangeEnduranceArgs {
  events: CombatEvent[];
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  s: ExchangeSetup;
  aGoesFirst: boolean;
}

/** Sub-phase 4b: endurance costs for the attack exchange (att/def-derived OE/AL/weapon reqs). */
function applyExchangeEndurance(args: ApplyExchangeEnduranceArgs): void {
  const { events, ctx, fA, fD, s } = args;
  const { aGoesFirst } = args;
  const curAttOE = aGoesFirst ? s.OE_A : s.OE_D;
  const curAttAL = aGoesFirst ? s.AL_A : s.AL_D;
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;

  applyEnduranceCosts(
    { events: events, ctx: ctx, fA: fA, fD: fD, aGoesFirst: aGoesFirst, curAttOE: curAttOE, curAttAL: curAttAL, curAttWepReq: curAttWepReq, curDefWepReq: curDefWepReq, OE_D: s.OE_D, AL_D: s.AL_D, OE_A: s.OE_A, AL_A: s.AL_A }
  );
}

/** Track tactic streaks for the overuse penalty. */
function updateTacticStreaks(
  ctx: ResolutionContext,
  currTacticA: string,
  currTacticD: string
): void {
  ctx.tacticStreakA =
    currTacticA !== 'none' && ctx.lastOffTacticA === currTacticA
      ? ctx.tacticStreakA + 1
      : currTacticA !== 'none'
        ? 1
        : 0;
  ctx.tacticStreakD =
    currTacticD !== 'none' && ctx.lastOffTacticD === currTacticD
      ? ctx.tacticStreakD + 1
      : currTacticD !== 'none'
        ? 1
        : 0;
  ctx.lastOffTacticA = currTacticA;
  ctx.lastOffTacticD = currTacticD;
}

/** SL bleed: damage-over-time tick on any bleeding fighter, then decay. */
function tickBleedOnFighters(fA: FighterState, fD: FighterState, events: CombatEvent[]): void {
  for (const fighter of [fA, fD]) {
    const stacks = fighter.bleedStacks ?? 0;
    if (stacks > 0) {
      const { damage, next } = tickBleed(stacks);
      fighter.hp -= damage;
      fighter.bleedStacks = next;
      events.push({
        type: 'HIT',
        actor: fighter.label === 'A' ? 'D' : 'A',
        target: fighter.label,
        value: damage,
        location: 'Bleed',
        metadata: { cause: 'BLEED', stacks: next },
      });
    }
  }
}
