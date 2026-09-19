/**
 * D.0 — Intel worker.
 * Weekly seeded scouting refreshes dossier planIntel on the most relevant
 * opponent (vendetta target > highest threat > player); scout quality varies
 * by owner personality; the player dossier can feed challenge selection.
 */
import { describe, it, expect } from 'vitest';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import {
  makeAgentMemory,
  makeGameState,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import type { StableId } from '@/types/shared.types';

describe('intelWorker', () => {
  it('seeding intel refreshes the vendetta target dossier planIntel', () => {
    const target = makeRival({ roster: [makeWarrior()], fame: 300 });
    const scout = makeRival({
      strategy: {
        intent: 'VENDETTA',
        planWeeksRemaining: 4,
        targetStableId: target.id,
      },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [scout, target] });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const dossier = updatedRival.agentMemory!.opponentDossiers[target.id];
    expect(dossier).toBeDefined();
    expect(dossier!.planIntel).toBeDefined();
    expect(dossier!.planIntel!.lastPlanWeek).toBe(state.absoluteWeek ?? state.week);
    expect(dossier!.planIntel!.suspectedOE).toBeGreaterThanOrEqual(0);
    expect(dossier!.planIntel!.suspectedAL).toBeGreaterThanOrEqual(0);
  });

  it('with no vendetta target, the highest-threat dossier is scouted', () => {
    const dangerous = makeRival({ fame: 900, roster: [makeWarrior()] });
    const harmless = makeRival({ fame: 10, roster: [makeWarrior()] });
    const scout = makeRival({
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [scout, dangerous, harmless], fame: 0 });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const dossier = updatedRival.agentMemory!.opponentDossiers[dangerous.id];
    expect(dossier!.planIntel).toBeDefined();
  });

  it('personality weighting: Tactician scouts produce tighter plan estimates', () => {
    const target = makeRival({
      fame: 300,
      roster: [makeWarrior()],
      owner: { id: 't-owner' as StableId, name: 'T', stableName: 'T', fame: 300, renown: 0, titles: 0, personality: 'Aggressive' },
    });
    const tactician = makeRival({
      owner: { id: 's-owner' as StableId, name: 'S', stableName: 'S', fame: 100, renown: 0, titles: 0, personality: 'Tactician' },
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: target.id },
      agentMemory: makeAgentMemory(),
    });
    const state = makeGameState({ rivals: [tactician, target] });
    const { updatedRival } = processIntel(tactician, state, buildPerceptionSnapshot(state));
    const oe = updatedRival.agentMemory!.opponentDossiers[target.id]!.planIntel!.suspectedOE!;
    // Aggressive owners plan high-OE; a Tactician's estimate lands near the truth band.
    expect(oe).toBeGreaterThan(0.4);
  });

  it('the player dossier is scouted when the vendetta targets the player', () => {
    const scout = makeRival({ agentMemory: makeAgentMemory() });
    const state = makeGameState({ rivals: [scout], roster: [makeWarrior({ fame: 200 })] });
    scout.strategy = {
      intent: 'VENDETTA',
      planWeeksRemaining: 4,
      targetStableId: state.player.id,
    };
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const dossier = updatedRival.agentMemory!.opponentDossiers[state.player.id];
    expect(dossier).toBeDefined();
    expect(dossier!.planIntel).toBeDefined();
  });

  it('logs an INTEL event with cause INTEL_UPDATE', () => {
    const target = makeRival({ roster: [makeWarrior()], fame: 300 });
    const scout = makeRival({
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: target.id },
      agentMemory: makeAgentMemory(),
      actionHistory: [],
    });
    const state = makeGameState({ rivals: [scout, target] });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const intelEvent = updatedRival.actionHistory!.find((e) => e.type === 'INTEL');
    expect(intelEvent).toBeDefined();
    expect(intelEvent!.cause).toBe('INTEL_UPDATE');
  });
});
