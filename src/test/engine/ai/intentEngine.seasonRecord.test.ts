/**
 * Stage C.0 — G1: with seasonRecord now populated (Stage B), the
 * seasonWinRate-driven intent branches must actually fire.
 */
import { describe, it, expect } from 'vitest';
import { pickWeeklyIntent } from '@/engine/ai/intentEngine';
import { makeRival, makeWarrior, makeGameState, makeAgentMemory } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';

const healthyRoster = () =>
  Array.from({ length: 4 }, (_, i) =>
    makeWarrior({ style: FightingStyle.StrikingAttack, id: `w${i}` as never })
  );

describe('pickWeeklyIntent — live seasonRecord', () => {
  it('RECOVERY fires on a losing season (<0.3 winrate, ≥6 fights)', () => {
    const rival = makeRival({
      treasury: 2000,
      roster: healthyRoster(),
      agentMemory: makeAgentMemory({
        seasonRecord: { wins: 1, losses: 6, kills: 0, rosterSizeAtSeasonStart: 4 },
      }),
    });
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(rival, state, 42)).toBe('RECOVERY');
  });

  it('does NOT fire RECOVERY before 6 season fights (insufficient data)', () => {
    const rival = makeRival({
      treasury: 2000,
      roster: healthyRoster(),
      agentMemory: makeAgentMemory({
        seasonRecord: { wins: 0, losses: 3, kills: 0, rosterSizeAtSeasonStart: 4 },
      }),
    });
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(rival, state, 42)).not.toBe('RECOVERY');
  });

  it('WEALTH_ACCUMULATION fires for a thriving Methodical stable', () => {
    const rival = makeRival({
      treasury: 2000,
      roster: healthyRoster(),
      agentMemory: makeAgentMemory({
        seasonRecord: { wins: 6, losses: 2, kills: 0, rosterSizeAtSeasonStart: 4 },
      }),
    });
    rival.owner.personality = 'Methodical';
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    expect(pickWeeklyIntent(rival, state, 42)).toBe('WEALTH_ACCUMULATION');
  });
});
