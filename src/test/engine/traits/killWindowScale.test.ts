/**
 * killWindowBonus scale invariant — the trait effect feeds
 * `calculateKillWindow`'s `specialtyBonus`, which is added to a probability
 * clamped to [0, 0.04]. A value >= 0.05 permanently saturates the cap, so
 * every trait-level killWindowBonus must live on the probability scale
 * (F-trait1: orphan_vengeance's `1` is 200x too large).
 */
import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';
import { calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';

describe('killWindowBonus scale', () => {
  it('every trait killWindowBonus stays below the kill-threshold cap scale', () => {
    const offenders = Object.values(TRAITS).filter(
      (t) => (t.effect?.killWindowBonus ?? 0) >= 0.05
    );
    expect(offenders.map((t) => t.id)).toEqual([]);
  });

  it('no single trait can saturate the kill window on its own', () => {
    for (const t of Object.values(TRAITS)) {
      const bonus = t.effect?.killWindowBonus ?? 0;
      if (bonus === 0) continue;
      // Same shape as the hit-execution call: a trait-only specialty bonus
      // must not, by itself, reach the 0.04 cap. A limb location keeps the
      // base window small so the bonus term is what decides saturation.
      const threshold = calculateKillWindow(
        0.45, // defender hurt but not near-death
        0.55, // winded
        'right arm',
        8, // killDesire
        2, // LATE
        8, // attOE
        8, // attAL
        0, // matchup
        12, // decSkill
        0, // momentum
        bonus,
        0
      );
      expect(threshold, `${t.id} killWindowBonus=${bonus} saturates cap`).toBeLessThan(0.04);
    }
  });
});
