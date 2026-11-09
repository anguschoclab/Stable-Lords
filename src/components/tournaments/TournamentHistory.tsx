import { useState } from 'react';
import { Trophy, ChevronDown, ChevronRight, Swords, Flame } from 'lucide-react';
import type { TournamentEntry } from '@/types/game';
import type { Season, WarriorId } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import { getFightsForTournament } from '@/engine/core/historyUtils';
import { Surface } from '@/components/ui/Surface';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { groupBy } from '@/utils/collections';
import { cn } from '@/lib/utils';

interface TournamentHistoryProps {
  pastTournaments: TournamentEntry[];
  seasonIcons: Record<string, string>;
  seasonNames: Record<string, string>;
  currentSeason: string;
  arenaHistory?: FightSummary[];
}

/** One call-out candidate: a player loser, their killer, and the file action. */
interface CalloutPair {
  loserId: WarriorId;
  killerId: WarriorId;
  loserName: string;
  killerName: string;
  onCallOut?: () => void;
}

/** One stablemate-hunt candidate: a booked victim, the unbooked killer, and
 *  the unbooked player finishers who could avenge them. */
interface HuntPair {
  victimId: WarriorId;
  killerId: WarriorId;
  victimName: string;
  killerName: string;
  hunters: { id: WarriorId; name: string; onHunt: () => void }[];
}

/**
 * Player-facing grudge lanes on a completed class bracket. The AI auto-files
 * both lanes for itself; the player chooses here (same rules, different
 * chooser):
 *  - call-outs: a player loser rematches their unbooked killer (+1 FE), and
 *  - hunts: when the victim is already booked, an unbooked stablemate
 *    finisher goes after the still-unbooked killer.
 */
function useGrudgeLanes(entry: TournamentEntry): {
  callouts: CalloutPair[];
  hunts: HuntPair[];
} {
  const { roster, boutOffers, callOutGrudgeMatch, sendStablemateHunt } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      boutOffers: s.boutOffers,
      callOutGrudgeMatch: s.callOutGrudgeMatch,
      sendStablemateHunt: s.sendStablemateHunt,
    }))
  );
  if (!entry.classId || !entry.completed) return { callouts: [], hunts: [] };
  const playerIds = new Set(roster.map((w) => w.id));
  const booked = new Set(
    Object.values(boutOffers ?? {})
      .filter((o) => o.grudgeOfTournamentId === entry.id && o.status === 'Proposed')
      .flatMap((o) => o.warriorIds)
  );
  const nameOf = (id: string) =>
    entry.participants.find((p) => p.id === id)?.name ?? 'Unknown';
  const callouts: CalloutPair[] = [];
  const hunts: HuntPair[] = [];
  for (const b of entry.bracket) {
    if (b.isBronzeMatch || !b.winner) continue;
    const loserId = (b.winner === 'A' ? b.warriorIdD : b.warriorIdA) as WarriorId;
    const killerId = (b.winner === 'A' ? b.warriorIdA : b.warriorIdD) as WarriorId;
    if (!loserId || !killerId || !playerIds.has(loserId) || booked.has(killerId)) continue;
    if (!booked.has(loserId)) {
      callouts.push({
        loserId,
        killerId,
        loserName: nameOf(loserId),
        killerName: nameOf(killerId),
      });
      continue;
    }
    const hunters = entry.participants
      .filter((p) => playerIds.has(p.id) && p.id !== loserId && !booked.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        onHunt: () => sendStablemateHunt(entry.id, p.id, killerId),
      }));
    if (hunters.length > 0) {
      hunts.push({
        victimId: loserId,
        killerId,
        victimName: nameOf(loserId),
        killerName: nameOf(killerId),
        hunters,
      });
    }
  }
  return {
    callouts: callouts.map((p) => ({
      ...p,
      onCallOut: () => callOutGrudgeMatch(entry.id, p.loserId, p.killerId),
    })),
    hunts,
  };
}

