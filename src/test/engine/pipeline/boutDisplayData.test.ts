import { describe, it, expect } from 'vitest';
import { runBoutSimulationPass } from '@/engine/pipeline/passes/BoutSimulationPass';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import type { GameState, BoutOffer, Promoter } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';

function makeBoutState(): GameState {
  const rng = new SeededRNGService(1);

  const warriorA = makeWarrior(
    'warrior-a' as import('@/types/shared.types').WarriorId,
    'Fighter A',
    FightingStyle.StrikingAttack,
    { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    { fame: 10 },
    rng
  );

  const warriorD = makeWarrior(
    'warrior-d' as import('@/types/shared.types').WarriorId,
    'Fighter D',
    FightingStyle.BashingAttack,
    { ST: 12, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 8, DF: 10 },
    { fame: 5 },
    rng
  );

  const promoter: Promoter = {
    id: 'promoter-1' as import('@/types/shared.types').PromoterId,
    name: 'Test Promoter',
    age: 40,
    personality: 'Honorable',
    tier: 'Local',
    capacity: 5,
    biases: [],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
  };

  const offer: BoutOffer = {
    id: 'offer-1' as import('@/types/shared.types').BoutOfferId,
    promoterId: 'promoter-1' as import('@/types/shared.types').PromoterId,
    warriorIds: [
      'warrior-a' as import('@/types/shared.types').WarriorId,
      'warrior-d' as import('@/types/shared.types').WarriorId,
    ],
    boutWeek: 1,
    expirationWeek: 2,
    purse: 500,
    hype: 100,
    status: 'Signed',
    responses: {
      ['warrior-a' as import('@/types/shared.types').WarriorId]: 'Accepted',
      ['warrior-d' as import('@/types/shared.types').WarriorId]: 'Accepted',
    },
  };

  return {
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    week: 1,
      absoluteWeek: 1,
    year: 1,
    treasury: 1000,
    fame: 10,
    roster: [warriorA],
    rivals: [
      {
        id: 'rival-1',
        owner: {
          id: 'owner-d',
          name: 'Rival D',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [warriorD],
        treasury: 100,
        fame: 0,
      } as any,
    ],
    boutOffers: { ['offer-1' as import('@/types/shared.types').BoutOfferId]: offer as any },
    promoters: { ['promoter-1' as import('@/types/shared.types').PromoterId]: promoter as any },
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    player: {
      id: 'player-1',
      name: 'Player',
      stableName: 'Player Stable',
      fame: 10,
      renown: 0,
      titles: 0,
    } as any,
  } as unknown as GameState;
}

describe('BoutSimulationPass returns display data', () => {
  it('runBoutSimulationPass returns { impact, results, summary }', () => {
    const state = makeBoutState();
    const rng = new SeededRNGService(42);
    const result = runBoutSimulationPass(state, rng);

    expect(result).toHaveProperty('impact');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.summary).toHaveProperty('deathNames');
    expect(result.summary).toHaveProperty('injuryNames');
  });

  it('runBoutPhase stashes lastWeekBoutDisplay on state via advanceWeek', () => {
    const state = makeBoutState();
    const nextState = advanceWeek(state);

    expect(nextState.lastWeekBoutDisplay).toBeDefined();
    expect(nextState.lastWeekBoutDisplay!.results).toHaveLength(1);
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.deathNames)).toBe(true);
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.injuryNames)).toBe(true);
  });

  it('lastWeekBoutDisplay is plain serializable data (no Maps)', () => {
    const state = makeBoutState();
    const nextState = advanceWeek(state);

    expect(() => JSON.stringify(nextState.lastWeekBoutDisplay)).not.toThrow();
    expect(() => structuredClone(nextState.lastWeekBoutDisplay)).not.toThrow();
  });
});
