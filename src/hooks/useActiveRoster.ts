import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warriorStatus';
import type { CareerRecord, AttributePotential, InjuryData } from '@/types/warrior.types';
import type { Attributes } from '@/types/shared.types';

/**
 *
 */
export interface ActiveRosterItem {
  id: string;
  name: string;
  fame: number;
  style: string;
  champion: boolean;
  potential?: AttributePotential | null;
  attributes: Attributes;
  career: CareerRecord;
  injuries?: InjuryData[];
  flair?: string[];
  traits?: string[];
  age?: number;
}

/**
 *
 */
export function useActiveRoster(): ActiveRosterItem[] {
  const roster = useGameStore((s) => s.roster);

  return useMemo(() => {
    const result: ActiveRosterItem[] = [];
    for (const w of roster) {
      if (isActive(w)) {
        result.push({
          id: w.id,
          name: w.name,
          fame: w.fame,
          style: w.style,
          champion: w.champion,
          potential: w.potential,
          attributes: w.attributes,
          career: w.career,
          injuries: w.injuries,
          flair: w.flair,
          traits: w.traits,
          age: w.age,
        });
      }
    }
    result.sort((a, b) => b.fame - a.fame);
    return result;
  }, [roster]);
}
