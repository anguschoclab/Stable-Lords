/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { Trophy, UserPlus, ShieldCheck } from 'lucide-react';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { audioManager } from '@/lib/AudioManager';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { useRegisterCtaAction } from '@/components/layout/useRegisterCtaAction';
import { useExecuteTournamentRound } from '@/hooks/useExecuteTournamentRound';
import {
  SEASON_ICONS,
  SEASON_NAMES,
  useTournamentState,
} from '@/pages/tournaments/useTournamentState';

// Modular Components
import {
  ActiveTournamentManifest,
  TournamentHistory,
  TournamentPrepDialog,
  WarriorReadinessBanner,
} from '@/components/tournaments';

/** Header actions — Prep Mode link + conditional recruit prompt. */
function HeaderActions({ needsRecruits }: { needsRecruits: boolean }) {
  const btnClass =
    'h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 rounded-none border-white/10 hover:bg-white/5 transition-all motion-reduce:transition-none';
  return (
    <div className="flex items-center gap-3">
      <Link to="/world/tournament-prep">
        <Button variant="outline" className={cn(btnClass, 'motion-reduce:transform-none')}>
          <ShieldCheck className="h-3.5 w-3.5" /> Prep Mode
        </Button>
      </Link>
      {needsRecruits && (
        <Link to="/stable/recruit">
          <Button variant="outline" className={btnClass}>
            <UserPlus className="h-3.5 w-3.5" /> Recruit Warriors
          </Button>
        </Link>
      )}
    </div>
  );
}

/** Prep-dialog lifecycle: auto-opens once when a tournament is ready to start. */
function usePrepDialog(isTournamentReadyToStart: boolean, hasAlreadyStarted: boolean | undefined) {
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [hasShownPrep, setHasShownPrep] = useState(false);

  React.useEffect(() => {
    if (isTournamentReadyToStart && !hasShownPrep && !hasAlreadyStarted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-open prep dialog when tournament is ready
      setIsPrepOpen(true);
      setHasShownPrep(true);
      audioManager.play('clash'); // Thematic entrance sound
    }
  }, [isTournamentReadyToStart, hasShownPrep, hasAlreadyStarted]);

  return { isPrepOpen, setIsPrepOpen };
}

/** Campaign archives section: bookmark filter + history list. */
function CampaignArchives(props: {
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
  bookmarkedCount: number;
  pastTournaments: Parameters<typeof TournamentHistory>[0]['pastTournaments'];
  season: Parameters<typeof TournamentHistory>[0]['currentSeason'];
  arenaHistory: Parameters<typeof TournamentHistory>[0]['arenaHistory'];
}) {
  const { showBookmarkedOnly, onToggleBookmarked, bookmarkedCount, pastTournaments, season } =
    props;
  const { arenaHistory } = props;
  return (
    <div className="space-y-6 pt-12">
      <div className="flex items-center justify-between">
        <SectionDivider label="Campaign Archives" />
        <BookmarkFilterToggle
          active={showBookmarkedOnly}
          onToggle={onToggleBookmarked}
          count={bookmarkedCount}
        />
      </div>
      <TournamentHistory
        pastTournaments={pastTournaments}
        seasonIcons={SEASON_ICONS}
        seasonNames={SEASON_NAMES}
        currentSeason={season}
        arenaHistory={arenaHistory}
      />
    </div>
  );
}

/** Explicit campaign status when no live bracket exists. */
function CampaignStatus() {
  return (
    <section aria-labelledby="campaign-status-heading" className="space-y-4">
      <SectionDivider label="Campaign Status" />
      <Surface variant="glass" className="p-6">
        <h2
          id="campaign-status-heading"
          className="font-display text-sm font-black uppercase tracking-[0.15em] text-foreground"
        >
          No Active Campaign
        </h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Tournaments begin during seasonal campaign weeks. Use Prep Mode to review readiness and
          recruit warriors if your roster is short.
        </p>
      </Surface>
    </section>
  );
}

