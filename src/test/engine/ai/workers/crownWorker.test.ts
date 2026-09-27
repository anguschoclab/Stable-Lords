// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  assessCrownOpportunity,
  processCrownPosture,
} from '@/engine/ai/workers/crownWorker';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeAgentMemory,
  makeOwner,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { ARENA_COMMISSION_ID } from '@/constants/arena';
import type { ArenaTitle, BoutOffer, GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

function venueWarrior(id: string, arenaId: string, rec: { wins: number; losses: number }) {
  return makeWarrior({
    id: id as WarriorId,
    career: {
      wins: rec.wins,
      losses: rec.losses,
      kills: 0,
      byArena: { [arenaId]: { wins: rec.wins, losses: rec.losses, kills: 0 } },
    },
  });
}

function titleAt(championId: string | null, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: championId
      ? {
          warriorId: championId as WarriorId,
          startedAbsoluteWeek: 1,
          defenses: 2,
          lastActivityWeek: 1,
        }
      : null,
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...over,
  };
}

function signedTitleOffer(
  warriorId: string,
  opponentId: string,
  arenaId: string,
  over: Partial<BoutOffer> = {}
): BoutOffer {
  return makeBoutOffer({
    warriorIds: [warriorId as WarriorId, opponentId as WarriorId],
    promoterId: ARENA_COMMISSION_ID as BoutOffer['promoterId'],
    titleArenaId: arenaId,
    status: 'Signed',
    boutWeek: 8,
    createdAbsoluteWeek: 5,
    responses: { [warriorId]: 'Accepted', [opponentId]: 'Accepted' } as BoutOffer['responses'],
    ...over,
  });
}

function world(over: Partial<GameState> = {}): GameState {
  return makeGameState({ week: 5, absoluteWeek: 5, ...over });
}

describe('assessCrownOpportunity', () => {
  it('returns undefined when the world has no titles', () => {
    const rival = makeRival({ roster: [venueWarrior('w1', 'arena_a', { wins: 3, losses: 0 })] });
    expect(assessCrownOpportunity(rival, world())).toBeUndefined();
  });

  it('targets a vacant arena the stable can contend at', () => {
    const contender = venueWarrior('w1', 'arena_a', { wins: 3, losses: 1 });
    const rival = makeRival({ roster: [contender] });
    const state = world({ arenaChampions: { arena_a: titleAt(null) } });
    const assessment = assessCrownOpportunity(rival, state);
    expect(assessment?.arenaId).toBe('arena_a');
    expect(assessment?.warriorId).toBe('w1');
  });

  it('prefers the vacant title over a dominant champion', () => {
    // Eligible at both arenas; arena_b's champion is 10-0 there.
    const dual = makeWarrior({
      id: 'w1' as WarriorId,
      career: {
        wins: 8,
        losses: 0,
        kills: 0,
        byArena: {
          arena_a: { wins: 3, losses: 0, kills: 0 },
          arena_b: { wins: 5, losses: 0, kills: 0 },
        },
      },
    });
    const dominantChamp = venueWarrior('champ', 'arena_b', { wins: 10, losses: 0 });
    const rival = makeRival({ roster: [dual] });
    const holder = makeRival({ id: 'holder' as never, roster: [dominantChamp] });
    const state = world({
      rivals: [rival, holder],
      arenaChampions: {
        arena_a: titleAt(null),
        arena_b: titleAt('champ'),
      },
    });
    const assessment = assessCrownOpportunity(rival, state);
    expect(assessment?.arenaId).toBe('arena_a');
  });

  it('never campaigns a warrior who already reigns (single-crown rule)', () => {
    const champ = venueWarrior('w1', 'arena_b', { wins: 4, losses: 0 });
    const rival = makeRival({ roster: [champ] });
    const state = world({
      arenaChampions: {
        arena_b: titleAt('w1'), // w1 already reigns here
        arena_a: titleAt(null),
      },
    });
    expect(assessCrownOpportunity(rival, state)).toBeUndefined();
  });

  it('de-prioritizes a champion whose stable has observed aggressive tells', () => {
    // Two equally-strong champions; the dossier says arena_a's holder fights
    // high-OE. A calculating stable prefers the calm throne at arena_b.
    const dual = makeWarrior({
      id: 'w1' as WarriorId,
      career: {
        wins: 8,
        losses: 0,
        kills: 0,
        byArena: {
          arena_a: { wins: 4, losses: 0, kills: 0 },
          arena_b: { wins: 4, losses: 0, kills: 0 },
        },
      },
    });
    const champA = venueWarrior('champ_a', 'arena_a', { wins: 6, losses: 0 });
    const champB = venueWarrior('champ_b', 'arena_b', { wins: 6, losses: 0 });
    const holderA = makeRival({ id: 'aggro-stable' as never, roster: [champA] });
    const holderB = makeRival({ id: 'calm-stable' as never, roster: [champB] });
    const rival = makeRival({
      roster: [dual],
      owner: makeOwner({ personality: 'Methodical' }),
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          'aggro-stable': {
            lastSeenWeek: 5,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
            observedTells: { oe: 0.9, al: 0.2, samples: 4, lastSeenWeek: 5 },
          },
          'calm-stable': {
            lastSeenWeek: 5,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
            observedTells: { oe: 0.2, al: 0.8, samples: 4, lastSeenWeek: 5 },
          },
        },
      }),
    });
    const state = world({
      rivals: [rival, holderA, holderB],
      arenaChampions: {
        arena_a: titleAt('champ_a'),
        arena_b: titleAt('champ_b'),
      },
    });
    const assessment = assessCrownOpportunity(rival, state);
    expect(assessment?.arenaId).toBe('arena_b');
  });

  it('skips contenders still cooling down after a declined shot', () => {
    const contender = venueWarrior('w1', 'arena_a', { wins: 3, losses: 0 });
    const rival = makeRival({ roster: [contender] });
    const state = world({
      arenaChampions: {
        arena_a: titleAt(null, { declinedContenders: { w1: 20 } }),
      },
    });
    expect(assessCrownOpportunity(rival, state)).toBeUndefined();
  });
});

