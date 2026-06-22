import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { TRAITS } from '@/engine/traits';
import { canAcquireTrait } from './traitTraining';

/**
 * Per-warrior trait ceiling from hidden aptitude (`trainability`, rolled in
 * [0.4, 0.9] at birth). Low-aptitude warriors permanently plateau, so the world
 * keeps a spread of blank / lightly-traited / fully-developed warriors instead of
 * saturating everyone to the cap. Thresholds are tuned for the [0.4,0.9] range;
 * adjust against the liveness harness, not by feel.
 */
export const CAPACITY_T1 = 0.52; // below → capacity 0 (never develops)
export const CAPACITY_T2 = 0.66; // below → capacity 1
export const CAPACITY_T3 = 0.8; // below → capacity 2, else 3

export function traitCapacity(w: Warrior): number {
  const t = w.trainability ?? 0.65;
  if (t < CAPACITY_T1) return 0;
  if (t < CAPACITY_T2) return 1;
  if (t < CAPACITY_T3) return 2;
  return 3;
}

/** Traits are earned: only warriors with a winning record or real fame develop. */
export const WINS_FOR_MERIT = 2;
export const FAME_FOR_MERIT = 25;

export function meritsTraitDevelopment(w: Warrior): boolean {
  const wins = w.career?.wins ?? 0;
  const losses = w.career?.losses ?? 0;
  const fame = w.fame ?? 0;
  return (wins >= WINS_FOR_MERIT && wins >= losses) || fame >= FAME_FOR_MERIT;
}

export function countFlaws(w: Warrior): number {
  return (w.traits ?? []).filter((id) => TRAITS[id]?.tier === 'Flaw').length;
}

/** Pick an acquirable Flaw (respects hard cap + conflicts), or null if none fit. */
export function pickExposureFlaw(w: Warrior, rng: IRNGService): string | null {
  const flaws = Object.values(TRAITS).filter(
    (t) => t.tier === 'Flaw' && canAcquireTrait(w, t.id)
  );
  if (flaws.length === 0) return null;
  const idx = Math.floor(rng.next() * flaws.length);
  return flaws[Math.min(idx, flaws.length - 1)]!.id;
}
