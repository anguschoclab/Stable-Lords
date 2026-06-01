import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { QuadrantDot } from '@/hooks/useQuadrantDots';

interface QuadrantDotProps {
  dot: QuadrantDot;
}

export function QuadrantDotItem({ dot }: QuadrantDotProps) {
  const x = dot.fame;
  const y = 100 - dot.notoriety;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute w-3 h-3 rounded-none -translate-x-1/2 -translate-y-1/2 cursor-default transition-transform hover:scale-150',
            dot.isPlayer
              ? 'bg-primary shadow-[0_0_8px_rgba(255,0,0,0.6)] z-10'
              : 'bg-white/30 hover:bg-white/50'
          )}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="text-[9px] font-black uppercase tracking-widest bg-neutral-950 border-white/10 rounded-none"
      >
        <div className="font-black text-foreground">{dot.label}</div>
        <div className="text-muted-foreground/60 mt-0.5">
          Fame {dot.fame} · Notoriety {dot.notoriety}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
