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
  makeBoutOffer,
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

  it('prefers the upcoming title opponent over a merely-famous stable', () => {
    // Plan D.4: scout order vendetta > threat > upcoming title opponent > player.
    const challenger = makeWarrior({ id: 'sw1' as never });
    const champWarrior = makeWarrior({ id: 'cw1' as never });
    const champStable = makeRival({
      id: 'champ-stable' as never,
      roster: [champWarrior],
      owner: { id: 'cs-owner' as never, name: 'CS', stableName: 'CS', fame: 50, renown: 0, titles: 0, personality: 'Pragmatic' },
    });
    const famous = makeRival({
      id: 'famous' as never,
      roster: [makeWarrior()],
      owner: { id: 'f-owner' as never, name: 'F', stableName: 'F', fame: 999, renown: 0, titles: 0, personality: 'Pragmatic' },
    });
    const scout = makeRival({
      id: 's1' as never,
      roster: [challenger],
      strategy: { intent: 'CROWN_CAMPAIGN', planWeeksRemaining: 4 },
      agentMemory: makeAgentMemory(),
    });
    const titleOffer = makeBoutOffer({
      warriorIds: [champWarrior.id, challenger.id],
      titleArenaId: 'arena_a',
      status: 'Signed',
      responses: { [champWarrior.id]: 'Accepted', [challenger.id]: 'Accepted' } as never,
    });
    const state = makeGameState({
      rivals: [scout, champStable, famous],
      boutOffers: { [titleOffer.id]: titleOffer },
    });

    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    expect(updatedRival.agentMemory!.opponentDossiers['champ-stable']!.planIntel).toBeDefined();
    expect(updatedRival.agentMemory!.opponentDossiers['famous']?.planIntel).toBeUndefined();
  });

  it('blends persisted dossier observedTells into the plan estimate', () => {
    // An Aggressive owner's reputation says high-OE, but witnessed fights say
    // the stable actually plans cautiously — the estimate follows what was seen.
    const target = makeRival({
      fame: 300,
      roster: [makeWarrior()],
      owner: { id: 't-owner' as never, name: 'T', stableName: 'T', fame: 300, renown: 0, titles: 0, personality: 'Aggressive' },
    });
    const scout = makeRival({
      owner: { id: 's-owner' as never, name: 'S', stableName: 'S', fame: 100, renown: 0, titles: 0, personality: 'Tactician' },
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: target.id },
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          [target.id]: {
            lastSeenWeek: 4,
            knownStyles: [],
            estimatedThreat: 0.7,
            recordVs: { w: 0, l: 0, k: 0 },
            observedTells: { oe: 0.1, al: 0.9, samples: 3, lastSeenWeek: 4 },
          },
        },
      }),
    });
    const state = makeGameState({ rivals: [scout, target], absoluteWeek: 5 });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const intel = updatedRival.agentMemory!.opponentDossiers[target.id]!.planIntel!;
    // 0.9-quality scout: 0.75 bias * 0.1 + 0.1 tells * 0.9 ≈ 0.17 ± jitter — far below the 0.5 midpoint.
    expect(intel.suspectedOE!).toBeLessThan(0.5);
    expect(intel.suspectedAL!).toBeGreaterThan(0.5);
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