/** Grudge call-out + stablemate-hunt affordances on a completed class bracket. */
function CalloutSection({
  callouts,
  hunts,
}: {
  callouts: CalloutPair[];
  hunts: HuntPair[];
}) {
  if (callouts.length === 0 && hunts.length === 0) return null;
  return (
    <div className="pt-2 border-t border-white/5 space-y-1.5">
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
        Grudge call-outs — a rematch banks +1 FE on the loser
      </p>
      {callouts.map((c) => (
        <div
          key={`${c.loserId}_${c.killerId}`}
          className="flex items-center justify-between text-[10px] py-1.5 px-2 bg-destructive/[0.04] border-l-2 border-destructive/40"
        >
          <span className="text-foreground/80">
            {c.loserName} <span className="text-muted-foreground/50">vs</span> {c.killerName}
          </span>
          <Button
            variant="outline"
            onClick={c.onCallOut}
            className="h-5 px-2 text-[8px] font-black uppercase tracking-widest gap-1 rounded-none border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Flame className="h-2.5 w-2.5" /> Call out
          </Button>
        </div>
      ))}
      {hunts.map((h) => (
        <div
          key={`hunt_${h.victimId}_${h.killerId}`}
          className="flex items-center justify-between gap-2 text-[10px] py-1.5 px-2 bg-arena-gold/[0.04] border-l-2 border-arena-gold/40"
        >
          <span className="text-foreground/80 truncate">
            {h.victimName} <span className="text-muted-foreground/50">felled by</span> {h.killerName}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {h.hunters.map((hh) => (
              <Button
                key={hh.id}
                variant="outline"
                onClick={hh.onHunt}
                className="h-5 px-2 text-[8px] font-black uppercase tracking-widest gap-1 rounded-none border-arena-gold/40 text-arena-gold hover:bg-arena-gold/10"
              >
                <Swords className="h-2.5 w-2.5" /> {hh.name}
              </Button>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** One archived tournament row with an expandable bout list. */
function TournamentEntryRow({
  entry,
  arenaHistory,
  expanded,
  onToggle,
}: {
  entry: TournamentEntry;
  arenaHistory: FightSummary[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const bouts = expanded ? getFightsForTournament(arenaHistory, entry.id) : [];
  const { callouts, hunts } = useGrudgeLanes(entry);

  return (
    <div className="bg-black/20 border border-white/5">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Trophy className="h-4 w-4 text-arena-gold drop-shadow-[0_0_8px_hsla(var(--arena-gold),0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Wk {entry.week}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BookmarkButton entityType="tournament" entityId={entry.id} size="sm" />
          <span className="font-display font-black text-xs text-arena-gold uppercase tracking-tight">
            {entry.champion ?? 'VACANT'}
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors motion-reduce:transition-none"
          >
            <Swords className="h-3 w-3" />
            Bouts
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {bouts.length === 0 ? (
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 py-2">
              No recorded bouts in archive
            </p>
          ) : (
            bouts.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-[10px] py-1.5 px-2 bg-white/[0.02] border-l-2 border-arena-gold/30"
              >
                <span className="text-foreground/80">{f.title}</span>
                <span className="font-black uppercase tracking-widest text-muted-foreground/50">
                  {f.by}
                </span>
              </div>
            ))
          )}
          <CalloutSection callouts={callouts} hunts={hunts} />
        </div>
      )}
    </div>
  );
}

/** One season column: archive entries or the empty-season placeholder. */
function SeasonCard(props: {
  season: string;
  tournaments: TournamentEntry[];
  seasonIcons: Record<string, string>;
  seasonNames: Record<string, string>;
  isCurrent: boolean;
  arenaHistory: FightSummary[];
  expandedId: string | null;
  onToggleEntry: (id: string) => void;
}) {
  const { season, tournaments, seasonIcons, seasonNames, isCurrent } = props;
  const { arenaHistory, expandedId, onToggleEntry } = props;
  return (
    <Surface
      variant={isCurrent ? 'gold' : 'glass'}
      padding="none"
      className={cn(
        'transition-all motion-reduce:transition-none motion-reduce:transform-none duration-500 overflow-hidden relative group',
        !isCurrent && 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
      )}
    >
      {isCurrent && (
        <div className="absolute top-0 right-0 p-3">
          <div className="h-2 w-2 rounded-full bg-arena-gold animate-ping motion-reduce:animate-none" />
        </div>
      )}
      <div className="p-4 border-b border-white/5 bg-secondary/5 flex items-center gap-3">
        <span className="text-xl group-hover:scale-125 transition-transform duration-500 motion-reduce:transition-none motion-reduce:transform-none">
          {seasonIcons[season]}
        </span>
        <span className="font-display font-black uppercase text-[10px] tracking-[0.15em]">
          {seasonNames[season]}
        </span>
      </div>
      <div className="p-5">
        {tournaments.length > 0 ? (
          <div className="space-y-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Champion Archives
            </div>
            {tournaments.map((t) => (
              <TournamentEntryRow
                key={t.id}
                entry={t}
                arenaHistory={arenaHistory}
                expanded={expandedId === t.id}
                onToggle={() => onToggleEntry(t.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground/20 border border-dashed border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
              No Champions Recorded
              <br />
              For This Season
            </p>
          </div>
        )}
      </div>
    </Surface>
  );
}

/** Past champions grouped into a four-season grid. */
export function TournamentHistory({
  pastTournaments,
  seasonIcons,
  seasonNames,
  currentSeason,
  arenaHistory = [],
}: TournamentHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bySeason = groupBy(pastTournaments, (t) => t.season);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(['Spring', 'Summer', 'Fall', 'Winter'] as Season[]).map((s) => (
        <SeasonCard
          key={s}
          season={s}
          tournaments={bySeason.get(s) ?? []}
          seasonIcons={seasonIcons}
          seasonNames={seasonNames}
          isCurrent={s === currentSeason}
          arenaHistory={arenaHistory}
          expandedId={expandedId}
          onToggleEntry={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        />
      ))}
    </div>
  );
}