describe('processCrownPosture', () => {
  it('persists the assessment into agent memory', () => {
    const contender = venueWarrior('w1', 'arena_a', { wins: 3, losses: 1 });
    const rival = makeRival({ roster: [contender] });
    const state = world({ arenaChampions: { arena_a: titleAt(null) } });
    const { updatedRival } = processCrownPosture(rival, state);
    expect(updatedRival.agentMemory?.crownAssessment?.arenaId).toBe('arena_a');
  });

  it('marks an aging, declining champion for relinquishment', () => {
    const oldChamp = venueWarrior('w1', 'arena_a', { wins: 6, losses: 3 });
    oldChamp.age = 34;
    const rival = makeRival({
      roster: [oldChamp],
      agentMemory: makeAgentMemory({
        seasonRecord: { wins: 0, losses: 4, kills: 0, rosterSizeAtSeasonStart: 4 },
      }),
    });
    const state = world({ arenaChampions: { arena_a: titleAt('w1') } });
    const { updatedRival } = processCrownPosture(rival, state);
    expect(updatedRival.agentMemory?.pendingRelinquish).toBe('arena_a');
  });

  it('keeps a healthy prime champion on the throne', () => {
    const champ = venueWarrior('w1', 'arena_a', { wins: 6, losses: 0 });
    const rival = makeRival({ roster: [champ] });
    const state = world({ arenaChampions: { arena_a: titleAt('w1') } });
    const { updatedRival } = processCrownPosture(rival, state);
    expect(updatedRival.agentMemory?.pendingRelinquish).toBeUndefined();
  });

  it('rests a warrior already signed for a title bout', () => {
    const challenger = venueWarrior('w1', 'arena_a', { wins: 3, losses: 0 });
    const rival = makeRival({ roster: [challenger] });
    const signed = signedTitleOffer('w1', 'champ_x', 'arena_a');
    const state = world({
      arenaChampions: { arena_a: titleAt('champ_x') },
      boutOffers: { [signed.id]: signed },
    });
    const { updatedRival } = processCrownPosture(rival, state);
    const rest = (updatedRival.trainingAssignments ?? []).find(
      (a) => a.warriorId === challenger.id
    );
    expect(rest?.type).toBe('recovery');
  });

  it('rests reigning champions inside the Grand Championship prep window', () => {
    const champ = venueWarrior('w1', 'arena_a', { wins: 6, losses: 0 });
    const rival = makeRival({ roster: [champ] });
    const state = world({
      week: 51,
      absoluteWeek: 51,
      arenaChampions: { arena_a: titleAt('w1') },
    });
    const { updatedRival } = processCrownPosture(rival, state);
    const rest = (updatedRival.trainingAssignments ?? []).find((a) => a.warriorId === champ.id);
    expect(rest?.type).toBe('recovery');
  });

  it('does not rest champions outside the prep window', () => {
    const champ = venueWarrior('w1', 'arena_a', { wins: 6, losses: 0 });
    const rival = makeRival({ roster: [champ] });
    const state = world({
      week: 40,
      absoluteWeek: 40,
      arenaChampions: { arena_a: titleAt('w1') },
    });
    const { updatedRival } = processCrownPosture(rival, state);
    expect(updatedRival.trainingAssignments ?? []).toHaveLength(0);
  });
});
