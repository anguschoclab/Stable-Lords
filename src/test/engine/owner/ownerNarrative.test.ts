import { describe, it, expect } from 'vitest';
import { generateOwnerNarratives } from '@/engine/owner/narrative';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { FightSummary } from '@/types/combat.types';

const mockRng: IRNGService = {
  next: () => 0,
  pick: <T>(arr: T[]) => arr[0] as T,
  uuid: () => 'mock-uuid',
  roll: () => 0,
  shuffle: <T>(arr: T[]) => [...arr],
  pickWeighted: <T>(items: T[]) => items[0] as T,
  chance: () => true,
};

const nameToId = (name: string) => `w-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

const createMockFight = (overrides: any = {}): FightSummary => {
  const { a, d, ...rest } = overrides;
  const title = rest.title || `${a || 'WarriorA'} vs ${d || 'WarriorB'}`;
  return {
    id: `fight-${rest.week ?? 10}` as any,
    week: rest.week ?? 10,
    title,
    warriorIdA: (rest.warriorIdA || nameToId(a || 'WarriorA')) as any,
    warriorIdD: (rest.warriorIdD || nameToId(d || 'WarriorB')) as any,
    stableIdA: 's-a' as any,
    stableIdD: 's-b' as any,
    winner: rest.winner ?? 'A',
    by: rest.by ?? 'KO',
    styleA: 'Brawler',
    styleD: 'Swordsman',
    createdAt: new Date().toISOString(),
    ...rest,
  };
};

const createMockState = (overrides: any = {}): any => ({
  week: 14,
  season: 'Spring',
  player: { id: 'player-stable', stableName: "Dragon's Hearth" },
  rivals: [],
  arenaHistory: [],
  rivalries: [],
  ...overrides,
});

describe('generateOwnerNarratives', () => {
  it('returns [] when newSeason equals state.season', () => {
    const state = createMockState({ season: 'Spring' });
    const result = generateOwnerNarratives(state, 'Spring');
    expect(result).toEqual([]);
  });

  it('returns [] when no rival has qualifying recent fights', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toEqual([]);
  });

  it('generates narrative for Aggressive owner losing badly', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'D' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'D' }),
        createMockFight({ week: 13, d: 'WarriorA', a: 'Other', winner: 'D' }),
      ],
    });
    // 0 wins, 4 losses = 0.0 winRate, totalFights = 4
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      `Rival (Rival Stable) rages: "Heads will roll if results don't improve!"`
    );
  });

  it('generates narrative for Methodical owner on winning streak', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Methodical' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 13, a: 'WarriorA', d: 'Other', winner: 'D' }),
      ],
    });
    // 3 wins, 1 loss = 0.75
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Rival (Rival Stable): "Our preparation is paying dividends — 3W/1L this Spring."'
    );
  });

  it('generates narrative for Showman with kills', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Showman' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'A', by: 'Kill' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'A', by: 'Kill' }),
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Rival (Rival Stable) boasts: "2 kills this Spring! The crowd demands blood, and we deliver!"'
    );
  });

  it('generates narrative for Pragmatic owner suffering deaths', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Pragmatic' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D', by: 'Kill' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'D', by: 'Kill' }),
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Rival (Rival Stable) grimly assesses: "2 warriors lost this Spring. Costs are unsustainable."'
    );
  });

  it('generates narrative for Tactician dominating cleanly', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Tactician' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
      ],
    });
    // 3 wins, 0 losses, 0 kills, totalFights = 3
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Rival (Rival Stable): "Clean victories, no unnecessary bloodshed — 3W/0L. Strategy prevails."'
    );
  });

  it('generates dominant season narrative for any owner', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Pragmatic' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 13, a: 'WarriorA', d: 'Other', winner: 'A' }),
        createMockFight({ week: 14, a: 'WarriorA', d: 'Other', winner: 'D' }),
      ],
    });
    // 4 wins, 1 loss = 0.8, totalFights = 5
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Rival Stable dominated Spring with a record of 4-1!');
  });

  it('generates devastating losses narrative for any owner', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Pragmatic' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D', by: 'Kill' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'D', by: 'Kill' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'D', by: 'Kill' }),
      ],
    });
    // 0 wins, 3 losses, 3 deaths
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    // Pragmatic death trigger (deaths >= 2) AND devastating losses trigger (deaths >= 3)
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(
      'Rival (Rival Stable) grimly assesses: "3 warriors lost this Spring. Costs are unsustainable."'
    );
    expect(result[1]).toBe('A grim Spring for Rival Stable — 3 warriors fell in the arena.');
  });

  it('stacks multiple triggers for the same rival', () => {
    const state = createMockState({
      season: 'Spring',
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Showman' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [
        createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'A', by: 'Kill' }),
        createMockFight({ week: 11, a: 'WarriorA', d: 'Other', winner: 'A', by: 'Kill' }),
        createMockFight({ week: 12, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
        createMockFight({ week: 13, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
        createMockFight({ week: 14, a: 'WarriorA', d: 'Other', winner: 'A', by: 'KO' }),
      ],
    });
    // 5 wins, 0 losses, 2 kills, winRate = 1.0
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(
      'Rival (Rival Stable) boasts: "2 kills this Spring! The crowd demands blood, and we deliver!"'
    );
    expect(result[1]).toBe('Rival Stable dominated Spring with a record of 5-0!');
  });

  it('generates blood feud taunt when rivalry intensity is high and RNG passes', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D' })],
      rivalries: [
        {
          id: 'riv1',
          stableIdA: 'player-stable',
          stableIdB: 'r1',
          intensity: 4,
          reason: 'Feud',
          startWeek: 1,
        },
      ],
    });
    // With mockRng: next() returns 0 (< 0.25), pick() returns arr[0]
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    // First loop: 1 fight, 0 wins, 1 loss, totalFights 1 < 4 → no personality narrative
    // Taunt loop: intensity 4, RNG passes
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      `"Dragon's Hearth is a disgrace to the sands. I will see them bleed," vows Rival (Rival Stable).`
    );
  });

  it('does not generate blood feud taunt when rivalry intensity is too low', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [],
      rivalries: [
        {
          id: 'riv1',
          stableIdA: 'player-stable',
          stableIdB: 'r1',
          intensity: 3,
          reason: 'Feud',
          startWeek: 1,
        },
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toEqual([]);
  });

  it('does not generate blood feud taunt when RNG gate fails', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [],
      rivalries: [
        {
          id: 'riv1',
          stableIdA: 'player-stable',
          stableIdB: 'r1',
          intensity: 4,
          reason: 'Feud',
          startWeek: 1,
        },
      ],
    });
    const failingRng: IRNGService = {
      ...mockRng,
      next: () => 0.3, // >= 0.25, gate fails
    };
    const result = generateOwnerNarratives(state, 'Summer', failingRng);
    expect(result).toEqual([]);
  });

  it('generates blood feud taunt with reversed stable ID order in rivalry', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D' })],
      rivalries: [
        {
          id: 'riv1',
          stableIdA: 'r1',
          stableIdB: 'player-stable',
          intensity: 4,
          reason: 'Feud',
          startWeek: 1,
        },
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      `"Dragon's Hearth is a disgrace to the sands. I will see them bleed," vows Rival (Rival Stable).`
    );
  });

  it('matches only the correct rivalry among multiple rivalries', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
        {
          owner: { id: 'r2', name: 'Other', stableName: 'Other Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriorb', name: 'WarriorB' }],
        },
      ],
      arenaHistory: [createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D' })],
      rivalries: [
        {
          id: 'riv1',
          stableIdA: 'player-stable',
          stableIdB: 'r1',
          intensity: 4,
          reason: 'Feud',
          startWeek: 1,
        },
        {
          id: 'riv2',
          stableIdA: 'r2',
          stableIdB: 'some-other-stable',
          intensity: 5,
          reason: 'Other Feud',
          startWeek: 1,
        },
      ],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      `"Dragon's Hearth is a disgrace to the sands. I will see them bleed," vows Rival (Rival Stable).`
    );
  });

  it('generates no taunts when rivalries array is empty', () => {
    const state = createMockState({
      season: 'Spring',
      player: { id: 'player-stable', stableName: "Dragon's Hearth" },
      rivals: [
        {
          owner: { id: 'r1', name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive' },
          roster: [{ id: 'w-warriora', name: 'WarriorA' }],
        },
      ],
      arenaHistory: [createMockFight({ week: 10, a: 'WarriorA', d: 'Other', winner: 'D' })],
      rivalries: [],
    });
    const result = generateOwnerNarratives(state, 'Summer', mockRng);
    expect(result).toEqual([]);
  });
});
