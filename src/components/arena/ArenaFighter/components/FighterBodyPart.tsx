import { cn } from '@/lib/utils';

interface FighterBodyPartProps {
  isDead?: boolean;
  part: 'head' | 'torso' | 'abdomen' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
}

/**
 *
 */
export function FighterBodyPart({ isDead, part }: FighterBodyPartProps) {
  const deadFill = {
    head: 'fill-gray-400/80',
    torso: 'fill-gray-600/60',
    abdomen: 'fill-gray-700/50',
    leftArm: 'fill-gray-400/70',
    rightArm: 'fill-gray-400/70',
    leftLeg: 'fill-gray-600/60',
    rightLeg: 'fill-gray-600/60',
  }[part];

  const aliveFill = {
    head: 'fill-amber-200/80',
    torso: 'fill-amber-800/60',
    abdomen: 'fill-amber-700/50',
    leftArm: 'fill-amber-200/70',
    rightArm: 'fill-amber-200/70',
    leftLeg: 'fill-amber-700/60',
    rightLeg: 'fill-amber-700/60',
  }[part];

  const commonClasses = 'stroke-amber-900/40';

  switch (part) {
    case 'head':
      return (
        <circle
          cx="50"
          cy="15"
          r="10"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'torso':
      return (
        <path
          d="M35 25 H65 V55 H35 V25 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'abdomen':
      return (
        <path
          d="M38 56 H62 V80 L50 90 L38 80 V56 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'leftArm':
      return (
        <path
          d="M35 30 L20 40 L15 65 L25 70 L32 32 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'rightArm':
      return (
        <path
          d="M65 30 L80 40 L85 65 L75 70 L68 32 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'leftLeg':
      return (
        <path
          d="M38 85 L30 140 L45 140 L48 90 L38 85 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
    case 'rightLeg':
      return (
        <path
          d="M62 85 L70 140 L55 140 L52 90 L62 85 Z"
          className={cn(aliveFill, commonClasses, isDead && deadFill)}
          strokeWidth="2"
        />
      );
  }
}
