import type { Warrior } from '@/types/warrior.types';
import { TRAITS, type TraitTier } from '@/engine/traits';
import { clamp } from '@/utils/math';

/**
 *
 */
export interface LiabilityResult {
  score: number; // 0–100, higher = more of a liability
  factors: { name: string; weight: number }[];
  recommendation: 'Keep' | 'Monitor' | 'Release';
}

const POSITIVE_VALUE: Record<TraitTier, number> = {
  Common: 6,
  Notable: 10,
  Exceptional: 16,
  Signature: 24,
  Flaw: 0,
};

/**
 * Liability = flaw burden minus the warrior's value (good traits, record, fame).
 * The churn signal: 2+ flaws reads as a cut candidate unless real value offsets it.
 *
 * ⚡ Bolt Optimization: Uses a single for-loop for trait evaluation instead of
 * chained array methods (.map, .filter, .reduce) to prevent allocating multiple
 * temporary arrays and reduce GC pressure during AI roster simulation.
 */
export function computeWarriorLiability(warrior: Warrior): LiabilityResult {
  const factors: { name: string; weight: number }[] = [];

  let flawCount = 0;
  let traitValue = 0;

  if (warrior.traits) {
    for (let i = 0; i < warrior.traits.length; i++) {
      const t = TRAITS[warrior.traits[i]!];
      if (!t) continue;

      if (t.tier === 'Flaw') {
        flawCount++;
      }
      if (t.sign === 'positive') {
        traitValue += POSITIVE_VALUE[t.tier];
      }
    }
  }

  const flawBurden = flawCount * 34;
  if (flawCount > 0) {
    factors.push({
      name: `${flawCount} flaw${flawCount > 1 ? 's' : ''}`,
      weight: flawBurden,
    });
  }

  if (traitValue > 0) {
    factors.push({ name: 'positive traits', weight: -traitValue });
  }

  const c = warrior.career ?? { wins: 0, losses: 0, kills: 0 };
  const fights = (c.wins ?? 0) + (c.losses ?? 0);
  const winRate = fights > 0 ? (c.wins ?? 0) / fights : 0.5;
  const recordValue = Math.round((winRate - 0.5) * 40); // ±20
  if (fights >= 5 && recordValue !== 0) factors.push({ name: 'win record', weight: -recordValue });

  const fameValue = Math.min(20, Math.round((warrior.fame ?? 0) / 5));
  if (fameValue) factors.push({ name: 'fame', weight: -fameValue });

  const ageBurden = (warrior.age ?? 24) >= 30 ? 8 : 0;
  if (ageBurden) factors.push({ name: 'age', weight: ageBurden });

  const raw = flawBurden + ageBurden - traitValue - recordValue - fameValue;
  const score = clamp(raw + 20, 0, 100); // baseline 20 so a clean warrior sits low-but-nonzero

  const recommendation: LiabilityResult['recommendation'] =
    flawCount >= 2 && score > 55 ? 'Release' : flawCount >= 1 || score > 55 ? 'Monitor' : 'Keep';

  return { score, factors, recommendation };
}
