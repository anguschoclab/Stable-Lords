/**
 * ReputationQuadrant — 2D scatter: Fame (X) vs Notoriety (Y)
 * Shows player stable vs rival stables in reputation space.
 */
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useQuadrantDots } from '@/hooks/useQuadrantDots';
import { QuadrantPlot } from './QuadrantPlot';
import { QuadrantDotItem } from './QuadrantDot';

export function ReputationQuadrant({ className }: { className?: string }) {
  const worldState = useWorldState();
  const { rivals } = useGameStore(useShallow((s) => ({ rivals: s.rivals })));
  const dots = useQuadrantDots(worldState, rivals);

  return (
    <Surface variant="glass" className={cn('p-4 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Reputation Quadrant
        </span>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-primary inline-block" /> You
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-white/20 inline-block" /> Rivals
          </span>
        </div>
      </div>

      <QuadrantPlot>
        <TooltipProvider>
          {dots.map((dot) => (
            <QuadrantDotItem key={dot.label} dot={dot} />
          ))}
        </TooltipProvider>
      </QuadrantPlot>
    </Surface>
  );
}
