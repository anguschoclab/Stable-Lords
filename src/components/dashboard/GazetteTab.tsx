import { useMemo } from 'react';
import { Quote, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import type { GazetteStory } from '@/types/state.types';

interface GazetteTabProps {
  stories: GazetteStory[];
}

/**
 *
 */
export function GazetteTab({ stories }: GazetteTabProps) {
  const state = useGameStore(
    useShallow((s: any) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      player: s.player,
    }))
  );

  const warriorNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of state.roster ?? []) names.add(w.name);
    for (const w of state.graveyard ?? []) names.add(w.name);
    for (const w of state.retired ?? []) names.add(w.name);
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) names.add(w.name);
    }
    return [...names];
  }, [state.roster, state.graveyard, state.retired, state.rivals]);

  const stableNames = useMemo(() => {
    const names = new Set<string>();
    if (state.player?.stableName) names.add(state.player.stableName);
    for (const r of state.rivals ?? []) {
      if (r.owner?.stableName) names.add(r.owner.stableName);
    }
    return [...names];
  }, [state.player, state.rivals]);

  return (
    <ScrollArea className="h-72 px-6">
      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 opacity-20">
          <Zap className="h-8 w-8 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">No News Yet</p>
        </div>
      ) : (
        <div className="py-6 space-y-8">
          {stories.map((story, i) => (
            <div
              key={`${story.headline.slice(0, 30)}-${i}`}
              className="group/story relative pl-12 border-l border-white/5 hover:border-primary/40 transition-colors py-1 motion-reduce:transition-none"
            >
              <div className="absolute left-[-5px] top-2 h-2.5 w-2.5 rounded-full bg-neutral-800 border boder-white/10 group-hover/story:bg-primary group-hover/story:shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all motion-reduce:transition-none motion-reduce:transform-none" />

              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] font-mono font-black text-primary/60">
                  WK {story.week.toString().padStart(2, '0')}
                </span>
                <h4 className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/story:text-foreground transition-colors italic motion-reduce:transition-none">
                  <LinkifiedText
                    text={story.headline}
                    names={warriorNames}
                    stableNames={stableNames}
                  />
                </h4>
              </div>

              <div className="relative">
                <Quote className="absolute -left-6 top-0 h-4 w-4 text-primary/10" />
                <p className="text-[11px] text-muted-foreground/70 group-hover/story:text-muted-foreground leading-relaxed italic line-clamp-3">
                  <LinkifiedText text={story.body} names={warriorNames} stableNames={stableNames} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="h-6" />
    </ScrollArea>
  );
}
