/**
 * Stable Lords — The Arena Gazette
 * Codex Sanguis design: Roman acta diurna / historical broadsheet aesthetic
 * data-bible-exempt: the broadsheet GazetteMasthead IS this page's header —
 * a standard PageHeader above it would duplicate the masthead title.
 */
import { useMemo, useState, useCallback } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import { Radio } from 'lucide-react';
import { GazetteSectionHeader } from './gazette/GazetteSectionHeader';
import { AnalyticsRegistry, NarrativeFeed } from './gazette/sections';
import { GazetteMasthead, GazetteEmptyState } from './gazette/GazetteMasthead';

// ─── Main Page ─────────────────────────────────────────────────────────────────

/**
 * Gazette.
 */
export default function Gazette() {
  const state = useWorldState();
  const { week, season, gazettes } = state;

  const allFights = useMemo(() => ArenaHistory.all(), []);

  const weeklyIssues = useMemo(() => {
    return [...(gazettes || [])].sort((a, b) => b.week - a.week);
  }, [gazettes]);

  const PAGE_SIZE = 3;
  const [shown, setShown] = useState(PAGE_SIZE);
  const visibleIssues = weeklyIssues.slice(0, shown);
  const hasMore = shown < weeklyIssues.length;
  const loadMore = useCallback(() => setShown((s) => s + PAGE_SIZE), []);
  const hasContent = weeklyIssues.length > 0;

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700 motion-reduce:animate-none">
      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <GazetteMasthead season={season} week={week} hasContent={hasContent} />

      {/* ── Analytics Registry ────────────────────────────────────────────────── */}
      {hasContent && <AnalyticsRegistry allFights={allFights} />}

      {/* ── Narrative Feed ────────────────────────────────────────────────────── */}
      <section className="space-y-12">
        <GazetteSectionHeader
          icon={Radio}
          title="News Archive"
          subtitle="Weekly Chronicles"
          badge="Archive"
          badgeStyle="gold"
        />

        {!hasContent ? (
          <GazetteEmptyState />
        ) : (
          <NarrativeFeed
            visibleIssues={visibleIssues}
            season={season}
            hasMore={hasMore}
            remaining={weeklyIssues.length - shown}
            onLoadMore={loadMore}
          />
        )}
      </section>
    </div>
  );
}
