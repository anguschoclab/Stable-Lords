import type { GameState, RivalStableData } from '@/types/state.types';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '@/engine/rivals';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';

/**
 * Mint a bankruptcy-replacement stable. Seeds overlap across generation call
 * sites — a colliding seed re-mints a byte-identical clone of a live stable
 * (same stableId + warrior ids), conflating every id-keyed update. Re-seed
 * until the minted stable id and all warrior ids are world-unique.
 */
export function mintSuccessorStable(state: GameState, index: number): RivalStableData | undefined {
  const usedStableIds = new Set((state.rivals ?? []).map((r) => r.id));
  const usedWarriorIds = collectUsedWarriorIds(state);
  const usedNames = collectUsedWarriorNames(state);
  const usedStableNames = new Set((state.rivals ?? []).map((r) => r.owner.stableName));
  const usedOwnerNames = new Set((state.rivals ?? []).map((r) => r.owner.name));
  if (state.player) {
    usedStableNames.add(state.player.stableName);
    usedOwnerNames.add(state.player.name);
  }
  const retirementSeed = state.absoluteWeek + index * 1000;
  for (let attempt = 0; attempt < 8; attempt++) {
    const newStable = generateRivalStables(1, retirementSeed + attempt * 7919, 0, usedNames)[0];
    if (!newStable) return undefined;
    if (usedStableIds.has(newStable.id) || newStable.roster.some((w) => usedWarriorIds.has(w.id))) {
      continue;
    }
    // Shards share a pre-pass snapshot — same-week mints can't see each
    // other, so `index` shifts the suffix scan to spread collisions.
    const suffixAt = 2 + index;
    return {
      ...newStable,
      owner: {
        ...newStable.owner,
        stableName: uniqueStableName(newStable.owner.stableName, usedStableNames, suffixAt),
        name: uniqueOwnerName(newStable.owner.name, usedOwnerNames, suffixAt),
      },
      establishedAbsoluteWeek: state.absoluteWeek,
    } as RivalStableData;
  }
  return undefined;
}
