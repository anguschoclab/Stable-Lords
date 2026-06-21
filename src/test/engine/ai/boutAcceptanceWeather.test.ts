/**
 * Gaps 3, 5, 9 — Weather skepticism in bout acceptance.
 * Gap 3: verifyBoutAcceptance is never called from offerProcessor.ts
 * Gap 5: evaluateBoutOffer has no weather awareness
 * Gap 9: verifyBoutAcceptance only covers 5 of 35+ weather types
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData, BoutOffer } from '@/types/state.types';
import {
  verifyBoutAcceptance,
  evaluateBoutOffer,
} from '@/engine/ai/workers/competitionWorker/boutAcceptance';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  style: FightingStyle,
  cn: number = 15,
  overrides: Partial<Warrior> = {}
): Warrior {
  return {
    id: 'w1' as any,
    name: 'Test Warrior',
    style,
    attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    derivedStats: { hp: 100 } as any,
    ...overrides,
  } as Warrior;
}

function makeOpponent(
  style: FightingStyle,
  cn: number = 15,
  overrides: Partial<Warrior> = {}
): Warrior {
  return makeWarrior(style, cn, { id: 'w2' as any, name: 'Opponent', ...overrides });
}

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    ...overrides,
  } as RivalStableData;
}

function makeOffer(overrides: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'offer-1' as any,
    promoterId: 'prom-1' as any,
    warriorIds: ['w1' as any, 'w2' as any],
    boutWeek: 5,
    expirationWeek: 6,
    purse: 400,
    hype: 120,
    status: 'Proposed',
    responses: {},
    arenaId: 'standard_arena',
    ...overrides,
  } as BoutOffer;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 3: processAllRivalsBoutOffers calls verifyBoutAcceptance', () => {
  it('verifyBoutAcceptance is called before evaluateBoutOffer for each offer', async () => {
    const processMod = await import('@/engine/ai/workers/competitionWorker/offerProcessor');

    const warrior = makeWarrior(FightingStyle.LungingAttack);
    const opponent = makeOpponent(FightingStyle.BashingAttack);
    const rival = makeRival({ roster: [warrior] });

    const state = {
      week: 5,
      weather: 'Rainy',
      boutOffers: {
        'offer-1': makeOffer({
          warriorIds: [warrior.id, opponent.id],
          responses: { [warrior.id]: 'Pending', [opponent.id]: 'Pending' },
        }),
      },
      warriorMap: new Map([
        [warrior.id, warrior],
        [opponent.id, opponent],
      ]) as any,
      warriorToStableMap: new Map([
        [warrior.id, { stableId: 'rival-1', isPlayer: false }],
        [opponent.id, { stableId: 'player-1', isPlayer: true }],
      ]) as any,
      rivalMap: new Map([['rival-1', rival]]) as any,
    } as any;

    const result = processMod.processAllRivalsBoutOffers(state, [rival]);

    // verifyBoutAcceptance should have caused the LungingAttack warrior's offer
    // to be declined in Rainy weather (weather skepticism)
    const offer = result.boutOffers?.['offer-1'];
    expect(offer).toBeDefined();
    expect(offer.responses[warrior.id]).toBe('Declined');
  });
});

describe('Gap 5: evaluateBoutOffer has weather awareness', () => {
  it('declines LungingAttack warrior in Rainy weather', () => {
    const warrior = makeWarrior(FightingStyle.LungingAttack);
    const rival = makeRival();
    const offer = makeOffer();

    // Should decline due to weather — currently no weather param exists
    const result = evaluateBoutOffer(offer, rival, warrior, 5, 'Rainy');
    expect(result).toBe('Declined');
  });

  it('declines low-CN warrior in Sweltering weather', () => {
    const warrior = makeWarrior(FightingStyle.StrikingAttack, 8);
    const rival = makeRival();
    const offer = makeOffer();

    const result = evaluateBoutOffer(offer, rival, warrior, 5, 'Sweltering');
    expect(result).toBe('Declined');
  });

  it('accepts same warrior in Clear weather', () => {
    const warrior = makeWarrior(FightingStyle.StrikingAttack, 8);
    const rival = makeRival();
    const offer = makeOffer();

    const result = evaluateBoutOffer(offer, rival, warrior, 5, 'Clear');
    expect(result).toBe('Accepted');
  });
});

describe('Gap 9: verifyBoutAcceptance covers all significant weather types', () => {
  it('rejects Sandstorm + AimedBlow (precision targeting blinded)', () => {
    const warrior = makeWarrior(FightingStyle.AimedBlow);
    const opponent = makeWarrior(FightingStyle.BashingAttack);
    const rival = makeRival();
    const decision = verifyBoutAcceptance(rival, warrior, opponent, 'Sandstorm');
    expect(decision.accepted).toBe(false);
  });

  it('rejects Gale + StrikingAttack (winds disrupt attacks)', () => {
    const warrior = makeWarrior(FightingStyle.StrikingAttack);
    const opponent = makeWarrior(FightingStyle.ParryRiposte);
    const rival = makeRival();
    const decision = verifyBoutAcceptance(rival, warrior, opponent, 'Gale');
    expect(decision.accepted).toBe(false);
  });

  it('rejects Tornado for any style (violent winds)', () => {
    const warrior = makeWarrior(FightingStyle.StrikingAttack);
    const opponent = makeWarrior(FightingStyle.ParryRiposte);
    const rival = makeRival();
    const decision = verifyBoutAcceptance(rival, warrior, opponent, 'Tornado');
    expect(decision.accepted).toBe(false);
  });

  it('rejects Hailstorm for low-CN warrior (stamina drain)', () => {
    const warrior = makeWarrior(FightingStyle.StrikingAttack, 8);
    const opponent = makeWarrior(FightingStyle.BashingAttack);
    const rival = makeRival();
    const decision = verifyBoutAcceptance(rival, warrior, opponent, 'Hailstorm');
    expect(decision.accepted).toBe(false);
  });

  it('accepts Clear weather for all styles (sanity check)', () => {
    const styles = Object.values(FightingStyle);
    for (const style of styles) {
      const warrior = makeWarrior(style);
      const opponent = makeWarrior(FightingStyle.BashingAttack);
      const rival = makeRival();
      const decision = verifyBoutAcceptance(rival, warrior, opponent, 'Clear');
      expect(decision.accepted).toBe(true);
    }
  });
});
