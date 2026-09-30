import { describe, it, expect } from 'vitest';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { makeGameState, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/state.types';
import type { ArenaTitle } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';

/**
 * A warrior every cull rule wants gone: 0 kills, 8+ fights, age 30, losing
 * record — eligible for the Aggressive cull, the underperformer cull, the
 * liability release, and the age-30 roll all at once.
 */
const cullTarget = (over: Partial<Warrior> = {}): Warrior =>
  makeWarrior({
    age: 30,
    fame: 2,
    career: { wins: 2, losses: 8, kills: 0 },
    traits: ['fragile', 'glass_jaw', 'short_winded'],
    ...over,
  });

const titleReigningOn = (warriorId: string): Record<string, ArenaTitle> => ({
  arena_1: {
    champion: {
      warriorId: warriorId as Warrior['id'],
      startedAbsoluteWeek: 1,
      defenses: 0,
      lastActivityWeek: 1,
    },
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
  },
});

const stateWith = (rival: ReturnType<typeof makeRival>, titles = {}) =>
  makeGameState({
    week: 20,
    absoluteWeek: 20,
    rivals: [rival],
    arenaHistory: [],
    arenaChampions: titles,
  } as any);

describe('AI roster culling — champion protection', () => {
  it('never culls a reigning champion, whatever the personality trigger', () => {
    for (const personality of ['Aggressive', 'Methodical', 'Tactician', 'Pragmatic'] as const) {
      const champ = cullTarget({ id: 'champ1' as any });
      const rival = makeRival({
        roster: [champ],
        owner: {
          id: 'o1' as any,
          name: 'O',
          stableName: 'S',
          fame: 0,
          renown: 0,
          titles: 0,
          personality,
        },
      });
      const state = stateWith(rival, titleReigningOn('champ1'));
      const { updatedRivals } = processAIRosterManagement(
        state,
        new SeededRNGService(1)
      );
      expect(
        updatedRivals[0]!.roster.map((w) => w.id),
        `personality=${personality} culled a reigning champion`
      ).toContain('champ1');
    }
  });

  it('still culls a non-champion matching the same criteria', () => {
    const fodder = cullTarget({ id: 'fodder1' as any });
    const rival = makeRival({
      roster: [fodder],
      owner: {
        id: 'o1' as any,
        name: 'O',
        stableName: 'S',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const state = stateWith(rival, titleReigningOn('someone-else'));
    const { updatedRivals } = processAIRosterManagement(state, new SeededRNGService(1));
    expect(updatedRivals[0]!.roster.map((w) => w.id)).not.toContain('fodder1');
  });
});

describe('AI roster culling — retired warriors are preserved', () => {
  it('returns culled warriors so they can reach the retired list', () => {
    const fodder = cullTarget({ id: 'gone1' as any, name: 'Cullbait' });
    const rival = makeRival({
      roster: [fodder],
      owner: {
        id: 'o1' as any,
        name: 'O',
        stableName: 'S',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const state = stateWith(rival);
    const { retiredWarriors } = processAIRosterManagement(state, new SeededRNGService(1));
    expect(retiredWarriors.map((w) => w.id)).toContain('gone1');
    expect(retiredWarriors[0]!.status).toBe('Retired');
  });
});

describe('new-stable bankruptcy grace', () => {
  const broke = (establishedAbsoluteWeek: number) =>
    makeRival({
      treasury: -600, // below BANKRUPTCY_THRESHOLD
      establishedAbsoluteWeek,
      roster: [makeWarrior({ trainability: 0, fame: 0, career: { wins: 0, losses: 0, kills: 0 } })],
    });
  const graceState = async () => {
    const { createFreshState } = await import('@/engine/factories/gameStateFactory');
    const state = createFreshState('grace-check');
    state.week = 40;
    state.absoluteWeek = 40;
    return state;
  };

  it('a freshly minted stable inside the grace window does not fold', async () => {
    const { processAIStable } = await import('@/engine/ai/stableManager');
    const { isBankrupt } = processAIStable(broke(39), await graceState());
    expect(isBankrupt).toBe(false);
  });

  it('a stable past the grace window still folds', async () => {
    const { processAIStable } = await import('@/engine/ai/stableManager');
    const { isBankrupt } = processAIStable(broke(20), await graceState());
    expect(isBankrupt).toBe(true);
  });
});
