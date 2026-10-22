// @vitest-environment node
/**
 * responseNotes generalized to ALL rival offer verdicts.
 * Today `explain.reason` is only persisted for title bouts; a rival's
 * ordinary accept/decline is silent on the offer card. Every evaluated
 * response now records its reason so the UI can show the player why a
 * stable said yes or no.
 */
import { describe, it, expect } from 'vitest';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';
import {
  makeOfferRival as makeRival,
  makePendingOffer as makeOffer,
  offerState as makeState,
  severeInjury,
} from '@/test/_fixtures/competitionWorker';

const makeWarrior = (id: string, over: Partial<Warrior> = {}): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name: `Fighter ${id}`,
    style: FightingStyle.StrikingAttack,
    fame: 100,
    derivedStats: { hp: 100 } as never,
    ...over,
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
