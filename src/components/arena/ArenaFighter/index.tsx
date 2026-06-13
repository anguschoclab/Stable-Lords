import { cn } from '@/lib/utils';
import { calculatePercent, parseShieldInfo } from '../arenaUtils';
import type { FighterPose, FighterStats } from '@/types/arena.types';
import { FightingStyle } from '@/types/game';
import { useFighterStyles, getStanceAnimationClass } from './hooks/useFighterStyles';
import { getIdleAnimation } from './utils/idleAnimation';
import { getWeaponCategory } from './utils/weaponCategory';
import { FighterBars } from './components/FighterBars';
import { FighterNamePlate } from './components/FighterNamePlate';
import { FighterFigure } from './components/FighterFigure';

interface ArenaFighterProps {
  name: string;
  pose: FighterPose;
  stats: FighterStats;
  style: FightingStyle;
  weaponName?: string;
  shieldName?: string;
  isWinner?: boolean;
  isDead?: boolean;
  isActive?: boolean;
  className?: string;
  size?: number;
}

export default function ArenaFighter({
  name,
  pose,
  stats,
  style,
  weaponName = 'Longsword',
  shieldName,
  isWinner,
  isDead,
  isActive,
  className,
  size = 120,
}: ArenaFighterProps) {
  const weaponCategory = getWeaponCategory(weaponName);
  const shieldInfo = parseShieldInfo(shieldName);
  const hpPercent = calculatePercent(stats.currentHp, stats.maxHp);
  const fpPercent = calculatePercent(stats.currentFp, stats.maxFp);
  const { containerStyle, containerClassName } = useFighterStyles({
    pose,
    isDead,
    isActive,
    className,
  });
  const stanceClass = getStanceAnimationClass(pose.stance);
  const idleClass = !isDead && pose.stance === 'neutral' ? getIdleAnimation(style) : '';

  return (
    <div className={containerClassName} style={containerStyle}>
      <FighterBars hpPercent={hpPercent} fpPercent={fpPercent} isWinner={isWinner} />
      <FighterNamePlate name={name} isWinner={isWinner} />
      <div
        className={cn('relative', stanceClass, idleClass)}
        style={{ width: size, height: size * 1.5 }}
      >
        <FighterFigure
          isDead={isDead}
          weaponCategory={weaponCategory}
          shieldInfo={shieldInfo}
          pose={pose}
        />
      </div>
    </div>
  );
}
