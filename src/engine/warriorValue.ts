import type { Warrior } from '@/types/warrior.types';
import { TRAITS, type TraitTier, type TraitDef } from '@/engine/traits';

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
 */
export function computeWarriorLiability(warrior: Warrior): LiabilityResult {
  const traits = (warrior.traits ?? [])
    .map((id) => TRAITS[id])
    .filter((t): t is TraitDef => Boolean(t));
  const factors: { name: string; weight: number }[] = [];

  const flaws = traits.filter((t) => t.tier === 'Flaw');
  const flawBurden = flaws.length * 34;
  if (flaws.length)
    factors.push({
      name: `${flaws.length} flaw${flaws.length > 1 ? 's' : ''}`,
      weight: flawBurden,
    });

  const traitValue = traits
    .filter((t) => t.sign === 'positive')
    .reduce((s, t) => s + POSITIVE_VALUE[t.tier], 0);
  if (traitValue) factors.push({ name: 'positive traits', weight: -traitValue });

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
  const score = Math.max(0, Math.min(100, raw + 20)); // baseline 20 so a clean warrior sits low-but-nonzero

  const recommendation: LiabilityResult['recommendation'] =
    flaws.length >= 2 && score > 55
      ? 'Release'
      : flaws.length >= 1 || score > 55
        ? 'Monitor'
        : 'Keep';

  return { score, factors, recommendation };
}
