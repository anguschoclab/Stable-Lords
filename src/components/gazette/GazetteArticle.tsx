import { Surface } from '@/components/ui/Surface';
import {
  ArticleMasthead,
  LeadStory,
  SideRegistry,
  type GazetteIssue,
} from './gazetteArticle/sections';
import { useEntityNames } from '@/hooks/useEntityNames';

interface GazetteArticleProps {
  issue: GazetteIssue;
  season: string;
}

/**
 * Gazette article.
 * @param - { issue, season }.
 */
export function GazetteArticle({ issue, season }: GazetteArticleProps) {
  const { warriorNames, stableNames } = useEntityNames();

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
