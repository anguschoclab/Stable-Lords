import { Check, Lock, ArrowUpRight } from 'lucide-react';

interface AttributeRowStatusProps {
  isSelected: boolean;
  maxed: boolean;
  ceilingHit: boolean;
  atCap: boolean;
  seasonCapped: boolean;
  disabled: boolean;
  chance: number;
}

/**
 * Right-side status indicator for an attribute training row: selected check,
 * lock/max/season-cap badges, or the gain chance with hover arrow.
 */
export function AttributeRowStatus({
  isSelected,
  maxed,
  ceilingHit,
  atCap,
  seasonCapped,
  disabled,
  chance,
}: AttributeRowStatusProps) {
  return (
    <div className="w-12 text-right">
      {isSelected ? (
        <Check className="h-3.5 w-3.5 text-primary float-right drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
      ) : maxed ? (
        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
          MAX
        </div>
      ) : ceilingHit ? (
        <Lock className="h-3 w-3 text-arena-gold/60 float-right" />
      ) : atCap ? (
        <Lock className="h-3 w-3 text-destructive/60 float-right" />
      ) : seasonCapped ? (
        <div className="text-[8px] font-black text-arena-gold uppercase tracking-widest">3/3</div>
      ) : !disabled ? (
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] font-mono font-bold text-primary/80">{chance}%</span>
          <ArrowUpRight className="h-2.5 w-2.5 opacity-40 group-hover/row:opacity-100 transition-opacity motion-reduce:transition-none" />
        </div>
      ) : null}
    </div>
  );
}
