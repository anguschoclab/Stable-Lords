/**
 * D.0 — Tournament worker.
 * TOURNAMENT_CAMPAIGN shapes preparation only: top-2 fame warriors get rest
 * (recovery) assignments that suppress bids via isBookable, plus a typed
 * TOURNAMENT_PREP event. Committee selection stays rank-based (G13).
 */
import { describe, it, expect } from 'vitest';
import { processTournamentPrep } from '@/engine/ai/workers/tournamentWorker';
import {
  makeAgentMemory,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';

function campaignRival() {
  return makeRival({
    roster: [
      makeWarrior({ fame: 300 }),
      makeWarrior({ fame: 250 }),
      makeWarrior({ fame: 100 }),
      makeWarrior({ fame: 50 }),
    ],
    strategy: { intent: 'TOURNAMENT_CAMPAIGN', planWeeksRemaining: 3 },
    agentMemory: makeAgentMemory(),
    actionHistory: [],
    trainingAssignments: [],
  });
}

describe('tournamentWorker', () => {
  it('rests the top-2 fame warriors during TOURNAMENT_CAMPAIGN', () => {
    const rival = campaignRival();
    const { updatedRival } = processTournamentPrep(rival, 11);
    const rested = new Set(
      updatedRival.trainingAssignments
        .filter((a) => a.type === 'recovery')
        .map((a) => a.warriorId as string)
    );
    const byFame = [...rival.roster].sort((a, b) => b.fame - a.fame);
    expect(rested.has(byFame[0]!.id as string)).toBe(true);
    expect(rested.has(byFame[1]!.id as string)).toBe(true);
    expect(rested.size).toBe(2);
  });

  it('logs a ROSTER event with cause TOURNAMENT_PREP', () => {
    const rival = campaignRival();
    const { updatedRival } = processTournamentPrep(rival, 11);
    const event = updatedRival.actionHistory!.find((e) => e.cause === 'TOURNAMENT_PREP');
    expect(event).toBeDefined();
    expect(event!.type).toBe('ROSTER');
  });

  it('no-op outside TOURNAMENT_CAMPAIGN', () => {
    const rival = campaignRival();
    rival.strategy = { intent: 'CONSOLIDATION', planWeeksRemaining: 3 };
    const { updatedRival } = processTournamentPrep(rival, 11);
    expect(updatedRival.trainingAssignments).toHaveLength(0);
    expect(updatedRival.actionHistory).toHaveLength(0);
  });
});
