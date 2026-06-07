/**
 * AI Strategic Levers
 * Chooses the strategic options the AI historically left at defaults — hit-location
 * target, protected zone, aggression bias, opening move, and range preference — so
 * NPC fight plans contest the same systems a human player can. Driven by fighting
 * style, owner personality, strategic intent, and kill desire.
 */
import { FightingStyle } from '@/types/shared.types';
import type {
  AttackTarget,
  ProtectTarget,
  DistanceRange,
  OffensiveTactic,
  DefensiveTactic,
} from '@/types/shared.types';
import type { OwnerPersonality, AIIntent } from '@/types/state.types';
import { clamp } from '@/utils/math';

const AGGRESSIVE_STYLES = new Set<FightingStyle>([
  FightingStyle.BashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.SlashingAttack,
]);

const DEFENSIVE_STYLES = new Set<FightingStyle>([
  FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.ParryLunge,
]);

/**
 * Pick an offensive hit-location target. Lethal intent goes for the head; tacticians
 * cripple a leg to bleed the opponent's initiative; aggressors hammer centre mass.
 */
export function getAITarget(
  style: FightingStyle,
  personality: OwnerPersonality,
  killDesire: number,
  intent?: AIIntent
): AttackTarget {
  if (intent === 'RECOVERY') return 'Any';
  if (intent === 'VENDETTA' || killDesire >= 8 || style === FightingStyle.AimedBlow) return 'Head';
  if (personality === 'Tactician' || personality === 'Methodical') return 'Right Leg';
  if (personality === 'Aggressive' || AGGRESSIVE_STYLES.has(style)) return 'Chest';
  return 'Any';
}

/**
 * Pick a protected zone. Defensive styles and recovering fighters guard the head;
 * methodical/pragmatic owners cover the body. Aggressors leave everything exposed.
 */
export function getAIProtect(
  style: FightingStyle,
  personality: OwnerPersonality,
  intent?: AIIntent
): ProtectTarget {
  if (intent === 'RECOVERY' || DEFENSIVE_STYLES.has(style)) return 'Head';
  if (personality === 'Methodical' || personality === 'Pragmatic') return 'Body';
  return 'Any';
}

/**
 * Aggression bias (0–10, 5 = neutral): weights the attack/defense split each exchange.
 */
export function getAIAggressionBias(personality: OwnerPersonality, intent?: AIIntent): number {
  const base =
    personality === 'Aggressive'
      ? 7
      : personality === 'Showman'
        ? 6
        : personality === 'Methodical' || personality === 'Tactician'
          ? 4
          : 5;
  const intentMod = intent === 'VENDETTA' ? 1 : intent === 'RECOVERY' ? -2 : 0;
  return clamp(base + intentMod, 0, 10);
}

/**
 * Opening move: aggressors press early, methodical/tactical owners feel the opponent out.
 */
export function getAIOpeningMove(
  personality: OwnerPersonality
): 'Safe' | 'Aggressive' | 'Measured' {
  if (personality === 'Aggressive' || personality === 'Showman') return 'Aggressive';
  if (personality === 'Methodical' || personality === 'Tactician') return 'Safe';
  return 'Measured';
}

/**
 * Range preference for styles whose ideal engagement distance is intrinsic to the
 * style rather than the weapon. Returns undefined to defer to the weapon default.
 */
export function getAIRangePreference(style: FightingStyle): DistanceRange | undefined {
  if (style === FightingStyle.LungingAttack || style === FightingStyle.ParryLunge)
    return 'Extended';
  if (style === FightingStyle.BashingAttack || style === FightingStyle.WallOfSteel) return 'Tight';
  if (style === FightingStyle.AimedBlow) return 'Striking';
  return undefined;
}

/**
 * Returns the canonical Favorite Tactics for a given fighting style.
 * These drive the AI's baseline tactic selection unless overridden by dynamic traits.
 */
export function getAITactics(style: FightingStyle): {
  offTactic: OffensiveTactic;
  defTactic: DefensiveTactic;
} {
  switch (style) {
    case FightingStyle.AimedBlow:
      return { offTactic: 'Slash', defTactic: 'Dodge' };
    case FightingStyle.BashingAttack:
      return { offTactic: 'Bash', defTactic: 'none' };
    case FightingStyle.LungingAttack:
      return { offTactic: 'Lunge', defTactic: 'Dodge' };
    case FightingStyle.ParryLunge:
      return { offTactic: 'Lunge', defTactic: 'Parry' };
    case FightingStyle.ParryRiposte:
      return { offTactic: 'none', defTactic: 'Parry' };
    case FightingStyle.ParryStrike:
      return { offTactic: 'Decisiveness', defTactic: 'Parry' };
    case FightingStyle.SlashingAttack:
      return { offTactic: 'Slash', defTactic: 'none' };
    case FightingStyle.StrikingAttack:
      return { offTactic: 'Decisiveness', defTactic: 'none' };
    case FightingStyle.TotalParry:
      return { offTactic: 'none', defTactic: 'Parry' };
    case FightingStyle.WallOfSteel:
      return { offTactic: 'Bash', defTactic: 'Parry' };
    default:
      return { offTactic: 'none', defTactic: 'none' };
  }
}
