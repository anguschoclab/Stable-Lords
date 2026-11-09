/**
 * V26 — favorite-tactic joins the shared discovery channel. The hidden
 * `favorites.tactic` exists for everyone, but `discovered.tactic` and
 * `tacticHints` don't — nothing can ever reveal it. The discovery spec:
 *
 *  - `generateFavorites` emits `discovered.tactic: false` + `tacticHints: 0`
 *  - `checkDiscovery` gains a tactic section: fought plan ran the hidden
 *    favorite → 25% symmetry epiphany, otherwise 2% base, hints cap at 2
 *    (same constants as weapon/rhythm — one shared discovery system)
 *  - the tactic roll draws on a dedicated `hashStr(w.id|week)` sub-stream
 *    so the shared bout stream stays untouched (determinism discipline)
 *
 * Live since Phase 4 — `discovered.tactic` + the tactic roll section.
 */
import { describe, it, expect } from 'vitest';
import { checkDiscovery } from '@/engine/favorites';
import { generateFavorites } from '@/engine/favorites/favorites';
import { makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WarriorFavorites } from '@/types/warrior.types';

const flatRng = (v: number): IRNGService => ({
  next: () => v,
  uuid: () => 'u',
  pick: <T>(arr: T[]): T => arr[0] as T,
  roll: (min: number) => min,
  shuffle: <T>(arr: T[]) => arr,
  rollWeighted: <K extends string>(wts: Partial<Record<K, number>>): K =>
    Object.keys(wts)[0] as K,
  chance: () => v < 1,
});

const countingRng = (v: number): { rng: IRNGService; count: () => number } => {
  let n = 0;
  return {
    rng: {
      ...flatRng(v),
      next: () => {
        n++;
        return v;
      },
    },
    count: () => n,
  };
};

const favWith = (over: Partial<WarriorFavorites> = {}): WarriorFavorites => ({
  weaponId: 'shortsword',
  rhythm: { oe: 5, al: 5 },
  tactic: 'Lunge',
  discovered: {
    weapon: true,
    rhythm: true,
    weaponHints: 0,
    rhythmHints: 0,
    learn: true,
    tactic: false,
    tacticHints: 0,
  } as WarriorFavorites['discovered'],
  ...over,
});

const warrior = () => makeWarrior({ favorites: favWith() });

describe('generateFavorites — tactic discovery ledger', () => {
  it('initializes tactic + tacticHints on the discovered ledger', () => {
    const fav = generateFavorites(FightingStyle.StrikingAttack, flatRng(0.5));
    const disc = fav.discovered as Record<string, unknown>;
    expect(disc.tactic).toBe(false);
    expect(disc.tacticHints).toBe(0);
  });
});

describe('checkDiscovery — tactic section', () => {
  it('reports tacticRevealed when the fought plan ran the hidden favorite', () => {
    const w = warrior();
    let revealedWeek = -1;
    for (let week = 1; week <= 60 && revealedWeek < 0; week++) {
      const res = checkDiscovery(w, flatRng(0.5), {
        week,
        offensiveTactic: 'Lunge',
      } as never);
      if ((res as unknown as Record<string, unknown>).tacticRevealed) revealedWeek = week;
    }
    // 25%/week → a reveal within 60 weeks is a near-certainty; the seeded
    // sub-stream makes the concrete week deterministic.
    expect(revealedWeek).toBeGreaterThan(0);
    expect(
      (w.favorites!.discovered as Record<string, unknown>).tactic
    ).toBe(true);
  });

  it('reveals earlier under symmetry (fought favorite) than base rate', () => {
    const revealWeek = (offensiveTactic?: string) => {
      const w = warrior();
      for (let week = 1; week <= 200; week++) {
        const res = checkDiscovery(w, flatRng(0.5), {
          week,
          offensiveTactic,
        } as never);
        if ((res as unknown as Record<string, unknown>).tacticRevealed) return week;
      }
      return Infinity;
    };
    const symmetry = revealWeek('Lunge');
    const base = revealWeek('Dodge');
    // Same per-week sub-stream rolls, different thresholds — symmetry must
    // reveal no later than base (any roll < 2% is also < 25%).
    expect(symmetry).toBeLessThanOrEqual(base);
    expect(symmetry).toBeLessThan(Infinity);
  });

  it('accrues hints and caps them at 2 like the other channels', () => {
    const w = warrior();
    for (let week = 1; week <= 80; week++) {
      checkDiscovery(w, flatRng(0.5), { week, offensiveTactic: 'Dodge' } as never);
      const hints = (w.favorites!.discovered as Record<string, unknown>).tacticHints;
      expect((hints as number) ?? 0).toBeLessThanOrEqual(2);
      if ((w.favorites!.discovered as Record<string, unknown>).tactic) break;
    }
    const d = w.favorites!.discovered as Record<string, unknown>;
    // 80 weeks at 10%/week hint chance: either the reveal fired or the
    // ledger picked up at least one hint (deterministic on the seed).
    expect(d.tactic === true || ((d.tacticHints as number) ?? 0) >= 1).toBe(true);
  });

  it('draws on a dedicated sub-stream — the shared bout stream is untouched', () => {
    const wA = warrior();
    const wB = warrior();
    const { rng: rngA, count: countA } = countingRng(0.5);
    const { rng: rngB, count: countB } = countingRng(0.5);
    checkDiscovery(wA, rngA, { week: 5, offensiveTactic: 'Lunge' } as never);
    checkDiscovery(wB, rngB, { week: 5 } as never); // no tactic context
    expect(countA()).toBe(countB());
  });
});
