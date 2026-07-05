// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, Attributes, BaseSkills, DerivedStats } from '@/types/game';
import type { GameState } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment';
import { REFRESH_COST } from '@/engine/recruitment';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import '@/test/_setup/setup';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useRecruit } from '@/pages/Recruit/hooks/useRecruit';
import { useRecruitFilters } from '@/pages/Recruit/hooks/useRecruitFilters';
import { useRecruitActions } from '@/pages/Recruit/hooks/useRecruitActions';

const baseAttrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
const baseSkills: BaseSkills = { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 };
const derivedStats: DerivedStats = { hp: 100, endurance: 100, damage: 5, encumbrance: 0 };

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return {
    id: 'pw1',
    name: 'TestRecruit',
    style: FightingStyle.StrikingAttack,
    attributes: { ...baseAttrs },
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    baseSkills: { ...baseSkills },
    derivedStats: { ...derivedStats },
    tier: 'Common',
    cost: 50,
    age: 20,
    lore: 'A young fighter.',
    traits: [],
    addedWeek: 1,
    favorites: { weaponId: 'shortsword', rhythm: { oe: 5, al: 5 }, discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 } },
    luckfactor: { ...baseSkills },
    ...overrides,
  };
}

function makeTestWarrior(id: string, name: string): Warrior {
  return makeWarrior(id as any, name, FightingStyle.StrikingAttack, baseAttrs);
}

function loadState(partial?: Partial<GameState>) {
  const state = createFreshState('test-seed');
  state.treasury = 10000;
  state.roster = [];
  state.recruitPool = [
    makePoolWarrior({ id: 'pw1', name: 'Alpha', tier: 'Common', cost: 50, age: 20, style: FightingStyle.StrikingAttack }),
    makePoolWarrior({ id: 'pw2', name: 'Beta', tier: 'Promising', cost: 100, age: 22, style: FightingStyle.BashingAttack }),
    makePoolWarrior({ id: 'pw3', name: 'Gamma', tier: 'Exceptional', cost: 200, age: 25, style: FightingStyle.StrikingAttack }),
    makePoolWarrior({ id: 'pw4', name: 'Delta', tier: 'Prodigy', cost: 400, age: 18, style: FightingStyle.ParryRiposte }),
  ];
  Object.assign(state, partial);
  useGameStore.getState().loadGame('test-slot', state as GameState);
}

// ─── useRecruitFilters ─────────────────────────────────────────────────────

