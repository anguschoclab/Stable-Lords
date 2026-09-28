/**
 * Stable Lords — The Arena Gazette
 * Codex Sanguis design: Roman acta diurna / historical broadsheet aesthetic
 * data-bible-exempt: the broadsheet GazetteMasthead IS this page's header —
 * a standard PageHeader above it would duplicate the masthead title.
 */
import { useMemo, useState, useCallback } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import { Terminal, Radio } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GazetteSectionHeader } from './gazette/GazetteSectionHeader';
import { AnalyticsRegistry, NarrativeFeed } from './gazette/sections';

// ─── Gazette Masthead ──────────────────────────────────────────────────────────

function GazetteMasthead({ season, week }: { season: string; week: number }) {
  return (
    <div className="text-center space-y-3 py-10 relative">
      {/* Top ornamental rule — thick and thin */}
      <div className="space-y-0.5 mb-6">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
      </div>

      {/* Pub info row */}
      <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
        <span>Est. 412 AE</span>
        <span className="w-1 h-1 inline-block rounded-none bg-accent/40" />
        <span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help hover:text-accent/60 transition-colors motion-reduce:transition-none">
                Season {season} // Week {week}
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-[9px] font-black tracking-widest uppercase">
              Current Chronology
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="w-1 h-1 inline-block rounded-none bg-accent/40" />
        <span>Arena Press</span>
      </div>

      {/* Main title */}
      <div>
        <h1 className="font-display font-black uppercase text-[clamp(2.2rem,6vw,4.5rem)] tracking-[0.08em] text-[hsl(var(--foreground))] [text-shadow:0_3px_16px_rgba(var(--void-rgb), 0.9),0_1px_0_rgba(var(--void-rgb), 0.95),0_0_40px_rgba(var(--gold-glow-rgb), 0.1)] leading-none">
          THE ARENA GAZETTE
        </h1>
        <p className="text-[11px] italic mt-2 text-[hsl(var(--foreground))]/45">
          BLOOD · GLORY · GOSSIP · TRANSCRIPTS
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mt-1">
        <div className="w-1.5 h-1.5 rounded-none bg-primary animate-pulse motion-reduce:animate-none" />
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-primary/50">
          Latest Edition
        </span>
      </div>

      {/* Bottom ornamental rule */}
      <div className="space-y-0.5 mt-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function GazetteEmptyState() {
  return (
    <Surface
      variant="glass"
      className="py-32 flex flex-col items-center gap-6 relative overflow-hidden border-dashed opacity-50"
    >
      <div className="absolute inset-0 opacity-50 bg-radial-at-center from-arena-blood/5 to-transparent" />
      <div className="relative">
        <div className="absolute inset-0 blur-2xl rounded-none bg-arena-blood/10" />
        <Terminal className="h-16 w-16 relative z-10 opacity-15 text-muted-foreground" />
      </div>
      <div className="space-y-2 relative z-10 text-center">
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          The Presses Are Silent
        </p>
        <p className="text-xs text-muted-foreground/35 italic max-w-sm mx-auto leading-relaxed">
          No arena records have been stylized by our chroniclers yet. Proceed to combat to generate
          headlines — check back after your next fight.
        </p>
      </div>
    </Surface>
  );
}

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
      <GazetteMasthead season={season} week={week} />

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
