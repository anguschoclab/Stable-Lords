import { describe, it, expect, vi } from 'vitest';
import {
  computeReachScore,
  getWeaponPreferredRange,
  getWeaponRangeMod,
  contestDistance,
  getZonePenalty,
  transitionZone,
  resetZone,
  clampRangeToMax,
  ARENA_SIZE_PROFILES,
  WEAPON_PREFERRED_RANGE,
  WEAPON_RANGE_MODIFIERS,
} from '@/engine/combat/mechanics/distanceResolution';
import { WEAPON_DAMAGE_TYPE } from '@/engine/combat/mechanics/combatDamage';
import { WEAPONS, SHIELD_ITEM_IDS } from '@/data/equipment/weapons';
import { STYLE_CLASSIC_WEAPONS } from '@/data/equipment/equipment.utils';

describe('computeReachScore', () => {
  it('returns INI + 0 when OE=5, no motivation, no debt', () => {
    expect(computeReachScore(10, 5, 0, 0)).toBe(10);
  });
  it('adds (OE-5)*2 for OE above 5', () => {
    expect(computeReachScore(10, 7, 0, 0)).toBe(14);
  });
  it('subtracts (5-OE)*2 for OE below 5', () => {
    expect(computeReachScore(10, 3, 0, 0)).toBe(6);
  });
  it('adds motivation bonus', () => {
    expect(computeReachScore(10, 5, 2, 0)).toBe(12);
  });
  it('subtracts recoveryDebt*2', () => {
    expect(computeReachScore(10, 5, 0, 2)).toBe(6);
  });
});

describe('getWeaponPreferredRange', () => {
  // Updated 2026-04: weapon ids must match those in src/data/equipment.ts.
  // Prior tests used `open_hand` and `pike` which were never real weapon ids,
  // (Fixed: pike -> short_spear to use a valid weapon id)
  // exposing the underlying weapon-id-mismatch bug that silently disabled the
  // entire range/weapon system.
  it('returns Tight for short_sword', () => {
    expect(getWeaponPreferredRange('short_sword')).toBe('Tight');
  });
  it('returns Extended for halberd', () => {
    expect(getWeaponPreferredRange('halberd')).toBe('Extended');
  });
  it('returns Striking as default for unknown weapon', () => {
    expect(getWeaponPreferredRange('unknown_weapon')).toBe('Striking');
  });
  it('returns Striking as default when weaponId is undefined', () => {
    expect(getWeaponPreferredRange(undefined)).toBe('Striking');
  });
});

describe('contestDistance', () => {
  it('winner gets +1 rangeMod, loser gets -1', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    expect(result.rangeModA).toBe(1);
    expect(result.rangeModD).toBe(-1);
    expect(result.distanceWinner).toBe('A');
  });

  it("produces newRange = one step toward winner's preferred range", () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5, rangePreference: 'Extended' },
      recoveryDebt: 0,
      weaponId: 'short_spear',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    // Striking → Extended (one step toward Extended)
    expect(result.newRange).toBe('Extended');
  });

  it('keeps current range when scores are equal (pure tie)', () => {
    // Equal INI, equal OE, equal recoveryDebt — reach scores are identical
    // contestCheck will break the tie with rng, but we test no RANGE_SHIFT event when range stays same
    const rng = vi.fn().mockReturnValue(0.5);
    const fA = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    // Both prefer Striking, so newRange stays Striking regardless of who wins
    expect(result.newRange).toBe('Striking');
  });
});

describe('getZonePenalty', () => {
  it('returns 0 for Center', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Center', config)).toBe(0);
  });
  it('returns -2 for Edge in standard config', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Edge', config)).toBe(-2);
  });
  it('returns -4 for Corner in standard config', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Corner', config)).toBe(-4);
  });
  it('returns 0 when zone not in config', () => {
    const config = { zoneDef: {} } as any;
    expect(getZonePenalty('Edge', config)).toBe(0);
  });
});

describe('transitionZone', () => {
  it('Center → Edge when pushed', () => {
    expect(transitionZone('Center')).toBe('Edge');
  });
  it('Edge → Corner when pushed again', () => {
    expect(transitionZone('Edge')).toBe('Corner');
  });
  it('Corner stays Corner', () => {
    expect(transitionZone('Corner')).toBe('Corner');
  });
  it('Obstacle stays Obstacle', () => {
    expect(transitionZone('Obstacle')).toBe('Obstacle');
  });
});

describe('resetZone', () => {
  it('Corner → Edge on reset', () => {
    expect(resetZone('Corner')).toBe('Edge');
  });
  it('Edge → Center on reset', () => {
    expect(resetZone('Edge')).toBe('Center');
  });
  it('Center stays Center on reset', () => {
    expect(resetZone('Center')).toBe('Center');
  });
});

// ─── Regression: Weapon ID lookups must reference canonical WEAPONS ─────────

const WEAPON_IDS = new Set(WEAPONS.map((w) => w.id));

describe('WEAPON_PREFERRED_RANGE keys', () => {
  it('every key exists in canonical WEAPONS', () => {
    for (const id of Object.keys(WEAPON_PREFERRED_RANGE)) {
      expect(WEAPON_IDS.has(id)).toBe(true);
    }
  });
});

describe('WEAPON_RANGE_MODIFIERS keys', () => {
  it('every key exists in canonical WEAPONS', () => {
    for (const id of Object.keys(WEAPON_RANGE_MODIFIERS)) {
      expect(WEAPON_IDS.has(id)).toBe(true);
    }
  });
});

