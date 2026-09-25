/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Trophy, UserPlus } from 'lucide-react';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { audioManager } from '@/lib/AudioManager';
import { engineProxy } from '@/engine/workerProxy';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

// Modular Components
import { isActive } from '@/engine/warriorStatus';
import {
  ActiveTournamentManifest,
  TournamentHistory,
  TournamentPrepDialog,
  WarriorReadinessBanner,
} from '@/components/tournaments';

const SEASON_NAMES: Record<string, string> = {
  Spring: 'Spring Classic',
  Summer: 'Summer Cup',
  Fall: 'Fall Clash',
  Winter: 'Winter Crown',
};

const SEASON_ICONS: Record<string, string> = {
  Spring: '🌿',
  Summer: '☀️',
  Fall: '🍂',
  Winter: '❄️',
};

/**
 * Tournaments.
 */
export default function Tournaments() {
  const {
    tournaments,
    season,
    roster,
    week,
    year,
    arenaHistory,
    player,
    activeSlotId,
    loadGame,
    setSimulating,
    isSimulating,
    bookmarks,
    activeTournamentId,
  } = useGameStore(
    useShallow((s) => ({
      tournaments: s.tournaments,
      season: s.season,
      activeTournamentId: s.activeTournamentId,
      roster: s.roster,
      week: s.week,
      year: s.year,
      arenaHistory: s.arenaHistory,
      player: s.player,
      activeSlotId: s.activeSlotId,
      loadGame: s.loadGame,
      setSimulating: s.setSimulating,
      isSimulating: s.isSimulating,
      bookmarks: s.bookmarks,
    }))
  );

  const [expandedBout, setExpandedBout] = useState<string | null>(null);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [hasShownPrep, setHasShownPrep] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // The active tournament is whichever the engine marked live this week.
  // Leftover tiers from previous years share season/week, so a bare
  // `!completed` match would resurrect a stale bracket — scope by id first.
  const currentTournament = useMemo(
    () =>
      tournaments.find((t) => t.id === activeTournamentId) ??
      tournaments.find((t) => t.week === week && !t.completed),
    [tournaments, activeTournamentId, week]
  );

  const activeWarriors = useMemo(() => roster.filter((w) => isActive(w)), [roster]);

  // Warriors belonging to the player that are in the active tournament
  const playerWarriorsInTournament = useMemo(() => {
    if (!currentTournament || !player) return [];
    return currentTournament.participants.filter((w) => w.stableId === player.id);
  }, [currentTournament, player]);

  const allPastTournaments = useMemo(
    () => tournaments.filter((t) => t.completed).reverse(),
    [tournaments]
  );
  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);
  const pastTournaments = useMemo(() => {
    if (!showBookmarkedOnly) return allPastTournaments;
    const ids = bookmarkIds.get('tournament');
    return allPastTournaments.filter((t) => ids?.has(t.id));
  }, [allPastTournaments, showBookmarkedOnly, bookmarkIds]);

  const bookmarkedCount = allPastTournaments.filter(
    (t) => bookmarkIds.get('tournament')?.has(t.id)
  ).length;

  // 🌩️ Protocol Sync: Auto-open prep dialog if tournament is ready but not started
  const isTournamentReadyToStart = useMemo(() => {
    if (!currentTournament) return false;
    return currentTournament.bracket.every((b) => b.winner === undefined);
  }, [currentTournament]);

  React.useEffect(() => {
    const hasAlreadyStarted = currentTournament?.bracket.some((b) => b.winner !== undefined);
    if (isTournamentReadyToStart && !hasShownPrep && !hasAlreadyStarted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-open prep dialog when tournament is ready
      setIsPrepOpen(true);
      setHasShownPrep(true);
      audioManager.play('clash'); // Thematic entrance sound
    }
  }, [isTournamentReadyToStart, hasShownPrep, currentTournament]);

  const handleExecuteRound = useCallback(async () => {
    if (!currentTournament) return;

    setSimulating(true);
    try {
      const state = useGameStore.getState();
      const currentFullState = reconstructGameState(state);

      const { updatedState, roundResults } = await engineProxy.resolveTournamentRound(
        currentFullState,
        currentTournament.id,
        cryptoRandomInt(0, 2147483647)
      );

      loadGame(activeSlotId || 'autosave', updatedState);
      audioManager.play('clash');
      toast.success(roundResults.length > 0 ? 'Round resolved.' : 'Tournament complete.');
    } catch (error) {
      console.error('Tournament resolution failed:', error);
      toast.error('Resolution failed.');
    } finally {
      setSimulating(false);
    }
  }, [currentTournament, activeSlotId, loadGame, setSimulating]);

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Trophy}
        eyebrow="Seasonal Campaigns"
        title="Tournaments"
        subtitle={`${season.toUpperCase()} SEASON · YEAR ${year}`}
        actions={
          <div className="flex items-center gap-3">
            {!currentTournament && activeWarriors.length < 2 && (
              <Link to="/stable/recruit">
                <Button
                  variant="outline"
                  className="h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 rounded-none border-white/10 hover:bg-white/5 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Recruit Warriors
                </Button>
              </Link>
            )}
          </div>
        }
      />

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
          onToggleExpand={setExpandedBout}
          isReadyToStart={isTournamentReadyToStart}
          onExecuteRound={handleExecuteRound}
          isSimulating={isSimulating}
          onOpenPrep={() => setIsPrepOpen(true)}
          seasonIcon={SEASON_ICONS[season] ?? ''}
        />
      )}

      <div className="space-y-6 pt-12">
        <div className="flex items-center justify-between">
          <SectionDivider label="Campaign Archives" />
          <BookmarkFilterToggle
            active={showBookmarkedOnly}
            onToggle={() => setShowBookmarkedOnly((v) => !v)}
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
