/**
 * Decoy mask + boundary phase-shift helpers (Stage D.2b / D.4).
 *
 * `applyDecoyMask` returns the plan a decoying fighter *performs* during the
 * masked window — the axes are real fight behavior, which is exactly what
 * makes the deception honest: opponent tactic-streak and momentum reads
 * build on the decoy pattern, and the fighter pays for the illusion with a
 * genuinely off-script tempo until `untilPhase`.
 *
 * `applyPhaseShiftBoundary` implements `phaseShiftOn`: evaluated once at the
 * named phase boundary, the fired shift is committed into the fighter's plan
 * for the rest of that phase — unlike per-exchange condition overrides, a
 * momentum swing back does not revoke it.
 */
import type { CombatEvent, FightPlan } from '@/types/combat.types';
import type { PhaseShiftDecl } from '@/types/shared/fightPlan';
import { aiFeature } from '@/engine/ai/featureFlags';
import type { FighterState } from './types';

const PHASE_ORDER = { opening: 0, mid: 1, late: 2 } as const;
type PhaseKey = keyof typeof PHASE_ORDER;

/** True when the bout has reached or passed `untilPhase`. */
export function phaseReached(phaseKey: PhaseKey, untilPhase: 'mid' | 'late'): boolean {
  return PHASE_ORDER[phaseKey] >= PHASE_ORDER[untilPhase];
}

/**
 * The effective plan while the decoy mask holds: decoy axes (and optional
 * decoy tactics) replace the plan's own values and the phase curve is
 * flattened — phase entries would otherwise unmask the act. Past the
 * boundary the plan is returned unchanged.
 */
export function applyDecoyMask(plan: FightPlan, phaseKey: PhaseKey): FightPlan {
  const d = plan.decoyAxes;
  if (!aiFeature('AI_DECOY') || !d || phaseReached(phaseKey, d.untilPhase)) return plan;
  return {
    ...plan,
    OE: d.OE,
    AL: d.AL,
    killDesire: d.killDesire ?? plan.killDesire,
    offensiveTactic: d.offensiveTactic ?? plan.offensiveTactic,
    defensiveTactic: d.defensiveTactic ?? plan.defensiveTactic,
    phases: undefined,
  };
}

/**
 * Emit `DECOY_REVEAL` exactly once — the first exchange at or past
 * `untilPhase` — so bout telemetry and the corner panel can show the snap.
 */
export function emitDecoyReveal(
  fighter: FighterState,
  phaseKey: PhaseKey,
  events: CombatEvent[]
): void {
  const d = fighter.plan.decoyAxes;
  if (!aiFeature('AI_DECOY') || !d || fighter.decoyRevealed || !phaseReached(phaseKey, d.untilPhase))
    return;
  fighter.decoyRevealed = true;
  events.push({ type: 'STATE_CHANGE', actor: fighter.label, result: 'DECOY_REVEAL' });
}

/** Whether a phaseShiftOn declaration's `when` read currently holds. */
function shiftReadHolds(
  decl: PhaseShiftDecl,
  fighter: FighterState,
  opponent: FighterState
): boolean {
  switch (decl.when) {
    case 'MOMENTUM_BEHIND':
      return fighter.momentum < 0;
    case 'MOMENTUM_AHEAD':
      return fighter.momentum > 0;
    case 'HP_BEHIND':
      return fighter.hp / fighter.maxHp < opponent.hp / opponent.maxHp;
    case 'HP_AHEAD':
      return fighter.hp / fighter.maxHp > opponent.hp / opponent.maxHp;
    default:
      return false;
  }
}

/** Both fighters' phaseShiftOn declarations at a boundary — call only when
 *  `ctx.cornerAdvice` marks the first exchange of a non-opening phase. */
export function applyBoundaryPhaseShifts(
  fA: FighterState,
  fD: FighterState,
  phaseKey: PhaseKey
): void {
  applyPhaseShiftBoundary(fA, fD, phaseKey);
  applyPhaseShiftBoundary(fD, fA, phaseKey);
}

/** Reveal events first (each fires once), then mask the resolved plans
 *  while the decoy window still holds. */
export function resolveDecoyMasks(
  fA: FighterState,
  fD: FighterState,
  phaseKey: PhaseKey,
  events: CombatEvent[]
): void {
  emitDecoyReveal(fA, phaseKey, events);
  emitDecoyReveal(fD, phaseKey, events);
  fA.activePlan = applyDecoyMask(fA.activePlan, phaseKey);
  fD.activePlan = applyDecoyMask(fD.activePlan, phaseKey);
}

/**
 * Apply `phaseShiftOn` declarations for the phase boundary just entered.
 * Called only when `ctx.cornerAdvice` marks the first exchange of a new
 * phase — a mid-phase read change cannot trigger or revoke a shift.
 * Replaces `fighter.plan` with a shifted copy (the roster plan object is
 * never mutated in place), so `evaluateConditions` downstream sees the
 * committed curve.
 */
export function applyPhaseShiftBoundary(
  fighter: FighterState,
  opponent: FighterState,
  phaseKey: PhaseKey
): void {
  const decls = fighter.plan.phaseShiftOn;
  if (!decls || phaseKey === 'opening') return;
  const decl = decls.find((d) => d.at === phaseKey && shiftReadHolds(d, fighter, opponent));
  if (!decl) return;
  const prior = fighter.plan.phases?.[phaseKey];
  fighter.plan = {
    ...fighter.plan,
    phases: {
      ...fighter.plan.phases,
      [phaseKey]: {
        OE: decl.OE,
        AL: decl.AL,
        killDesire: decl.killDesire ?? prior?.killDesire ?? fighter.plan.killDesire ?? 5,
        ...(prior?.offensiveTactic !== undefined
          ? { offensiveTactic: prior.offensiveTactic }
          : {}),
        ...(prior?.defensiveTactic !== undefined
          ? { defensiveTactic: prior.defensiveTactic }
          : {}),
        ...(prior?.target !== undefined ? { target: prior.target } : {}),
        ...(decl.aggressionBias !== undefined
          ? { aggressionBias: decl.aggressionBias }
          : prior?.aggressionBias !== undefined
            ? { aggressionBias: prior.aggressionBias }
            : {}),
      },
    },
  };
}
