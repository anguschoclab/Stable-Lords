import { FightingStyle } from '@/types/shared.types';
import { AB_SHELL_GAP_ATT_MAX, AB_SHELL_GAP_DF_DIVISOR } from '@/constants/combat/combat';
import type { FighterState } from './types';

/**
 * Aimed Blow "gap-finder" payoff — canon conditional win condition.
 *
 * AB's identity is the patient precision striker: it waits, studies the
 * opponent, and lands the one blow that matters. Its two payoffs map the two
 * halves of that identity: armor bypass handles the *armor* shell, and this
 * bonus handles the *defense* shell — when the defender's guard skill
 * out-classes AB's attack craft (TP/WS shells, heavily-built defensive
 * mutants), AB's deftness finds the seam.
 *
 * Trigger is the defender's PAR exceeding the attacker's ATT — a shell
 * condition, not a style check, so it engages developed turtles regardless of
 * their listed style and does NOT fire against low-PAR styles or against
 * canon-patient fighters whose guard is thin. DF-scaled like the armor bypass
 * (precision is a deftness stat); returns 0 for non-AB attackers.
 */
export function aimedBlowShellGapBonus(att: FighterState, def: FighterState): number {
  if (att.style !== FightingStyle.AimedBlow) return 0;
  const gap = def.skills.PAR - att.skills.ATT;
  if (gap <= 0) return 0;
  return Math.min(
    AB_SHELL_GAP_ATT_MAX,
    Math.ceil((gap * att.attributes.DF) / AB_SHELL_GAP_DF_DIVISOR)
  );
}
