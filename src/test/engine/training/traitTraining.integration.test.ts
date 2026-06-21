import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';
import { TRAIT_TRAIN_WEEKS } from '@/engine/training/trainingGains/traitTraining';

describe('trait training (integration)', () => {
  it('a blank warrior assigned to a Master trainer resolves after N weeks', () => {
    let state = createFreshState('train-int');
    const rng = new SeededRNGService(42);
    const w = makeWarrior(
      rng.uuid() as any,
      'Tyro',
      FightingStyle.WallOfSteel,
      { ST: 12, CN: 12, SZ: 10, WT: 14, WL: 14, SP: 12, DF: 12 },
      { traits: [], age: 20 },
      rng
    );
    state.roster = [w];
    state.trainers = [
      {
        id: 'm',
        name: 'Master',
        tier: 'Master',
        focus: 'Defense',
        fame: 0,
        age: 50,
        contractWeeksLeft: 99,
      } as any,
    ];
    state.trainingAssignments = [
      { warriorId: w.id, type: 'trait', trainerId: 'm', weeksRemaining: TRAIT_TRAIN_WEEKS },
    ];

    for (let i = 0; i < TRAIT_TRAIN_WEEKS; i++) state = advanceWeek(state);

    const after = state.roster.find((x) => x.id === w.id)!;
    expect(after).toBeDefined();
    expect(state.trainingAssignments.some((a) => a.warriorId === w.id)).toBe(false);
  });
});
