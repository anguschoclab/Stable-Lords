import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { collectAllKnownWarriors } from '@/engine/core/warriorCollection';
import { ensureEntityIndex } from '@/engine/core/entityIndex';
import { computeAlmanac, type AlmanacData, type AlmanacInput } from '@/engine/analytics/almanac';

/**
 * Reads every record-bearing slice of GameState and computes the full
 * Almanac board set. All inputs come from canonical state (never the
 * localStorage ArenaHistory mirror — that one is a 500-fight window).
 */
export function useAlmanac(): AlmanacData {
  const slice = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      arenaHistory: s.arenaHistory,
      hallOfFame: s.hallOfFame,
      awards: s.awards,
      arenaChampions: s.arenaChampions,
      grandChampions: s.grandChampions,
      tournaments: s.tournaments,
      lifetimeStats: s.lifetimeStats,
      deadWarriorIds: s.deadWarriorIds,
      killEvents: s.killEvents,
      rivalries: s.rivalries,
      player: s.player,
      fame: s.fame,
      year: s.year,
      week: s.week,
      absoluteWeek: s.absoluteWeek,
    }))
  );

  // Shared cached index — same WeakMap-keyed Map other pages use.
  const stableNameById = useGameStore((s) => ensureEntityIndex(s).stableNameById);

  return useMemo(() => {
    const warriors = collectAllKnownWarriors({
      roster: slice.roster,
      graveyard: slice.graveyard,
      retired: slice.retired,
      rivals: slice.rivals,
    });
    const stables = [
      {
        id: slice.player.id as string,
        name: slice.player.stableName,
        fame: slice.fame ?? 0,
        isPlayer: true,
      },
      ...(slice.rivals ?? []).map((r) => ({
        id: r.id as string,
        name: r.owner?.stableName ?? (r.id as string),
        fame: r.fame ?? 0,
        isPlayer: false,
      })),
    ];
    const input: AlmanacInput = {
      warriors,
      playerStableId: slice.player.id as string,
      stableNameById,
      stables,
      arenaHistory: slice.arenaHistory,
      hallOfFame: slice.hallOfFame,
      awards: slice.awards,
      arenaChampions: slice.arenaChampions,
      grandChampions: slice.grandChampions,
      tournaments: slice.tournaments,
      lifetimeStats: slice.lifetimeStats,
      deadWarriorIds: slice.deadWarriorIds as string[] | undefined,
      killEvents: slice.killEvents,
      rivalries: slice.rivalries,
      absoluteWeek: slice.absoluteWeek,
      year: slice.year,
      week: slice.week,
    };
    return computeAlmanac(input);
  }, [slice, stableNameById]);
}
