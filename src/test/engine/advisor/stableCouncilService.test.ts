import { describe, it, expect } from 'vitest';
import { buildStableCouncilReport } from '@/engine/advisor/stableCouncilService';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';

const mkWarrior = (id: string, over: Partial<Warrior> = {}): Warrior => ({
  id: id as any,
  name: `Warrior_${id}`,
  style: FightingStyle.LungingAttack,
  attributes: { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 },
  fame: 50,
  popularity: 20,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 4, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...over,
});

const mkOffer = (id: string, widA: string, widB: string, purse = 200): BoutOffer => ({
  id: id as any,
  promoterId: 'p1' as any,
  warriorIds: [widA as any, widB as any],
  boutWeek: 6,
  createdAbsoluteWeek: 5,
  expirationWeek: 6,
  purse,
  hype: 10,
  status: 'Proposed',
  responses: { [widA]: 'Pending', [widB]: 'Pending' } as any,
});

describe('buildStableCouncilReport', () => {
  it('aggregates roster into complete council cards and stable summary', () => {
    const w1 = mkWarrior('w1', { style: FightingStyle.AimedBlow });
    const w2 = mkWarrior('w2', {
      injuries: [
        {
          id: 'i1' as any,
          name: 'Fracture',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });
    const rival = mkWarrior('r1', { style: FightingStyle.WallOfSteel });
    const offer = mkOffer('off_1', 'w1', 'r1', 220);

    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster: [w1, w2],
      rivals: [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } }],
      boutOffers: { off_1: offer },
      trainingAssignments: [],
      realmRankings: {
        w1: { overallRank: 40, classRank: 3, compositeScore: 180 },
      },
      tournaments: [],
      isTournamentWeek: false,
    } as unknown as GameState;

    const report = buildStableCouncilReport(state);

    expect(report.cards).toHaveLength(2);
    expect(report.summary.totalWarriors).toBe(2);
    expect(report.summary.combatReadyCount).toBe(1); // w1 has offer
    expect(report.summary.rehabCount).toBe(1); // w2 is injured
    expect(report.summary.tournamentContenderCount).toBe(1); // w1 is rank 40
    expect(report.summary.unassignedTrainingCount).toBe(2);
    expect(report.summary.projectedPurseGold).toBe(220);
    expect(report.summary.projectedTrainingCost).toBe(40); // 2 * 20
    expect(report.summary.stableDirectives.length).toBeGreaterThan(0);
    expect(report.summary.allActionPayloads).toHaveLength(2);

    // Verify action payload for w1
    const p1 = report.summary.allActionPayloads.find((p) => p.warriorId === 'w1');
    expect(p1).toBeDefined();
    expect(p1!.boutOfferIdToAccept).toBe('off_1');
    expect(p1!.trainingAssignment.type).toBe('attribute');
    expect(p1!.tacticsPlanPatch?.offensiveTactic).toBeDefined();
    expect(p1!.tacticsPlanPatch?.defensiveTactic).toBeDefined();

    // Verify action payload for w2 (rehab warrior)
    const p2 = report.summary.allActionPayloads.find((p) => p.warriorId === 'w2');
    expect(p2).toBeDefined();
    expect(p2!.boutOfferIdToAccept).toBeUndefined(); // no bout accepted for injured
    expect(p2!.trainingAssignment.type).toBe('recovery');
    expect(p2!.tacticsPlanPatch?.fallbackCondition).toBe('YIELD');
  });
});
