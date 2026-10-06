/**
 * Gazette page sections — analytics registry and narrative archive feed.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, History, ChevronDown, Sparkles, Scroll } from 'lucide-react';
import { GazetteArticle } from '@/components/gazette/GazetteArticle';
import { TacticalStyleAnalysis, StyleMatchupHeatmap } from '@/components/gazette/MetaAnalytics';
import {
  GazetteLeaderboard,
  BestByStyle,
  RisingStars,
} from '@/components/gazette/GazetteLeaderboards';
import type { FightSummary } from '@/types/combat.types';
import type { GazetteStory } from '@/types/state/game';
import { GazetteSectionHeader } from './GazetteSectionHeader';

/** Arena Stats analytics registry — aggregate leaderboards above the archive. */
export function AnalyticsRegistry({ allFights }: { allFights: FightSummary[] }) {
  return (
    <section className="space-y-10">
      <GazetteSectionHeader
        icon={BarChart3}
        title="Arena Stats"
        subtitle="Historical Aggregates"
        badge="Live"
        badgeStyle="primary"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <TacticalStyleAnalysis allFights={allFights} />
        <StyleMatchupHeatmap allFights={allFights} />
      </div>

      <GazetteLeaderboard allFights={allFights} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <BestByStyle allFights={allFights} />
        </div>
        <div className="lg:col-span-4">
          <RisingStars allFights={allFights} />
        </div>
      </div>

      {/* Ornamental break before narrative feed */}
      <div className="flex items-center gap-4 py-4">
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.25))',
          }}
        />
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
          <Scroll className="h-3 w-3" />
          <span>Narrative Archive</span>
          <Scroll className="h-3 w-3" />
        </div>
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(90deg, rgba(var(--gold-glow-rgb), 0.25), transparent)',
          }}
        />
      </div>
    </section>
  );
}

/** A single animated issue entry in the archive feed. */
function IssueEntry({ issue, season, idx }: { issue: GazetteStory; season: string; idx: number }) {
  const paragraphs = issue.body.split('\n\n').filter((p: string) => p.trim().length > 0);
  const mappedIssue = {
    week: issue.week,
    mainHeadline: issue.headline,
    mainStory: paragraphs[0] || '',
    sideStories: paragraphs.slice(1),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: idx * 0.1,
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <GazetteArticle issue={mappedIssue} season={season} />
    </motion.div>
  );
}

/** Historical Recall pager control at the archive feed's tail. */
function LoadMoreControl({ remaining, onLoadMore }: { remaining: number; onLoadMore: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 pt-12 relative">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.15) 30%, rgba(var(--gold-glow-rgb), 0.15) 70%, transparent)',
        }}
      />

      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">
          Archive Remainder: {remaining} Editions
        </span>
      </div>

      <button
        onClick={onLoadMore}
        className="group relative flex items-center gap-3 px-16 h-14 transition-all duration-500 bg-[hsl(var(--popover))] border border-border/70 rounded-none hover:border-accent/50 motion-reduce:transition-none"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-arena-gold/5 to-arena-gold/0 motion-reduce:transition-none" />
        <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-arena-gold/80 to-transparent motion-reduce:transition-none" />
        <History className="relative z-10 h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors motion-reduce:transition-none" />
        <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-accent transition-colors motion-reduce:transition-none">
          Historical Recall
        </span>
        <ChevronDown className="relative z-10 h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-y-1 transition-all motion-reduce:transition-none motion-reduce:transform-none" />
      </button>

      <div className="flex items-center gap-2 mt-4 opacity-20">
        <Sparkles
          className="h-3 w-3 text-primary"
          style={{ animation: 'livePulse 2s ease-in-out infinite' }}
        />
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
          All issues loaded
        </span>
      </div>
    </div>
  );
}

/** The weekly-chronicle issue feed with paginated recall. */
export function NarrativeFeed({
  visibleIssues,
  season,
  hasMore,
  remaining,
  onLoadMore,
}: {
  visibleIssues: GazetteStory[];
  season: string;
  hasMore: boolean;
  remaining: number;
  onLoadMore: () => void;
}) {
  return (
    <div className="space-y-24">
      <AnimatePresence mode="popLayout">
        {visibleIssues.map((issue, idx) => (
          <IssueEntry key={issue.id} issue={issue} season={season} idx={idx} />
        ))}
      </AnimatePresence>

      {hasMore && <LoadMoreControl remaining={remaining} onLoadMore={onLoadMore} />}
    </div>
  );
}
