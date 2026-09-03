import { describe, it, expect } from 'vitest';
import { runRecruitmentPass } from '@/engine/pipeline/passes/RecruitmentPass';
import { SeededRNGService } from '@/utils/random';
import type { GameState } from '@/types/state.types';

describe('RecruitmentPass — year rollover boundary', () => {
  it('should grant post-death recruitment bonus when deathWeek matches absoluteWeek at year boundary', () => {
    const baseState = {
      week: 1,
      year: 2,
      absoluteWeek: 53,
      roster: [],
      rivals: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      weather: 'Clear',
      season: 'Spring',
    } as any as GameState;

    const rngWithoutDeath = new SeededRNGService(42);
    const resultWithoutDeath = runRecruitmentPass(baseState, rngWithoutDeath);
    const poolWithoutDeath = resultWithoutDeath.recruitPool || [];

    const stateWithDeath = {
      ...baseState,
      graveyard: [
        {
          id: 'dead-warrior' as any,
          name: 'Dead Warrior',
          deathWeek: 53,
          fame: 0,
          status: 'Dead',
        } as any,
      ],
    } as any as GameState;

    const rngWithDeath = new SeededRNGService(42);
    const resultWithDeath = runRecruitmentPass(stateWithDeath, rngWithDeath);
    const poolWithDeath = resultWithDeath.recruitPool || [];

    expect(poolWithDeath.length).toBeGreaterThan(poolWithoutDeath.length);
  });
});

describe('RecruitmentPass — usedNames excludes rival roster names', () => {
  it('should not generate recruits whose name matches a rival roster warrior name', () => {
    const rivalWarriorName = 'UniqueRivalName';
    const baseState = {
      week: 1,
      year: 1,
      absoluteWeek: 1,
      roster: [],
      rivals: [
        {
          id: 'rival-1' as any,
          owner: { id: 'o1' as any, name: 'Owner', stableName: 'Stable', fame: 0, renown: 0, titles: 0, personality: 'Pragmatic' },
          roster: [
            {
              id: 'rw1' as any,
              name: rivalWarriorName,
              style: 'StrikingAttack' as any,
              attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
              fame: 0,
              status: 'Active',
            } as any,
          ],
          treasury: 1000,
          fame: 0,
          ledger: [],
          trainingAssignments: [],
        } as any,
      ],
      graveyard: [],
      retired: [],
      recruitPool: [],
      weather: 'Clear',
      season: 'Spring',
    } as any as GameState;

    const rng = new SeededRNGService(99);
    const result = runRecruitmentPass(baseState, rng);
    const pool = result.recruitPool || [];

    // No recruit in the pool should share the rival warrior's name
    for (const recruit of pool) {
      expect(recruit.name).not.toBe(rivalWarriorName);
    }
  });

  it('should not generate recruits whose name matches a player roster warrior name', () => {
    const playerWarriorName = 'UniquePlayerName';
    const baseState = {
      week: 1,
      year: 1,
      absoluteWeek: 1,
      roster: [
        {
          id: 'pw1' as any,
          name: playerWarriorName,
          style: 'StrikingAttack' as any,
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          fame: 0,
          status: 'Active',
        } as any,
      ],
      rivals: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      weather: 'Clear',
      season: 'Spring',
    } as any as GameState;

    const rng = new SeededRNGService(99);
    const result = runRecruitmentPass(baseState, rng);
    const pool = result.recruitPool || [];

    for (const recruit of pool) {
      expect(recruit.name).not.toBe(playerWarriorName);
    }
  });
});
