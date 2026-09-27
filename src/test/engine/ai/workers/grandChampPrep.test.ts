// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { weeksUntilChampionsTournament } from '@/engine/core/absoluteWeek';
import { processRoster } from '@/engine/ai/workers/rosterWorker';
import { makeRival, makeWarrior, makeTrainer } from '@/test/_fixtures/factories';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import type { WarriorId } from '@/types/shared.types';

describe('weeksUntilChampionsTournament', () => {
  it('counts down to the week-52 bracket', () => {
    expect(weeksUntilChampionsTournament(52)).toBe(0);
    expect(weeksUntilChampionsTournament(51)).toBe(1);
    expect(weeksUntilChampionsTournament(50)).toBe(2);
    expect(weeksUntilChampionsTournament(1)).toBe(51);
    expect(weeksUntilChampionsTournament(5)).toBe(47);
  });
});

describe('rosterWorker — recovery-assigned warriors skip training', () => {
  it('a warrior on a recovery assignment is not drilled', () => {
    const resting = makeWarrior({ id: 'w1' as WarriorId, fame: 200, champion: true });
    const other = makeWarrior({ id: 'w2' as WarriorId, fame: 50 });
    const rival = makeRival({
      treasury: 2000,
      roster: [resting, other],
      trainers: [makeTrainer()],
      trainingAssignments: [{ warriorId: resting.id, type: 'recovery' } as never],
    });
    const before = { ...resting.attributes };
    const updated = processRoster(rival, CHAMPIONS_TOURNEY.WEEK - 1, 'Winter', 42);
    const updatedResting = updated.roster.find((w) => w.id === resting.id)!;
    expect(updatedResting.attributes).toEqual(before);
    const trained = (updated.trainingAssignments ?? []).find(
      (a) => a.warriorId === resting.id && a.type !== 'recovery'
    );
    expect(trained).toBeUndefined();
  });
});
