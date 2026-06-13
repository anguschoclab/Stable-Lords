import { cn } from '@/lib/utils';
import type { ShieldInfo } from '../../arenaUtils';
import type { FighterPose } from '@/types/arena.types';
import { FighterBodyPart } from './FighterBodyPart';
import { WeaponIcon } from './WeaponIcon';
import { ShieldIcon } from './ShieldIcon';

interface FighterFigureProps {
  isDead?: boolean;
  weaponCategory: string;
  shieldInfo: ShieldInfo;
  pose: FighterPose;
}

export function FighterFigure({ isDead, weaponCategory, shieldInfo, pose }: FighterFigureProps) {
  return (
    <svg
      viewBox="0 0 100 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full filter drop-shadow-lg"
    >
      <g className={cn('transition-transform duration-200', isDead && 'translate-y-8')}>
        <FighterBodyPart part="head" isDead={isDead} />
        <FighterBodyPart part="torso" isDead={isDead} />
        <FighterBodyPart part="abdomen" isDead={isDead} />
        <FighterBodyPart part="leftArm" isDead={isDead} />
        <FighterBodyPart part="rightArm" isDead={isDead} />
        <FighterBodyPart part="leftLeg" isDead={isDead} />
        <FighterBodyPart part="rightLeg" isDead={isDead} />

        {!isDead && <WeaponIcon category={weaponCategory} pose={pose.stance} x={85} y={55} />}

        {shieldInfo.hasShield && !isDead && <ShieldIcon size={shieldInfo.size} x={15} y={55} />}
      </g>
    </svg>
  );
}
