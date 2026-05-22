/**
 * advanceWeek pipeline tests — verifies orchestration of the weekly pipeline
 * NOTE: The pipeline uses a pass-based architecture. Mocks target pass modules directly.
 */
import { describe, it, expect, vi } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';

const mockResolveImpacts = vi.hoisted(() => vi.fn((state: any) => (state ? { ...state } : {})));
const mockArchiveWeekLogs = vi.hoisted(() => vi.fn((s: any) => s));
const mockRunWarriorPass = vi.hoisted(() => vi.fn(() => ({})));
const mockRunEconomyPass = vi.hoisted(() => vi.fn(() => ({})));
const mockRunBoutSimulationPass = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('@/engine/pipeline/passes/WarriorPass', () => ({ runWarriorPass: mockRunWarriorPass }));
vi.mock('@/engine/pipeline/passes/EconomyPass', () => ({ runEconomyPass: mockRunEconomyPass }));
vi.mock('@/engine/pipeline/passes/EquipmentPass', () => ({ runEquipmentPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/RecruitmentPass', () => ({ runRecruitmentPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/RivalStrategyPass', () => ({ runRivalStrategyPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/WorldPass', () => ({ runWorldPass: vi.fn(() => ({})), computeNextSeason: vi.fn(() => 'Summer') }));
vi.mock('@/engine/pipeline/passes/SystemPass', () => ({ runSystemPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/RankingsPass', () => ({ runRankingsPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/PromoterPass', () => ({ runPromoterPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/PromoterLifecyclePass', () => ({ runPromoterLifecyclePass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/TrainerPass', () => ({ runTrainerPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/EventPass', () => ({ runEventPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/NarrativePass', () => ({ runNarrativePass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/seasonal', () => ({ runSeasonalPass: vi.fn(() => ({})) }));
vi.mock('@/engine/pipeline/passes/BoutSimulationPass', () => ({ runBoutSimulationPass: mockRunBoutSimulationPass }));
vi.mock('@/engine/pipeline/adapters/opfsArchiver', () => ({ archiveWeekLogs: mockArchiveWeekLogs }));
vi.mock('@/engine/impacts', () => ({
  resolveImpacts: mockResolveImpacts,
  mergeImpacts: vi.fn((impacts: any) => impacts),
  StateImpact: {},
}));

import * as WarriorPass from '@/engine/pipeline/passes/WarriorPass';
import * as EconomyPass from '@/engine/pipeline/passes/EconomyPass';
import * as Impacts from '@/engine/impacts';

describe('advanceWeek pipeline orchestration', () => {
  it('calls warrior and economy pass functions', () => {
    const state = createFreshState('test-seed-week');
    advanceWeek(state);

    expect(WarriorPass.runWarriorPass).toHaveBeenCalled();
    expect(EconomyPass.runEconomyPass).toHaveBeenCalled();
  });

  it('resolves collected impacts using resolveImpacts', () => {
    const state = createFreshState('test-seed-week');
    advanceWeek(state);

    expect(Impacts.resolveImpacts).toHaveBeenCalled();
  });

  it('advances the week counter and returns a new state', () => {
    const state = createFreshState('test-seed');
    const originalWeek = state.week;

    const next = advanceWeek(state);

    expect(next.week).toBe(originalWeek + 1);
    expect(next).not.toBe(state);
  });
});
