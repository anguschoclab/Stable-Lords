import { cn } from '@/lib/utils';
import type { FightPlan, OffensiveTactic, DefensiveTactic } from '@/types/game';

/**
 * Shared tactic-bank helpers for the plan builder / FTUE plan step:
 * the offensive-or-defensive plan update and the tactic button styling.
 */

interface TacticRef {
  type: 'offensive' | 'defensive';
  id: string;
}

/**
 * Returns a new FightPlan with the tactic assigned to its slot
 * (offensive → offensiveTactic, defensive → defensiveTactic).
 * @param plan - Current fight plan.
 * @param tactic - Tactic to assign.
 */
export function withPlanTactic(plan: FightPlan, tactic: TacticRef): FightPlan {
  return tactic.type === 'offensive'
    ? { ...plan, offensiveTactic: tactic.id as OffensiveTactic }
    : { ...plan, defensiveTactic: tactic.id as DefensiveTactic };
}

/** Whether `tactic` is the one currently assigned in `plan`. */
export function isPlanTactic(plan: FightPlan | undefined, tactic: TacticRef): boolean {
  return (
    !!plan &&
    ((tactic.type === 'offensive' && plan.offensiveTactic === tactic.id) ||
      (tactic.type === 'defensive' && plan.defensiveTactic === tactic.id))
  );
}

/** Shared base styling for tactic-pick buttons. */
const TACTIC_BUTTON_BASE =
  'flex items-center p-3 text-xs font-bold uppercase tracking-wider border transition-all motion-reduce:transition-none motion-reduce:transform-none duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset';
const TACTIC_BUTTON_ACTIVE = 'bg-arena-blood/20 border-arena-blood/60 text-foreground';
const TACTIC_BUTTON_INACTIVE =
  'bg-white/5 border-white/10 text-muted-foreground hover:border-arena-gold/40 hover:text-foreground';

/**
 * Tactic button classes — blood-lit when the tactic is the plan's current
 * pick, muted gold-hover otherwise.
 * @param active - Whether the tactic is currently assigned.
 * @param opts.gap - Icon↔label spacing (gap-2 grid, gap-3 list).
 * @param opts.inactiveExtra - Extra classes applied only in the inactive
 *   state (e.g. press-scale affordances).
 */
export function tacticButtonClasses(
  active: boolean,
  opts: { gap?: 'gap-2' | 'gap-3'; inactiveExtra?: string } = {}
): string {
  const { gap = 'gap-2', inactiveExtra } = opts;
  return cn(
    TACTIC_BUTTON_BASE,
    gap,
    active ? TACTIC_BUTTON_ACTIVE : cn(TACTIC_BUTTON_INACTIVE, inactiveExtra)
  );
}
