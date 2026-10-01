// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  pickWeeklyIntent,
  verifyIntentSkepticism,
  updateAIStrategy,
  intentStillApplies,
} from '@/engine/ai/intentEngine';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeAgentMemory,
  makeOwner,
} from '@/test/_fixtures/factories';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

function titleWithChampion(warriorId: string, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: {
      warriorId: warriorId as WarriorId,
      startedAbsoluteWeek: 1,
      defenses: 0,
      lastActivityWeek: 1,
    },
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...over,
  };
}

function crownAssessment(arenaId = 'arena_a', warriorId = 'w1') {
  return {
    arenaId,
    warriorId: warriorId as WarriorId,
    score: 4,
    reason: 'Vacant crown at arena_a',
  };
}

/** Roster that clears the EXPANSION and ROSTER_DIVERSITY triggers. */
const diverseRoster = () =>
  [
    'BASHING ATTACK',
    'SLASHING ATTACK',
    'STRIKING ATTACK',
    'AIMED BLOW',
    'LUNGING ATTACK',
    'WALL OF STEEL',
  ].map((style, i) =>
    makeWarrior({ id: `w${i + 1}` as WarriorId, style: style as never, status: 'Active' })
  );

function contenderRival(over: Parameters<typeof makeRival>[0] = {}) {
  return makeRival({
    treasury: 1000,
    owner: makeOwner({ personality: 'Pragmatic', fame: 700 }),
    roster: diverseRoster(),
    ...over,
  });
}

describe('pickWeeklyIntent — CROWN_CAMPAIGN', () => {
  it('returns CROWN_CAMPAIGN when the memory holds a crown assessment', () => {
    const rival = contenderRival({
      agentMemory: makeAgentMemory({ crownAssessment: crownAssessment() }),
    });
    const state = makeGameState({ week: 5 });
    expect(pickWeeklyIntent(rival, state)).toBe('CROWN_CAMPAIGN');
  });

  it('does not campaign without an assessment', () => {
    const rival = contenderRival();
    const state = makeGameState({ week: 5 });
    expect(pickWeeklyIntent(rival, state)).toBe('CONSOLIDATION');
  });

  it('RECOVERY still overrides crown campaigning when broke', () => {
    const rival = contenderRival({
      treasury: 100,
      agentMemory: makeAgentMemory({ crownAssessment: crownAssessment() }),
    });
    const state = makeGameState({ week: 5 });
    expect(pickWeeklyIntent(rival, state)).toBe('RECOVERY');
  });
});

describe('updateAIStrategy — crown campaign', () => {
  it('stores the target arena on the strategy', () => {
    const rival = contenderRival({
      agentMemory: makeAgentMemory({ crownAssessment: crownAssessment('arena_b', 'w2') }),
    });
    const state = makeGameState({ week: 5 });
    const strategy = updateAIStrategy(rival, state);
    expect(strategy.intent).toBe('CROWN_CAMPAIGN');
    expect(strategy.targetArenaId).toBe('arena_b');
    expect(strategy.planWeeksRemaining).toBeGreaterThan(0);
  });
});

function campaigningRival(over: Parameters<typeof makeRival>[0] = {}) {
  return contenderRival({
    strategy: {
      intent: 'CROWN_CAMPAIGN',
      targetArenaId: 'arena_a',
      planWeeksRemaining: 4,
    },
    agentMemory: makeAgentMemory({ crownAssessment: crownAssessment() }),
    ...over,
  });
}

describe('intentStillApplies / verifyIntentSkepticism — crown campaign', () => {
  it('stays valid while the assessment lives and the crown is unclaimed', () => {
    const rival = campaigningRival();
    const state = makeGameState({
      week: 5,
      arenaChampions: { arena_a: titleWithChampion('other_champ') },
    });
    expect(intentStillApplies(rival, state, 'CROWN_CAMPAIGN')).toBe(true);
    expect(verifyIntentSkepticism(rival, state)).toBe(false);
  });

  it('is disproved when the assessment is gone', () => {
    const rival = campaigningRival({
      agentMemory: makeAgentMemory({ crownAssessment: undefined }),
    });
    const state = makeGameState({ week: 5 });
    expect(intentStillApplies(rival, state, 'CROWN_CAMPAIGN')).toBe(false);
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });

  it('is disproved when the campaign warrior already reigns at the target', () => {
    const rival = campaigningRival({
      agentMemory: makeAgentMemory({ crownAssessment: crownAssessment('arena_a', 'w1') }),
    });
    const state = makeGameState({
      week: 5,
      arenaChampions: { arena_a: titleWithChampion('w1') },
    });
    expect(intentStillApplies(rival, state, 'CROWN_CAMPAIGN')).toBe(false);
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });

  it('is disproved when the campaign warrior is no longer active', () => {
    const rival = campaigningRival({
      roster: [makeWarrior({ id: 'w1' as WarriorId, status: 'Dead' }), ...diverseRoster().slice(1)],
      agentMemory: makeAgentMemory({ crownAssessment: crownAssessment('arena_a', 'w1') }),
    });
    const state = makeGameState({ week: 5 });
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });
});
