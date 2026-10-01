import { useMemo } from 'react';
import type { RivalStableData } from '@/types/state.types';
import type { StableReputationInput } from '@/engine/stable/stableReputation';
import { computeStableReputation, computeRivalReputation } from '@/engine/stable/stableReputation';

/**
 *
 */
export interface QuadrantDot {
  id: string;
  label: string;
  fame: number;
  notoriety: number;
  isPlayer: boolean;
}

/**
 *
 */
export function useQuadrantDots(
  worldState: StableReputationInput,
  rivals: RivalStableData[]
): QuadrantDot[] {
  return useMemo<QuadrantDot[]>(() => {
    const playerRep = computeStableReputation(worldState);
    const result: QuadrantDot[] = [
      {
        id: 'player',
        label: worldState.player?.stableName ?? 'Your Stable',
        fame: playerRep.fame,
        notoriety: playerRep.notoriety,
        isPlayer: true,
      },
    ];
    for (const rival of rivals ?? []) {
      const rep = computeRivalReputation(rival.roster);
      result.push({
        id: rival.id,
        label: rival.owner.stableName,
        fame: rep.fame,
        notoriety: rep.notoriety,
        isPlayer: false,
      });
    }
    return result;
  }, [worldState, rivals]);
}
