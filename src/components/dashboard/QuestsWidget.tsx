import { Check, Circle, Compass, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import React from 'react';
import { useGameStore } from '@/state/useGameStore';
import { ONBOARDING_QUESTS, QUESTS_DISMISSED } from '@/engine/onboarding/quests';
import { useShallow } from 'zustand/react/shallow';

/**
 * Onboarding quest checklist — early-game milestones derived from GameState.
 * Self-hides once all quests complete or the player dismisses it.
 */
export const QuestsWidget = React.memo(function QuestsWidget() {
  const setState = useGameStore((s) => s.setState);

  const questCompletions = useGameStore(
    useShallow((s) => ONBOARDING_QUESTS.map((q) => q.done(s)))
  );
  const isDismissed = useGameStore((s) => (s.coachDismissed ?? []).includes(QUESTS_DISMISSED));

  if (isDismissed || questCompletions.every(Boolean)) return null;

  const quests = ONBOARDING_QUESTS.map((q, i) => ({
    ...q,
    complete: questCompletions[i],
  }));

  const doneCount = questCompletions.filter(Boolean).length;

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
});
