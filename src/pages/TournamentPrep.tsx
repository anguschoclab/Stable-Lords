import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { ShieldCheck } from 'lucide-react';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyPrepState, EntryDeskSection, PrepNotice, TierSection } from './tournamentPrep/sections';

/** Entrant/your-warrior stat pair for the page header. */
function PrepHeaderStats({
  totalEntrants,
  yourEntrantCount,
}: {
  totalEntrants: number;
  yourEntrantCount: number;
}) {
  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">
          Entrants
        </span>
        <span className="font-display font-black text-xl text-foreground">{totalEntrants}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">
          Your Warriors
        </span>
        <span className="font-display font-black text-xl text-arena-gold">{yourEntrantCount}</span>
      </div>
    </div>
  );
}

/**
 * Tournament Prep Mode (Feature Matrix #23): the pre-bracket readiness surface.
 * Lists entrants per tournament class with eligibility checks (activity,
 * injuries, fatigue, weather aversion) — blocking vs advisory issues labeled.
 */
/** Store slice the prep page reads — entrants, cycle, and desk actions. */
function usePrepStoreSlice() {
  return useGameStore(
    useShallow((s) => ({
      tournaments: s.tournaments,
      week: s.week,
      player: s.player,
      rivals: s.rivals,
      weather: s.weather,
      tournamentCycle: s.tournamentCycle,
      roster: s.roster,
      declareTournamentEntry: s.declareTournamentEntry,
      scratchTournamentEntry: s.scratchTournamentEntry,
    }))
  );
}

/** Tournament Prep page — Entry Desk during the freeze window, readiness once drawn. */
export default function TournamentPrep() {
  const {
    tournaments,
    week,
    player,
    rivals,
    weather,
    tournamentCycle,
    roster,
    declareTournamentEntry,
    scratchTournamentEntry,
  } = usePrepStoreSlice();

  // Desk closes once the brackets draw — the cycle lingers for the tourney week.
  const deskOpen = !!tournamentCycle && week < tournamentCycle.forWeek;

  const pendingTournaments = useMemo(
    () => (tournaments ?? []).filter((t) => t.week === week && !t.completed),
    [tournaments, week]
  );

  const stableNames = useMemo(() => {
    const map = new Map<string, string>();
    if (player) map.set(player.id as string, player.stableName);
    for (const r of rivals ?? []) map.set(r.owner.id as string, r.owner.stableName);
    return map;
  }, [player, rivals]);

  const { totalEntrants, yourEntrantCount } = useMemo(
    () =>
      pendingTournaments.reduce(
        (acc, t) => {
          acc.totalEntrants += t.participants.length;
          acc.yourEntrantCount += t.participants.filter(
            (w) => w.stableId === player?.id
          ).length;
          return acc;
        },
        { totalEntrants: 0, yourEntrantCount: 0 }
      ),
    [pendingTournaments, player]
  );

  return (
    <PageFrame>
      <PageHeader
        eyebrow="World"
        title="Tournament Prep"
        subtitle="WORLD · TOURNAMENTS · ENTRANT READINESS"
        icon={ShieldCheck}
        actions={
          <PrepHeaderStats totalEntrants={totalEntrants} yourEntrantCount={yourEntrantCount} />
        }
      />

      <PrepBody
        desk={{
          open: deskOpen,
          cycle: tournamentCycle,
          roster,
          player,
          onDeclare: declareTournamentEntry,
          onScratch: scratchTournamentEntry,
        }}
        lists={{ pendingTournaments, stableNames, weather }}
      />
    </PageFrame>
  );
}

type PrepSlice = ReturnType<typeof usePrepStoreSlice>;

/** Entry desk (freeze window) plus the drawn-brackets readiness list. */
function PrepBody({
  desk,
  lists,
}: {
  desk: {
    open: boolean;
    cycle: PrepSlice['tournamentCycle'];
    roster: PrepSlice['roster'];
    player: PrepSlice['player'];
    onDeclare: PrepSlice['declareTournamentEntry'];
    onScratch: PrepSlice['scratchTournamentEntry'];
  };
  lists: {
    pendingTournaments: PrepSlice['tournaments'];
    stableNames: Map<string, string>;
    weather: PrepSlice['weather'];
  };
}) {
  const { open, cycle, roster, player, onDeclare, onScratch } = desk;
  const { pendingTournaments, stableNames, weather } = lists;
  return (
    <>
      {open && cycle && player && (
        <div className="mb-12">
          <EntryDeskSection
            cycle={cycle}
            roster={roster}
            playerId={player.id}
            onDeclare={onDeclare}
            onScratch={onScratch}
          />
        </div>
      )}

      {pendingTournaments.length === 0 ? (
        open ? null : <EmptyPrepState />
      ) : (
        <div className="space-y-12">
          <PrepNotice />
          {pendingTournaments.map((t) => (
            <TierSection
              key={t.id}
              tournament={t}
              stableNames={stableNames}
              playerStableId={player?.id}
              weather={weather}
            />
          ))}
        </div>
      )}
    </>
  );
}
