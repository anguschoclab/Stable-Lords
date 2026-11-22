import { useMemo } from 'react';
import type { RivalStableData } from '@/types/state.types';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import type { StableReputationInput } from '@/engine/stable/stableReputation';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { computeStableReputation, computeRivalReputation } from '@/engine/stable/stableReputation';

/** One dot on the reputation quadrant chart — fame vs notoriety. */
export interface QuadrantDot {
  id: string;
  label: string;
  fame: number;
  notoriety: number;
  isPlayer: boolean;
}

/** Player + rival stables plotted as fame/notoriety quadrant dots. */
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
    for (const [index, rival] of (rivals ?? []).entries()) {
      const rep = computeRivalReputation(rival.roster);
      result.push({
        id: `rival-${index}-${rival.id ?? rival.owner.id ?? 'unknown'}`,
        label: rival.owner.stableName,
        fame: rep.fame,
        notoriety: rep.notoriety,
        isPlayer: false,
      });
    }
    return result;
  }, [worldState, rivals]);
}
