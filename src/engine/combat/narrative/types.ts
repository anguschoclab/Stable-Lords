import { type FightingStyle } from '@/types/shared.types';

/**
 *
 */
export interface NarrationContext {
  rng: () => number;
  nameA: string;
  nameD: string;
  weaponA: string;
  weaponD: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  maxHpA: number;
  maxHpD: number;
  /** HP ratio at the start of this exchange (before resolveExchange ran). */
  prevHpRatioA: number;
  prevHpRatioD: number;
  /**
   * Authoritative post-exchange HP ratios from the engine state (fA.hp/maxHp).
   * These are post-mitigation (shield + protect reductions applied).
   * Narration uses these for state-change and severity lines instead of
   * re-deriving from the pre-mitigation event.value.
   * Optional for backwards-compat with tests that don't supply them.
   */
  postHpRatioA?: number;
  postHpRatioD?: number;
  fameA: number;
  fameD: number;
  isFavoriteA?: boolean;
  isFavoriteD?: boolean;
  spA?: number;
  spD?: number;
  originA?: string;
  originD?: string;
}
