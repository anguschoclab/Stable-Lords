// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { assignCampaignRoles } from '@/engine/ai/workers/crownWorker';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { evaluateBoutOffers } from '@/engine/advisor/boutOfferAdvisor';
import {
  makeWarrior,
  makeGameState,
  makeRival,
  makeBoutOffer,
  makeOwner,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

const ARENA = 'standard_arena';

function venueWarrior(id: string, wins: number, losses = 0) {
  return makeVenueWarrior(id, { wins, losses, arenaId: ARENA, age: 22 });
}

function titleAt(championId: string | null): ArenaTitle {
  return makeArenaTitle(championId);
}

describe('assignCampaignRoles — rival per-warrior roles', () => {
  it('stamps the shared campaignFocus field on rival warriors', () => {
    const contender = venueWarrior('w1', 5);
    const prospect = makeWarrior({ id: 'w2' as WarriorId, age: 19 });
    const rival = makeRival({ roster: [contender, prospect] });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival],
      arenaChampions: { [ARENA]: titleAt('champ_x') },
    });
    const updated = assignCampaignRoles(rival, state);
    expect(updated.roster.find((w) => w.id === contender.id)?.campaignFocus).toBe('CROWN_BID');
    expect(updated.roster.find((w) => w.id === prospect.id)?.campaignFocus).toBe('PROSPECT_DEV');
  });

  it('rehab-focused warriors carry a recovery assignment', () => {
    const exhausted = venueWarrior('w1', 5);
    exhausted.fatigue = 55;
    const rival = makeRival({ roster: [exhausted] });
    const state = makeGameState({ week: 5, absoluteWeek: 5, rivals: [rival] });
    const updated = assignCampaignRoles(rival, state);
    const rest = (updated.trainingAssignments ?? []).find((a) => a.warriorId === exhausted.id);
    expect(rest?.type).toBe('recovery');
  });
});

describe('rival roles — evaluateBoutOffer parity', () => {
  it('a PURSE_HUNTER rival warrior takes a thin purse instead of countering', () => {
    const hunter = makeWarrior({
      id: 'w1' as WarriorId,
      fame: 200,
      campaignFocus: 'PURSE_HUNTER',
    });
    const rival = makeRival({ roster: [hunter], owner: makeOwner({ personality: 'Pragmatic' }) });
    const offer = makeBoutOffer({
      warriorIds: ['w1' as WarriorId, 'opp' as WarriorId],
      purse: 80, // far below the fame floor (200-50)
      status: 'Proposed',
      responses: { w1: 'Pending', opp: 'Accepted' } as never,
    });
    const opponent = makeWarrior({ id: 'opp' as WarriorId, fame: 60 });
    expect(evaluateBoutOffer(offer, rival, hunter, 5, 'Clear', opponent)).toBe('Accepted');
  });

  it('rival and advisor paths agree on a clean favorable offer', () => {
    const w = makeWarrior({ id: 'w1' as WarriorId, fame: 100 });
    const opp = makeWarrior({ id: 'opp' as WarriorId, fame: 90 });
    const offer = makeBoutOffer({
      warriorIds: ['w1' as WarriorId, 'opp' as WarriorId],
      purse: 250,
      status: 'Proposed',
      boutWeek: 6,
      createdAbsoluteWeek: 5,
      responses: { w1: 'Pending', opp: 'Accepted' } as never,
    });
    const rival = makeRival({ roster: [w] });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [w],
      rivals: [makeRival({ id: 'r2' as never, roster: [opp] })],
      boutOffers: { [offer.id]: offer },
    });
    const rivalVerdict = evaluateBoutOffer(offer, rival, w, 5, 'Clear', opp, state);
    const advisorVerdict = evaluateBoutOffers(w, state, 'PURSE_HUNTER');
    expect(rivalVerdict).toBe('Accepted');
    expect(advisorVerdict.action).toBe('ACCEPT_OFFER');
  });
});
