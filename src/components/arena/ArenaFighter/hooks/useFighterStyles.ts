import { cn } from '@/lib/utils';
import type { FighterPose } from '@/types/arena.types';

const STANCE_ANIMATION_CLASSES: Record<FighterPose['stance'], string> = {
  neutral: '',
  advancing: 'animate-advancing',
  retreating: 'animate-retreating',
  lunging: 'animate-lunging',
  defending: 'animate-defending',
  stunned: 'animate-stunned',
  victorious: 'animate-victorious',
  defeated: 'animate-defeated',
};

export function getStanceAnimationClass(stance: FighterPose['stance']): string {
  return STANCE_ANIMATION_CLASSES[stance] ?? '';
}

interface UseFighterStylesParams {
  pose: FighterPose;
  isDead?: boolean;
  isActive?: boolean;
  className?: string;
}

export function useFighterStyles({ pose, isDead, isActive, className }: UseFighterStylesParams) {
  const containerClassName = cn('absolute transition-all duration-300', className);

  const containerStyle = {
    left: `${pose.x}%`,
    bottom: `${30 + pose.y}%`,
    transform: `translateX(-50%) ${pose.facing === 'left' ? 'scaleX(-1)' : ''} ${isDead ? 'rotate(90deg)' : ''}`,
    zIndex: isActive ? 10 : 5,
    opacity: isDead ? 0.6 : 1,
  } as React.CSSProperties;

  return { containerClassName, containerStyle };
}
