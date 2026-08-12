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
} from './exchangeSubPhases';
import { tickBleed } from './bleed';
import { resolveInitiativePhase, resolveCombatOffenseDefense } from './phaseResolvers';
import { prepareExchange } from './exchangePrep';
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
  runApproach(rng, fA, fD, s.OE_A, s.OE_D, ctx, es);
  events.push(...es.events.splice(0));

  // 2. Initiative Phase
  const { aGoesFirst, event: iniEvent } = resolveInitiativePhase(
    ctx,
    fA,
    fD,
    s.OE_A,
    s.AL_A,
    s.OE_D,
    s.AL_D,
    s.fatA,
    s.fatD,
    s.defModsA,
    s.defModsD,
    s.passA,
    s.passD,
    s.psychA,
    s.psychD,
    s.dynTraitsA,
    s.dynTraitsD
  );
  events.push(iniEvent);

  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  // Sub-phase 2: Feint (attacker only)
  const feintResult = runFeint(rng, att, def);
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
    ctx,
    fA,
    fD,
    aGoesFirst,
    s.OE_A,
    s.AL_A,
    s.OE_D,
    s.AL_D,
    s.fatA,
    s.fatD,
    s.offModsA,
    s.offModsD,
    s.defModsA,
    s.defModsD,
    s.passA,
    s.passD,
    s.biasAttA,
    s.biasDefA,
    s.biasAttD,
    s.biasDefD,
    s.tactA,
    s.tactD,
    s.psychA,
    s.psychD,
    s.dynTraitsA,
    s.dynTraitsD,
    feintAttBonus,
    feintDefBonus,
    attCommit,
    defCommit,
    es,
    phaseKey,
    phase as StylePhase,
    events
  );

  const curAttOE = aGoesFirst ? s.OE_A : s.OE_D;
  const curAttAL = aGoesFirst ? s.AL_A : s.AL_D;
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;

  applyEnduranceCosts(
    events,
    ctx,
    fA,
    fD,
    aGoesFirst,
    curAttOE,
    curAttAL,
    curAttWepReq,
    curDefWepReq,
    s.OE_D,
    s.AL_D,
    s.OE_A,
    s.AL_A
  );

  // Sub-phase 5: Recovery — write debt, handle zone transitions
  runRecovery(fA, fD, es.recoveryDebtToWriteA, es.recoveryDebtToWriteD, events, ctx);

  // Track tactic streaks for overuse penalty
  const currTacticA = s.tactA.offTactic;
  const currTacticD = s.tactD.offTactic;
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

  // SL bleed: damage-over-time tick on any bleeding fighter, then decay.
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

  return events;
}