/** Class tab bar — one tab per unfinished bracket of the current week. */
function ClassTabBar(props: {
  live: { id: string; name: string; classId?: string }[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const { live, selectedId, onSelect } = props;
  return (
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Tournament classes">
      {live.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === selectedId}
          onClick={() => onSelect(t.id)}
          className={cn(
            'px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] border transition-all motion-reduce:transition-none',
            t.id === selectedId
              ? 'border-arena-gold/60 bg-arena-gold/10 text-arena-gold'
              : 'border-white/10 bg-white/[0.02] text-muted-foreground/60 hover:border-white/25'
          )}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

/** Readiness banner, live manifest, and campaign archives. */
function TournamentBody(props: {
  tournamentState: ReturnType<typeof useTournamentState>;
  expandedBout: string | null;
  onToggleExpand: (id: string | null) => void;
  isSimulating: boolean;
  onExecuteRound: () => void;
  onOpenPrep: () => void;
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
}) {
  const { tournamentState, expandedBout, onToggleExpand, isSimulating, onExecuteRound } = props;
  const { onOpenPrep, showBookmarkedOnly, onToggleBookmarked } = props;
  const {
    season,
    arenaHistory,
    pastTournaments,
    bookmarkedCount,
  } = tournamentState;

  return (
    <>
      <LiveBracketPanel
        tournamentState={tournamentState}
        expandedBout={expandedBout}
        onToggleExpand={onToggleExpand}
        isSimulating={isSimulating}
        onExecuteRound={onExecuteRound}
        onOpenPrep={onOpenPrep}
      />

      <CampaignArchives
        showBookmarkedOnly={showBookmarkedOnly}
        onToggleBookmarked={onToggleBookmarked}
        bookmarkedCount={bookmarkedCount}
        pastTournaments={pastTournaments}
        season={season}
        arenaHistory={arenaHistory}
      />
    </>
  );
}

/** Class tabs, readiness banner, and the live bracket manifest. */
function LiveBracketPanel(props: {
  tournamentState: ReturnType<typeof useTournamentState>;
  expandedBout: string | null;
  onToggleExpand: (id: string | null) => void;
  isSimulating: boolean;
  onExecuteRound: () => void;
  onOpenPrep: () => void;
}) {
  const { tournamentState, expandedBout, onToggleExpand, isSimulating } = props;
  const { onExecuteRound, onOpenPrep } = props;
  const {
    season,
    week,
    arenaHistory,
    currentTournament,
    liveTournaments,
    player,
    isTournamentReadyToStart,
  } = tournamentState;

  // Class tabs: the featured bracket is default; a manual pick overrides.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const displayTournament =
    liveTournaments.find((t) => t.id === selectedId) ?? currentTournament;
  const displayWarriors = useMemo(() => {
    if (!displayTournament || !player) return [];
    return displayTournament.participants.filter((w) => w.stableId === player.id);
  }, [displayTournament, player]);

  return (
    <>
      {/* ── Class tabs (multi-bracket weeks) ── */}
      {liveTournaments.length > 1 && (
        <ClassTabBar
          live={liveTournaments}
          selectedId={displayTournament?.id}
          onSelect={setSelectedId}
        />
      )}

      {/* ── Pre-tournament readiness banner ── */}
      {displayTournament && displayWarriors.length > 0 && (
        <WarriorReadinessBanner
          tournament={displayTournament}
          warriors={displayWarriors}
        />
      )}

      {!displayTournament && <CampaignStatus />}

      {displayTournament && (
        <ActiveTournamentManifest
          tournament={displayTournament}
          arenaHistory={arenaHistory}
          week={week}
          expandedBout={expandedBout}
          onToggleExpand={onToggleExpand}
          isReadyToStart={isTournamentReadyToStart}
          onExecuteRound={onExecuteRound}
          isSimulating={isSimulating}
          onOpenPrep={onOpenPrep}
          seasonIcon={SEASON_ICONS[season] ?? ''}
        />
      )}
    </>
  );
}

/**
 * Tournaments.
 */
export default function Tournaments() {
  const [expandedBout, setExpandedBout] = useState<string | null>(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const tournamentState = useTournamentState(showBookmarkedOnly);
  const {
    season,
    year,
    isSimulating,
    currentTournament,
    activeWarriors,
    isTournamentReadyToStart,
  } = tournamentState;

  const hasAlreadyStarted = currentTournament?.bracket.some((b) => b.winner !== undefined);
  const { isPrepOpen, setIsPrepOpen } = usePrepDialog(isTournamentReadyToStart, hasAlreadyStarted);

  const handleExecuteRound = useExecuteTournamentRound({
    tournament: currentTournament,
  });

  // Top-bar ADVANCE BRACKET CTA — resolves the next round of the live bracket;
  // disabled when no unresolved tournament is on the card.
  const bracketOpen = !!currentTournament && !currentTournament.completed && !isSimulating;
  useRegisterCtaAction('/world/tournaments', {
    enabled: bracketOpen,
    run: handleExecuteRound,
  });

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Trophy}
        eyebrow="Seasonal Campaigns"
        title="Tournaments"
        subtitle={`${season.toUpperCase()} SEASON · YEAR ${year}`}
        actions={<HeaderActions needsRecruits={!currentTournament && activeWarriors.length < 2} />}
      />

      <TournamentBody
        tournamentState={tournamentState}
        expandedBout={expandedBout}
        onToggleExpand={setExpandedBout}
        isSimulating={isSimulating}
        onExecuteRound={handleExecuteRound}
        onOpenPrep={() => setIsPrepOpen(true)}
        showBookmarkedOnly={showBookmarkedOnly}
        onToggleBookmarked={() => setShowBookmarkedOnly((v) => !v)}
      />
      <TournamentPrepDialog
        isOpen={isPrepOpen}
        onOpenChange={setIsPrepOpen}
        activeWarriors={activeWarriors}
        seasonName={SEASON_NAMES[season] ?? season}
        onStart={() => setIsPrepOpen(false)}
      />
    </PageFrame>
  );
}
