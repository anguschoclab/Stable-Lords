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
