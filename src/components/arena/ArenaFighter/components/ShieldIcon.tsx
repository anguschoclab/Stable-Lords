interface ShieldIconProps {
  size: string;
  x: number;
  y: number;
}

/**
 *
 */
export function ShieldIcon({ size, x, y }: ShieldIconProps) {
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
