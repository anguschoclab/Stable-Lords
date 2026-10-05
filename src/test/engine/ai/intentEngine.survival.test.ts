import { describe, it, expect } from 'vitest';
import {
  pickWeeklyIntent,
  verifyIntentSkepticism,
  intentStillApplies,
  updateAIStrategy,
} from '@/engine/ai/intentEngine';
import { projectedWeeklyUpkeep } from '@/engine/ai/workers/budgetWorker';
import { verifyBoutAcceptance } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';
import { makeBidRival, makeBidWarrior } from '@/test/_fixtures/bidRoster';
import {
  makeWarrior,
  makeRival as fixtureRival,
  makeOwner as fixtureOwner,
  makeGameState as fixtureState,
  makeAgentMemory,
} from '@/test/_fixtures/factories';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

/**
 * SURVIVAL — the deeper crisis tier below RECOVERY (revived N1).
 * A stable that cannot cover its burn *and* is losing is past belt-tightening:
 * it hunkers — no proactive bids, accepts only bouts it is favored to win,
 * freezes staff moves — until the treasury climbs back out of the runway.
 */

const makeRival = (overrides: Partial<RivalStableData> = {}): RivalStableData =>
  fixtureRival({
    id: 'rival-1' as StableId,
    owner: fixtureOwner({
      id: 'owner-1' as StableId,
      name: 'Test Owner',
      stableName: 'Test Stable',
      favoredStyles: [],
    }),
    roster: Array.from({ length: 6 }, () => makeWarrior({ fame: 0 })),
    ...overrides,
  });

const losingMemory = makeAgentMemory({
  lastTreasury: 200,
  burnRate: 480,
  seasonRecord: {
    wins: 1,
    losses: 6,
    kills: 0,
    rosterSizeAtSeasonStart: 6,
  },
});

const makeState = (overrides: Partial<GameState> = {}): GameState =>
  fixtureState({
    week: 5,
    season: 'Spring',
    year: 1,
    weather: 'Clear',
    ...overrides,
  });

describe('pickWeeklyIntent — SURVIVAL', () => {
  it('picks SURVIVAL when the stable cannot cover its burn and is losing', () => {
    const rival = makeRival({
      treasury: 50, // << 480g projected upkeep for six active warriors
      agentMemory: losingMemory,
    });
    expect(pickWeeklyIntent(rival, makeState())).toBe('SURVIVAL');
  });

  it('picks RECOVERY (not SURVIVAL) when insolvent but without a losing record', () => {
    // No season record → the "proven losing" leg of SURVIVAL stays unmet;
    // the stable is merely cash-strapped, which is RECOVERY's band.
    const rival = makeRival({ treasury: 50 });
    expect(pickWeeklyIntent(rival, makeState())).toBe('RECOVERY');
  });

  it('picks RECOVERY (not SURVIVAL) when losing but still covering its burn', () => {
    const rival = makeRival({
      treasury: projectedWeeklyUpkeep(makeRival()) + 100, // covers this week
      agentMemory: losingMemory,
    });
    expect(pickWeeklyIntent(rival, makeState())).toBe('RECOVERY');
  });

  it('lets VENDETTA still outrank SURVIVAL for a live grudge', () => {
    const rival = makeRival({
      treasury: 50,
      agentMemory: losingMemory,
    });
    const state = makeState({
      // grudgeMap is derived from ownerGrudges inside makeGameState — seed the
      // source array so the live-grudge path is exercised.
      ownerGrudges: [
        {
          id: 'g1',
          ownerIdA: 'owner-1',
          ownerIdB: 'owner-2',
          intensity: 2,
          reason: 'Kill',
          startWeek: 1,
          lastEscalation: 1,
        },
      ],
    } as Partial<GameState>);
    const rng = { next: () => 0, uuid: () => 'u' } as never;
    expect(pickWeeklyIntent(rival, state, undefined, rng)).toBe('VENDETTA');
  });
});

describe('SURVIVAL strategy lifecycle', () => {
  it('does not disprove a SURVIVAL strategy merely because treasury < 150', () => {
    const rival = makeRival({
      treasury: 100,
      strategy: { intent: 'SURVIVAL', planWeeksRemaining: 2 },
    });
    expect(verifyIntentSkepticism(rival, makeState())).toBe(false);
  });

  it('holds SURVIVAL while insolvent, releases once solvent', () => {
    const state = makeState();
    expect(intentStillApplies(makeRival({ treasury: 50 }), state, 'SURVIVAL')).toBe(true);
    expect(intentStillApplies(makeRival({ treasury: 2000 }), state, 'SURVIVAL')).toBe(false);
  });

  it('keeps a short plan duration like RECOVERY — insolvency resolves fast either way', () => {
    const rival = makeRival({
      treasury: 50,
      agentMemory: losingMemory,
    });
    const strategy = updateAIStrategy(rival, makeState());
    expect(strategy.intent).toBe('SURVIVAL');
    expect(strategy.planWeeksRemaining).toBeLessThanOrEqual(2);
  });
});

describe('SURVIVAL downstream behavior', () => {
  it('issues no proactive bout bids — a folding stable cannot risk a warrior', () => {
    const rival = makeBidRival({
      treasury: 50,
      strategy: { intent: 'SURVIVAL', planWeeksRemaining: 2 },
      roster: [
        makeBidWarrior('Survivor1', 'BASHING ATTACK' as never, { fame: 50 }),
        makeBidWarrior('Survivor2', 'BASHING ATTACK' as never, { fame: 50 }),
      ],
    });
    const { bids } = generateBoutBids({
      rival,
      _currentWeek: 5,
      rivals: [makeBidRival({})],
      state: makeState(),
    });
    expect(bids).toHaveLength(0);
  });

  it('accepts only bouts it is favored to win — refuses non-favored opponents', () => {
    const rival = makeBidRival({
      strategy: { intent: 'SURVIVAL', planWeeksRemaining: 2 },
    });
    const warrior = makeBidWarrior('Survivor', 'BASHING ATTACK' as never, { fame: 100 });
    const favored = makeBidWarrior('Journeyman', 'BASHING ATTACK' as never, { fame: 20 });
    const superior = makeBidWarrior('Veteran', 'BASHING ATTACK' as never, { fame: 150 });
    // Favored: purse upside worth the risk.
    expect(verifyBoutAcceptance(rival, warrior, favored).accepted).toBe(true);
    // Not favored: a loss buys nothing and a death ends the stable.
    expect(verifyBoutAcceptance(rival, warrior, superior).accepted).toBe(false);
  });
});
