/**
 * V26 — AI turnaround consumer. `diagnoseTurnaround` is already pure and
 * returns a structured `TurnaroundAction[]`; the AI stable needs a consumer
 * that maps it onto the surfaces AI stables actually own:
 *
 *  - `applyTurnaroundDiagnosis(rival)` appends `trainingAssignments` for
 *    confidently-diagnosed losers (drill → skillDrill assignment, train →
 *    attribute assignment). An assignment also suppresses bout bids through
 *    the existing `bookableRoster` gate — the rest is free.
 *  - `turnaroundMatchupBias(w, foeStyle)` returns a bid-steering nudge —
 *    positive toward the matrix's best matchup, negative toward the worst —
 *    so the stable seeks winnable fights instead of repeating losing ones.
 *  - `recentLossFactors` gates the response: ≥2 identical recent factors =
 *    confident diagnosis → act; thin records → advisory only, no churn.
 *
 * Live since Phase 6 — `src/engine/ai/turnaround.ts` is the consumer.
 */
import { describe, it, expect } from 'vitest';
import {
  applyTurnaroundDiagnosis,
  turnaroundMatchupBias,
} from '@/engine/ai/turnaround';
import { diagnoseTurnaround } from '@/engine/advisor/turnaroundAdvisor';
import { getMatchupBonus } from '@/constants/combat/combat';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { TrainingAssignment } from '@/types/state.types';

const loser = (over: Record<string, unknown> = {}) =>
  makeWarrior({
    id: 'loser-1' as WarriorId,
    style: FightingStyle.StrikingAttack,
    career: { wins: 1, losses: 5, kills: 0 },
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 9, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 12, DEC: 5 },
    strategyMemory: { cells: {}, recentLossFactors: ['attrition', 'attrition'] },
    ...over,
  });

describe('applyTurnaroundDiagnosis — assignments from the shared diagnosis', () => {
  it('a confidently-diagnosed loser gets a drill assignment on the win condition', () => {
    const w = loser();
    const rival = makeRival({ roster: [w], trainingAssignments: [] });
    const out = applyTurnaroundDiagnosis(rival);
    const report = diagnoseTurnaround(w);
    expect(report).not.toBeNull();
    const drill = (out.trainingAssignments ?? []).find(
      (a: TrainingAssignment) => a.warriorId === 'loser-1' && a.type === 'skillDrill'
    );
    expect(drill?.skill).toBe(report!.winCondition.skill);
  });

  it('a slow-learner loser also gets the WT attribute assignment', () => {
    const w = loser(); // WT 9 < SLOW_LEARNER_WT
    const rival = makeRival({ roster: [w], trainingAssignments: [] });
    const out = applyTurnaroundDiagnosis(rival);
    const train = (out.trainingAssignments ?? []).find(
      (a: TrainingAssignment) => a.warriorId === 'loser-1' && a.type === 'attribute'
    );
    expect(train?.attribute).toBe('WT');
  });

  it('advisory-only for thin evidence — no assignments without repeated factors', () => {
    const w = loser({
      strategyMemory: { cells: {}, recentLossFactors: [] },
    });
    const rival = makeRival({ roster: [w], trainingAssignments: [] });
    const out = applyTurnaroundDiagnosis(rival);
    expect(
      (out.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId === 'loser-1')
    ).toEqual([]);
  });

  it('leaves winning warriors untouched', () => {
    const winner = loser({
      career: { wins: 6, losses: 1, kills: 0 },
    });
    const rival = makeRival({ roster: [winner], trainingAssignments: [] });
    const out = applyTurnaroundDiagnosis(rival);
    expect(out.trainingAssignments ?? []).toEqual([]);
  });

  it('does not duplicate an existing assignment for the same warrior', () => {
    const w = loser();
    const rival = makeRival({
      roster: [w],
      trainingAssignments: [{ warriorId: 'loser-1' as WarriorId, type: 'skillDrill', skill: 'ATT' }],
    });
    const out = applyTurnaroundDiagnosis(rival);
    expect(
      (out.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId === 'loser-1').length
    ).toBe(1);
  });
});

describe('turnaroundMatchupBias — steers bids toward winnable fights', () => {
  it('biases toward the matrix-best foe and away from the worst', () => {
    const w = loser();
    let best: FightingStyle | undefined;
    let bestEdge = -Infinity;
    let worst: FightingStyle | undefined;
    let worstEdge = Infinity;
    for (const foe of Object.values(FightingStyle)) {
      if (foe === w.style) continue;
      const e = getMatchupBonus(w.style, foe);
      if (e > bestEdge) {
        best = foe;
        bestEdge = e;
      }
      if (e < worstEdge) {
        worst = foe;
        worstEdge = e;
      }
    }
    expect(turnaroundMatchupBias(w, best!)).toBeGreaterThan(0);
    expect(turnaroundMatchupBias(w, worst!)).toBeLessThan(0);
    expect(turnaroundMatchupBias(w, w.style)).toBe(0);
  });

  it('returns 0 for warriors that are not losing', () => {
    const winner = loser({ career: { wins: 6, losses: 1, kills: 0 } });
    for (const foe of Object.values(FightingStyle)) {
      expect(turnaroundMatchupBias(winner, foe)).toBe(0);
    }
  });
});
