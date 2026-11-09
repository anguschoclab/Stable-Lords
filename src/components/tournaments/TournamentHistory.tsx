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

/**
 * Player-loss pairs in a completed class bracket that haven't been booked as
 * grudges yet — the call-out candidates. The AI auto-files its own losers;
 * the player chooses here (same rule, different chooser).
 */
function useCalloutPairs(entry: TournamentEntry) {
  const { roster, boutOffers, callOutGrudgeMatch } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      boutOffers: s.boutOffers,
      callOutGrudgeMatch: s.callOutGrudgeMatch,
    }))
  );
  if (!entry.classId || !entry.completed) return [];
  const playerIds = new Set(roster.map((w) => w.id));
  const booked = new Set(
    Object.values(boutOffers ?? {})
      .filter((o) => o.grudgeOfTournamentId === entry.id && o.status === 'Proposed')
      .flatMap((o) => o.warriorIds)
  );
  const nameOf = (id: string) =>
    entry.participants.find((p) => p.id === id)?.name ?? 'Unknown';
  const pairs: CalloutPair[] = [];
  for (const b of entry.bracket) {
    if (b.isBronzeMatch || !b.winner) continue;
    const loserId = (b.winner === 'A' ? b.warriorIdD : b.warriorIdA) as WarriorId;
    const killerId = (b.winner === 'A' ? b.warriorIdA : b.warriorIdD) as WarriorId;
    if (!loserId || !killerId || !playerIds.has(loserId)) continue;
    if (booked.has(loserId) || booked.has(killerId)) continue;
    pairs.push({
      loserId,
      killerId,
      loserName: nameOf(loserId),
      killerName: nameOf(killerId),
    });
  }
  return pairs.map((p) => ({
    ...p,
    onCallOut: () => callOutGrudgeMatch(entry.id, p.loserId, p.killerId),
  }));
}

/** Grudge call-out affordances on a completed class bracket. */
function CalloutSection({ callouts }: { callouts: CalloutPair[] }) {
  if (callouts.length === 0) return null;
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
  const callouts = useCalloutPairs(entry);

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
          <CalloutSection callouts={callouts} />
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
