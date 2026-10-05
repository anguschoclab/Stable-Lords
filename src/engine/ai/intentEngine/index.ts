import type { GameState, RivalStableData, AIIntent, AIStrategy } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNG, resolveRng } from '@/utils/random';
import { buildIntentContext } from './context';
import {
  weatherPivotApplies,
  survivalApplies,
  recoveryApplies,
  vendettaApplies,
  objectiveServicingIntent,
  tournamentCampaignApplies,
  crownCampaignPicked,
  wealthAccumulationApplies,
  aggressiveExpansionApplies,
  rosterDiversityApplies,
  expansionApplies,
} from './predicates';
import {
  INTENT_REASONS,
  intentStillApplies,
  resolveVendettaTarget,
  verifyIntentSkepticism,
} from './skepticism';

export { verifyIntentSkepticism, intentStillApplies } from './skepticism';

/**
 * Determines the weekly strategic intent for an AI owner.
 * Intent impacts recruitment, training, and matchmaking choices.
 */
export function pickWeeklyIntent(
  rival: RivalStableData,
  state: GameState,
  seed?: number,
  rng?: IRNGService
): AIIntent {
  const rngService = resolveRng(rng, seed ?? state.week * 131 + rival.owner.id.length);
  const ctx = buildIntentContext(rival, state);

  if (weatherPivotApplies(ctx)) return 'RECOVERY';
  // Vendetta precedes recovery: a fresh blood feud outranks belt-tightening —
  // otherwise a broke grudge-holder can never answer the grievance (RECOVERY
  // crowds the pick on every cash-strapped week).
  if (vendettaApplies(ctx, rngService)) return 'VENDETTA';
  // SURVIVAL precedes RECOVERY: insolvency-plus-losses is a deeper crisis
  // than belt-tightening, and a live grudge (checked just above) still
  // outranks it — a folding stable answers its feud, then hunkers.
  if (survivalApplies(ctx)) return 'SURVIVAL';
  if (recoveryApplies(ctx)) return 'RECOVERY';
  // The tournament prep window is a fixed calendar deadline — it must outrank
  // the season plan-of-record, or a TREASURY/REBUILD program buries it every
  // week and TOURNAMENT_CAMPAIGN can never fire.
  if (tournamentCampaignApplies(ctx)) return 'TOURNAMENT_CAMPAIGN';
  // Stage C: a live season objective is serviced by its intent — a CROWN
  // plan campaigns even through a lean week the bare cascade would skip.
  const servicing = objectiveServicingIntent(ctx);
  if (servicing) return servicing;
  if (crownCampaignPicked(ctx)) return 'CROWN_CAMPAIGN';
  if (wealthAccumulationApplies(ctx)) return 'WEALTH_ACCUMULATION';
  if (aggressiveExpansionApplies(ctx)) return 'AGGRESSIVE_EXPANSION';
  if (rosterDiversityApplies(ctx)) return 'ROSTER_DIVERSITY';
  if (expansionApplies(ctx)) return 'EXPANSION';

  // CONSOLIDATION: Default (focus on training and base maintenance)
  return 'CONSOLIDATION';
}

/**
 * Updates the AI strategy, either continuing the current plan or picking a new one.
 */
export function updateAIStrategy(
  rival: RivalStableData,
  state: GameState,
  seed?: number
): AIStrategy {
  const current = rival.strategy;

  // ⚡ Skeptical Memory: Verify current plan
  const planDisproved = verifyIntentSkepticism(rival, state);

  // If no strategy, plan expired, or plan is disproved, pick a new one
  if (!current || current.planWeeksRemaining <= 0 || planDisproved) {
    const s = seed ?? state.week * 7919 + rival.owner.id.length * 13;
    const rng = new SeededRNG(s);
    const picked = pickWeeklyIntent(rival, state, s, rng);

    // Hysteresis: a merely-expired (not disproved) plan whose condition still
    // ~applies is renewed rather than churned into a neighboring intent.
    // CONSOLIDATION is the fallback, not a real plan — `intentStillApplies`
    // returns true for it unconditionally, so without this exclusion it would
    // absorb every re-pick and the strategy could never leave the default.
    const holdCourse =
      current !== undefined &&
      !planDisproved &&
      picked !== current.intent &&
      current.intent !== 'CONSOLIDATION' &&
      intentStillApplies(rival, state, current.intent);
    const intent = holdCourse ? current.intent : picked;

    // Determine the duration of this intent
    const duration =
      intent === 'RECOVERY' || intent === 'SURVIVAL'
        ? 2
        : intent === 'VENDETTA' || intent === 'CROWN_CAMPAIGN'
          ? 6
          : intent === 'EXPANSION'
            ? 3
            : 4;

    const targetStableId = intent === 'VENDETTA' ? resolveVendettaTarget(rival, state) : undefined;

    const crownTarget = rival.agentMemory?.crownAssessment;
    return {
      intent,
      planWeeksRemaining: duration,
      targetStableId,
      targetArenaId: intent === 'CROWN_CAMPAIGN' ? crownTarget?.arenaId : undefined,
      reason: holdCourse
        ? `Holding course — ${INTENT_REASONS[intent].toLowerCase()}`
        : intent === 'CROWN_CAMPAIGN' && crownTarget
          ? `${INTENT_REASONS[intent]} — ${crownTarget.reason}.`
          : INTENT_REASONS[intent],
    };
  }

  // Otherwise, tick the current strategy
  return {
    ...current,
    planWeeksRemaining: current.planWeeksRemaining - 1,
  };
}
