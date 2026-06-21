import type { FighterPose } from '@/types/arena.types';

interface WeaponIconProps {
  category: string;
  pose: FighterPose['stance'];
  x: number;
  y: number;
}

/**
 *
 */
export function WeaponIcon({ category, pose, x, y }: WeaponIconProps) {
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
