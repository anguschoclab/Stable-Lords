// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCampaignFocus } from '@/engine/advisor/campaignFocusEvaluator';
import { computeStableCouncilReport } from '@/engine/advisor/stableCouncilService';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { makeWarrior, makeGameState, makeRival, resetFixtureIds } from '@/test/_fixtures/factories';
import { makeArenaContender, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

const ARENA = 'standard_arena';



describe('evaluateCampaignFocus — CROWN_BID', () => {
  it('marks a ranked contender for crown pursuit', () => {
    const contender = makeArenaContender('w1', 4);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [contender],
      arenaChampions: { [ARENA]: makeArenaTitle('someone_else') },
    });
    const index = buildContenderIndex(state);
    expect(evaluateCampaignFocus(contender, state, index)).toBe('CROWN_BID');
  });

  it('does not mark the reigning champion', () => {
    const champ = makeArenaContender('w1', 6);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [champ],
      arenaChampions: { [ARENA]: makeArenaTitle('w1') },
    });
    const index = buildContenderIndex(state);
    expect(evaluateCampaignFocus(champ, state, index)).not.toBe('CROWN_BID');
  });

  it('does not mark warriors off the contender ladder', () => {
    const green = makeWarrior({ id: 'w1' as WarriorId, age: 20 });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [green],
      arenaChampions: { [ARENA]: makeArenaTitle(null) },
    });
    const index = buildContenderIndex(state);
    // 0 bouts & young → PROSPECT_DEV, not a crown bid
    expect(evaluateCampaignFocus(green, state, index)).toBe('PROSPECT_DEV');
  });

  it('REHABILITATION still outranks a crown bid', () => {
    const contender = makeArenaContender('w1', 4);
    contender.fatigue = 60;
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [contender],
      arenaChampions: { [ARENA]: makeArenaTitle(null) },
    });
    const index = buildContenderIndex(state);
    expect(evaluateCampaignFocus(contender, state, index)).toBe('REHABILITATION');
  });
});

describe('stable council — crown contention surfacing', () => {
  it('flags a title-contention directive when a warrior holds a crown bid', () => {
    const contender = makeArenaContender('w1', 5);
    const rivalContender = makeArenaContender('rx', 3);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [contender],
      rivals: [makeRival({ roster: [rivalContender] })],
      arenaChampions: { [ARENA]: makeArenaTitle('champ_x') },
      boutOffers: {},
    });
    const report = computeStableCouncilReport(state);
    const card = report.cards.find((c) => c.warriorId === contender.id);
    expect(card?.campaignFocus).toBe('CROWN_BID');
    expect(report.summary.stableDirectives.some((d) => /crown|title/i.test(d))).toBe(true);
  });
});
