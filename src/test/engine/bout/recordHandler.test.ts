import { describe, it, expect } from 'vitest';
import { applyRecords } from '@/engine/bout/recordHandler';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';

describe('applyRecords', () => {
  const createMockWarrior = (id: string, overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id,
      name: `Warrior ${id}`,
      fame: 10,
      popularity: 10,
      fatigue: 10,
      career: { wins: 0, losses: 0, kills: 0 },
      flair: [],
      // dummy required fields for TS compliance if necessary, adding minimums
      age: 20,
      potential: 5,
      style: 'DEFENSIVE',
      attributes: {
        strength: 1,
        agility: 1,
        endurance: 1,
        constitution: 1,
        charisma: 1,
        intelligence: 1,
      },
      ...overrides,
    }) as any as Warrior;

  const createMockState = (overrides: Partial<GameState> = {}): GameState =>
    ({
      isTournamentWeek: false,
      tournaments: [],
      rivals: [],
      ...overrides,
    }) as any as GameState;

  it('updates stats correctly when A wins and no kill occurs', () => {
    const s = createMockState();
    const wA = createMockWarrior('A');
    const wD = createMockWarrior('D');
    const outcome: FightOutcome = { winner: 'A', by: 'KO', minutes: 5, log: [] };

    const impact = applyRecords(s, wA, wD, outcome, [], 5, 2, 1, 1);

    const updatedA = impact.rosterUpdates!.get('A' as import('@/types/shared.types').WarriorId)!;
    const updatedD = impact.rosterUpdates!.get('D' as import('@/types/shared.types').WarriorId)!;

    expect(updatedA).toBeDefined();
    expect(updatedD).toBeDefined();

    expect(updatedA.fame).toBe(15);
    expect(updatedA.popularity).toBe(12);
    expect(updatedA.career?.wins).toBe(1);
    expect(updatedA.career?.losses).toBe(0);
    expect(updatedA.fatigue).toBe(35); // 10 + 25

    expect(updatedD.fame).toBe(11);
    expect(updatedD.popularity).toBe(11);
    expect(updatedD.career?.wins).toBe(0);
    expect(updatedD.career?.losses).toBe(1);
    expect(updatedD.fatigue).toBe(35);
  });

  it('updates stats correctly when D wins and a kill occurs', () => {
    const s = createMockState();
    const wA = createMockWarrior('A');
    const wD = createMockWarrior('D');
    const outcome: FightOutcome = { winner: 'D', by: 'Kill', minutes: 5, log: [] };

    const impact = applyRecords(s, wA, wD, outcome, ['Flashy'], 1, 1, 5, 2);

    const updatedA = impact.rosterUpdates!.get('A' as import('@/types/shared.types').WarriorId)!;
    const updatedD = impact.rosterUpdates!.get('D' as import('@/types/shared.types').WarriorId)!;

    expect(updatedA).toBeDefined();
    expect(updatedD).toBeDefined();

    // A lost, and did not get a kill
    expect(updatedA.career?.wins).toBe(0);
    expect(updatedA.career?.losses).toBe(1);
    expect(updatedA.career?.kills).toBe(0);
    expect(updatedA.fatigue).toBe(35); // normal fatigue for losing
    expect(updatedA.flair).not.toContain('Flashy');

    // D won, and got a kill
    expect(updatedD.career?.wins).toBe(1);
    expect(updatedD.career?.losses).toBe(0);
    expect(updatedD.career?.kills).toBe(1); // D got the kill
    expect(updatedD.fatigue).toBe(0); // Fatigue is reset to 0 when a warrior performs a kill
    expect(updatedD.flair).toContain('Flashy');
  });

  it('populates rivalsUpdates correctly when rivalStableId is provided', () => {
    const wD = createMockWarrior('D');
    const rival = {
      id: 'rival-1' as import('@/types/shared.types').StableId,
      owner: {
        id: 'rival-1' as import('@/types/shared.types').StableId,
        name: 'Rival Stable',
        personality: 'Aggressive',
        stableName: 'RS',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      treasury: 0,
      roster: [wD],
      targetClass: 1,
      baseFame: 10,
      weeklyMultiplier: 1,
      baseStats: { minFame: 1, maxFame: 10, popModifier: 1 },
    } as unknown as RivalStableData;
    const s = createMockState({ rivals: [rival] });
    const wA = createMockWarrior('A');

    const outcome: FightOutcome = { winner: 'A', by: 'KO', minutes: 5, log: [] };

    const impact = applyRecords(s, wA, wD, outcome, [], 5, 2, 1, 1, 'rival-1');

    expect(impact.rosterUpdates?.has('D' as import('@/types/shared.types').WarriorId)).toBeFalsy();
    expect(
      impact.rivalsUpdates?.has('rival-1' as import('@/types/shared.types').StableId)
    ).toBeTruthy();

    const updatedRivalData = impact.rivalsUpdates!.get(
      'rival-1' as import('@/types/shared.types').StableId
    )!;
    expect(updatedRivalData.roster).toBeDefined();
    const updatedWD = updatedRivalData.roster?.find((w) => w.id === 'D');
    expect(updatedWD).toBeDefined();
    expect(updatedWD?.career?.losses).toBe(1);
    expect(updatedWD?.popularity).toBe(10); // Rival popularity delta is 0, so it remains at the initial value
  });

  it('skips fatigue accrual for tournament participants during tournament week', () => {
    const s = createMockState({
      isTournamentWeek: true,
      tournaments: [
        {
          id: 'tourney-1' as import('@/types/shared.types').TournamentId,
          name: 'Tournament',
          season: 'Spring',
          week: 1,
          tierId: 'Gold',
          bracket: [],
          participants: [
            {
              id: 'A' as import('@/types/shared.types').WarriorId,
              stableId: 'player' as import('@/types/shared.types').StableId,
            } as any,
            {
              id: 'D' as import('@/types/shared.types').WarriorId,
              stableId: 'rival' as import('@/types/shared.types').StableId,
            } as any,
          ],
          completed: false,
        },
      ],
    });
    const wA = createMockWarrior('A', { fatigue: 20 });
    const wD = createMockWarrior('D', { fatigue: 30 });
    const outcome: FightOutcome = { winner: 'A', by: 'KO', minutes: 5, log: [] };

    const impact = applyRecords(s, wA, wD, outcome, [], 5, 2, 1, 1);

    const updatedA = impact.rosterUpdates!.get('A' as import('@/types/shared.types').WarriorId)!;
    const updatedD = impact.rosterUpdates!.get('D' as import('@/types/shared.types').WarriorId)!;

    expect(updatedA.fatigue).toBe(20); // No change
    expect(updatedD.fatigue).toBe(30); // No change
  });

  it('handles missing fatigue gracefully by initializing it to 0', () => {
    const s = createMockState();
    const outcome: FightOutcome = { winner: 'A', by: 'KO', minutes: 5, log: [] };

    const wA2 = createMockWarrior('A', { fatigue: undefined });
    const wD2 = createMockWarrior('D', { fatigue: undefined });
    const impact = applyRecords(s, wA2, wD2, outcome, [], 0, 0, 0, 0);

    const updatedA = impact.rosterUpdates!.get('A' as import('@/types/shared.types').WarriorId)!;
    const updatedD = impact.rosterUpdates!.get('D' as import('@/types/shared.types').WarriorId)!;

    expect(updatedA.fatigue).toBe(25); // 0 + 25
    expect(updatedD.fatigue).toBe(25); // 0 + 25
  });
});
