import type { GameStore } from '@/state/useGameStore';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { STARTING_TREASURY } from '@/constants/economy';
import { createChampionshipDelta, relinquishCrown } from '@/engine/championship/arenaChampionship';
import { sanitizeEntityName } from '@/utils/entityName';
import type { ArenaPreferences } from './types';

/** Locate a rival warrior and its stable id by warrior id. */
function findRivalWarrior(
  state: GameStore,
  warriorId: string
): { warrior: Warrior; stableId: string } | undefined {
  for (const r of state.rivals ?? []) {
    for (const w of r.roster) {
      if (w.id === warriorId) return { warrior: w, stableId: r.id as string };
    }
  }
  return undefined;
}

/** Canon: challenge/avoid marks only bind once a warrior is listed in the
 *  newsletter — i.e. has fought at least once (draws count as losses). */
function isListedInArena(warrior: Warrior): boolean {
  return ((warrior.career?.wins ?? 0) + (warrior.career?.losses ?? 0)) > 0;
}

/**
 *
 */
export function createPlayerActions(set: (fn: (state: GameStore) => Partial<GameStore>) => void) {
  return {
    setWeek: (week: number) => set(() => ({ week })),

    setArenaPreferences: (prefs: Partial<ArenaPreferences>) => {
      set((state) => ({
        arenaPreferences: { ...state.arenaPreferences, ...prefs },
      }));
    },

    initializeStable: (name: string, stableName: string) => {
      set((state) => ({
        player: {
          ...state.player,
          name: sanitizeEntityName(name) || state.player?.name || 'Unknown',
          stableName: sanitizeEntityName(stableName) || state.player?.stableName || 'Unknown',
        },
        treasury: STARTING_TREASURY,
      }));
    },

    renameStable: (newName: string) => {
      set((state) => {
        const clean = sanitizeEntityName(newName);
        if (!clean) return state;
        return { player: { ...state.player, stableName: clean } };
      });
    },

    renamePlayer: (newName: string) => {
      set((state) => {
        const clean = sanitizeEntityName(newName);
        if (!clean) return state;
        return { player: { ...state.player, name: clean } };
      });
    },

    toggleChallenge: (warriorId: string) => {
      set((state) => {
        const challenges = state.playerChallenges || [];
        const avoids = state.playerAvoids || [];
        const stableAvoids = state.playerStableAvoids || [];
        if (challenges.includes(warriorId)) {
          return { playerChallenges: challenges.filter((id) => id !== warriorId) };
        }
        const found = findRivalWarrior(state, warriorId);
        // Unlisted warriors can't be challenged; unresolvable ids pass through.
        if (found && !isListedInArena(found.warrior)) return {};
        return {
          playerChallenges: [...challenges, warriorId],
          playerAvoids: avoids.filter((id) => id !== warriorId),
          // A specific mark overrides a blanket stable avoid.
          playerStableAvoids: found
            ? stableAvoids.filter((id) => id !== found.stableId)
            : stableAvoids,
        };
      });
    },

    relinquishArenaTitle: (arenaId: string) => {
      set((state) => {
        const delta = createChampionshipDelta();
        relinquishCrown(state as unknown as GameState, delta, arenaId);
        const nextTitle = delta.arenaChampions[arenaId];
        if (!nextTitle) return {};
        return {
          arenaChampions: { ...state.arenaChampions, [arenaId]: nextTitle },
          newsletter: [...(state.newsletter ?? []), ...delta.newsletterItems],
        };
      });
    },

    toggleAvoid: (warriorId: string) => {
      set((state) => {
        const challenges = state.playerChallenges || [];
        const avoids = state.playerAvoids || [];
        if (avoids.includes(warriorId)) {
          return { playerAvoids: avoids.filter((id) => id !== warriorId) };
        }
        const found = findRivalWarrior(state, warriorId);
        if (found && !isListedInArena(found.warrior)) return {};
        return {
          playerAvoids: [...avoids, warriorId],
          playerChallenges: challenges.filter((id) => id !== warriorId),
        };
      });
    },

    toggleStableAvoid: (stableId: string) => {
      set((state) => {
        const stableAvoids = state.playerStableAvoids || [];
        if (stableAvoids.includes(stableId)) {
          return { playerStableAvoids: stableAvoids.filter((id) => id !== stableId) };
        }
        // A blanket avoid clears per-warrior marks on that stable's roster.
        const target = (state.rivals ?? []).find(
          (r) => r.id === stableId || r.owner.id === stableId
        );
        const warriorIds = new Set((target?.roster ?? []).map((w) => w.id as string));
        return {
          playerStableAvoids: [...stableAvoids, stableId],
          playerChallenges: (state.playerChallenges || []).filter((id) => !warriorIds.has(id)),
          playerAvoids: (state.playerAvoids || []).filter((id) => !warriorIds.has(id)),
        };
      });
    },

    submitPlayerAd: (text: string) => {
      set((state) => {
        const trimmed = text.trim();
        if (!trimmed) return {};
        return { playerAds: [...(state.playerAds || []), trimmed].slice(-3) };
      });
    },
  };
}