describe('useRecruitFilters', () => {
  it('returns all warriors when all tiers active and style=all', () => {
    const pool = [
      makePoolWarrior({ id: 'a', tier: 'Common' }),
      makePoolWarrior({ id: 'b', tier: 'Prodigy' }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    expect(result.current.filteredPool).toHaveLength(2);
  });

  it('filters by tier when a tier is toggled off', () => {
    const pool = [
      makePoolWarrior({ id: 'a', tier: 'Common' }),
      makePoolWarrior({ id: 'b', tier: 'Prodigy' }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.toggleTier('Prodigy'));
    expect(result.current.filteredPool).toHaveLength(1);
    expect(result.current.filteredPool[0]!.id).toBe('a');
  });

  it('toggleTier adds a tier back after removal', () => {
    const pool = [
      makePoolWarrior({ id: 'a', tier: 'Common' }),
      makePoolWarrior({ id: 'b', tier: 'Prodigy' }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.toggleTier('Prodigy'));
    expect(result.current.filteredPool).toHaveLength(1);
    act(() => result.current.toggleTier('Prodigy'));
    expect(result.current.filteredPool).toHaveLength(2);
  });

  it('filters by style when activeStyle is set', () => {
    const pool = [
      makePoolWarrior({ id: 'a', style: FightingStyle.StrikingAttack }),
      makePoolWarrior({ id: 'b', style: FightingStyle.BashingAttack }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.setActiveStyle(FightingStyle.BashingAttack));
    expect(result.current.filteredPool).toHaveLength(1);
    expect(result.current.filteredPool[0]!.id).toBe('b');
  });

  it('setActiveStyle updates the style filter', () => {
    const { result } = renderHook(() => useRecruitFilters([]));
    expect(result.current.activeStyle).toBe('all');
    act(() => result.current.setActiveStyle(FightingStyle.StrikingAttack));
    expect(result.current.activeStyle).toBe(FightingStyle.StrikingAttack);
  });

  it('setSortBy updates the sort mode', () => {
    const { result } = renderHook(() => useRecruitFilters([]));
    expect(result.current.sortBy).toBe('potential-desc');
    act(() => result.current.setSortBy('cost-asc'));
    expect(result.current.sortBy).toBe('cost-asc');
  });

  it('sorts by cost-asc correctly', () => {
    const pool = [
      makePoolWarrior({ id: 'a', cost: 300 }),
      makePoolWarrior({ id: 'b', cost: 50 }),
      makePoolWarrior({ id: 'c', cost: 150 }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.setSortBy('cost-asc'));
    expect(result.current.filteredPool.map((w: PoolWarrior) => w.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by cost-desc correctly', () => {
    const pool = [
      makePoolWarrior({ id: 'a', cost: 300 }),
      makePoolWarrior({ id: 'b', cost: 50 }),
      makePoolWarrior({ id: 'c', cost: 150 }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.setSortBy('cost-desc'));
    expect(result.current.filteredPool.map((w: PoolWarrior) => w.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by age-asc correctly', () => {
    const pool = [
      makePoolWarrior({ id: 'a', age: 30 }),
      makePoolWarrior({ id: 'b', age: 18 }),
      makePoolWarrior({ id: 'c', age: 25 }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.setSortBy('age-asc'));
    expect(result.current.filteredPool.map((w: PoolWarrior) => w.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by potential-desc correctly', () => {
    const pool = [
      makePoolWarrior({ id: 'a', potential: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } }),
      makePoolWarrior({ id: 'b', potential: { ST: 25, CN: 25, SZ: 25, WT: 25, WL: 25, SP: 25, DF: 25 } }),
    ];
    const { result } = renderHook(() => useRecruitFilters(pool));
    act(() => result.current.setSortBy('potential-desc'));
    expect(result.current.filteredPool[0]!.id).toBe('b');
  });

  it('handles undefined recruitPool defensively', () => {
    const { result } = renderHook(() => useRecruitFilters(undefined));
    expect(result.current.filteredPool).toEqual([]);
  });
});

// ─── useRecruitActions ─────────────────────────────────────────────────────

describe('useRecruitActions', () => {
  let setState: ReturnType<typeof vi.fn>;
  let deductFunds: ReturnType<typeof vi.fn>;

  function renderActionsHook(overrides?: { rosterFull?: boolean }) {
    setState = vi.fn();
    deductFunds = vi.fn(() => true);
    const { result } = renderHook(() =>
      useRecruitActions({
        rosterFull: overrides?.rosterFull ?? false,
        setState,
        deductFunds,
        week: 1,
        navigate: mockNavigate,
      })
    );
    return result;
  }

  beforeEach(() => {
    loadState();
    mockNavigate.mockClear();
  });

  // ── handleRecruit ──

  it('handleRecruit calls deductFunds with base cost', () => {
    const result = renderActionsHook();
    const w = makePoolWarrior({ cost: 50 });
    act(() => result.current.handleRecruit(w, false));
    expect(deductFunds).toHaveBeenCalledWith(50, expect.any(String), 'recruit');
  });

  it('handleRecruit with bonus calls deductFunds with cost + 50', () => {
    const result = renderActionsHook();
    const w = makePoolWarrior({ cost: 50 });
    act(() => result.current.handleRecruit(w, true));
    expect(deductFunds).toHaveBeenCalledWith(100, expect.any(String), 'recruit');
  });

  it('handleRecruit does nothing when roster is full', () => {
    const result = renderActionsHook({ rosterFull: true });
    const w = makePoolWarrior({ cost: 50 });
    act(() => result.current.handleRecruit(w, false));
    expect(deductFunds).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it('handleRecruit does nothing when deductFunds returns false', () => {
    deductFunds = vi.fn(() => false);
    setState = vi.fn();
    const { result } = renderHook(() =>
      useRecruitActions({
        rosterFull: false,
        setState,
        deductFunds,
        week: 1,
        navigate: mockNavigate,
      })
    );
    const w = makePoolWarrior({ cost: 50 });
    act(() => result.current.handleRecruit(w, false));
    expect(setState).not.toHaveBeenCalled();
  });

  it('handleRecruit calls setState to add warrior and remove from pool', () => {
    const result = renderActionsHook();
    const w = makePoolWarrior({ id: 'pw1', name: 'TestRecruit', cost: 50 });
    act(() => result.current.handleRecruit(w, false));
    expect(setState).toHaveBeenCalled();
  });

  // ── handleScout ──

  it('handleScout calls deductFunds with 25g', () => {
    const result = renderActionsHook();
    const w = makePoolWarrior({ id: 'scout1' });
    act(() => result.current.handleScout(w));
    expect(deductFunds).toHaveBeenCalledWith(25, expect.any(String), 'other');
  });

  it('handleScout adds id to scoutedIds and report to scoutReports', () => {
    const result = renderActionsHook();
    const w = makePoolWarrior({ id: 'scout1' });
    act(() => result.current.handleScout(w));
    expect(result.current.scoutedIds.has('scout1')).toBe(true);
    expect(result.current.scoutReports['scout1']).toBeDefined();
  });

  it('handleScout does nothing when deductFunds returns false', () => {
    deductFunds = vi.fn(() => false);
    setState = vi.fn();
    const { result } = renderHook(() =>
      useRecruitActions({
        rosterFull: false,
        setState,
        deductFunds,
        week: 1,
        navigate: mockNavigate,
      })
    );
    const w = makePoolWarrior({ id: 'scout1' });
    act(() => result.current.handleScout(w));
    expect(result.current.scoutedIds.has('scout1')).toBe(false);
  });

  // ── handleRefresh ──

  it('handleRefresh calls deductFunds with REFRESH_COST', () => {
    const result = renderActionsHook();
    act(() => result.current.handleRefresh());
    expect(deductFunds).toHaveBeenCalledWith(REFRESH_COST, expect.any(String), 'other');
  });

  it('handleRefresh calls setState to replace pool', () => {
    const result = renderActionsHook();
    act(() => result.current.handleRefresh());
    expect(setState).toHaveBeenCalled();
  });

  it('handleRefresh does nothing when deductFunds returns false', () => {
    deductFunds = vi.fn(() => false);
    setState = vi.fn();
    const { result } = renderHook(() =>
      useRecruitActions({
        rosterFull: false,
        setState,
        deductFunds,
        week: 1,
        navigate: mockNavigate,
      })
    );
    act(() => result.current.handleRefresh());
    expect(setState).not.toHaveBeenCalled();
  });

  // ── handleCustomCreate ──

  it('handleCustomCreate calls deductFunds with 200g', () => {
    const result = renderActionsHook();
    act(() =>
      result.current.handleCustomCreate({
        name: 'CustomWarrior',
        style: FightingStyle.StrikingAttack,
        attributes: { ...baseAttrs },
      })
    );
    expect(deductFunds).toHaveBeenCalledWith(200, expect.any(String), 'recruit');
  });

  it('handleCustomCreate does nothing when roster is full', () => {
    const result = renderActionsHook({ rosterFull: true });
    act(() =>
      result.current.handleCustomCreate({
        name: 'CustomWarrior',
        style: FightingStyle.StrikingAttack,
        attributes: { ...baseAttrs },
      })
    );
    expect(deductFunds).not.toHaveBeenCalled();
  });

  it('handleCustomCreate does nothing when deductFunds returns false', () => {
    deductFunds = vi.fn(() => false);
    setState = vi.fn();
    const { result } = renderHook(() =>
      useRecruitActions({
        rosterFull: false,
        setState,
        deductFunds,
        week: 1,
        navigate: mockNavigate,
      })
    );
    act(() =>
      result.current.handleCustomCreate({
        name: 'CustomWarrior',
        style: FightingStyle.StrikingAttack,
        attributes: { ...baseAttrs },
      })
    );
    expect(setState).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ─── useRecruit orchestrator ───────────────────────────────────────────────

describe('useRecruit orchestrator', () => {
  beforeEach(() => {
    loadState();
    mockNavigate.mockClear();
  });

  it('returns all expected keys', () => {
    const { result } = renderHook(() => useRecruit());
    const keys = Object.keys(result.current);
    expect(keys).toContain('roster');
    expect(keys).toContain('treasury');
    expect(keys).toContain('MAX_ROSTER');
    expect(keys).toContain('rosterFull');
    expect(keys).toContain('activeTiers');
    expect(keys).toContain('activeStyle');
    expect(keys).toContain('sortBy');
    expect(keys).toContain('canRefresh');
    expect(keys).toContain('scoutedIds');
    expect(keys).toContain('scoutReports');
    expect(keys).toContain('filteredPool');
    expect(keys).toContain('recruitPool');
    expect(keys).toContain('setActiveStyle');
    expect(keys).toContain('setSortBy');
    expect(keys).toContain('toggleTier');
    expect(keys).toContain('handleRecruit');
    expect(keys).toContain('handleScout');
    expect(keys).toContain('handleRefresh');
    expect(keys).toContain('handleCustomCreate');
  });

  it('MAX_ROSTER equals BASE_ROSTER_CAP + rosterBonus', () => {
    loadState({ rosterBonus: 5 });
    const { result } = renderHook(() => useRecruit());
    expect(result.current.MAX_ROSTER).toBe(BASE_ROSTER_CAP + 5);
  });

  it('rosterFull is true when roster.length >= MAX_ROSTER', () => {
    const roster = Array.from({ length: BASE_ROSTER_CAP }, (_, i) =>
      makeTestWarrior(`w${i}`, `Warrior${i}`)
    );
    loadState({ roster });
    const { result } = renderHook(() => useRecruit());
    expect(result.current.rosterFull).toBe(true);
  });

  it('rosterFull is false when roster.length < MAX_ROSTER', () => {
    loadState({ roster: [] });
    const { result } = renderHook(() => useRecruit());
    expect(result.current.rosterFull).toBe(false);
  });

  it('canRefresh is false when treasury < REFRESH_COST', () => {
    loadState({ treasury: 10 });
    const { result } = renderHook(() => useRecruit());
    expect(result.current.canRefresh).toBe(false);
  });

  it('canRefresh is true when treasury >= REFRESH_COST', () => {
    loadState({ treasury: 1000 });
    const { result } = renderHook(() => useRecruit());
    expect(result.current.canRefresh).toBe(true);
  });
});
