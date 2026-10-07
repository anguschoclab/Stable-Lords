import type { NarrationContext } from '@/engine/combat/narrative/narrator';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

/** Deterministic Thunderstrike-vs-Lightning narration context shared by narrator tests. */
export function makeNarrationContext(overrides: Partial<NarrationContext> = {}): NarrationContext {
  return {
    rng: new SeededRNG(42),
    nameA: 'Thunderstrike',
    nameD: 'Lightning',
    weaponA: 'broadsword',
    weaponD: 'short_spear',
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.TotalParry,
    maxHpA: 100,
    maxHpD: 100,
    prevHpRatioA: 1.0,
    prevHpRatioD: 1.0,
    fameA: 10,
    fameD: 10,
    ...overrides,
  };
}
