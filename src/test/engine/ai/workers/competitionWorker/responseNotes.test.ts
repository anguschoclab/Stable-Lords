// @vitest-environment node
/**
 * Stage E — responseNotes generalized to ALL rival offer verdicts.
 * Today `explain.reason` is only persisted for title bouts; a rival's
 * ordinary accept/decline is silent on the offer card. Every evaluated
 * response now records its reason so the UI can show the player why a
 * stable said yes or no.
 */
import { describe, it, expect } from 'vitest';
import type { WarriorId, BoutOfferId, StableId, InjuryId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import type { InjuryData } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';
import {
  makeWarrior as fixtureWarrior,
  makeRival as fixtureRival,
  makeBoutOffer as fixtureBoutOffer,
  makeGameState as fixtureGameState,
} from '@/test/_fixtures/factories';

const severeInjury: InjuryData = {
  id: 'inj-1' as InjuryId,
  name: 'Crushed Rib',
  severity: 'Severe',
  description: 'Crushed rib',
  weeksRemaining: 6,
  penalties: {},
};

const makeWarrior = (id: string, over: Partial<Warrior> = {}): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name: `Fighter ${id}`,
    style: FightingStyle.StrikingAttack,
    fame: 100,
    derivedStats: { hp: 100 } as never,
    ...over,
  });

const makeRival = (id: string, roster: Warrior[], over: Partial<RivalStableData> = {}): RivalStableData =>
  fixtureRival({
    id: id as StableId,
    roster,
    treasury: 1000,
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...over,
  });

const makeOffer = (id: string, warriorIds: string[], opts: Partial<BoutOffer> = {}): BoutOffer =>
  fixtureBoutOffer({
    id: id as BoutOfferId,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])),
    ...opts,
  });

const makeState = (offers: BoutOffer[], rivals: RivalStableData[]): GameState =>
  fixtureGameState({
    rivals,
    boutOffers: Object.fromEntries(offers.map((o) => [o.id, o])),
    absoluteWeek: 5,
  });

const offerOut = (state: GameState, rival: RivalStableData, id: string): BoutOffer =>
  (processAllRivalsBoutOffers(state, [rival]).boutOffers as Record<string, BoutOffer>)[id]!;

describe('responseNotes — every rival verdict leaves a reason', () => {
  it('a non-title decline records why on the offer', () => {
    const w = makeWarrior('w1', { injuries: [severeInjury] });
    const rival = makeRival('r1', [w]);
    const offer = makeOffer('o1', ['w1']); // no titleArenaId — ordinary offer
    const out = offerOut(makeState([offer], [rival]), rival, 'o1');
    expect(out.responses?.['w1' as WarriorId]).toBe('Declined');
    expect(out.responseNotes?.['w1' as WarriorId]).toBeTruthy();
    expect(out.responseNotes?.['w1' as WarriorId]).toContain('injur');
  });

  it('a non-title accept records why on the offer', () => {
    const w = makeWarrior('w2');
    // Broke stable — desperation accepts anything survivable.
    const rival = makeRival('r1', [w], { treasury: 300 });
    const offer = makeOffer('o2', ['w2']);
    const out = offerOut(makeState([offer], [rival]), rival, 'o2');
    expect(out.responses?.['w2' as WarriorId]).toBe('Accepted');
    expect(out.responseNotes?.['w2' as WarriorId]).toBeTruthy();
  });
});
