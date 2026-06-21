import type { GameStore } from '@/state/useGameStore';
import { Warrior, InsightToken } from '@/types/state.types';
import { type WarriorId, type InsightId } from '@/types/shared.types';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { computeWarriorStats } from '@/engine/skillCalc';

/**
 *
 */
export function createRosterActions(set: (fn: (state: GameStore) => Partial<GameStore>) => void) {
  return {
    setRoster: (roster: Warrior[]) => set(() => ({ roster })),

    addWarrior: (warrior: Warrior) => set((state) => ({ roster: [...state.roster, warrior] })),

    killWarrior: (
      warriorId: WarriorId,
      killedBy: string,
      cause: string,
      deathEvent?: Parameters<GameStore['killWarrior']>[3]
    ) => {
      set((state) => {
        const victim = state.roster.find((w: Warrior) => w.id === warriorId);
        if (!victim) return state;

        const dead: Warrior = {
          ...victim,
          status: 'Dead',
          deathWeek: state.week,
          deathCause: cause,
          killedBy,
          deathEvent,
          isDead: true,
          dateOfDeath: `Week ${state.week}, ${state.season}`,
          causeOfDeath: cause,
        };

        return {
          roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
          graveyard: [...state.graveyard, dead],
          unacknowledgedDeaths: [...(state.unacknowledgedDeaths || []), warriorId],
        };
      });
    },

    retireWarrior: (warriorId: WarriorId) => {
      set((state) => {
        const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
        if (!warrior) return state;

        const ret: Warrior = {
          ...warrior,
          status: 'Retired',
          retiredWeek: state.week,
        };

        return {
          roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
          retired: [...state.retired, ret],
        };
      });
    },

    releaseWarrior: (warriorId: WarriorId, _reason = 'Released') => {
      set((state) => {
        const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
        if (!warrior) return state;

        const ret: Warrior = {
          ...warrior,
          status: 'Retired',
          retiredWeek: state.week,
        };

        return {
          roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
          retired: [...state.retired, ret],
        };
      });
    },

    consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => {
      set((state) => {
        const token = state.insightTokens?.find((t: InsightToken) => t.id === tokenId);
        if (!token) return state;

        const nextRoster = state.roster.map((w: Warrior) => {
          if (w.id !== warriorId) return w;

          const draft = { ...w };
          if (!draft.favorites) {
            draft.favorites = {
              weaponId: 'broadsword',
              rhythm: { oe: 0.5, al: 0.5 },
              discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
            };
          }

          if (token.type === 'Weapon') {
            draft.favorites.discovered.weapon = true;
          } else if (token.type === 'Rhythm') {
            draft.favorites.discovered.rhythm = true;
          } else if (token.type === 'Style') {
            if (draft.baseSkills) {
              draft.baseSkills = { ...draft.baseSkills, ATT: draft.baseSkills.ATT + 1 };
              const recalc = computeWarriorStats(draft.attributes, draft.style);
              draft.derivedStats = recalc.derivedStats;
            }
          } else if (token.type === 'Attribute') {
            const primaries = ['ST', 'WT', 'SP', 'DF'] as const;
            const attrKey = primaries[cryptoRandomInt(0, primaries.length - 1)];
            if (attrKey) {
              draft.attributes = {
                ...draft.attributes,
                [attrKey]: (draft.attributes[attrKey] || 10) + 1,
              };
              const recalc = computeWarriorStats(draft.attributes, draft.style);
              draft.baseSkills = recalc.baseSkills;
              draft.derivedStats = recalc.derivedStats;
            }
          } else if (token.type === 'Tactic') {
            draft.flair = [...(draft.flair || []), 'Tactical Insight'];
          }

          return draft;
        });

        return {
          roster: nextRoster,
          insightTokens: state.insightTokens.filter((t: InsightToken) => t.id !== tokenId),
        };
      });
    },

    updateWarriorEquipment: (
      warriorId: WarriorId,
      equipment: { weapon: string; armor: string; shield: string; helm: string }
    ) => {
      set((state) => {
        const nextRoster = state.roster.map((w: Warrior) => {
          if (w.id !== warriorId) return w;
          return { ...w, equipment };
        });
        return { roster: nextRoster };
      });
    },

    renameWarrior: (warriorId: WarriorId, newName: string) => {
      set((state) => {
        const updateList = (list: Warrior[]) =>
          list.map((w) => (w.id === warriorId ? { ...w, name: newName } : w));

        return {
          roster: updateList(state.roster),
          graveyard: updateList(state.graveyard),
          retired: updateList(state.retired),
        };
      });
    },

    acknowledgeDeath: (warriorId: WarriorId) => {
      set((state) => ({
        unacknowledgedDeaths: (state.unacknowledgedDeaths || []).filter((id) => id !== warriorId),
      }));
    },
  };
}
