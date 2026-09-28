/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
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
function usePrepDialog(
  isTournamentReadyToStart: boolean,
  hasAlreadyStarted: boolean | undefined
) {
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
function CampaignArchives({
  showBookmarkedOnly,
  onToggleBookmarked,
  bookmarkedCount,
  pastTournaments,
  season,
  arenaHistory,
}: {
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
  bookmarkedCount: number;
  pastTournaments: Parameters<typeof TournamentHistory>[0]['pastTournaments'];
  season: Parameters<typeof TournamentHistory>[0]['currentSeason'];
  arenaHistory: Parameters<typeof TournamentHistory>[0]['arenaHistory'];
}) {
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

/** Readiness banner, live manifest, and campaign archives. */
function TournamentBody({
  tournamentState,
  expandedBout,
  onToggleExpand,
  isSimulating,
  onExecuteRound,
  onOpenPrep,
  showBookmarkedOnly,
  onToggleBookmarked,
}: {
  tournamentState: ReturnType<typeof useTournamentState>;
  expandedBout: string | null;
  onToggleExpand: (id: string | null) => void;
  isSimulating: boolean;
  onExecuteRound: () => void;
  onOpenPrep: () => void;
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
}) {
  const {
    season,
    week,
    arenaHistory,
    currentTournament,
    playerWarriorsInTournament,
    pastTournaments,
    bookmarkedCount,
    isTournamentReadyToStart,
  } = tournamentState;

  return (
    <>
      {/* ── Pre-tournament readiness banner ── */}
      {currentTournament && playerWarriorsInTournament.length > 0 && (
        <WarriorReadinessBanner
          tournament={currentTournament}
          warriors={playerWarriorsInTournament}
        />
      )}

      {currentTournament && (
        <ActiveTournamentManifest
          tournament={currentTournament}
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
    activeSlotId,
    loadGame,
    setSimulating,
    isSimulating,
    currentTournament,
    activeWarriors,
    isTournamentReadyToStart,
  } = tournamentState;

  const hasAlreadyStarted = currentTournament?.bracket.some((b) => b.winner !== undefined);
  const { isPrepOpen, setIsPrepOpen } = usePrepDialog(
    isTournamentReadyToStart,
    hasAlreadyStarted
  );

  const handleExecuteRound = useExecuteTournamentRound({
    tournament: currentTournament,
    activeSlotId,
    loadGame,
    setSimulating,
  });

  // Top-bar ADVANCE BRACKET CTA — resolves the next round of the live bracket;
  // disabled when no unresolved tournament is on the card.
  const bracketOpen =
    !!currentTournament && !currentTournament.completed && !isSimulating;
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
        actions={
          <HeaderActions needsRecruits={!currentTournament && activeWarriors.length < 2} />
        }
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
