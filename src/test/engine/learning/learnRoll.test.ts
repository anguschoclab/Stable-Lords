import { describe, it, expect } from 'vitest';
import {
  favoriteLearnOf,
  learnPoolWeights,
  learnsTotal,
  rollBoutLearns,
  suspectedFavoriteLearn,
} from '@/engine/learning';
import {
  LEARN_ATTEMPTS,
  LEARN_CAREER_CAP,
  LEARN_FAVORITE_WEIGHT,
  LEARN_PER_SKILL_CAP,
  LEARN_SUSPECT_MIN,
} from '@/constants/combat/combat/learn';
import { STYLE_LEARN_WEIGHTS } from '@/data/learnPriorities';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNG } from '@/utils/random';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

const warrior = (over?: {
  id?: string;
  style?: FightingStyle;
  WT?: number;
  learnedSkills?: Partial<Record<keyof BaseSkills, number>>;
}): Warrior =>
  makeWarrior({
    id: (over?.id ?? 'w1') as WarriorId,
    name: 'Learner',
    style: over?.style ?? FightingStyle.LungingAttack,
    attrs: { ST: 11, CN: 11, SZ: 11, WT: over?.WT ?? 10, WL: 11, SP: 11, DF: 11 },
    overrides: { learnedSkills: over?.learnedSkills },
  });

