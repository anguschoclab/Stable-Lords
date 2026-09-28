import { cn } from '@/lib/utils';

interface FighterBodyPartProps {
  isDead?: boolean;
  part: 'head' | 'torso' | 'abdomen' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
}

type Part = FighterBodyPartProps['part'];

const DEAD_FILL: Record<Part, string> = {
  head: 'fill-gray-400/80',
  torso: 'fill-gray-600/60',
  abdomen: 'fill-gray-700/50',
  leftArm: 'fill-gray-400/70',
  rightArm: 'fill-gray-400/70',
  leftLeg: 'fill-gray-600/60',
  rightLeg: 'fill-gray-600/60',
};

const ALIVE_FILL: Record<Part, string> = {
  head: 'fill-amber-200/80',
  torso: 'fill-amber-800/60',
  abdomen: 'fill-amber-700/50',
  leftArm: 'fill-amber-200/70',
  rightArm: 'fill-amber-200/70',
  leftLeg: 'fill-amber-700/60',
  rightLeg: 'fill-amber-700/60',
};

const PART_D: Record<Exclude<Part, 'head'>, string> = {
  torso: 'M35 25 H65 V55 H35 V25 Z',
  abdomen: 'M38 56 H62 V80 L50 90 L38 80 V56 Z',
  leftArm: 'M35 30 L20 40 L15 65 L25 70 L32 32 Z',
  rightArm: 'M65 30 L80 40 L85 65 L75 70 L68 32 Z',
  leftLeg: 'M38 85 L30 140 L45 140 L48 90 L38 85 Z',
  rightLeg: 'M62 85 L70 140 L55 140 L52 90 L62 85 Z',
};

/**
 * One anatomical part of the SVG fighter — head circle or body path.
 * @param - { is dead, part }.
 */
export function FighterBodyPart({ isDead, part }: FighterBodyPartProps) {
  const classes = cn(ALIVE_FILL[part], 'stroke-amber-900/40', isDead && DEAD_FILL[part]);

  if (part === 'head') {
    return <circle cx="50" cy="15" r="10" className={classes} strokeWidth="2" />;
  }
  return <path d={PART_D[part]} className={classes} strokeWidth="2" />;
}
