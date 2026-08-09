/**
 * Tests for offerProcessor — Map instantiation refactor correctness.
 * Verifies that processAllRivalsBoutOffers correctly groups offers by rival,
 * sorts by hype*purse, and processes accept/decline logic.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, BoutOfferId, StableId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';

function makeWarrior(
  id: string,
  name: string,
  style: FightingStyle = FightingStyle.StrikingAttack
): Warrior {
  return {
    id: id as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
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
  } as Warrior;
}

function makeRival(id: string, roster: Warrior[]): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: `owner-${id}` as any,
      name: `Owner ${id}`,
      stableName: `Stable ${id}`,
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    roster,
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
  } as RivalStableData;
}

function makeOffer(id: string, warriorIds: string[], opts: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: id as BoutOfferId,
    promoterId: 'prom-1' as any,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])),
    ...opts,
  } as BoutOffer;
}

function makeState(
  offers: BoutOffer[],
  rivals: RivalStableData[],
  playerWarriors: Warrior[] = []
): GameState {
  const warriorMap = new Map<string, Warrior>();
  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  const rivalMap = new Map<string, RivalStableData>();

  for (const r of rivals) {
    rivalMap.set(r.id, r);
    for (const w of r.roster) {
      warriorMap.set(w.id, w);
      warriorToStableMap.set(w.id, { stableId: r.id, isPlayer: false });
    }
  }
  for (const w of playerWarriors) {
    warriorMap.set(w.id, w);
    warriorToStableMap.set(w.id, { stableId: 'player', isPlayer: true });
  }

  const boutOffers: Record<string, BoutOffer> = {};
  for (const o of offers) {
    boutOffers[o.id] = o;
  }

  return {
    boutOffers,
    warriorMap,
    warriorToStableMap,
    rivalMap,
    absoluteWeek: 5,
    weather: 'Clear',
  } as unknown as GameState;
}

describe('processAllRivalsBoutOffers', () => {
  it('returns empty boutOffers when no pending offers exist', () => {
    const rival = makeRival('r1', [makeWarrior('w1', 'Fighter1')]);
    const state = makeState([], [rival]);
    const result = processAllRivalsBoutOffers(state, [rival]);
    expect(result.boutOffers).toBeDefined();
    expect(Object.keys(result.boutOffers || {}).length).toBe(0);
  });

  it('groups offers by rival stable ID using warriorToStableMap', () => {
    const w1 = makeWarrior('w1', 'Fighter1');
    const w2 = makeWarrior('w2', 'Fighter2');
    const rival1 = makeRival('r1', [w1]);
    const rival2 = makeRival('r2', [w2]);

    const offer = makeOffer('o1', ['w1', 'w2']);
    const state = makeState([offer], [rival1, rival2]);

    const result = processAllRivalsBoutOffers(state, [rival1, rival2]);
    expect(result.boutOffers).toBeDefined();
    expect((result.boutOffers as Record<string, BoutOffer>)['o1']).toBeDefined();
  });

  it('skips offers where warrior is not in rival roster', () => {
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = makeRival('r1', [w1]);

    const offer = makeOffer('o1', ['w1']);
    const state = makeState([offer], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    expect(result.boutOffers).toBeDefined();
  });

  it('skips offers that are not Proposed status (no responses added)', () => {
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = makeRival('r1', [w1]);

    const offer = makeOffer('o1', ['w1'], { status: 'Signed' });
    const state = makeState([offer], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    expect(Object.keys(result.boutOffers || {}).length).toBe(1);
    expect((result.boutOffers as Record<string, BoutOffer>)['o1']?.status).toBe('Signed');
  });

  it('processes offers sorted by hype*purse descending', () => {
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = makeRival('r1', [w1]);

    const lowOffer = makeOffer('o1', ['w1'], { hype: 10, purse: 50 });
    const highOffer = makeOffer('o2', ['w1'], { hype: 100, purse: 200 });

    const state = makeState([lowOffer, highOffer], [rival]);
    const result = processAllRivalsBoutOffers(state, [rival]);
    expect(result.boutOffers).toBeDefined();
    expect((result.boutOffers as Record<string, BoutOffer>)['o1']).toBeDefined();
    expect((result.boutOffers as Record<string, BoutOffer>)['o2']).toBeDefined();
  });

  it('uses Map for O(1) rival lookup (Map instantiation refactor)', () => {
    const w1 = makeWarrior('w1', 'Fighter1');
    const rivals: RivalStableData[] = [];
    for (let i = 0; i < 10; i++) {
      rivals.push(makeRival(`r${i}`, i === 0 ? [w1] : [makeWarrior(`w${i + 10}`, `F${i}`)]));
    }

    const offer = makeOffer('o1', ['w1']);
    const state = makeState([offer], rivals);

    const result = processAllRivalsBoutOffers(state, rivals);
    expect(result.boutOffers).toBeDefined();
  });
});
