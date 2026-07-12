/**
 * Unit tests for extracted stableReputation helpers: getTopFameWarriors, computeFameScore.
 */
import { describe, it, expect } from 'vitest';
import { getTopFameWarriors, computeFameScore } from '@/engine/stableReputation';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import { computeWarriorStats } from '@/engine/skillCalc';

function makeWarrior(id: string, fame: number): Warrior {
  const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id: id as any,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
  } as any as Warrior;
}

// ─── getTopFameWarriors ───────────────────────────────────────────────────

describe('getTopFameWarriors', () => {
  it('returns empty array for empty input', () => {
    expect(getTopFameWarriors([])).toEqual([]);
  });

  it('returns all warriors sorted desc by fame when < 5', () => {
    const warriors = [makeWarrior('a', 10), makeWarrior('b', 30), makeWarrior('c', 20)];
    const result = getTopFameWarriors(warriors);

    expect(result).toHaveLength(3);
    expect(result[0]!.fame).toBe(30);
    expect(result[1]!.fame).toBe(20);
    expect(result[2]!.fame).toBe(10);
  });

  it('returns exactly 5 when more than 5 warriors', () => {
    const warriors = Array.from({ length: 10 }, (_, i) => makeWarrior(`w${i}`, i * 5));
    const result = getTopFameWarriors(warriors);

    expect(result).toHaveLength(5);
    // Top 5 should be w9(45), w8(40), w7(35), w6(30), w5(25)
    expect(result[0]!.fame).toBe(45);
    expect(result[4]!.fame).toBe(25);
  });

  it('returns all 5 when exactly 5 warriors', () => {
    const warriors = Array.from({ length: 5 }, (_, i) => makeWarrior(`w${i}`, i * 10));
    const result = getTopFameWarriors(warriors);

    expect(result).toHaveLength(5);
    expect(result[0]!.fame).toBe(40);
    expect(result[4]!.fame).toBe(0);
  });

  it('respects custom count parameter', () => {
    const warriors = Array.from({ length: 10 }, (_, i) => makeWarrior(`w${i}`, i * 5));
    const result = getTopFameWarriors(warriors, 3);

    expect(result).toHaveLength(3);
    expect(result[0]!.fame).toBe(45);
  });
});

// ─── computeFameScore ─────────────────────────────────────────────────────

describe('computeFameScore', () => {
  it('returns 0 for empty warriors, 0 mentions, 0 stateFame', () => {
    expect(computeFameScore([], 0, 0)).toBe(0);
  });

  it('matches existing test: avg 20 + 2 mentions + 5 stateFame = 46', () => {
    const warriors = [makeWarrior('a', 10), makeWarrior('b', 20), makeWarrior('c', 30)];
    // avgFame = 20, fameRaw = 20 * 2.0 + 2 * 1.0 + 5 * 0.85 = 40 + 2 + 4.25 = 46.25 -> 46
    expect(computeFameScore(warriors, 2, 5)).toBe(46);
  });

  it('caps at 100', () => {
    const warriors = [makeWarrior('a', 100)];
    // avgFame = 100, fameRaw = 100 * 2.0 + 0 + 0 = 200 -> capped to 100
    expect(computeFameScore(warriors, 0, 0)).toBe(100);
  });

  it('handles single warrior', () => {
    const warriors = [makeWarrior('a', 15)];
    // avgFame = 15, fameRaw = 15 * 2.0 + 0 + 0 = 30
    expect(computeFameScore(warriors, 0, 0)).toBe(30);
  });
});
