import { cn } from '@/lib/utils';
import type { FighterPose } from '@/types/arena.types';

const STANCE_ANIMATION_CLASSES: Record<FighterPose['stance'], string> = {
  neutral: '',
  advancing: 'animate-advancing motion-reduce:animate-none',
  retreating: 'animate-retreating motion-reduce:animate-none',
  lunging: 'animate-lunging motion-reduce:animate-none',
  defending: 'animate-defending motion-reduce:animate-none',
  stunned: 'animate-stunned motion-reduce:animate-none',
  victorious: 'animate-victorious motion-reduce:animate-none',
  defeated: 'animate-defeated motion-reduce:animate-none',
};

/**
 *
 */
export function getStanceAnimationClass(stance: FighterPose['stance']): string {
  return STANCE_ANIMATION_CLASSES[stance] ?? '';
}

interface UseFighterStylesParams {
  pose: FighterPose;
  isDead?: boolean;
  isActive?: boolean;
  className?: string;
}

/**
 *
 */
export function useFighterStyles({ pose, isDead, isActive, className }: UseFighterStylesParams) {
  const containerClassName = cn(
    'absolute transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none',
    className
  );

  const containerStyle = {
    left: `${pose.x}%`,
    bottom: `${30 + pose.y}%`,
    transform: `translateX(-50%) ${pose.facing === 'left' ? 'scaleX(-1)' : ''} ${isDead ? 'rotate(90deg)' : ''}`,
    zIndex: isActive ? 10 : 5,
    opacity: isDead ? 0.6 : 1,
  } as React.CSSProperties;

  return { containerClassName, containerStyle };
}
