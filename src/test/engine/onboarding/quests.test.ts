import { describe, it, expect } from 'vitest';
import { ONBOARDING_QUESTS } from '@/engine/onboarding/quests';
import { makeGameState, makeFightSummary, makeWarrior } from '@/test/_fixtures/factories';

describe('onboarding quests (G4)', () => {
  it('starts with all quests incomplete on a fresh state', () => {
    const s = makeGameState({});
    expect(ONBOARDING_QUESTS.every((q) => !q.done(s))).toBe(true);
  });

  it('marks quests complete as state advances', () => {
    const s = makeGameState({
      absoluteWeek: 3,
      arenaHistory: [makeFightSummary({ by: 'KO' })],
      scoutReports: [{} as never],
      roster: [makeWarrior({ equipment: { weapon: 'sword', armor: 'a', shield: 's', helm: 'h' } })],
    });
    const byId = Object.fromEntries(ONBOARDING_QUESTS.map((q) => [q.id, q.done(s)]));
    expect(byId['first-bout']).toBe(true);
    expect(byId['armed']).toBe(true);
    expect(byId['scouted']).toBe(true);
    expect(byId['second-week']).toBe(true);
  });
});