describe('WEAPON_DAMAGE_TYPE keys', () => {
  it('every key exists in canonical WEAPONS', () => {
    for (const id of Object.keys(WEAPON_DAMAGE_TYPE)) {
      expect(WEAPON_IDS.has(id)).toBe(true);
    }
  });
});

describe('STYLE_CLASSIC_WEAPONS values', () => {
  it('every value exists in canonical WEAPONS', () => {
    for (const id of Object.values(STYLE_CLASSIC_WEAPONS)) {
      expect(WEAPON_IDS.has(id)).toBe(true);
    }
  });
});

describe('SHIELD_ITEM_IDS', () => {
  it('every shield id exists in canonical WEAPONS', () => {
    for (const id of SHIELD_ITEM_IDS) {
      expect(WEAPON_IDS.has(id)).toBe(true);
    }
  });
});

// ─── getWeaponRangeMod (previously untested) ──────────────────────────────────

describe('getWeaponRangeMod', () => {
  it('returns positive modifier for weapon at its preferred range', () => {
    expect(getWeaponRangeMod('dagger', 'Tight')).toBe(4);
  });

  it('returns negative modifier for weapon at disadvantaged range', () => {
    expect(getWeaponRangeMod('dagger', 'Extended')).toBe(-5);
  });

  it('returns 0 for unknown weaponId', () => {
    expect(getWeaponRangeMod('unknown_weapon', 'Striking')).toBe(0);
  });

  it('returns 0 for undefined weaponId', () => {
    expect(getWeaponRangeMod(undefined, 'Striking')).toBe(0);
  });

  it('returns 0 for range not in weapon modifier map', () => {
    // broadsword has no Grapple entry in some configs; test a weapon/range combo
    // that has no explicit modifier — broadsword at Striking = 0
    expect(getWeaponRangeMod('broadsword', 'Striking')).toBe(0);
  });

  it('returns 0 for weapon not in WEAPON_RANGE_MODIFIERS', () => {
    // 'small_shield' is a valid equipment id but not in WEAPON_RANGE_MODIFIERS
    expect(getWeaponRangeMod('small_shield', 'Striking')).toBe(0);
  });
});

// ─── clampRangeToMax (previously untested) ───────────────────────────────────

describe('clampRangeToMax', () => {
  it('returns range unchanged when within max', () => {
    expect(clampRangeToMax('Tight', 'Extended')).toBe('Tight');
  });

  it('returns max when range exceeds max', () => {
    expect(clampRangeToMax('Extended', 'Striking')).toBe('Striking');
  });

  it('returns range when range equals max', () => {
    expect(clampRangeToMax('Striking', 'Striking')).toBe('Striking');
  });
});

// ─── ARENA_SIZE_PROFILES (previously untested) ───────────────────────────────

describe('ARENA_SIZE_PROFILES', () => {
  it('cramped: startRange=Tight, maxRange=Striking, zoneStepBias=1', () => {
    expect(ARENA_SIZE_PROFILES.cramped).toEqual({
      startRange: 'Tight',
      maxRange: 'Striking',
      zoneStepBias: 1,
    });
  });

  it('standard: startRange=Striking, maxRange=Extended, zoneStepBias=0', () => {
    expect(ARENA_SIZE_PROFILES.standard).toEqual({
      startRange: 'Striking',
      maxRange: 'Extended',
      zoneStepBias: 0,
    });
  });

  it('open: startRange=Striking, maxRange=Extended, zoneStepBias=0', () => {
    expect(ARENA_SIZE_PROFILES.open).toEqual({
      startRange: 'Striking',
      maxRange: 'Extended',
      zoneStepBias: 0,
    });
  });
});

// ─── contestDistance edge cases ──────────────────────────────────────────────

describe('contestDistance edge cases', () => {
  it('D wins the contest when D has higher reach', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 15 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    expect(result.distanceWinner).toBe('D');
    expect(result.rangeModA).toBe(-1);
    expect(result.rangeModD).toBe(1);
  });

  it('cramped arena caps range at Striking', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5, rangePreference: 'Extended' },
      recoveryDebt: 0,
      weaponId: 'long_spear',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking', ARENA_SIZE_PROFILES.cramped);
    // A wins and prefers Extended, but cramped caps at Striking
    expect(result.newRange).toBe('Striking');
  });

  it('rangePreference override takes priority over weaponId', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5, rangePreference: 'Tight' },
      recoveryDebt: 0,
      weaponId: 'halberd', // halberd prefers Extended, but rangePreference says Tight
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    // A wins, prefers Tight → shift from Striking toward Tight
    expect(result.newRange).toBe('Tight');
  });

  it('emits RANGE_SHIFT event when range changes', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5, rangePreference: 'Extended' },
      recoveryDebt: 0,
      weaponId: 'short_spear',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.type).toBe('RANGE_SHIFT');
    expect(result.events[0]!.result).toBe('Extended');
  });

  it('does not emit RANGE_SHIFT event when range stays same', () => {
    const rng = vi.fn().mockReturnValue(0.5);
    const fA = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    expect(result.events).toHaveLength(0);
  });

  it('halves motivation when preferred range is beyond arena cap', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Extended' },
      recoveryDebt: 0,
      weaponId: 'long_spear',
    } as any;
    const fD = {
      skills: { INI: 10 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    // In cramped arena, Extended is beyond cap (Striking)
    // A's motivation should be halved: rawMotA = 2 (pref != current), halved to 1
    // D's motivation: D prefers Striking (broadsword), current is Striking, so motD = 0
    // reachA = 10 + 0 + 1 - 0 = 11, reachD = 10 + 0 + 0 - 0 = 10
    // A should still win with higher reach
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking', ARENA_SIZE_PROFILES.cramped);
    expect(result.distanceWinner).toBe('A');
  });
});
