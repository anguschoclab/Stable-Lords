import { useMemo } from 'react';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { StableReputationInput } from '@/engine/stableReputation';
import { computeStableReputation, computeRivalReputation } from '@/engine/stableReputation';

/**
 *
 */
export interface QuadrantDot {
  label: string;
  fame: number;
  notoriety: number;
  isPlayer: boolean;
}

/**
 *
 */
export function useQuadrantDots(worldState: StableReputationInput, rivals: RivalStableData[]): QuadrantDot[] {
  return useMemo<QuadrantDot[]>(() => {
    const playerRep = computeStableReputation(worldState);
    const result: QuadrantDot[] = [
      {
        label: worldState.player?.stableName ?? 'Your Stable',
        fame: playerRep.fame,
        notoriety: playerRep.notoriety,
        isPlayer: true,
      },
    ];
    for (const rival of rivals ?? []) {
      const rep = computeRivalReputation(rival.roster);
      result.push({
        label: rival.owner.stableName,
        fame: rep.fame,
        notoriety: rep.notoriety,
        isPlayer: false,
      });
    }
    return result;
  }, [worldState, rivals]);
}
