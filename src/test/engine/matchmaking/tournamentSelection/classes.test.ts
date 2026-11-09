import { describe, it, expect } from 'vitest';
import {
  TOURNAMENT_CLASSES,
  TOURNAMENT_FREEZE_OFFSET,
  CLASS_INVITE_COUNT,
  STABLE_CLASS_ENTRY_CAP,
  classForFE,
  isTournamentFreezeWeek,
} from '@/engine/matchmaking/tournamentSelection/classes';

describe('classForFE — Duel2 breakpoints verbatim', () => {
  const cases: [number, string][] = [
    [0, 'rookies'],
    [1, 'apprentices'],
    [4, 'apprentices'],
    [5, 'initiates'],
    [10, 'initiates'],
    [11, 'adepts'],
    [20, 'adepts'],
    [21, 'champions'],
    [45, 'champions'],
  ];
  for (const [fe, expected] of cases) {
    it(`${fe} FE → ${expected}`, () => {
      expect(classForFE(fe)).toBe(expected);
    });
  }
});

describe('TOURNAMENT_CLASSES table', () => {
  it('has exactly 5 contiguous, ordered bands covering 0..∞', () => {
    expect(TOURNAMENT_CLASSES).toHaveLength(5);
    let prevMax = -1;
    for (const spec of TOURNAMENT_CLASSES) {
      expect(spec.minFE).toBe(prevMax + 1);
      expect(spec.maxFE).toBeGreaterThanOrEqual(spec.minFE);
      prevMax = spec.maxFE;
    }
    expect(prevMax).toBe(Number.POSITIVE_INFINITY);
  });
  it('field caps follow the canon pyramid (rookies widest, champions narrowest)', () => {
    const caps = TOURNAMENT_CLASSES.map((c) => c.fieldCap);
    for (let i = 1; i < caps.length; i++) {
      expect(caps[i]).toBeLessThanOrEqual(caps[i - 1]!);
    }
  });
  it('constants pin the agreed entry model', () => {
    expect(TOURNAMENT_FREEZE_OFFSET).toBe(2);
    expect(CLASS_INVITE_COUNT).toBe(16);
    expect(STABLE_CLASS_ENTRY_CAP).toBe(4);
  });
});

describe('isTournamentFreezeWeek — T−2 before each seasonal', () => {
  it('fires on weeks 8/18/28/40', () => {
    for (const w of [8, 18, 28, 40]) expect(isTournamentFreezeWeek(w)).toBe(true);
  });
  it('does not fire inside the tournament or post-freeze weeks', () => {
    for (const w of [9, 10, 11, 19, 20, 21, 29, 30, 41, 42]) {
      expect(isTournamentFreezeWeek(w)).toBe(false);
    }
  });
});
