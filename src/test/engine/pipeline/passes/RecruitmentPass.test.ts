import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRecruitmentPass } from '@/engine/pipeline/passes/RecruitmentPass';
import { GameState } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import * as recruitmentModule from '@/engine/recruitment/recruitment';
import { makePoolWarrior, makeRival } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { StableId } from '@/types/shared.types';

vi.mock('@/engine/recruitment/recruitment', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/engine/recruitment/recruitment')>();
  return {
    ...mod,
    partialRefreshPool: vi.fn(),
    generateRecruit: vi.fn(),
    generateApprentice: vi.fn(),
  };
});

describe('runRecruitmentPass', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const makeMockWarrior = (id: string, style: string = 'Brawler', extras = {}) => ({
    id,
    name: `W_${id}`,
    style,
    level: 1,
    ...extras,
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
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
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
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
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
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
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
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
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
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
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

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([
      mockWarrior,
      mockWarrior2,
    ] as any);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [
        {
          id: 'rival1',
          roster: [],
          owner: { foundedByWarriorId: 'leg1', favoredStyles: ['Brawler'] },
        },
      ],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    const brawler = impact.recruitPool!.find((w) => w.id === 'w1')!;
    expect(brawler.academyStableId).toBe('rival1');
    expect(brawler.source).toBe('academy');

    const rogue = impact.recruitPool!.find((w) => w.id === 'w2')!;
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
        makePoolWarrior({ id: 'fa1', shelfWeeksRemaining: 2 }),
        makePoolWarrior({ id: 'fa2', shelfWeeksRemaining: 1 }),
      ],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    expect(impact.freeAgents).toHaveLength(1);
    expect(impact.freeAgents?.[0]?.id).toBe('fa1');
    expect(impact.freeAgents?.[0]?.shelfWeeksRemaining).toBe(1);
  });

  it('academy claims prefer apprentices among unclaimed entries', () => {
    const apprentice = makePoolWarrior({
      id: 'app-1',
      source: 'apprentice',
      style: FightingStyle.BashingAttack,
    });
    const normal1 = makePoolWarrior({ id: 'n-1', style: FightingStyle.BashingAttack });
    const normal2 = makePoolWarrior({ id: 'n-2', style: FightingStyle.BashingAttack });

    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([normal1, apprentice, normal2]);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [
        {
          id: 'rival1',
          roster: [],
          owner: { foundedByWarriorId: 'leg1', favoredStyles: [FightingStyle.BashingAttack] },
        },
      ],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    const claimed = impact.recruitPool!.filter((w) => w.academyStableId === 'rival1');
    // Claims are capped at AI_ACADEMY_BONUS_RECRUITS (2) — the apprentice is
    // always in the set when one exists.
    expect(claimed.map((w) => w.id)).toContain('app-1');
    expect(claimed.length).toBe(2);
  });

  it('trims the pool to the hard cap oldest-first, protecting claimed and apprentice entries', () => {
    // stableCount = 1 → target 20 → hard cap 60; return 62 to force a trim.
    const claimed = makePoolWarrior({
      id: 'pw-0',
      addedWeek: 0,
      academyStableId: 'r-1',
      academyClaimExpiryWeek: 12,
    });
    const apprentice = makePoolWarrior({ id: 'pw-1', addedWeek: 1, source: 'apprentice' });
    const rest = Array.from({ length: 60 }, (_, i) =>
      makePoolWarrior({ id: `pw-${i + 2}`, addedWeek: i + 2 })
    );
    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([claimed, apprentice, ...rest]);

    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [makeRival({ id: 'r-1' as StableId })],
      freeAgents: [],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));
    const ids = new Set(impact.recruitPool!.map((w) => w.id));

    expect(impact.recruitPool).toHaveLength(60);
    expect(ids.has('pw-0')).toBe(true); // actively claimed — protected
    expect(ids.has('pw-1')).toBe(true); // apprentice — protected
    expect(ids.has('pw-2')).toBe(false); // oldest unprotected — trimmed
    expect(ids.has('pw-3')).toBe(false);
  });

  it('threads legacyChance into the refresh and mints a mentor apprentice per retired veteran', () => {
    vi.mocked(recruitmentModule.partialRefreshPool).mockReturnValue([] as any);
    const mentorApprentice = makePoolWarrior({ id: 'mentor-app-1', source: 'apprentice' });
    vi.mocked(recruitmentModule.generateApprentice).mockReturnValue(mentorApprentice);

    const expiredVet = makePoolWarrior({
      id: 'vet-ret-1',
      source: 'freeAgent',
      cost: 400,
      shelfWeeksRemaining: 1,
      veteran: {
        fame: 60,
        popularity: 20,
        career: { wins: 5, losses: 2, kills: 0 },
        titles: [],
      },
    });
    const state = {
      week: 10,
      weather: 'Clear',
      recruitPool: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [], // no needy stables — the veteran retires
      freeAgents: [expiredVet],
      cachedMetaDrift: { globalMetaFame: 10, fameTargetBase: 10 },
    } as unknown as GameState;

    const impact = runRecruitmentPass(state, new SeededRNG(12345));

    // One newly retired veteran → legacyChance = 0.05 + 1 * 0.05 = 0.10.
    expect(recruitmentModule.partialRefreshPool).toHaveBeenCalledWith(
      expect.objectContaining({ legacyChance: 0.1 })
    );
    expect(recruitmentModule.generateApprentice).toHaveBeenCalledTimes(1);
    expect(impact.recruitPool).toContainEqual(mentorApprentice);
    expect(impact.retired).toHaveLength(1);
  });
});
