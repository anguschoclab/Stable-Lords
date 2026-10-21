import { describe, it, expect, vi } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { getPairKey } from '@/utils/keyUtils';
import {
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
  makeTournamentBaseState,
  makeTournamentWarrior,
  rivalMapEntry,
} from '@/test/_fixtures/tournamentState';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import { getAIPlan, generateFreelancer } from '@/engine/matchmaking/tournamentSelection/utils';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

describe('getAIPlan', () => {
  it('returns default plan with killDesire 7 for non-rival warrior', () => {
    const w = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeTournamentBaseState(1);

    const plan = getAIPlan(state, w);

    expect(plan).toBeDefined();
    expect(plan.killDesire).toBe(7);
  });

  it('uses rivalMap for rival lookup', () => {
    const w = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeTournamentBaseState(1);
    state.rivalMap = new Map([[RIVAL_ID, rivalMapEntry({ personality: 'Aggressive' })]]);

    const plan = getAIPlan(state, w);

    expect(plan).toBeDefined();
  });

  it('passes grudge intensity when owner grudge exists', () => {
    const w = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeTournamentBaseState(1);
    state.rivalMap = new Map([[RIVAL_ID, rivalMapEntry({ ownerId: 'owner-rival' })]]);

    const grudge = {
      id: 'g1' as any,
      ownerIdA: 'owner-rival' as any,
      ownerIdB: PLAYER_ID,
      intensity: 5,
      reason: 'test',
      startWeek: 1,
      lastEscalation: 1,
    };
    state.ownerGrudges = [grudge];
    state.grudgeMap = new Map([[getPairKey('owner-rival', PLAYER_ID), grudge]]);

    const plan = getAIPlan(state, w, FightingStyle.StrikingAttack, PLAYER_ID);

    expect(plan).toBeDefined();
  });
});

describe('generateFreelancer', () => {
  it('creates a valid warrior', () => {
    const rng = new SeededRNG(42);
    const freelancer = generateFreelancer('Gold', 0, rng);

    expect(freelancer.name).toBeDefined();
    expect(freelancer.style).toBeDefined();
    expect(Object.values(FightingStyle)).toContain(freelancer.style);
  });

  it('scales attributes by tier', () => {
    const rng1 = new SeededRNG(1);
    const rng2 = new SeededRNG(1);

    const gold = generateFreelancer('Gold', 0, rng1);
    const iron = generateFreelancer('Iron', 0, rng2);

    const goldTotal = Object.values(gold.attributes).reduce((a, b) => a + b, 0);
    const ironTotal = Object.values(iron.attributes).reduce((a, b) => a + b, 0);

    expect(goldTotal).toBeGreaterThan(ironTotal);
  });
});
