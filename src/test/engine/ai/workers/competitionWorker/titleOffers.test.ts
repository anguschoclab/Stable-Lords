// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyBoutAcceptance,
  evaluateBoutOffer,
} from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker/offerProcessor';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeOwner,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import { ARENA_COMMISSION_ID, ARENA_TITLE } from '@/constants/arena';
import type { ArenaTitle, BoutOffer, GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

function titleAt(championId: string | null, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return makeArenaTitle(championId, over);
}

function titleOffer(champId: string, challengerId: string, over: Partial<BoutOffer> = {}): BoutOffer {
  return makeBoutOffer({
    warriorIds: [champId as WarriorId, challengerId as WarriorId],
    promoterId: ARENA_COMMISSION_ID as BoutOffer['promoterId'],
    titleArenaId: 'arena_a',
    status: 'Proposed',
    responses: { [champId]: 'Pending', [challengerId]: 'Pending' } as BoutOffer['responses'],
    ...over,
  });
}

function killer(id: string): ReturnType<typeof makeWarrior> {
  return makeWarrior({
    id: id as WarriorId,
    fame: 60,
    career: { wins: 8, losses: 1, kills: 4 },
  });
}

describe('verifyBoutAcceptance — title bout awareness', () => {
  it('a RECOVERY-intent champion still answers the title defense against a killer', () => {
    const champ = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [champ],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 3 },
    });
    const verdict = verifyBoutAcceptance(rival, champ, killer('k1'), 'Clear', {
      isTitleBout: true,
    });
    expect(verdict.accepted).toBe(true);
  });

  it('non-title bouts under RECOVERY still refuse killers', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [w],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 3 },
    });
    const verdict = verifyBoutAcceptance(rival, w, killer('k1'), 'Clear');
    expect(verdict.accepted).toBe(false);
  });

  it('a champion does not dodge a title defense over a fame gap', () => {
    const champ = makeWarrior({ id: 'w1' as WarriorId, fame: 50 });
    const rival = makeRival({ roster: [champ] });
    const famousChallenger = makeWarrior({ id: 'k1' as WarriorId, fame: 900 });
    const verdict = verifyBoutAcceptance(rival, champ, famousChallenger, 'Clear', {
      isTitleBout: true,
    });
    expect(verdict.accepted).toBe(true);
  });
});

describe('evaluateBoutOffer — reign management', () => {
  const stateWithTitle = (refusals: number, champId = 'w1'): GameState =>
    makeGameState({
      arenaChampions: { arena_a: titleAt(champId, { refusals }) },
    });

  it('a champion one refusal from stripping fights hurt rather than lose the crown', () => {
    const champ = makeWarrior({
      id: 'w1' as WarriorId,
      derivedStats: { hp: 30, endurance: 100, damage: 5, encumbrance: 0 },
    });
    const rival = makeRival({ roster: [champ] });
    const offer = titleOffer('w1', 'k1');
    const state = stateWithTitle(ARENA_TITLE.REFUSALS_TO_STRIP - 1);
    expect(
      evaluateBoutOffer(offer, rival, champ, 5, 'Clear', killer('k1'), state)
    ).toBe('Accepted');
  });

  it('a champion who can still afford a refusal may decline at critical health', () => {
    const champ = makeWarrior({
      id: 'w1' as WarriorId,
      derivedStats: { hp: 30, endurance: 100, damage: 5, encumbrance: 0 },
    });
    const rival = makeRival({
      roster: [champ],
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const offer = titleOffer('w1', 'k1');
    const state = stateWithTitle(0);
    expect(
      evaluateBoutOffer(offer, rival, champ, 5, 'Clear', makeWarrior({ id: 'k1' as WarriorId }), state)
    ).toBe('Declined');
  });

  it('a blocking injury still postpones a title defense (medical, not refusal)', () => {
    const champ = makeWarrior({
      id: 'w1' as WarriorId,
      injuries: [
        { type: 'concussion', severity: 'Severe', weeksRemaining: 3, permanent: false } as never,
      ],
    });
    const rival = makeRival({ roster: [champ] });
    const offer = titleOffer('w1', 'k1');
    const state = stateWithTitle(ARENA_TITLE.REFUSALS_TO_STRIP - 1);
    expect(
      evaluateBoutOffer(offer, rival, champ, 5, 'Clear', killer('k1'), state)
    ).toBe('Declined');
  });

  it('a calculating challenger declines a known killer — the cooldown is cheap', () => {
    const challenger = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [challenger],
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const offer = titleOffer('champ_x', 'w1');
    const state = stateWithTitle(0, 'champ_x');
    expect(
      evaluateBoutOffer(offer, rival, challenger, 5, 'Clear', killer('champ_x'), state)
    ).toBe('Declined');
  });

  it('an aggressive challenger takes the shot regardless', () => {
    const challenger = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [challenger],
      owner: makeOwner({ personality: 'Aggressive' }),
    });
    const offer = titleOffer('champ_x', 'w1');
    const state = stateWithTitle(0, 'champ_x');
    expect(
      evaluateBoutOffer(offer, rival, challenger, 5, 'Clear', killer('champ_x'), state)
    ).toBe('Accepted');
  });
});

describe('processAllRivalsBoutOffers — unified title gate', () => {
  it('a RECOVERY-intent champion accepts the title defense end-to-end', () => {
    const champ = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [champ],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 3 },
    });
    const offer = titleOffer('w1', 'k1');
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { arena_a: titleAt('w1') },
    });
    const impact = processAllRivalsBoutOffers(state, [rival]);
    expect(impact.boutOffers?.[offer.id]?.responses['w1' as WarriorId]).toBe('Accepted');
  });
});

describe('title-bout verdict reasons (Plan G — offer card transparency)', () => {
  it('records the refusal reason when a champion declines a defense hurt', () => {
    const champ = makeWarrior({
      id: 'w1' as WarriorId,
      derivedStats: { hp: 30, endurance: 100, damage: 5, encumbrance: 0 },
    });
    const rival = makeRival({
      roster: [champ],
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const offer = titleOffer('w1', 'k1');
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { arena_a: titleAt('w1', { refusals: 0 }) },
    });
    const impact = processAllRivalsBoutOffers(state, [rival]);
    const updated = impact.boutOffers?.[offer.id];
    expect(updated?.responses['w1' as WarriorId]).toBe('Declined');
    expect(updated?.responseNotes?.['w1' as WarriorId]).toBe('title-defense-health');
  });

  it('records the reason when a calculating challenger passes on a killer champion', () => {
    const challenger = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({
      roster: [challenger],
      owner: makeOwner({ personality: 'Pragmatic' }),
    });
    const offer = titleOffer('champ_x', 'w1');
    const champWarrior = killer('champ_x');
    const champStable = makeRival({ id: 'champ-stable' as never, roster: [champWarrior] });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival, champStable],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { arena_a: titleAt('champ_x', { refusals: 0 }) },
    });
    const impact = processAllRivalsBoutOffers(state, [rival]);
    const updated = impact.boutOffers?.[offer.id];
    expect(updated?.responses['w1' as WarriorId]).toBe('Declined');
    expect(updated?.responseNotes?.['w1' as WarriorId]).toBe('killer-champion');
  });
});
