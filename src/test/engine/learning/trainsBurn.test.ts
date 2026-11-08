/**
 * V23 / D2 — trains-burn-skills economy (Arena 93 canon).
 *
 * Canon: every +1 attribute gain that crosses a skill breakpoint consumes
 * future learn capacity for the skills it grants. ST raises landing ≤14
 * and all CN raises are free — they cross no breakpoints (ST_ATT/ST_PAR
 * grant at 7, then not again until 15; CN has no skill tables).
 *
 * Implemented generically: burn = bp(table,new) − bp(table,old) per skill.
 */
import { describe, it, expect } from 'vitest';
import {
  breakpointBurns,
  applySkillBurns,
  effectiveLearnCap,
} from '@/engine/learning/skillBurn';
import { rollBoutLearns } from '@/engine/learning/learnRoll';
import { processAttributeTraining } from '@/engine/training/trainingGains/attributeTraining';
import { LEARN_PER_SKILL_CAP } from '@/constants/combat/combat/learn';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import type { BaseSkills } from '@/types/shared.types';

const sumBurns = (b: Partial<Record<keyof BaseSkills, number>>) =>
  Object.values(b).reduce((s, v) => s + (v ?? 0), 0);

describe('breakpointBurns — the generic bp-delta rule', () => {
  it('ST 14→15 burns ATT+PAR (both tables grant at 15)', () => {
    const burns = breakpointBurns('ST', 14, 15);
    expect(burns.ATT).toBe(1);
    expect(burns.PAR).toBe(1);
    expect(sumBurns(burns)).toBe(2);
  });

  it('ST raises landing ≤14 are free (canon: no breakpoints in 8–14)', () => {
    for (const [from, to] of [
      [7, 8],
      [9, 10],
      [13, 14],
    ] as const) {
      expect(sumBurns(breakpointBurns('ST', from, to))).toBe(0);
    }
  });

  it('CN gains are always free — CN feeds no skill tables', () => {
    for (const [from, to] of [
      [10, 11],
      [14, 15],
      [20, 21],
    ] as const) {
      expect(sumBurns(breakpointBurns('CN', from, to))).toBe(0);
    }
  });

  it('WT 10→11 burns the +4 INI spike and +2 ATT/DEF breakpoints', () => {
    const burns = breakpointBurns('WT', 10, 11);
    expect(burns.INI).toBe(4);
    expect(burns.ATT).toBe(2);
    expect(burns.DEF).toBe(2);
  });

  it('SZ gains burn nothing trainable-side except INI (SZ_INI_MOD is a mod, not a skill bp)', () => {
    const burns = breakpointBurns('SZ', 10, 11);
    expect(sumBurns(burns)).toBe(0);
  });
});

describe('applySkillBurns — ledger accumulation', () => {
  it('accumulates burns across multiple gains', () => {
    const w = makeComputedWarrior({ ST: 14 });
    const once = applySkillBurns(w, { ATT: 1, PAR: 1 });
    const twice = applySkillBurns(once, { ATT: 2 });
    expect(twice.burnedSkills?.ATT).toBe(3);
    expect(twice.burnedSkills?.PAR).toBe(1);
  });

  it('a no-burn gain returns the warrior unchanged', () => {
    const w = makeComputedWarrior({ ST: 9 });
    expect(applySkillBurns(w, {})).toBe(w);
  });
});

describe('effectiveLearnCap — burned capacity is gone', () => {
  it('burned slots decrement the per-skill cap', () => {
    const w = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      burnedSkills: { ATT: 3 },
    });
    expect(effectiveLearnCap(w, 'ATT')).toBe(LEARN_PER_SKILL_CAP - 3);
    expect(effectiveLearnCap(w, 'PAR')).toBe(LEARN_PER_SKILL_CAP);
  });

  it('a fully burned skill can never be learned — it drops out of the bout pool', () => {
    const w = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      learnedSkills: {},
      burnedSkills: { ATT: LEARN_PER_SKILL_CAP },
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 25, WL: 10, SP: 10, DF: 10 },
    });
    // Many bouts at WT 25 → every attempt succeeds; ATT must never appear.
    const result = rollBoutLearns(w, FightingStyle.StrikingAttack, new SeededRNG(1));
    expect(result.gained.ATT ?? 0).toBe(0);
    // Pool still offers something — the burn doesn't starve all learning.
    expect(Object.keys(result.gained).length).toBeGreaterThan(0);
  });
});

describe('uniform burn rule — every +1 gain crossing a breakpoint burns', () => {
  const state = { season: 1, trainers: [] } as unknown as GameState;

  it('a player stat train through a breakpoint records the burn', () => {
    const w = makeComputedWarrior({ ST: 14, WL: 21 });
    // rng 0 forces the gain roll to succeed.
    const out = processAttributeTraining(w, 'ST', state, [], new SeededRNG(1));
    // Force success regardless of gain chance: loop seeds until a gain.
    let gained = out;
    for (let seed = 2; gained.result.type !== 'gain' && seed < 200; seed++) {
      gained = processAttributeTraining(w, 'ST', state, [], new SeededRNG(seed));
    }
    expect(gained.result.type).toBe('gain');
    expect(gained.updatedWarrior?.attributes.ST).toBe(15);
    expect(gained.updatedWarrior?.burnedSkills?.ATT ?? 0).toBe(1);
    expect(gained.updatedWarrior?.burnedSkills?.PAR ?? 0).toBe(1);
  });

  it('a no-breakpoint ST train (9→10) records no burn', () => {
    const w = makeComputedWarrior({ ST: 9, WL: 21 });
    let gained = processAttributeTraining(w, 'ST', state, [], new SeededRNG(1));
    for (let seed = 2; gained.result.type !== 'gain' && seed < 200; seed++) {
      gained = processAttributeTraining(w, 'ST', state, [], new SeededRNG(seed));
    }
    expect(gained.result.type).toBe('gain');
    expect(gained.updatedWarrior?.attributes.ST).toBe(10);
    expect(gained.updatedWarrior?.burnedSkills).toBeUndefined();
  });
});
