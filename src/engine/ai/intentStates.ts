/**
 * In-bout AI intent layer (Stage F).
 *
 * A pure labeling layer over the plan/state selection the engine already
 * performs each exchange: conditional overrides (conditionEngine), psych
 * states (psychState), desperate-plan engagement (handleDesperateState), and
 * the commit/kill-window gate (hitExecution). The intent names WHICH of those
 * existing selections is active — it never changes probabilities, modifiers,
 * or plan values, so combat balance math is untouched.
 *
 * Telemetry: `evaluateBoutIntent` emits a `CombatEvent{metadata:{cause:
 * 'AI_INTENT_*'}}` only on intent *transitions*, which `buildExchangeLogEntry`
 * promotes into `ExchangeLogEntry.reasonCodes`. Emission is gated on
 * `ctx.aiIntentTelemetry` (non-headless or `__AI_DEBUG`).
 */
import type { CombatEvent } from '@/types/combat.types';
import type { PsychState } from '@/types/shared.types';
import type { OwnerPersonality } from '@/types/state.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import { COMMIT_HP_THRESHOLD, COMMIT_KILL_DESIRE } from '@/constants/combat';
import { getKillMechanic } from '@/engine/stylePassives';

/** Intent labels naming which existing engine selection is active this exchange. */
export type BoutIntent = 'Press' | 'Probe' | 'Hold' | 'Recover' | 'Finish' | 'Survive';

/** Fight-state inputs {@link deriveBoutIntent} reads to pick an intent label. */
export interface BoutIntentInput {
  psychState: PsychState;
  phase: 'OPENING' | 'MID' | 'LATE';
  /** Own hp / maxHp */
  hpRatio: number;
  /** Own endurance / maxEndurance */
  endRatio: number;
  /** Opponent hp / maxHp */
  opponentHpRatio: number;
  /** Effective killDesire from the active plan (phase-aware) */
  killDesire: number;
  /** Engine commit flag — attacker went all-in at low HP with high KD */
  committed: boolean;
  /** desperatePlan currently engaged (handleDesperateState) */
  desperateActive: boolean;
  momentum: number;
  /** This fighter's style kill-window HP multiplier (0.3–0.8) */
  killWindowHpMult: number;
  personality?: OwnerPersonality;
}

/**
 * Maps current fight state to the intent that best describes which existing
 * plan/state selection is active. Deterministic precedence:
 *
 *   Finish  — kill window open on the opponent AND the plan will press it
 *             (committed flag or KD at the commit threshold). Ordered first:
 *             the engine's own commit mechanic is an all-in at LOW hp, so a
 *             dying fighter hunting a killable opponent is finishing, not
 *             surviving.
 *   Survive — own HP below the engine's commit threshold.
 *   Recover — exhaustion crisis (FatiguePanic / low endurance) or the
 *             desperate plan is engaged for endurance reasons.
 *   Press   — InTheZone / Cruising, or a clear momentum lead.
 *   Hold    — Rattled, or a clear momentum deficit.
 *   Probe   — default feeling-out; personality shades mid/late neutral.
 */
export function deriveBoutIntent(i: BoutIntentInput): BoutIntent {
  if (
    i.committed ||
    (i.opponentHpRatio <= i.killWindowHpMult && i.killDesire >= COMMIT_KILL_DESIRE)
  ) {
    return 'Finish';
  }
  if (i.hpRatio < COMMIT_HP_THRESHOLD) return 'Survive';
  if (i.psychState === 'FatiguePanic' || i.endRatio < 0.2 || i.desperateActive) {
    return 'Recover';
  }
  // Psych 'Desperate' at hp >= threshold is endurance-driven (end < 10%,
  // high-WT branch in derivePsychState) — already Recover above.
  if (i.psychState === 'Desperate') return 'Survive';
  if (i.psychState === 'InTheZone' || i.psychState === 'Cruising') return 'Press';
  if (i.psychState === 'Rattled') return 'Hold';
  if (i.momentum >= 2) return 'Press';
  if (i.momentum <= -2) return 'Hold';
  if (i.phase === 'OPENING') return 'Probe';
  if (i.personality === 'Aggressive' || i.personality === 'Showman') return 'Press';
  if (i.personality === 'Methodical' || i.personality === 'Pragmatic') return 'Hold';
  return 'Probe';
}

/**
 * Derives the fighter's current intent and returns an `AI_INTENT` event when
 * it changed since the last evaluation. Mutates `f.lastIntent` (transition
 * dedup). Returns null when the intent is unchanged so steady-state fights
 * don't spam the event stream.
 */
export function evaluateBoutIntent(
  f: FighterState,
  opponent: FighterState,
  ctx: ResolutionContext
): CombatEvent | null {
  const phaseKey = ctx.phase === 'OPENING' ? 'opening' : ctx.phase === 'MID' ? 'mid' : 'late';
  const killMech = getKillMechanic(f.style, {
    phase: ctx.phase,
    hitsLanded: f.hitsLanded,
    consecutiveHits: f.consecutiveHits,
    hitLocation: '',
  });
  const intent = deriveBoutIntent({
    psychState: f.psychState,
    phase: ctx.phase,
    hpRatio: f.hp / f.maxHp,
    endRatio: f.endurance / f.maxEndurance,
    opponentHpRatio: opponent.hp / opponent.maxHp,
    killDesire:
      f.activePlan.phases?.[phaseKey]?.killDesire ?? f.activePlan.killDesire ?? 5,
    committed: f.committed,
    desperateActive: !!f.desperate,
    momentum: f.momentum,
    killWindowHpMult: killMech.killWindowHpMult,
    personality: f.plan.ownerPersonality,
  });
  if (f.lastIntent === intent) return null;
  f.lastIntent = intent;
  return {
    type: 'AI_INTENT',
    actor: f.label,
    metadata: { cause: `AI_INTENT_${intent.toUpperCase()}`, intent },
  };
}
