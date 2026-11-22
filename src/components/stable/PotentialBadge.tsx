import { TooltipBadge } from '@/components/ui/TooltipBadge';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { potentialRating, potentialGrade } from '@/engine/warrior/potential';
import type { AttributePotential } from '@/types/warrior.types';

interface PotentialBadgeProps {
  potential?: AttributePotential | null;
}

/** Letter-grade badge for a warrior's attribute potential. */
export function PotentialBadge({ potential }: PotentialBadgeProps) {
  if (!potential) return null;

  const grade = potentialGrade(potentialRating(potential));
  const color =
    grade === 'S'
      ? 'text-arena-gold border-arena-gold/40'
      : grade === 'A'
        ? 'text-primary border-primary/40'
        : grade === 'B'
          ? 'text-primary border-primary/40'
          : grade === 'C'
            ? 'text-muted-foreground border-white/10'
            : 'text-muted-foreground/60 border-white/5';

  return (
    <TooltipBadge color={color} tooltip="Potential grade — ceiling for training gains.">
      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">POT</span>
      <span className="text-[10px] font-mono font-black">{grade}</span>
    </TooltipBadge>
  );
}
