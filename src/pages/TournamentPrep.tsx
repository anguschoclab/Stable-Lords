import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { ShieldCheck } from 'lucide-react';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyPrepState, PrepNotice, TierSection } from './tournamentPrep/sections';

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
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
          Entrants
        </span>
        <span className="font-display font-black text-xl text-foreground">{totalEntrants}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
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
export default function TournamentPrep() {
  const { tournaments, week, player, rivals, weather } = useGameStore(
    useShallow((s) => ({
      tournaments: s.tournaments,
      week: s.week,
      player: s.player,
      rivals: s.rivals,
      weather: s.weather,
    }))
  );

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

  const yourEntrantCount = useMemo(
    () =>
      pendingTournaments.reduce(
        (n, t) => n + t.participants.filter((w) => w.stableId === player?.id).length,
        0
      ),
    [pendingTournaments, player]
  );

  const totalEntrants = useMemo(
    () => pendingTournaments.reduce((n, t) => n + t.participants.length, 0),
    [pendingTournaments]
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

      {pendingTournaments.length === 0 ? (
        <EmptyPrepState />
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
    </PageFrame>
  );
}
