/**
 * Style Matchup Analysis
 * Provides style-based matchup heuristics and suitability biases for AI planning.
 */
import { FightingStyle } from '@/types/shared.types';

/**
 * Returns OE/AL bias preferences for each fighting style.
 * Aggressive styles prefer higher OE, defensive styles prefer higher AL.
 *
 * @param style - The fighting style to evaluate
 * @returns A bias object with OE and AL adjustments
 */
export function getStyleSuitabilityBias(style: FightingStyle): { oe: number; al: number } {
  const biases: Partial<Record<FightingStyle, { oe: number; al: number }>> = {
    [FightingStyle.BashingAttack]: { oe: 2, al: -1 },
    [FightingStyle.SlashingAttack]: { oe: 1, al: 0 },
    [FightingStyle.StrikingAttack]: { oe: 1, al: 0 },
    [FightingStyle.LungingAttack]: { oe: 1, al: 1 },
    [FightingStyle.AimedBlow]: { oe: -1, al: 1 },
    [FightingStyle.TotalParry]: { oe: -2, al: 2 },
    [FightingStyle.ParryRiposte]: { oe: -1, al: 2 },
    [FightingStyle.ParryLunge]: { oe: 0, al: 1 },
    [FightingStyle.ParryStrike]: { oe: 0, al: 1 },
    [FightingStyle.WallOfSteel]: { oe: -1, al: 2 },
  };
  return biases[style] ?? { oe: 0, al: 0 };
}

/**
 * Per-style matchup heuristics from the Fighting Styles Compendium.
 * Returns OE/AL/KD adjustments when facing a specific opponent style.
 *
 * @param myStyle - The warrior's fighting style
 * @param oppStyle - The opponent's fighting style
 * @returns Matchup-based adjustments for the plan
 */
export function getStyleMatchupMods(
  myStyle: FightingStyle,
  oppStyle: FightingStyle
): { oe: number; al: number; kd: number } {
  // Map myStyle to its counter logic
  const matchers: Partial<
    Record<FightingStyle, (opp: FightingStyle) => { oe: number; al: number; kd: number } | null>
  > = {
    [FightingStyle.AimedBlow]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack)
        return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: 1, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.BashingAttack]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel)
        return { oe: 2, al: 1, kd: 1 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.LungingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: -1, al: 2, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: -2, al: 1, kd: -1 };
      return null;
    },
    [FightingStyle.ParryLunge]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.ParryRiposte]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack)
        return { oe: -2, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.ParryStrike]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: 1, al: 0, kd: 1 };
      if (opp === FightingStyle.LungingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.StrikingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      // Crimson: moderate effort vs walls — the old run-hot call fed
      // strikers into their worst matchup.
      if (opp === FightingStyle.WallOfSteel) return { oe: -1, al: 0, kd: 0 };
      // Blind Man's anti-scum grind: a sustained 6-OE marathon with collapsing
      // activity, not the 10-10 burst — out-endure the shell over 8+ minutes.
      if (opp === FightingStyle.TotalParry) return { oe: -1, al: -1, kd: 0 };
      // Rippers weather the first blow — moderate effort, pick shots.
      if (opp === FightingStyle.ParryRiposte) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.SlashingAttack]: (opp) => {
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: 1, al: 0, kd: 0 };
      if (opp === FightingStyle.ParryStrike) return { oe: 0, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.TotalParry]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel)
        return { oe: -2, al: -1, kd: -1 };
      if (opp === FightingStyle.AimedBlow) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.WallOfSteel]: (opp) => {
      if (opp === FightingStyle.StrikingAttack) return { oe: 0, al: 1, kd: 0 };
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
  };

  const matcher = matchers[myStyle];
  return matcher?.(oppStyle) ?? { oe: 0, al: 0, kd: 0 };
}
