import { FightingStyle } from '@/types/game';

const IDLE_ANIMATION_MAP: Record<FightingStyle, string> = {
  [FightingStyle.LungingAttack]: 'animate-idle-aggressive motion-reduce:animate-none',
  [FightingStyle.BashingAttack]: 'animate-idle-aggressive motion-reduce:animate-none',
  [FightingStyle.TotalParry]: 'animate-idle-defensive motion-reduce:animate-none',
  [FightingStyle.WallOfSteel]: 'animate-idle-defensive motion-reduce:animate-none',
  [FightingStyle.ParryLunge]: 'animate-idle-balanced motion-reduce:animate-none',
  [FightingStyle.ParryRiposte]: 'animate-idle-balanced motion-reduce:animate-none',
  [FightingStyle.ParryStrike]: 'animate-idle-balanced motion-reduce:animate-none',
  [FightingStyle.AimedBlow]: 'animate-idle-aimed motion-reduce:animate-none',
  [FightingStyle.SlashingAttack]: 'animate-idle-striking motion-reduce:animate-none',
  [FightingStyle.StrikingAttack]: 'animate-idle-striking motion-reduce:animate-none',
};

/**
 *
 */
export function getIdleAnimation(style: FightingStyle): string {
  return IDLE_ANIMATION_MAP[style] ?? 'animate-idle-balanced motion-reduce:animate-none';
}
