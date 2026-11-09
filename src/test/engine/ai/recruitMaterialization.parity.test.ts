/**
 * V26 parity — the pool-empty generated-recruit fallback must emit a
 * funnel-shaped recruit (PoolWarrior) so `signWarrior` materializes the
 * same field set as every other signing path. The hand-rolled Warrior
 * literal it returns today skips `favorites`, `potential`, `equipment`,
 * and `trainability` — meaning fallback recruits can never discover
 * favorites, never cap training, and never carry a fitted loadout.
 *
 * Live since Phase 2 — the generator routes through the funnel.
 */
import { describe, it, expect } from 'vitest';
import { generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { signWarrior } from '@/engine/recruitment/signWarrior';
import { checkDiscovery } from '@/engine/favorites';
import { checkWeaponRequirements } from '@/data/equipment';
import { makeRival } from '@/test/_fixtures/factories';
import { ATTRIBUTE_KEYS } from '@/types/shared.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment/types';

const rival = () => makeRival();
const recruit = () =>
  generateAIRecruit({ rival: rival(), week: 1, seed: 42 }) as unknown as PoolWarrior;

describe('generateAIRecruit — funnel-shaped output', () => {
  it('carries favorites — weapon, rhythm, tactic, and the discovered ledger', () => {
    const r = recruit();
    expect(r.favorites?.weaponId).toBeTruthy();
    expect(r.favorites?.rhythm).toBeDefined();
    expect(r.favorites?.tactic).toBeTruthy();
    expect(r.favorites?.discovered.weapon).toBe(false);
  });

  it('carries per-attribute potential ceilings', () => {
    const r = recruit();
    expect(r.potential).toBeDefined();
    for (const k of ATTRIBUTE_KEYS) {
      expect(r.potential[k]).toBeGreaterThanOrEqual(r.attributes[k]);
    }
  });

  it('signs through the funnel into a field-complete warrior', () => {
    const r = recruit();
    const signed = signWarrior({ recruit: r, roster: [], maxRoster: 5 });
    expect(signed.ok).toBe(true);
    if (!signed.ok) return;
    const w = signed.warrior;
    expect(w.favorites?.weaponId).toBe(r.favorites.weaponId);
    expect(w.potential).toBeDefined();
    expect(w.equipment?.weapon).toBeTruthy();
    expect(checkWeaponRequirements(w.equipment!.weapon, w.attributes).met).toBe(true);
    expect(w.trainability).toBeDefined();
    expect(w.handedness).toBe(r.handedness);
  });

  it('produces a warrior whose favorites can actually be discovered', () => {
    const r = recruit();
    const signed = signWarrior({ recruit: r, roster: [], maxRoster: 5 });
    if (!signed.ok) throw new Error('signing failed');
    const w = signed.warrior;
    const fav = w.favorites;
    expect(fav).toBeDefined();
    // A symmetry-context discovery roll that always succeeds must flip the
    // ledger — today it no-ops because favorites is undefined.
    const alwaysYes = {
      next: () => 0,
      uuid: () => 'u',
      pick: <T>(arr: T[]): T => arr[0] as T,
      roll: (min: number) => min,
      shuffle: <T>(arr: T[]) => arr,
      rollWeighted: <K extends string>(wts: Partial<Record<K, number>>): K =>
        Object.keys(wts)[0] as K,
      chance: () => true,
    };
    const res = checkDiscovery(w, alwaysYes, {
      weaponId: fav!.weaponId,
      oe: fav!.rhythm.oe,
      al: fav!.rhythm.al,
    });
    expect(res.weaponRevealed).toBe(true);
    expect(fav!.discovered.weapon).toBe(true);
  });
});
