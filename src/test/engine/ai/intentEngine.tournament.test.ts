/**
 * Stage C.0 — TOURNAMENT_CAMPAIGN intent: fires in the pre-tournament window
 * (weeks 10–13) for stables healthy enough to contend. It shapes preparation
 * only — committee selection stays rank-based.
 */
import { describe, it, expect } from 'vitest';
import { pickWeeklyIntent, updateAIStrategy } from '@/engine/ai/intentEngine';
import { makeRival, makeWarrior, makeGameState, makeAgentMemory } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';

const contenders = () =>
  Array.from({ length: 5 }, (_, i) =>
    makeWarrior({ style: FightingStyle.StrikingAttack, id: `w${i}` as never, fame: 60 })
  );

describe('TOURNAMENT_CAMPAIGN', () => {
  it('fires in weeks 10–13 for an eligible stable', () => {
    const rival = makeRival({ treasury: 900, roster: contenders() });
    const state = makeGameState({ rivals: [rival], week: 11, weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(rival, state, 42)).toBe('TOURNAMENT_CAMPAIGN');
  });

  it('does not fire outside the window', () => {
    const rival = makeRival({ treasury: 900, roster: contenders() });
    const state = makeGameState({ rivals: [rival], week: 6, weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(rival, state, 42)).not.toBe('TOURNAMENT_CAMPAIGN');
  });

  it('does not fire for a crisis stable (thin roster / broke)', () => {
    const broke = makeRival({ treasury: 50, roster: contenders() });
    const thin = makeRival({ treasury: 900, roster: [makeWarrior()] });
    const state = makeGameState({ week: 11, weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(broke, state, 42)).not.toBe('TOURNAMENT_CAMPAIGN');
    expect(pickWeeklyIntent(thin, state, 42)).not.toBe('TOURNAMENT_CAMPAIGN');
  });

  it('strategy carries a human-readable reason', () => {
    const rival = makeRival({ treasury: 900, roster: contenders() });
    const state = makeGameState({ rivals: [rival], week: 11, weather: 'Clear', arenaHistory: [] });
    const next = updateAIStrategy(rival, state, 42);
    expect(next.intent).toBe('TOURNAMENT_CAMPAIGN');
    expect(next.reason).toBeTruthy();
  });

  it('campaign ends after the tournament window', () => {
    const rival = makeRival({
      treasury: 900,
      roster: contenders(),
      strategy: { intent: 'TOURNAMENT_CAMPAIGN', planWeeksRemaining: 0 },
      agentMemory: makeAgentMemory(),
    });
    // Week 1 of the new season — window closed
    const state = makeGameState({ rivals: [rival], week: 1, weather: 'Clear', arenaHistory: [] });
    const next = updateAIStrategy(rival, state, 42);
    expect(next.intent).not.toBe('TOURNAMENT_CAMPAIGN');
  });

  it('crisis stables decline tournament conscription (G13 decline hook)', async () => {
    const { committeeSelection } = await import(
      '@/engine/matchmaking/tournamentSelection/committee'
    );
    const crisis = makeRival({
      roster: contenders().map((w, i) => ({ ...w, id: `crisis-${i}` as never })),
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });
    const eager = makeRival({
      roster: contenders().map((w, i) => ({ ...w, id: `eager-${i}` as never })),
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4 },
    });
    const state = makeGameState({
      rivals: [crisis, eager],
      realmRankings: {},
      arenaHistory: [],
    });
    // Give every warrior a ranking so they're eligible
    for (const r of state.rivals) {
      for (const w of r.roster) {
        state.realmRankings[w.id] = { overallRank: 10, classRank: 1, compositeScore: 50 };
      }
    }
    const { warriors } = committeeSelection(state, 'Regional', 42, new Set());
    const crisisIds = new Set(crisis.roster.map((w) => w.id));
    expect(warriors.every((w) => !crisisIds.has(w.id))).toBe(true);
    expect(warriors.some((w) => eager.roster.some((ew) => ew.id === w.id))).toBe(true);
  });
});
