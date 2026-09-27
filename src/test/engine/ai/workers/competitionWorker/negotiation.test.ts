/**
 * D.0 — Bout negotiation (counter offers).
 * AI stables counter marginal offers instead of flat-declining; AI-AI counters
 * resolve inside the same pass (gated by checkBudget on the proposer side);
 * player-bound counters surface as a new Proposed offer; only one counter
 * round is allowed.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateBoutOffer,
  processAllRivalsBoutOffers,
} from '@/engine/ai/workers/competitionWorker';
import { counterBoutOffer } from '@/engine/bout/mutations/contractMutations';
import {
  makeGameState,
  makeRival,
  makeWarrior,
  makeBoutOffer,
} from '@/test/_fixtures/factories';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

function richRivalWith(warrior: ReturnType<typeof makeWarrior>) {
  return makeRival({ roster: [warrior], treasury: 5000 });
}

describe('bout negotiation', () => {
  it('evaluateBoutOffer counters when the purse is far below warrior fame', () => {
    const warrior = makeWarrior({ fame: 400 });
    const rival = richRivalWith(warrior);
    const offer = makeBoutOffer({ warriorIds: [warrior.id], purse: 100, hype: 90 });
    const result = evaluateBoutOffer(offer, rival, warrior, 5, 'Clear');
    expect(result).toBe('Countered');
  });

  it('counterBoutOffer marks the counterer, raises the purse, and re-pends others', () => {
    const a = makeWarrior();
    const b = makeWarrior();
    const offer = makeBoutOffer({
      warriorIds: [a.id, b.id],
      purse: 200,
      responses: { [a.id]: 'Accepted', [b.id]: 'Pending' },
    });
    const state = makeGameState({ boutOffers: { [offer.id]: offer } });
    const impact = counterBoutOffer(state, offer.id, b.id);
    const updated = impact.boutOffers![offer.id]!;
    expect(updated.status).toBe('Proposed');
    expect(updated.responses[b.id]).toBe('Countered');
    expect(updated.responses[a.id]).toBe('Pending');
    expect(updated.purse).toBeGreaterThan(200);
    expect(updated.conditions).toContain('COUNTERED_PURSE');
  });

  it('AI-AI counter resolves in-pass: affordable proposer signs the bout', () => {
    const proposerW = makeWarrior({ fame: 50 });
    const countererW = makeWarrior({ fame: 400 });
    const proposer = richRivalWith(proposerW);
    const counterer = richRivalWith(countererW);
    const offer = makeBoutOffer({
      warriorIds: [proposerW.id, countererW.id],
      purse: 100,
      hype: 90,
      proposerStableId: proposer.id,
      responses: { [proposerW.id]: 'Accepted', [countererW.id]: 'Pending' },
    });
    const state = makeGameState({
      rivals: [proposer, counterer],
      boutOffers: { [offer.id]: offer },
    });
    const impact = processAllRivalsBoutOffers(state, [proposer, counterer]);
    const final = impact.boutOffers![offer.id]!;
    expect(final.status).toBe('Signed');
    expect(final.purse).toBeGreaterThan(100);
    expect(final.conditions).toContain('COUNTERED_PURSE');
  });

  it('AI-AI counter fails when the proposer cannot afford the bump', () => {
    const proposerW = makeWarrior({ fame: 50 });
    const countererW = makeWarrior({ fame: 2000 });
    // Proposer treasury just above the desperation line — cannot fund a large
    // purse bump (25% of 1200 = 300 > available after reserve).
    const proposer = makeRival({ roster: [proposerW], treasury: 550 });
    const counterer = richRivalWith(countererW);
    const offer = makeBoutOffer({
      warriorIds: [proposerW.id, countererW.id],
      purse: 1200,
      hype: 90,
      proposerStableId: proposer.id,
      responses: { [proposerW.id]: 'Accepted', [countererW.id]: 'Pending' },
    });
    const state = makeGameState({
      rivals: [proposer, counterer],
      boutOffers: { [offer.id]: offer },
    });
    const impact = processAllRivalsBoutOffers(state, [proposer, counterer]);
    const final = impact.boutOffers![offer.id]!;
    expect(final.status).toBe('Rejected');
  });

  it('player-bound counter leaves the offer Proposed for the player to decide', () => {
    const playerW = makeWarrior({ fame: 60 });
    const countererW = makeWarrior({ fame: 400 });
    const counterer = richRivalWith(countererW);
    const offer = makeBoutOffer({
      warriorIds: [playerW.id, countererW.id],
      purse: 100,
      hype: 90,
      responses: { [playerW.id]: 'Accepted', [countererW.id]: 'Pending' },
    });
    const state = makeGameState({
      roster: [playerW],
      rivals: [counterer],
      boutOffers: { [offer.id]: offer },
    });
    const impact = processAllRivalsBoutOffers(state, [counterer]);
    const final = impact.boutOffers![offer.id as BoutOfferId]!;
    expect(final.status).toBe('Proposed');
    expect(final.conditions).toContain('COUNTERED_PURSE');
    expect(final.responses[playerW.id as WarriorId]).toBe('Pending');
    expect(final.purse).toBeGreaterThan(100);
  });

  it('one round only: an already-countered offer cannot be countered again', () => {
    const warrior = makeWarrior({ fame: 400 });
    const rival = richRivalWith(warrior);
    const offer = makeBoutOffer({
      warriorIds: [warrior.id],
      purse: 100,
      hype: 90,
      conditions: ['COUNTERED_PURSE'],
    });
    const result = evaluateBoutOffer(offer, rival, warrior, 5, 'Clear');
    expect(result).not.toBe('Countered');
  });
});
