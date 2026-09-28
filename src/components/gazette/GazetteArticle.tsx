import { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import {
  ArticleMasthead,
  LeadStory,
  SideRegistry,
  type GazetteIssue,
} from './gazetteArticle/sections';

interface GazetteArticleProps {
  issue: GazetteIssue;
  season: string;
}

/**
 * Gazette article.
 * @param - { issue, season }.
 */
export function GazetteArticle({ issue, season }: GazetteArticleProps) {
  const state = useGameStore(
    useShallow((s) => ({
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

  const names = { warriorNames, stableNames };

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-border/10 bg-neutral-900/40 overflow-hidden shadow-2xl group transition-all motion-reduce:transition-none motion-reduce:transform-none duration-700 hover:shadow-primary/5"
    >
      <ArticleMasthead issue={issue} season={season} {...names} />

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5 bg-black/20">
        <LeadStory issue={issue} {...names} />
        <SideRegistry issue={issue} {...names} />
      </div>
    </Surface>
  );
}
