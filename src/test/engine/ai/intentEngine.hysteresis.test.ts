/**
 * Stage C.0 — strategy hysteresis: when a plan expires near a decision
 * boundary, the engine must not flip-flop intents week to week. A relaxed
 * "still applies" check keeps the current intent within a margin.
 */
import { describe, it, expect } from 'vitest';
import { updateAIStrategy, verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import { makeRival, makeWarrior, makeGameState, makeAgentMemory } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';

const roster = () =>
  Array.from({ length: 4 }, (_, i) =>
    makeWarrior({ style: FightingStyle.StrikingAttack, id: `w${i}` as never })
  );

describe('updateAIStrategy — hysteresis', () => {
  it('keeps RECOVERY when treasury recovers just past the trigger boundary', () => {
    const rival = makeRival({
      treasury: 210, // above the 200 RECOVERY trigger, within hysteresis margin
      roster: roster(),
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 0 },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    const next = updateAIStrategy(rival, state, 42);
    expect(next.intent).toBe('RECOVERY');
  });

  it('does switch when the old intent is truly resolved (far past margin)', () => {
    const rival = makeRival({
      treasury: 3000,
      roster: roster(),
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 0 },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    const next = updateAIStrategy(rival, state, 42);
    expect(next.intent).not.toBe('RECOVERY');
  });

  it('does not extend a plan that still has weeks remaining', () => {
    const rival = makeRival({
      treasury: 210,
      roster: roster(),
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 3 },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [rival], weather: 'Clear', arenaHistory: [] });
    const next = updateAIStrategy(rival, state, 42);
    expect(next.intent).toBe('RECOVERY');
    expect(next.planWeeksRemaining).toBe(2);
  });
});

describe('verifyIntentSkepticism — typed-cause checks', () => {
  it('disproves a VENDETTA plan when no grudge exists and target is gone', () => {
    const rival = makeRival({
      roster: roster(),
      treasury: 1000,
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'ghost-stable' as never },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [rival], ownerGrudges: [], arenaHistory: [] });
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });

  it('keeps a VENDETTA plan while a grudge lives', () => {
    const rival = makeRival({
      roster: roster(),
      treasury: 1000,
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4 },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({
      rivals: [rival],
      ownerGrudges: [
        {
          id: 'g1' as never,
          ownerIdA: rival.owner.id,
          ownerIdB: 'enemy' as never,
          intensity: 4,
          reason: 'blood',
          startWeek: 1,
          lastEscalation: 2,
        },
      ],
      arenaHistory: [],
    });
    expect(verifyIntentSkepticism(rival, state)).toBe(false);
  });
});
