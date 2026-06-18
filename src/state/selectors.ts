import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './useGameStore';
import { reconstructGameState } from './serialization';

/** --- Fine-Grained Selectors --- */
export const useWorldState = () => useGameStore(reconstructGameState);

export const usePlayer = () => useGameStore((s) => s.player);

export const useRoster = () => useGameStore((s) => s.roster);

export const useRivals = () => useGameStore((s) => s.rivals);

export const useTreasury = () => useGameStore((s) => s.treasury);

export const useWeek = () => useGameStore((s) => s.week);

export const useIsSimulating = () => useGameStore((s) => s.isSimulating);

export const useReputationState = () =>
  useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      arenaHistory: s.arenaHistory,
      newsletter: s.newsletter,
      player: s.player,
      fame: s.fame,
      trainingAssignments: s.trainingAssignments,
      trainers: s.trainers,
    }))
  );

/** --- Computed Selectors (Derived State) --- */
interface StyleStatsRow {
  style: string;
  wins: number;
  losses: number;
  winRate: number;
}

export const useStyleStats = (): StyleStatsRow[] =>
  useGameStore((s) => {
    const map = new Map<string, { wins: number; losses: number }>();
    for (const w of s.roster) {
      const entry = map.get(w.style) ?? { wins: 0, losses: 0 };
      entry.wins += w.career?.wins ?? 0;
      entry.losses += w.career?.losses ?? 0;
      map.set(w.style, entry);
    }
    return Array.from(map.entries())
      .map(([style, { wins, losses }]) => ({
        style,
        wins,
        losses,
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  });
