/**
 * Stage C — intents service the season objective. `pickWeeklyIntent`
 * remains the weekly cascade, but a live `seasonObjective` biases the
 * pick toward its servicing intent (TREASURY → WEALTH_ACCUMULATION,
 * CROWN → CROWN_CAMPAIGN), and `verifyIntentSkepticism` gains an
 * objective-infeasible tier so a disproved objective forces a re-pick.
 */
import { describe, it, expect } from 'vitest';
import { pickWeeklyIntent, verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeAgentMemory,
  makeStrategy,
} from '@/test/_fixtures/factories';
import type { SeasonObjective } from '@/types/state.types';

const objective = (over: Partial<SeasonObjective> = {}): SeasonObjective => ({
  kind: 'TREASURY',
  weeksRemaining: 10,
  reason: 'test',
  ...over,
});

/** Six active warriors + healthy treasury → the bare cascade idles at
 *  CONSOLIDATION (roster ≥ Pragmatic min, no season record, no crown). */
const steadyRival = (seasonObjective?: SeasonObjective) =>
  makeRival({
    treasury: 5000,
    roster: Array.from({ length: 6 }, () => makeWarrior()),
    agentMemory: makeAgentMemory({ seasonObjective }),
    strategy: makeStrategy({ intent: 'CONSOLIDATION', planWeeksRemaining: 4 }),
  });

describe('objective biases the weekly pick', () => {
  it('no objective → CONSOLIDATION baseline', () => {
    const rival = steadyRival();
    const intent = pickWeeklyIntent(rival, makeGameState({ rivals: [rival] }));
    expect(intent).toBe('CONSOLIDATION');
  });

  it('TREASURY objective → WEALTH_ACCUMULATION on the same stable', () => {
    const rival = steadyRival(objective({ kind: 'TREASURY', treasuryTarget: 10000 }));
    const intent = pickWeeklyIntent(rival, makeGameState({ rivals: [rival] }));
    expect(intent).toBe('WEALTH_ACCUMULATION');
  });

  it('CROWN objective commits through a lean week the bare cascade would skip', () => {
    // Treasury 350 sits below crownCampaignPicked's 400 floor — without the
    // objective the stable cannot campaign this week; the objective says
    // the crown is the season's business and the intent holds anyway.
    const w = makeWarrior();
    const rival = makeRival({
      treasury: 350,
      roster: [w, ...Array.from({ length: 5 }, () => makeWarrior())],
      agentMemory: makeAgentMemory({
        seasonObjective: objective({ kind: 'CROWN', targetArenaId: 'arena_a' }),
        crownAssessment: { arenaId: 'arena_a', warriorId: w.id, score: 6, reason: 'Winnable' },
      }),
      strategy: makeStrategy({ intent: 'CONSOLIDATION', planWeeksRemaining: 4 }),
    });
    const state = makeGameState({ rivals: [rival] });

    const leanTwin = { ...rival, agentMemory: makeAgentMemory({ crownAssessment: rival.agentMemory!.crownAssessment }) };
    expect(pickWeeklyIntent(leanTwin, state)).not.toBe('CROWN_CAMPAIGN');
    expect(pickWeeklyIntent(rival, state)).toBe('CROWN_CAMPAIGN');
  });
});

describe('objective-infeasible skepticism tier', () => {
  it('a disproved objective disproves the strategy it spawned', () => {
    const w = makeWarrior();
    const rival = makeRival({
      treasury: 5000,
      roster: [w],
      agentMemory: makeAgentMemory({
        seasonObjective: objective({ kind: 'CROWN', targetArenaId: 'arena_a' }),
        crownAssessment: { arenaId: 'arena_a', warriorId: w.id, score: 6, reason: 'Winnable' },
      }),
      strategy: makeStrategy({ intent: 'CROWN_CAMPAIGN', planWeeksRemaining: 4 }),
    });
    const state = makeGameState({ rivals: [rival] });
    expect(verifyIntentSkepticism(rival, state)).toBe(false);

    // Assessment lapses → the CROWN objective is infeasible → re-pick.
    rival.agentMemory!.crownAssessment = undefined;
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });
});
