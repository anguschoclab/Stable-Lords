import type { GameStore } from '@/state/useGameStore';
import { FightSummary } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { truncateArray } from '@/utils/stateUtils';

export function createCombatActions(set: (fn: (state: GameStore) => Partial<GameStore>) => void) {
  return {
    appendFight: (summary: FightSummary) => {
      set((state) => {
        const nextHistory = truncateArray([...state.arenaHistory, summary], 500).map(
          (f: FightSummary, i: number, arr: FightSummary[]) => {
            if (arr.length - i > 20 && f.transcript) {
              const { transcript: _transcript, ...rest } = f;
              return rest;
            }
            return f;
          }
        );
        return { arenaHistory: nextHistory };
      });
    },

    updateWarriorStatus: (
      warriorId: WarriorId,
      won: boolean,
      killed: boolean,
      fameDelta: number,
      popDelta: number,
      rivalStableId?: StableId
    ) => {
      set((state: GameStore) => {
        if (rivalStableId) {
          return {
            rivals: state.rivals.map((r) =>
              r.owner.id === rivalStableId
                ? {
                    ...r,
                    roster: r.roster.map((w) =>
                      w.id === warriorId
                        ? {
                            ...w,
                            fame: Math.max(0, (w.fame || 0) + fameDelta),
                            popularity: Math.max(0, (w.popularity || 0) + popDelta),
                            career: {
                              ...w.career,
                              wins: (w.career?.wins || 0) + (won ? 1 : 0),
                              losses: (w.career?.losses || 0) + (won ? 0 : 1),
                              kills: (w.career?.kills || 0) + (killed ? 1 : 0),
                            },
                          }
                        : w
                    ),
                  }
                : r
            ),
          };
        }

        return {
          roster: state.roster.map((w) =>
            w.id === warriorId
              ? {
                  ...w,
                  fame: Math.max(0, (w.fame || 0) + fameDelta),
                  popularity: Math.max(0, (w.popularity || 0) + popDelta),
                  career: {
                    ...w.career,
                    wins: (w.career?.wins || 0) + (won ? 1 : 0),
                    losses: (w.career?.losses || 0) + (won ? 0 : 1),
                    kills: (w.career?.kills || 0) + (killed ? 1 : 0),
                  },
                }
              : w
          ),
        };
      });
    },
  };
}
