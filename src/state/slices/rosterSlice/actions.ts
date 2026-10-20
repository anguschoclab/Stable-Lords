import type { GameStore } from '@/state/useGameStore';
import { Warrior, InsightToken } from '@/types/state.types';
import { type WarriorId, type InsightId } from '@/types/shared.types';
import { formatWeek } from '@/utils/format';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { updateEntityInList } from '@/utils/stateUtils';
import { retireWithHonors } from '@/engine/warrior/retirement';
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';
import { warriorToPoolWarrior } from '@/engine/recruitment/recruitment';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import {
  isLegacyFounderCaliber,
  buildLegacyFounderQueueEntry,
  collectCrownedWarriorIds,
} from '@/engine/ai/legacyFounder';
import { SeededRNG, hashStr } from '@/utils/random';
import { LEGACY_FOUND_CHANCE } from '@/constants/world';

/** Apply an insight token's effect to a warrior draft. */
function applyInsightToken(w: Warrior, token: InsightToken, state: GameStore): Warrior {
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
    // Deterministic pick — the same warrior/token/week always yields the same
    // attribute bump (save-scum re-rolls were a real exploit).
    const attrKey = new SeededRNG(state.week * 31 + hashStr(`${w.id}:${token.id}`)).pick([
      ...primaries,
    ]);
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
  } else if (token.type === 'Trait') {
    draft.flair = [...(draft.flair || []), 'Pattern Reader'];
  }

  return draft;
}

/** Move `warriorId` from the roster into the graveyard with death metadata. */
function retireToGraveyard(
  state: GameStore,
  warriorId: WarriorId,
  killedBy: string,
  cause: string,
  deathEvent: Parameters<GameStore['killWarrior']>[3]
): Partial<GameStore> {
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
    dateOfDeath: formatWeek(state.week, state.season),
    causeOfDeath: cause,
  };

  const update: Partial<GameStore> = {
    roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
    graveyard: [...state.graveyard, dead],
    unacknowledgedDeaths: [...(state.unacknowledgedDeaths || []), warriorId],
  };
  if (state.avatarCache) {
    const { [warriorId]: _droppedAvatar, ...avatarCache } = state.avatarCache;
    update.avatarCache = avatarCache;
  }
  return update;
}

/** Move `warriorId` from the roster into the retired list. Hall-of-Fame
 *  retirements may also join the world's legacy-founder queue — a player's
 *  legend can open a rival stable with lineage back to the player's stable. */
function retireFromRoster(state: GameStore, warriorId: WarriorId): Partial<GameStore> {
  const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
  if (!warrior) return state;

  const ret: Warrior = retireWithHonors(warrior, state.week);

  const update: Partial<GameStore> = {
    roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
    retired: [...state.retired, ret],
  };
  if (state.avatarCache) {
    const { [warriorId]: _droppedAvatar, ...avatarCache } = state.avatarCache;
    update.avatarCache = avatarCache;
  }

  const founderRng = new SeededRNG((state.absoluteWeek ?? state.week) * 977 + state.retired.length);
  if (
    isLegacyFounderCaliber(ret, collectCrownedWarriorIds(state)) &&
    founderRng.next() < LEGACY_FOUND_CHANCE
  ) {
    update.legacyFounderQueue = [
      ...(state.legacyFounderQueue ?? []),
      buildLegacyFounderQueueEntry(ret),
    ];
  }

  return update;
}

/** Move `warriorId` from the roster onto the free-agent shelf — a release,
 *  not a retirement: the warrior keeps competing for whoever signs them. */
function releaseFromRoster(
  state: GameStore,
  warriorId: WarriorId,
  reason: string
): Partial<GameStore> {
  const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
  if (!warrior) return state;

  const releaseSeed = (state.absoluteWeek ?? state.week) * 991 + hashStr(warrior.id);
  const poolEntry = warriorToPoolWarrior(
    warrior,
    state.week,
    new SeededRNG(releaseSeed),
    'released'
  );
  poolEntry.lore = `${poolEntry.lore} (${reason} from ${state.player?.stableName ?? 'the syndicate'} in week ${state.week}.)`;

  const update: Partial<GameStore> = {
    roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
    freeAgents: [...(state.freeAgents ?? []).filter((p) => p.id !== poolEntry.id), poolEntry],
  };
  if (state.avatarCache) {
    const { [warriorId]: _droppedAvatar, ...avatarCache } = state.avatarCache;
    update.avatarCache = avatarCache;
  }
  return update;
}

/**
 * Creates roster-related actions for the game store, including managing warriors,
 * insight tokens, equipment, and death acknowledgements.
 */
export function createRosterActions(set: (fn: (state: GameStore) => Partial<GameStore>) => void) {
  return {
    setRoster: (roster: Warrior[]) => set(() => ({ roster })),

    addWarrior: (warrior: Warrior) =>
      set((state) => {
        const activeCount = state.roster.filter((w: Warrior) => isActive(w)).length;
        if (activeCount >= BASE_ROSTER_CAP + (state.rosterBonus ?? 0)) return state;
        if (state.roster.some((w: Warrior) => w.id === warrior.id)) return state;
        // Dead identities can never re-enter a roster through any path.
        if (deadIdSet(state).has(warrior.id)) return state;
        const stamped = warrior.stableId ? warrior : { ...warrior, stableId: state.player?.id };
        return { roster: [...state.roster, stamped] };
      }),

    killWarrior: (
      warriorId: WarriorId,
      killedBy: string,
      cause: string,
      deathEvent?: Parameters<GameStore['killWarrior']>[3]
    ) => {
      set((state) => {
        if (state.avatarCache) {
          state.avatarCache = Object.fromEntries(
            Object.entries(state.avatarCache).filter(([key]) => key !== warriorId)
          );
        }
        return retireToGraveyard(state, warriorId, killedBy, cause, deathEvent);
      });
    },

    retireWarrior: (warriorId: WarriorId) => {
      set((state) => {
        if (state.avatarCache) {
          state.avatarCache = Object.fromEntries(
            Object.entries(state.avatarCache).filter(([key]) => key !== warriorId)
          );
        }
        return retireFromRoster(state, warriorId);
      });
    },

    releaseWarrior: (warriorId: WarriorId, reason = 'Released') => {
      set((state) => {
        if (state.avatarCache) {
          state.avatarCache = Object.fromEntries(
            Object.entries(state.avatarCache).filter(([key]) => key !== warriorId)
          );
        }
        return releaseFromRoster(state, warriorId, reason);
      });
    },

    consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => {
      set((state) => {
        const token = state.insightTokens?.find((t: InsightToken) => t.id === tokenId);
        if (!token) return state;

        return {
          roster: updateEntityInList(state.roster, warriorId, (w) =>
            applyInsightToken(w, token, state)
          ),
          insightTokens: state.insightTokens.filter((t: InsightToken) => t.id !== tokenId),
        };
      });
    },

    updateWarriorEquipment: (
      warriorId: WarriorId,
      equipment: { weapon: string; armor: string; shield: string; helm: string }
    ) => {
      set((state) => ({
        roster: updateEntityInList(state.roster, warriorId, (w) => ({ ...w, equipment })),
      }));
    },

    renameWarrior: (warriorId: WarriorId, newName: string) => {
      set((state) => {
        const updateList = (list: Warrior[]) =>
          updateEntityInList(list, warriorId, (w) => ({ ...w, name: newName }));

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
