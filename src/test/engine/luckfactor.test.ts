import { describe, it, expect } from 'vitest';
import { rollLuckfactor, applyLuckfactor, computeBaseSkills } from '@/engine/warrior/skillCalc';
import { SeededRNG } from '@/utils/random';
import { FightingStyle, type BaseSkills } from '@/types/shared.types';

const SKILLS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

describe('luckfactor', () => {
  it('rolls a delta in [-4, +4] for each of the 6 skills', () => {
    const rng = new SeededRNG(12345);
    for (let i = 0; i < 200; i++) {
      const luck = rollLuckfactor(rng);
      for (const s of SKILLS) {
        expect(luck[s]).toBeGreaterThanOrEqual(-4);
        expect(luck[s]).toBeLessThanOrEqual(4);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(rollLuckfactor(new SeededRNG(7))).toEqual(rollLuckfactor(new SeededRNG(7)));
  });

  it('produces variety (two seeds differ)', () => {
    const a = rollLuckfactor(new SeededRNG(1));
    const b = rollLuckfactor(new SeededRNG(2));
    expect(a).not.toEqual(b);
  });

  it('V23: pikers get NO widened range — knack parity across styles', () => {
    // User-locked adjudication: all styles share LUCKFACTOR_RANGE (±4).
    // Over 200 rolls, ±6 would produce |5|+|6| values ~constantly; ±4 never does.
    const rng = new SeededRNG(4242);
    for (let i = 0; i < 200; i++) {
      const luck = rollLuckfactor(rng, FightingStyle.ParryStrike);
      for (const s of SKILLS) {
        expect(luck[s]).toBeGreaterThanOrEqual(-4);
        expect(luck[s]).toBeLessThanOrEqual(4);
      }
    }
  });

  it('keeps every style on the shared canon ±4 range — PS included', () => {
    for (const style of Object.values(FightingStyle)) {
      const rng = new SeededRNG(777);
      for (let i = 0; i < 50; i++) {
        const luck = rollLuckfactor(rng, style);
        for (const s of SKILLS) {
          expect(luck[s], `${style}.${s} = ${luck[s]}`).toBeGreaterThanOrEqual(-4);
          expect(luck[s]).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('consumes the same six RNG draws regardless of style — stream stays aligned', () => {
    const rngPS = new SeededRNG(99);
    const rngLU = new SeededRNG(99);
    rollLuckfactor(rngPS, FightingStyle.ParryStrike);
    rollLuckfactor(rngLU, FightingStyle.LungingAttack);
    // If draw counts matched, the next value out of each stream is identical.
    expect(rngPS.next()).toBe(rngLU.next());
  });

  it('D1: WS positive luck lands only in ATT/PAR — Drake: "bonused only in Attack and Parry"', () => {
    const rng = new SeededRNG(31337);
    let sawPositivePool = false;
    let sawNegativeOffPool = false;
    for (let i = 0; i < 500; i++) {
      const luck = rollLuckfactor(rng, FightingStyle.WallOfSteel);
      for (const s of SKILLS) {
        if (s === 'ATT' || s === 'PAR') continue;
        expect(luck[s], `WS.${s} must never be positive (got ${luck[s]})`).toBeLessThanOrEqual(0);
        if (luck[s] < 0) sawNegativeOffPool = true;
      }
      if (luck.ATT > 0 || luck.PAR > 0) sawPositivePool = true;
    }
    // positives still reach the pool; hosed stays canon — negatives anywhere
    expect(sawPositivePool).toBe(true);
    expect(sawNegativeOffPool).toBe(true);
  });

  it('D1: styles without a positive pool keep unrestricted luck (V23 parity)', () => {
    // Only WS is canon-conditioned; every other style's positives may land
    // on any skill — the V23 knack-parity lock covers range, pools cover
    // nothing.
    const rng = new SeededRNG(2024);
    const offPoolPositives = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const luck = rollLuckfactor(rng, FightingStyle.LungingAttack);
      for (const s of SKILLS) if (luck[s] > 0) offPoolPositives.add(s);
    }
    expect(offPoolPositives.size).toBeGreaterThan(2); // far beyond {ATT,PAR}
  });

  it('D1: WS pool conditioning consumes the same six draws (stream alignment)', () => {
    const rngWS = new SeededRNG(555);
    const rngLU = new SeededRNG(555);
    rollLuckfactor(rngWS, FightingStyle.WallOfSteel);
    rollLuckfactor(rngLU, FightingStyle.LungingAttack);
    expect(rngWS.next()).toBe(rngLU.next());
  });

  it('applyLuckfactor adds deltas and floors each skill at 1', () => {
    const base: BaseSkills = { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 };
    expect(applyLuckfactor(base, { ATT: 3, DEF: -2 })).toMatchObject({ ATT: 13, DEF: 8 });
    // floor at 1 even with a large negative delta against a tiny base
    expect(applyLuckfactor({ ...base, RIP: 2 }, { RIP: -4 }).RIP).toBe(1);
  });

  it('applyLuckfactor with no luck returns skills unchanged (overview is luck-free)', () => {
    const base = computeBaseSkills(
      { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
      FightingStyle.StrikingAttack
    );
    expect(applyLuckfactor(base, undefined)).toBe(base);
  });
});
