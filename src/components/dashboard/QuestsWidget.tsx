import { Check, Circle, Compass, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { useGameStore } from '@/state/useGameStore';
import { evaluateQuests, questsVisible, QUESTS_DISMISSED } from '@/engine/onboarding/quests';

/**
 * Onboarding quest checklist — early-game milestones derived from GameState.
 * Self-hides once all quests complete or the player dismisses it.
 */
export function QuestsWidget() {
  const state = useGameStore((s) => s);
  const setState = useGameStore((s) => s.setState);

  if (!questsVisible(state)) return null;

  const quests = evaluateQuests(state);
  const doneCount = quests.filter((q) => q.complete).length;

  return (
    <Surface variant="glass" className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Compass className="h-4 w-4 text-arena-gold" />
        <div className="flex flex-col flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Getting Started
          </span>
          <span className="font-display font-black text-lg tracking-tight text-foreground">
            {doneCount} / {quests.length}
          </span>
        </div>
        <button
          type="button"
          aria-label="Dismiss getting started checklist"
          onClick={() =>
            setState((prev) => ({
              ...prev,
              coachDismissed: [...(prev.coachDismissed ?? []), QUESTS_DISMISSED],
            }))
          }
          className="text-muted-foreground/40 hover:text-foreground transition-colors motion-reduce:transition-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-2">
        {quests.map((q) => (
          <li key={q.id} className="flex items-start gap-2.5">
            {q.complete ? (
              <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 shrink-0" />
            )}
            <div>
              <div
                className={cn(
                  'text-[10px] font-black uppercase tracking-wider',
                  q.complete ? 'text-muted-foreground/40 line-through' : 'text-foreground/80'
                )}
              >
                {q.label}
              </div>
              {!q.complete && (
                <div className="text-[9px] text-muted-foreground/50 mt-0.5">{q.hint}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
