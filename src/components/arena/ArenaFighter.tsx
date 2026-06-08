import { cn } from '@/lib/utils';
import { calculatePercent, parseShieldInfo, type ShieldInfo } from './arenaUtils';
import type { FighterPose, FighterStats } from '@/types/arena.types';
import { FightingStyle } from '@/types/game';

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

// Module-level constants - not recreated on every render
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

// Weapon category detection
function getWeaponCategory(weaponName: string): 'slash' | 'bash' | 'pierce' | 'shield' | 'fist' {
  const w = weaponName.toLowerCase();
  if (
    w.includes('shield') ||
    w.includes('small shield') ||
    w.includes('medium shield') ||
    w.includes('large shield')
  )
    return 'shield';
  if (
    w.includes('sword') ||
    w.includes('scimitar') ||
    w.includes('axe') ||
    w.includes('blade') ||
    w.includes('scythe') ||
    w.includes('halberd')
  )
    return 'slash';
  if (
    w.includes('mace') ||
    w.includes('hammer') ||
    w.includes('flail') ||
    w.includes('maul') ||
    w.includes('morning star') ||
    w.includes('morningstar')
  )
    return 'bash';
  if (
    w.includes('spear') ||
    w.includes('épée') ||
    w.includes('epee') ||
    w.includes('dagger') ||
    w.includes('pike') ||
    w.includes('lance')
  )
    return 'pierce';
  if (w.includes('staff') || w.includes('fist') || w.includes('gauntlet')) return 'fist';
  return 'slash'; // default
}

// Helper functions
function getStanceAnimationClass(stance: FighterPose['stance']): string {
  return STANCE_ANIMATION_CLASSES[stance] ?? '';
}

function getIdleAnimation(style: FightingStyle): string {
  return IDLE_ANIMATION_MAP[style] ?? 'animate-idle-balanced';
}

interface FighterStylesParams {
  pose: FighterPose;
  isDead?: boolean;
  isActive?: boolean;
  className?: string;
}

function useFighterStyles({ pose, isDead, isActive, className }: FighterStylesParams) {
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

// Sub-component: HP/FP Bars
interface FighterBarsProps {
  hpPercent: number;
  fpPercent: number;
  isWinner?: boolean;
}

function FighterBars({ hpPercent, fpPercent, isWinner }: FighterBarsProps) {
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24">
      {/* HP Bar */}
      <div className="h-1.5 bg-black/50 rounded-none mb-0.5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            hpPercent > 50 ? 'bg-primary' : hpPercent > 25 ? 'bg-arena-gold' : 'bg-destructive'
          )}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      {/* FP Bar */}
      <div className="h-1 bg-black/50 rounded-none overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${fpPercent}%` }}
        />
      </div>
      {/* Winner glow */}
      {isWinner && <div className="absolute -inset-1 bg-arena-gold/30 blur-sm animate-pulse" />}
    </div>
  );
}

// Sub-component: Name Plate
interface FighterNamePlateProps {
  name: string;
  isWinner?: boolean;
}

function FighterNamePlate({ name, isWinner }: FighterNamePlateProps) {
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
      <span
        className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-none',
          isWinner ? 'bg-arena-gold/80 text-primary-foreground' : 'bg-black/60 text-foreground/90'
        )}
      >
        {name}
      </span>
    </div>
  );
}

// Sub-component: Body Part
interface FighterBodyPartProps {
  isDead?: boolean;
  part: 'head' | 'torso' | 'abdomen' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
}

function FighterBodyPart({ isDead, part }: FighterBodyPartProps) {
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

// Sub-component: Fighter Figure
interface FighterFigureProps {
  isDead?: boolean;
  weaponCategory: ReturnType<typeof getWeaponCategory>;
  shieldInfo: ShieldInfo;
  pose: FighterPose;
}

function FighterFigure({ isDead, weaponCategory, shieldInfo, pose }: FighterFigureProps) {
  return (
    <svg
      viewBox="0 0 100 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full filter drop-shadow-lg"
    >
      {/* Fighter body */}
      <g className={cn('transition-transform duration-200', isDead && 'translate-y-8')}>
        <FighterBodyPart part="head" isDead={isDead} />
        <FighterBodyPart part="torso" isDead={isDead} />
        <FighterBodyPart part="abdomen" isDead={isDead} />
        <FighterBodyPart part="leftArm" isDead={isDead} />
        <FighterBodyPart part="rightArm" isDead={isDead} />
        <FighterBodyPart part="leftLeg" isDead={isDead} />
        <FighterBodyPart part="rightLeg" isDead={isDead} />

        {/* Weapon */}
        {!isDead && <WeaponIcon category={weaponCategory} pose={pose.stance} x={85} y={55} />}

        {/* Shield */}
        {shieldInfo.hasShield && !isDead && <ShieldIcon size={shieldInfo.size} x={15} y={55} />}
      </g>
    </svg>
  );
}

/**
 * Arena fighter component - renders a fighter with HP/FP bars, name plate, and SVG figure.
 */
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

function WeaponIcon({
  category,
  pose,
  x,
  y,
}: {
  category: string;
  pose: string;
  x: number;
  y: number;
}) {
  // Weapon rotation based on pose
  const rotation =
    {
      neutral: 0,
      advancing: -15,
      retreating: 15,
      lunging: -30,
      defending: -45,
      stunned: 5,
      victorious: -60,
      defeated: 90,
    }[pose] || 0;

  const transform = `rotate(${rotation} ${x} ${y})`;

  if (category === 'shield') {
    return (
      <circle
        cx={x - 5}
        cy={y}
        r="12"
        className="fill-amber-900/80 stroke-amber-950/60"
        strokeWidth="2"
        transform={transform}
      />
    );
  }

  if (category === 'slash') {
    return (
      <g transform={transform}>
        <path
          d={`M${x} ${y - 20} L${x + 5} ${y + 20} L${x - 3} ${y + 20} Z`}
          className="fill-slate-400/90 stroke-slate-600"
          strokeWidth="1"
        />
        <rect x={x - 2} y={y - 25} width="4" height="10" className="fill-amber-800/80" />
      </g>
    );
  }

  if (category === 'bash') {
    return (
      <g transform={transform}>
        <circle
          cx={x}
          cy={y - 5}
          r="10"
          className="fill-slate-500/90 stroke-slate-700"
          strokeWidth="2"
        />
        <rect x={x - 3} y={y - 20} width="6" height="20" className="fill-amber-800/80" />
      </g>
    );
  }

  if (category === 'pierce') {
    return (
      <g transform={transform}>
        <path
          d={`M${x} ${y - 30} L${x + 3} ${y + 15} L${x - 3} ${y + 15} Z`}
          className="fill-slate-400/90 stroke-slate-600"
          strokeWidth="1"
        />
        <rect x={x - 2} y={y + 15} width="4" height="8" className="fill-amber-800/80" />
      </g>
    );
  }

  // Fist/default
  return (
    <g transform={transform}>
      <circle
        cx={x}
        cy={y - 5}
        r="6"
        className="fill-amber-200/80 stroke-amber-900/40"
        strokeWidth="2"
      />
    </g>
  );
}

function ShieldIcon({ size, x, y }: { size: string; x: number; y: number }) {
  const radius = size === 'large' ? 14 : size === 'small' ? 8 : 11;

  return (
    <ellipse
      cx={x}
      cy={y}
      rx={radius}
      ry={radius * 1.2}
      className="fill-amber-900/70 stroke-amber-950/50"
      strokeWidth="2"
    />
  );
}
