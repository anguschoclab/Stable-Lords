import { generatePairings } from '@/engine/bout/core/pairings';
import type { GameState } from '@/types/state.types';
import type { RivalStableData } from '@/types/game';
import type { StableId } from '@/types/shared.types';
import { indexBy } from '@/utils/collections';

/**
 * Builds the arena fight card for the current world state — one entry per
 * pairing, with the rival stable resolved (or a stub when the pairing
 * references a stable the rivals index doesn't carry).
 */
export function buildMatchCard(gameState: GameState) {
  const stableByOwner = indexBy(gameState.rivals, (r: RivalStableData) => r.owner.id);
  return generatePairings(gameState).pairings.map((p) => ({
    playerWarrior: p.a,
    rivalWarrior: p.d,
    rivalStable:
      (p.rivalStableId && stableByOwner.get(p.rivalStableId as StableId)) ||
      ({ owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData),
    isRivalryBout: p.isRivalry,
  }));
}
