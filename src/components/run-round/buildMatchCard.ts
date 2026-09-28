import { generatePairings } from '@/engine/bout/core/pairings';
import type { GameState } from '@/types/state.types';
import type { RivalStableData } from '@/types/game';

/**
 * Builds the arena fight card for the current world state — one entry per
 * pairing, with the rival stable resolved (or a stub when the pairing
 * references a stable the rivals index doesn't carry).
 */
export function buildMatchCard(gameState: GameState) {
  return generatePairings(gameState).pairings.map((p) => ({
    playerWarrior: p.a,
    rivalWarrior: p.d,
    rivalStable:
      gameState.rivals.find((r: RivalStableData) => r.owner.id === p.rivalStableId) ||
      ({ owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData),
    isRivalryBout: p.isRivalry,
  }));
}
