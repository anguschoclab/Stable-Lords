import { Surface } from '@/components/ui/Surface';
import { useGameStore } from '@/state/useGameStore';
import { Check, Circle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ObjectivesWidget() {
  const progression = useGameStore((s) => s.progression);

  if (!progression) return null;

  const standingText =
    progression.totalStables > 0
      ? `#${progression.stableStanding} of ${progression.totalStables}`
      : 'Unranked';

  return (
    <Surface variant="glass" className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Target className="h-4 w-4 text-arena-gold" />
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Stable Objectives
          </span>
          <span className="font-display font-black text-lg tracking-tight text-foreground">
            {standingText}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {progression.objectives.map((obj) => (
          <div
            key={obj.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2 border-l-2 transition-colors',
              obj.completed ? 'border-primary bg-primary/5' : 'border-white/10 bg-transparent'
            )}
          >
            {obj.completed ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
            )}
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'text-[11px] font-bold tracking-wide',
                  obj.completed ? 'text-primary' : 'text-foreground/80'
                )}
              >
                {obj.label}
              </span>
              <span className="text-[9px] text-muted-foreground/50 leading-tight">
                {obj.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
