import { useMemo } from 'react';
import { Medal, Crown } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { resolveWarriorName } from '@/engine/core/historyResolver';
import { useWarriorNameState } from '@/state/useGameStore';
import type { TournamentBout, FightSummary } from '@/types/game';
import { BracketMatchNode } from './BracketMatchNode';

interface TournamentBracketProps {
  bouts: TournamentBout[];
  arenaHistory: FightSummary[];
  expandedBout: string | null;
  onToggleExpand: (key: string | null) => void;
} /**
   * Tournament bracket.
   * @param  - {
  bouts,
  arena history,
  expanded bout,
  on toggle expand,
}.
   */

/**
 * Tournament bracket.
 * @param  - {
  bouts,
  arena history,
  expanded bout,
  on toggle expand,
}.
 */
export function TournamentBracket({
  bouts,
  arenaHistory,
  expandedBout,
  onToggleExpand,
}: TournamentBracketProps) {
  const state = useWarriorNameState();

  const roundsMap = new Map<number, TournamentBout[]>();
  bouts.forEach((b) => {
    const arr = roundsMap.get(b.round) || [];
    arr.push(b);
    roundsMap.set(b.round, arr);
  });

  // Precompute arena history lookups to avoid O(N) array scans per bout
  const fightHistoryMap = useMemo(() => {
    const map = new Map<string, FightSummary>();
    for (const f of arenaHistory) {
      map.set(f.id, f);
    }
    return map;
  }, [arenaHistory]);

  const sortedRounds = Array.from(roundsMap.entries()).sort(([a], [b]) => a - b);
  const totalRounds = sortedRounds.length;

  return (
    <div className="relative overflow-x-auto pb-8 pt-4 no-scrollbar">
      <div className="flex gap-16 min-w-max px-4">
        {sortedRounds.map(([round, roundBouts], rIdx) => (
          <div key={round} className="flex flex-col justify-around gap-8 relative py-4">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                {round === totalRounds && totalRounds > 1 ? 'Championship' : `Round ${round}`}
              </span>
            </div>

            {roundBouts.map((bout, bIdx) => {
              const boutKey = `${round}_${bIdx}`;
              const isExpanded = expandedBout === boutKey;
              const fightSummary = bout.fightId
                ? (fightHistoryMap.get(bout.fightId) ?? null)
                : null;

              return (
                <BracketMatchNode
                  key={bIdx}
                  bout={bout}
                  boutKey={boutKey}
                  isExpanded={isExpanded}
                  onToggleExpand={onToggleExpand}
                  fightSummary={fightSummary}
                  rIdx={rIdx}
                  bIdx={bIdx}
                  totalRounds={totalRounds}
                  gameState={state}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Champion display card shown when tournament is complete */
interface ChampionDisplayProps {
  championName: string;
  championId?: string;
  tournamentName: string;
} /**
   * Champion display.
   * @param  - {
  champion name,
  champion id,
  tournament name,
}.
   */

/**
 * Champion display.
 * @param  - {
  champion name,
  champion id,
  tournament name,
}.
 */
export function ChampionDisplay({
  championName,
  championId,
  tournamentName,
}: ChampionDisplayProps) {
  const state = useWarriorNameState();
  const displayName = championId
    ? resolveWarriorName(state, championId, championName)
    : championName;

  return (
    <Surface
      variant="gold"
      className="bg-gradient-to-br from-arena-gold/20 via-arena-gold/10 to-transparent border-arena-gold/50 shadow-[0_0_30px_-10px_rgba(255,215,0,0.5)]"
    >
      <div className="p-8 text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <Crown className="h-16 w-16 text-arena-gold animate-bounce" />
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-black">
              Tournament Supreme Champion
            </p>
            <h3 className="text-4xl font-display font-black uppercase tracking-tighter text-foreground mt-2">
              {displayName}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-white/5" />
              <p className="text-[11px] font-black uppercase tracking-widest text-arena-gold/60">
                {tournamentName}
              </p>
              <div className="h-px w-8 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

/** Bronze match highlight card */
interface BronzeHighlightProps {
  thirdPlaceName: string;
  thirdPlaceId?: string;
} /**
 * Bronze highlight.
 * @param - { third place name, third place id }.
 */

/**
 * Bronze highlight.
 * @param - { third place name, third place id }.
 */
export function BronzeHighlight({ thirdPlaceName, thirdPlaceId }: BronzeHighlightProps) {
  const state = useWarriorNameState();
  const displayName = thirdPlaceId
    ? resolveWarriorName(state, thirdPlaceId, thirdPlaceName)
    : thirdPlaceName;

  return (
    <Surface
      variant="glass"
      className="bg-gradient-to-br from-amber-600/10 to-transparent border-arena-gold/30"
    >
      <div className="p-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <Medal className="h-6 w-6 text-arena-gold" />
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-black">
              Third Place Medalist
            </p>
            <p className="text-lg font-display font-black text-arena-gold uppercase tracking-tight leading-none mt-1">
              {displayName}
            </p>
          </div>
        </div>
      </div>
    </Surface>
  );
}

/** Tournament progress summary */
interface TournamentProgressProps {
  currentRound: number;
  totalRounds: number;
  completedMatches: number;
  totalMatches: number;
} /**
   * Tournament progress.
   * @param  - {
  current round,
  total rounds,
  completed matches,
  total matches,
}.
   */

/**
 * Tournament progress.
 * @param  - {
  current round,
  total rounds,
  completed matches,
  total matches,
}.
 */
export function TournamentProgress({
  currentRound,
  totalRounds,
  completedMatches,
  totalMatches,
}: TournamentProgressProps) {
  const progress = Math.round((completedMatches / totalMatches) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Round {currentRound} of {totalRounds}
        </span>
        <span className="font-mono font-bold">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{completedMatches} matches completed</span>
        <span>{totalMatches - completedMatches} remaining</span>
      </div>
    </div>
  );
}
