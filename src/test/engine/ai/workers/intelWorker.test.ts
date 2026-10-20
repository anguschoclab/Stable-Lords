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
  makeOwner,
  makePlan,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { AI_SCOUT_REPORT_CAP } from '@/constants/ai';
import { FightingStyle, type StableId } from '@/types/shared.types';
import type { ScoutReportData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

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
    const state = makeGameState({ rivals: [scout, dangerous, harmless] });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const dossier = updatedRival.agentMemory!.opponentDossiers[dangerous.id];
    expect(dossier!.planIntel).toBeDefined();
  });

  it('personality weighting: Tactician scouts produce tighter plan estimates', () => {
    const target = makeRival({
      fame: 300,
      roster: [makeWarrior()],
      owner: {
        id: 't-owner' as StableId,
        name: 'T',
        stableName: 'T',
        fame: 300,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const tactician = makeRival({
      owner: {
        id: 's-owner' as StableId,
        name: 'S',
        stableName: 'S',
        fame: 100,
        renown: 0,
        titles: 0,
        personality: 'Tactician',
      },
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
      owner: {
        id: 'cs-owner' as never,
        name: 'CS',
        stableName: 'CS',
        fame: 50,
        renown: 0,
        titles: 0,
        personality: 'Pragmatic',
      },
    });
    const famous = makeRival({
      id: 'famous' as never,
      roster: [makeWarrior()],
      owner: {
        id: 'f-owner' as never,
        name: 'F',
        stableName: 'F',
        fame: 999,
        renown: 0,
        titles: 0,
        personality: 'Pragmatic',
      },
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
      owner: {
        id: 't-owner' as never,
        name: 'T',
        stableName: 'T',
        fame: 300,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const scout = makeRival({
      owner: {
        id: 's-owner' as never,
        name: 'S',
        stableName: 'S',
        fame: 100,
        renown: 0,
        titles: 0,
        personality: 'Tactician',
      },
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

describe('intelWorker — AI scout reports (V16/F3)', () => {
  /** Stale report stub for dedupe/eviction fixtures. */
  function makeReport(over: Partial<ScoutReportData> = {}): ScoutReportData {
    return {
      id: 'rpt-old' as ScoutReportData['id'],
      warriorId: 'w-old' as ScoutReportData['warriorId'],
      warriorName: 'Old Target',
      style: 'STRIKING ATTACK',
      quality: 'Basic',
      week: 1,
      attributeRanges: {},
      record: '0W-0L',
      knownInjuries: [],
      notes: 'stale',
      ...over,
    };
  }

  /** Tactician + Master scout → 0.9 blended quality → Expert reports. */
  function scoutPair(
    opts: { warrior?: Partial<Warrior>; targetOwner?: Record<string, unknown> } = {}
  ) {
    const targetWarrior = makeWarrior({
      name: 'Reported Ruth',
      style: FightingStyle.StrikingAttack,
      ...opts.warrior,
    });
    const target = makeRival({
      owner: makeOwner({
        id: 't-owner' as StableId,
        name: 'T',
        stableName: 'T',
        fame: 300,
        personality: 'Pragmatic',
        ...opts.targetOwner,
      }),
      roster: [targetWarrior],
    });
    const scout = makeRival({
      owner: makeOwner({
        id: 's-owner' as StableId,
        name: 'S',
        stableName: 'S',
        personality: 'Tactician',
        competence: 'Master',
      }),
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: target.id },
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          [target.id]: {
            lastSeenWeek: 4,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
          },
        },
      }),
    });
    const state = makeGameState({ rivals: [scout, target], absoluteWeek: 5 });
    return { scout, target, targetWarrior, state };
  }

  it('files a ScoutReportData for a warrior on the scouted stable', () => {
    const { scout, target, targetWarrior, state } = scoutPair();
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const reports = updatedRival.agentMemory!.scoutReports ?? [];
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      warriorId: targetWarrior.id,
      warriorName: 'Reported Ruth',
      week: 5,
      quality: 'Expert',
    });
    expect(updatedRival.agentMemory!.opponentDossiers[target.id]!.knownStyles).toContain(
      targetWarrior.style
    );
  });

  it('is deterministic — identical inputs produce identical reports', () => {
    const { scout, state } = scoutPair();
    const first = processIntel(scout, state, buildPerceptionSnapshot(state)).updatedRival;
    const second = processIntel(scout, state, buildPerceptionSnapshot(state)).updatedRival;
    expect(first.agentMemory!.scoutReports).toEqual(second.agentMemory!.scoutReports);
  });

  it('re-scouting the same warrior replaces the prior report (id-keyed dedupe)', () => {
    const { scout, targetWarrior, state } = scoutPair();
    scout.agentMemory!.scoutReports = [
      makeReport({ warriorId: targetWarrior.id, warriorName: 'Reported Ruth', week: 1 }),
    ];
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const reports = updatedRival.agentMemory!.scoutReports!;
    expect(reports).toHaveLength(1);
    expect(reports[0]!.week).toBe(5);
  });

  it('evicts the oldest reports beyond AI_SCOUT_REPORT_CAP', () => {
    const { scout, state } = scoutPair();
    scout.agentMemory!.scoutReports = Array.from({ length: AI_SCOUT_REPORT_CAP }, (_, i) =>
      makeReport({ id: `rpt-${i}` as ScoutReportData['id'], warriorId: `w-${i}` as never })
    );
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const reports = updatedRival.agentMemory!.scoutReports!;
    expect(reports).toHaveLength(AI_SCOUT_REPORT_CAP);
    expect(reports.find((r) => r.id === 'rpt-0')).toBeUndefined();
    expect(reports.at(-1)!.warriorName).toBe('Reported Ruth');
  });

  it('Expert report bands override the numeric planIntel estimate', () => {
    const { scout, target, state } = scoutPair({
      warrior: { plan: makePlan({ style: FightingStyle.StrikingAttack, OE: 8, AL: 8 }) },
    });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const intel = updatedRival.agentMemory!.opponentDossiers[target.id]!.planIntel!;
    // plan.OE/AL 8 → 'High' band → 0.75 normalized.
    expect(intel.suspectedOE).toBe(0.75);
    expect(intel.suspectedAL).toBe(0.75);
  });

  it('masked plans stay masked — the report flags uncertainty and cannot override planIntel', () => {
    const { scout, target, state } = scoutPair({
      warrior: {
        plan: makePlan({ style: FightingStyle.StrikingAttack, OE: 8, AL: 8 }),
        planMasked: true,
      },
    });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    const report = updatedRival.agentMemory!.scoutReports!.at(-1)!;
    expect(report.possiblyMaskedPlan).toBe(true);
    const intel = updatedRival.agentMemory!.opponentDossiers[target.id]!.planIntel!;
    // Pragmatic-owner estimate stays near the 0.5 bias — the 'High' band
    // (0.75) must NOT leak through the decoy.
    expect(intel.suspectedOE!).toBeLessThan(0.7);
  });

  it('writes suspectedCompetence onto the dossier at Expert quality', () => {
    const { scout, target, state } = scoutPair({
      targetOwner: { competence: 'Veteran' },
    });
    const { updatedRival } = processIntel(scout, state, buildPerceptionSnapshot(state));
    expect(updatedRival.agentMemory!.opponentDossiers[target.id]!.suspectedCompetence).toBe(
      'Veteran'
    );
  });

  it('scouts the player stable — reports file without a competence read', () => {
    const playerWarrior = makeWarrior({ name: 'Player Pete' });
    const state = makeGameState({ roster: [playerWarrior], absoluteWeek: 5 });
    const playerId = state.player.id;
    const scout = makeRival({
      owner: makeOwner({
        id: 's-owner' as StableId,
        personality: 'Tactician',
        competence: 'Master',
      }),
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: playerId },
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          [playerId]: {
            lastSeenWeek: 4,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
          },
        },
      }),
    });
    const withScout = { ...state, rivals: [...(state.rivals ?? []), scout] };
    const { updatedRival } = processIntel(scout, withScout, buildPerceptionSnapshot(withScout));
    const reports = updatedRival.agentMemory!.scoutReports!;
    expect(reports.at(-1)!.warriorId).toBe(playerWarrior.id);
    expect(
      updatedRival.agentMemory!.opponentDossiers[playerId]!.suspectedCompetence
    ).toBeUndefined();
  });
});
