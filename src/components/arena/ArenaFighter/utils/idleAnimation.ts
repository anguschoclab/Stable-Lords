import { FightingStyle } from '@/types/game';

const IDLE_ANIMATION_MAP: Record<FightingStyle, string> = {
  [FightingStyle.LungingAttack]: 'animate-idle-aggressive',
  [FightingStyle.BashingAttack]: 'animate-idle-aggressive',
  [FightingStyle.TotalParry]: 'animate-idle-defensive',
  [FightingStyle.WallOfSteel]: 'animate-idle-defensive',
  [FightingStyle.ParryLunge]: 'animate-idle-balanced',
  [FightingStyle.ParryRiposte]: 'animate-idle-balanced',
  [FightingStyle.ParryStrike]: 'animate-idle-balanced',
  [FightingStyle.AimedBlow]: 'animate-idle-aimed',
  [FightingStyle.SlashingAttack]: 'animate-idle-striking',
  [FightingStyle.StrikingAttack]: 'animate-idle-striking',
};

/**
 *
 */
export function getIdleAnimation(style: FightingStyle): string {
  return IDLE_ANIMATION_MAP[style] ?? 'animate-idle-balanced';
}
