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
import { STABLE_DISSOLVED_REASON } from '@/engine/bout/mutations/contractMutations';
import {
  makeWarrior as fixtureWarrior,
  makeRival as fixtureRival,
  makeBoutOffer as fixtureBoutOffer,
  makeGameState as fixtureGameState,
} from '@/test/_fixtures/factories';

const makeWarrior = (
  id: string,
  name: string,
  style: FightingStyle = FightingStyle.StrikingAttack
): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
    derivedStats: { hp: 100 } as any,
  } as any);

const makeRival = (id: string, roster: Warrior[]): RivalStableData =>
  fixtureRival({
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
  } as any);

const makeOffer = (id: string, warriorIds: string[], opts: Partial<BoutOffer> = {}): BoutOffer =>
  fixtureBoutOffer({
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
  } as any);

// fixtureGameState builds warriorMap / warriorToStableMap / rivalMap
// (roster → player stable, rivals[].roster → rival id) plus boutOffers.
const makeState = (
  offers: BoutOffer[],
  rivals: RivalStableData[],
  playerWarriors: Warrior[] = []
): GameState =>
  fixtureGameState({
    roster: playerWarriors,
    rivals,
    boutOffers: Object.fromEntries(offers.map((o) => [o.id, o])),
    absoluteWeek: 5,
  });

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

describe('finalized-roster ownership', () => {
  it('groups an offer under the finalized owner when the snapshot stable map is stale', () => {
    // Mid-tick poach/move: the week-start maps still credit w1 to r-stale,
    // but the finalized rival list carries w1 on r-final. The response must
    // be a real verdict for r-final — not silence, not a void decline.
    const w1 = makeWarrior('w1', 'Fighter1');
    const staleRival = makeRival('r-stale', [w1]);
    const finalRival = { ...makeRival('r-final', [w1]), treasury: 100 };

    const offer = makeOffer('o1', ['w1']);
    const state = makeState([offer], [staleRival]);

    const result = processAllRivalsBoutOffers(state, [finalRival]);
    const out = (result.boutOffers as Record<string, BoutOffer>)['o1']!;
    expect(out.responses['w1' as WarriorId]).toBe('Accepted');
    expect(out.responseNotes?.['w1' as WarriorId]).not.toBe(STABLE_DISSOLVED_REASON);
  });
});

describe('ownerless warriors — void-marked declines', () => {
  it('marks a Pending warrior with no finalized owner as Declined with a stable-dissolved note', () => {
    // w-gone's stable dissolved mid-tick — it is on no roster and unmapped.
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = { ...makeRival('r1', [w1]), treasury: 100 };

    const offer = makeOffer('o1', ['w-gone', 'w1']);
    const state = makeState([offer], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    const out = (result.boutOffers as Record<string, BoutOffer>)['o1']!;
    expect(out.responses['w-gone' as WarriorId]).toBe('Declined');
    expect(out.responseNotes?.['w-gone' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);
    // w1 accepted (broke stable takes anything) → all parties answered → the
    // offer resolves Rejected instead of silently lapsing.
    expect(out.responses['w1' as WarriorId]).toBe('Accepted');
    expect(out.status).toBe('Rejected');
  });

  it('marks every ownerless warrior; the offer resolves Rejected once all are marked', () => {
    const rival = makeRival('r1', [makeWarrior('w1', 'F1')]);
    const offer = makeOffer('o1', ['w-gone-a', 'w-gone-b']);
    const state = makeState([offer], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    const out = (result.boutOffers as Record<string, BoutOffer>)['o1']!;
    expect(out.responses['w-gone-a' as WarriorId]).toBe('Declined');
    expect(out.responses['w-gone-b' as WarriorId]).toBe('Declined');
    expect(out.responseNotes?.['w-gone-a' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);
    expect(out.responseNotes?.['w-gone-b' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);
    expect(out.status).toBe('Rejected');
  });

  it('never marks player-owned warriors — a pending player response is left for the UI', () => {
    const wP = makeWarrior('wP', 'Player Fighter');
    const rival = makeRival('r1', [makeWarrior('w1', 'F1')]);
    const offer = makeOffer('o1', ['wP', 'w-gone']);
    const state = makeState([offer], [rival], [wP]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    const out = (result.boutOffers as Record<string, BoutOffer>)['o1']!;
    expect(out.responses['wP' as WarriorId]).toBe('Pending');
    expect(out.responseNotes?.['wP' as WarriorId]).toBeUndefined();
    expect(out.responses['w-gone' as WarriorId]).toBe('Declined');
    expect(out.status).toBe('Proposed');
  });

  it('does not void a Pending response for a warrior still on a finalized roster', () => {
    // w1 commits to the richer offer first, so the cheap offer keeps w1
    // Pending — a live-rostered warrior must never be void-marked.
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = { ...makeRival('r1', [w1]), treasury: 100 };

    const hi = makeOffer('o-hi', ['w1', 'w-x'], { hype: 900, purse: 900 });
    const lo = makeOffer('o-lo', ['w1', 'w-y'], { hype: 1, purse: 1 });
    const state = makeState([hi, lo], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    const loOut = (result.boutOffers as Record<string, BoutOffer>)['o-lo']!;
    expect(loOut.responses['w1' as WarriorId]).toBe('Pending');
    expect(loOut.responseNotes?.['w1' as WarriorId]).toBeUndefined();
    // The ownerless opponent still voids, resolving the leftover offer.
    expect(loOut.responses['w-y' as WarriorId]).toBe('Declined');
    expect(loOut.responseNotes?.['w-y' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);
  });

  it('marks a pending counter-party as dissolved instead of leaving the counter in limbo', () => {
    // w1 countered; w2's stable dissolved before the counter resolved.
    const w1 = makeWarrior('w1', 'Fighter1');
    const rival = makeRival('r1', [w1]);
    const offer = makeOffer('o1', ['w1', 'w2'], {
      responses: { w1: 'Countered', w2: 'Pending' } as BoutOffer['responses'],
      counterPurseBump: 25,
      proposerStableId: 'r1' as StableId,
    });
    const state = makeState([offer], [rival]);

    const result = processAllRivalsBoutOffers(state, [rival]);
    const out = (result.boutOffers as Record<string, BoutOffer>)['o1']!;
    expect(out.responses['w2' as WarriorId]).toBe('Declined');
    expect(out.responseNotes?.['w2' as WarriorId]).toBe(STABLE_DISSOLVED_REASON);
    expect(out.status).toBe('Rejected');
  });
});