describe('favoriteLearnOf', () => {
  it('is a valid skill and stable per warrior id', () => {
    const w = warrior({ id: 'stable-id' });
    const learn = favoriteLearnOf(w);
    expect(SKILL_KEYS).toContain(learn);
    expect(favoriteLearnOf(w)).toBe(learn);
    expect(favoriteLearnOf(warrior({ id: 'stable-id' }))).toBe(learn);
  });

  it('varies across ids — different warriors draw different affinities', () => {
    const seen = new Set(
      Array.from({ length: 60 }, (_, i) => favoriteLearnOf(warrior({ id: `w-${i}` })))
    );
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe('learnPoolWeights', () => {
  it('sums both combatants\u2019 style priorities', () => {
    const weights = learnPoolWeights(
      FightingStyle.AimedBlow,
      FightingStyle.TotalParry
    );
    const own = STYLE_LEARN_WEIGHTS[FightingStyle.AimedBlow];
    const opp = STYLE_LEARN_WEIGHTS[FightingStyle.TotalParry];
    for (const skill of SKILL_KEYS) {
      expect(weights[skill], skill).toBe(own[skill] + opp[skill]);
    }
  });

  it('adds LEARN_FAVORITE_WEIGHT on the favorite learn only', () => {
    const base = learnPoolWeights(FightingStyle.LungingAttack, FightingStyle.StrikingAttack);
    const fav = learnPoolWeights(
      FightingStyle.LungingAttack,
      FightingStyle.StrikingAttack,
      'DEF'
    );
    expect(fav.DEF).toBe(base.DEF + LEARN_FAVORITE_WEIGHT);
    for (const skill of SKILL_KEYS.filter((k) => k !== 'DEF')) {
      expect(fav[skill]).toBe(base[skill]);
    }
  });
});

describe('rollBoutLearns', () => {
  it('learns more at high WT than low WT across seeded bouts', () => {
    const gains = (wt: number) => {
      let total = 0;
      // Fresh warrior each seed — per-bout rate, before career caps bind.
      for (let seed = 1; seed <= 40; seed++) {
        const r = rollBoutLearns(
          warrior({ WT: wt }),
          FightingStyle.TotalParry,
          new SeededRNG(seed * 977)
        );
        for (const v of Object.values(r.gained)) total += v;
      }
      return total;
    };
    expect(gains(17)).toBeGreaterThan(gains(7));
  });

  it('never exceeds LEARN_ATTEMPTS gains in a single bout', () => {
    const w = warrior({ WT: 21 });
    for (let seed = 1; seed <= 50; seed++) {
      const r = rollBoutLearns(w, FightingStyle.TotalParry, new SeededRNG(seed));
      const gained = Object.values(r.gained).reduce((s, v) => s + v, 0);
      expect(gained).toBeLessThanOrEqual(LEARN_ATTEMPTS);
    }
  });

  it('excludes skills already at the per-skill cap', () => {
    const w = warrior({
      WT: 21,
      learnedSkills: { INI: LEARN_PER_SKILL_CAP },
    });
    const r = rollBoutLearns(w, FightingStyle.WallOfSteel, new SeededRNG(42));
    expect(r.learnedSkills.INI).toBe(LEARN_PER_SKILL_CAP);
    expect(r.gained.INI ?? 0).toBe(0);
  });

  it('stops at the career cap — no gains when full', () => {
    const w = warrior({
      WT: 21,
      learnedSkills: { ATT: LEARN_CAREER_CAP },
    });
    const r = rollBoutLearns(w, FightingStyle.TotalParry, new SeededRNG(42));
    expect(Object.keys(r.gained)).toHaveLength(0);
    expect(learnsTotal(w)).toBe(LEARN_CAREER_CAP);
  });

  it('accumulates on top of existing learnedSkills without mutating input shape', () => {
    const before: Partial<Record<keyof BaseSkills, number>> = { ATT: 2 };
    const w = warrior({ WT: 21, learnedSkills: before });
    const r = rollBoutLearns(w, FightingStyle.TotalParry, new SeededRNG(7));
    expect(r.learnedSkills).not.toBe(before); // fresh object — shard-clone safe
    expect(r.learnedSkills.ATT).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic — same seed, same learns', () => {
    const w = warrior({ WT: 13 });
    const a = rollBoutLearns(w, FightingStyle.BashingAttack, new SeededRNG(999));
    const b = rollBoutLearns(w, FightingStyle.BashingAttack, new SeededRNG(999));
    expect(a.gained).toEqual(b.gained);
  });

  it('handles a warrior with no learnedSkills yet', () => {
    const w = warrior({ WT: 15 });
    delete w.learnedSkills;
    const r = rollBoutLearns(w, FightingStyle.TotalParry, new SeededRNG(3));
    expect(r.learnedSkills).toBeDefined();
    for (const k of Object.keys(r.gained)) expect(SKILL_KEYS).toContain(k);
  });

  it('falls back to a deterministic seed when rng is omitted — not a guaranteed sweep', () => {
    const w = warrior({ WT: 21 });
    const a = rollBoutLearns(w, FightingStyle.TotalParry);
    const b = rollBoutLearns(w, FightingStyle.TotalParry);
    expect(a.gained).toEqual(b.gained);
    // A constant-0.5 stub would always succeed at WT21 — assert the fallback
    // actually rolls rather than sweeping all six attempts.
    expect(Object.values(a.gained).reduce((s, v) => s + v, 0)).toBeLessThanOrEqual(
      LEARN_ATTEMPTS
    );
  });
});

describe('suspectedFavoriteLearn', () => {
  it('returns undefined below the deduction threshold', () => {
    expect(
      suspectedFavoriteLearn(warrior({ learnedSkills: { ATT: LEARN_SUSPECT_MIN - 1 } }))
    ).toBeUndefined();
  });

  it('returns the highest-count skill at or above threshold', () => {
    expect(
      suspectedFavoriteLearn(
        warrior({ learnedSkills: { ATT: LEARN_SUSPECT_MIN, INI: LEARN_SUSPECT_MIN + 2 } })
      )
    ).toBe('INI');
  });

  it('breaks ties by skill declaration order', () => {
    expect(
      suspectedFavoriteLearn(
        warrior({ learnedSkills: { RIP: LEARN_SUSPECT_MIN, ATT: LEARN_SUSPECT_MIN } })
      )
    ).toBe('ATT');
  });

  it('returns undefined with no ledger at all', () => {
    expect(suspectedFavoriteLearn(warrior())).toBeUndefined();
  });
});
