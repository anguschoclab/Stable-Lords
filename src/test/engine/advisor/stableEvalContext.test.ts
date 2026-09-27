// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { evaluateBoutOffers } from '@/engine/advisor/boutOfferAdvisor';
import { getOpponentIntel } from '@/engine/advisor/intelAdvisor';
import {
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeRival,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import type { InsightToken } from '@/types/state.types';
import type { InsightId, WarriorId } from '@/types/shared.types';
import { beforeEach } from 'vitest';

beforeEach(() => resetFixtureIds());

function pendingOfferFor(warriorId: string, opponentId: string) {
  return makeBoutOffer({
    warriorIds: [warriorId as WarriorId, opponentId as WarriorId],
    status: 'Proposed',
    boutWeek: 6,
    createdAbsoluteWeek: 5,
    expirationWeek: 6,
    purse: 200,
    responses: { [warriorId]: 'Pending', [opponentId]: 'Accepted' } as never,
  });
}

function intelToken(warriorId: string, type: InsightToken['type'], detail: string): InsightToken {
  return {
    id: `tok-${warriorId}-${type}` as InsightId,
    type,
    warriorId: warriorId as WarriorId,
    warriorName: warriorId,
    detail,
    discoveredWeek: 4,
  };
}

describe('StableEvalContext — evaluateBoutOffers', () => {
  it('uses ctx.treasury instead of the player treasury for purse desperation', () => {
    const warrior = makeWarrior({ id: 'w1' as WarriorId });
    const offer = pendingOfferFor('w1', 'opp1');
    const opponent = makeWarrior({ id: 'opp1' as WarriorId });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      treasury: 99999, // player is rich
      roster: [warrior],
      rivals: [makeRival({ id: 'r1' as never, roster: [opponent] })],
      boutOffers: { [offer.id]: offer },
    });
    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER', undefined, {
      treasury: 10, // rival is broke
      rosterSize: 6,
    });
    expect(advice.reasoning.some((r) => r.includes('Treasury pressure'))).toBe(true);
  });

  it('ignores ctx when omitted — player treasury drives the score', () => {
    const warrior = makeWarrior({ id: 'w1' as WarriorId });
    const offer = pendingOfferFor('w1', 'opp1');
    const opponent = makeWarrior({ id: 'opp1' as WarriorId });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      treasury: 99999,
      roster: [warrior],
      rivals: [makeRival({ id: 'r1' as never, roster: [opponent] })],
      boutOffers: { [offer.id]: offer },
    });
    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.reasoning.some((r) => r.includes('Treasury pressure'))).toBe(false);
  });
});

describe('getOpponentIntel — dossier override', () => {
  it('reads provided tokens instead of player insightTokens', () => {
    const state = makeGameState({
      insightTokens: [intelToken('opp1', 'Style', 'player-scouted style')],
    });
    const tokens = getOpponentIntel(state, 'opp1' as WarriorId, {
      tokens: [intelToken('opp1', 'Tactic', 'dossier tactic tell')],
    });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.detail).toBe('dossier tactic tell');
  });

  it('falls back to state.insightTokens without an override', () => {
    const state = makeGameState({
      insightTokens: [intelToken('opp1', 'Style', 'player-scouted style')],
    });
    const tokens = getOpponentIntel(state, 'opp1' as WarriorId);
    expect(tokens[0]?.detail).toBe('player-scouted style');
  });
});
