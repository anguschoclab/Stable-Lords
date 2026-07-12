import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { potentialRating, potentialGrade } from '@/engine/potential';
import type { AttributePotential } from '@/types/warrior.types';

interface PotentialBadgeProps {
  potential?: AttributePotential | null;
}

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
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-none bg-black border opacity-80 group-hover:opacity-100 transition-all',
            color
          )}
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">POT</span>
          <span className="text-[10px] font-mono font-black">{grade}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Potential grade — ceiling for training gains.</TooltipContent>
    </Tooltip>
  );
}
