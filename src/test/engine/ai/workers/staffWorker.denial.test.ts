/**
 * D.0 — Dossier-driven preemptive hiring (G21 redesign).
 * When the intel picture shows the observed opponent field concentrated in a
 * style group, the stable prefers the trainer focus that counters it —
 * hiring for the field it expects, ahead of the player.
 */
import { describe, it, expect } from 'vitest';
import { processStaff, preferredTrainerFocus } from '@/engine/ai/workers/staffWorker';
import {
  makeAgentMemory,
  makeGameState,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { Trainer } from '@/types/shared.types';

function trainer(id: string, tier: Trainer['tier'], focus: Trainer['focus']): Trainer {
  return {
    id,
    name: `Trainer ${id}`,
    tier,
    focus,
    fame: 10,
    age: 45,
    contractWeeksLeft: 13,
  };
}

const offensiveFieldDossier = {
  lastSeenWeek: 5,
  knownStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack],
  estimatedThreat: 0.8,
  recordVs: { w: 0, l: 3, k: 0 },
};

describe('staffWorker dossier-driven hiring', () => {
  it('offense-heavy opponent field prefers a Defense-focus hire', () => {
    const rival = makeRival({
      roster: [makeWarrior()],
      treasury: 5000,
      trainers: [],
      agentMemory: makeAgentMemory({
        opponentDossiers: { 'enemy-stable': offensiveFieldDossier },
      }),
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const state = makeGameState({ rivals: [rival] });
    const pool = [
      trainer('def-master', 'Master', 'Defense'),
      trainer('agg-master', 'Master', 'Aggression'),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.trainers![0]!.focus).toBe('Defense');
  });

  it('defense-heavy opponent field prefers an Aggression-focus hire', () => {
    const rival = makeRival({
      roster: [makeWarrior()],
      treasury: 5000,
      trainers: [],
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          'enemy-stable': {
            ...offensiveFieldDossier,
            knownStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel],
          },
        },
      }),
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const state = makeGameState({ rivals: [rival] });
    const pool = [
      trainer('def-master', 'Master', 'Defense'),
      trainer('agg-master', 'Master', 'Aggression'),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.trainers![0]!.focus).toBe('Aggression');
  });

  it('no dossier signal falls back to the intent-based preference', () => {
    const rival = makeRival({
      roster: [makeWarrior()],
      treasury: 5000,
      trainers: [],
      agentMemory: makeAgentMemory(),
      strategy: { intent: 'EXPANSION', planWeeksRemaining: 4 },
    });
    const state = makeGameState({ rivals: [rival] });
    const pool = [
      trainer('agg-novice', 'Novice', 'Aggression'),
      trainer('end-master', 'Master', 'Endurance'),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    // EXPANSION prefers Endurance (existing intent behavior)
    expect(updatedRival.trainers![0]!.focus).toBe('Endurance');
  });

  it('preferredTrainerFocus maps the observed field to a counter focus', () => {
    expect(
      preferredTrainerFocus([FightingStyle.BashingAttack, FightingStyle.StrikingAttack])
    ).toBe('Defense');
    expect(
      preferredTrainerFocus([FightingStyle.TotalParry, FightingStyle.WallOfSteel])
    ).toBe('Aggression');
    expect(preferredTrainerFocus([])).toBeNull();
  });
});
