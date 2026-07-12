import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { computeWarriorLiability } from '@/engine/warriorValue';
import type { Warrior } from '@/types/warrior.types';

interface LiabilityBadgeProps {
  warrior: Warrior;
}

export function LiabilityBadge({ warrior }: LiabilityBadgeProps) {
  const liab = computeWarriorLiability(warrior);
  if (liab.recommendation === 'Keep') return null;

  const label = liab.recommendation === 'Release' ? 'Consider releasing' : 'Watch';
  const color =
    liab.recommendation === 'Release'
      ? 'text-arena-gold border-arena-gold/40'
      : 'text-muted-foreground border-white/10';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-none bg-black border opacity-80 group-hover:opacity-100 transition-all',
            color
          )}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {liab.factors.map((f) => (
          <div key={f.name} className="text-[9px] font-mono">
            {f.name}: {f.weight > 0 ? '+' : ''}
            {f.weight}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
