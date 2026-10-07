import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRecruitmentPass } from '@/engine/pipeline/passes/RecruitmentPass';
import { GameState } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import * as recruitmentModule from '@/engine/recruitment/recruitment';

vi.mock('@/engine/recruitment/recruitment', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/engine/recruitment/recruitment')>();
  return {
    ...mod,
    partialRefreshPool: vi.fn(),
    generateRecruit: vi.fn(),
  };
});

describe('runRecruitmentPass', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const makeMockWarrior = (id: string, style: string = 'Brawler', extras = {}) => ({
    id, name: `W_${id}`, style, level: 1, ...extras
  });

  it('freezes pool on Blizzard weather without refreshing', () => {
    const mockWarrior = makeMockWarrior('w1', 'Brawler', { veteran: false });
    const state = {
      week: 10,
      weather: 'Blizzard',
      recruitPool: [mockWarrior],
      roster: [], // Need arrays for collectUsedWarriorNames
      graveyard: [],
      retired: [],
      rivals: [],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;
    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    expect(impact.recruitPool).toEqual([mockWarrior]);
    expect(recruitmentModule.partialRefreshPool).not.toHaveBeenCalled();
  });

  it('refreshes pool normally on Clear weather', () => {
    const mockWarrior = makeMockWarrior('w1');
    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([mockWarrior] as any);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;
    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    expect(impact.recruitPool).toEqual([mockWarrior]);
    expect(recruitmentModule.partialRefreshPool).toHaveBeenCalled();
  });

  it('adds bonus recruits for deaths this week', () => {
    const mockWarrior = makeMockWarrior('w1');
    const bonusWarrior = makeMockWarrior('b1');

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([mockWarrior] as any);
    vi.mocked(recruitmentModule.generateRecruit).mockReturnValue(bonusWarrior as any);

    const state = {
      week: 10,
      absoluteWeek: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [{ id: 'dead1', name: 'Dead', deathWeek: 10 }], // One death this week
      retired: [],
      rivals: [],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    expect(impact.recruitPool).toHaveLength(2); // 1 normal + 1 bonus
    expect(impact.recruitPool).toContainEqual(bonusWarrior);
    expect(recruitmentModule.generateRecruit).toHaveBeenCalledTimes(1);
  });

  it('caps bonus recruits from deaths at 3', () => {
    const mockWarrior = makeMockWarrior('w1');
    const bonusWarrior = makeMockWarrior('b1');

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([mockWarrior] as any);
    vi.mocked(recruitmentModule.generateRecruit).mockReturnValue(bonusWarrior as any);

    const state = {
      week: 10,
      absoluteWeek: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [
        { id: 'dead1', name: 'Dead1', deathWeek: 10 },
        { id: 'dead2', name: 'Dead2', deathWeek: 10 },
        { id: 'dead3', name: 'Dead3', deathWeek: 10 },
        { id: 'dead4', name: 'Dead4', deathWeek: 10 },
      ], // Four deaths this week
      retired: [],
      rivals: [],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    expect(impact.recruitPool).toHaveLength(4); // 1 normal + 3 bonus
    expect(recruitmentModule.generateRecruit).toHaveBeenCalledTimes(3);
  });

  it('adds 3 exceptional recruits on Mana Surge', () => {
    const mockWarrior = makeMockWarrior('w1');
    const bonusWarrior = makeMockWarrior('e1');

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([mockWarrior] as any);
    vi.mocked(recruitmentModule.generateRecruit).mockReturnValue(bonusWarrior as any);

    const state = {
      week: 10,
      weather: 'Mana Surge',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    expect(impact.recruitPool).toHaveLength(4); // 1 normal + 3 exceptional
    expect(recruitmentModule.generateRecruit).toHaveBeenCalledTimes(3);
    expect(recruitmentModule.generateRecruit).toHaveBeenCalledWith(
        expect.objectContaining({ forceTier: 'Exceptional' })
    );
  });

  it('applies academy claims correctly', () => {
    const mockWarrior = makeMockWarrior('w1', 'Brawler');
    const mockWarrior2 = makeMockWarrior('w2', 'Rogue');

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([mockWarrior, mockWarrior2] as any);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [
        { id: 'rival1', roster: [], owner: { foundedByWarriorId: 'leg1', favoredStyles: ['Brawler'] } }
      ],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    const brawler = impact.recruitPool!.find(w => w.id === 'w1')!;
    expect(brawler.academyStableId).toBe('rival1');
    expect(brawler.source).toBe('academy');

    const rogue = impact.recruitPool!.find(w => w.id === 'w2')!;
    expect(rogue.academyStableId).toBeUndefined();
  });

  it('ages free agents and removes expired ones', () => {
    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([] as any);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [],
      freeAgents: [
        makeMockWarrior('fa1', 'Brawler', { shelfWeeksRemaining: 2 }),
        makeMockWarrior('fa2', 'Brawler', { shelfWeeksRemaining: 1 }),
      ],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 }
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    expect(impact.freeAgents).toHaveLength(1);
    expect(impact.freeAgents?.[0]?.id).toBe('fa1');
    expect(impact.freeAgents?.[0]?.shelfWeeksRemaining).toBe(1);
  });
});
