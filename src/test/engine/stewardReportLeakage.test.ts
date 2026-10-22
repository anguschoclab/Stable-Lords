import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState } from '@/types/state.types';
import { makeGameState as fixtureGameState } from '@/test/_fixtures/factories';

const makeState = (lastSimReport?: any): GameState =>
  fixtureGameState({
    fame: 50,
    rivals: [],
    recruitPool: [],
    stewardReport: lastSimReport,
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any);

describe('NF1: stewardReport leakage', () => {
  it('stewardReport is replaced (not merged) by impact system', () => {
    const oldReport = {
      id: 'old-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 100,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Old Fight', winner: 'A', by: 'KO' } as any],
    };

    const state = makeState(oldReport);

    // Apply a new stewardReport impact
    const newReport = {
      id: 'new-report' as any,
      week: 2,
      absoluteWeek: 2,
      treasuryChange: 200,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'New Fight', winner: 'D', by: 'Kill' } as any],
    };

    const impact: StateImpact = {
      stewardReport: newReport as any,
    };

    resolveImpacts(state, [impact]);

    // The new report should completely replace the old one
    expect(state.stewardReport).toBe(newReport);
    expect(state.stewardReport?.week).toBe(2);
    expect(state.stewardReport?.bouts?.length).toBe(1);
    expect(state.stewardReport?.bouts?.[0]?.title).toBe('New Fight');
  });

  it('stewardReport does not accumulate bouts across weeks', () => {
    const week1Report = {
      id: 'week1' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Week 1 Fight' } as any],
    };

    const state = makeState(week1Report);

    // Simulate week 2's report
    const week2Report = {
      id: 'week2' as any,
      week: 2,
      absoluteWeek: 2,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Week 2 Fight' } as any],
    };

    resolveImpacts(state, [{ stewardReport: week2Report } as any]);

    // Should only have week 2's bouts, not accumulated
    expect(state.stewardReport?.bouts?.length).toBe(1);
    expect(state.stewardReport?.bouts?.[0]?.title).toBe('Week 2 Fight');
  });

  it('stewardReport with undefined impact does not clear existing report', () => {
    const existingReport = {
      id: 'existing' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [],
    };

    const state = makeState(existingReport);

    // Apply an impact that does NOT include stewardReport
    resolveImpacts(state, [{ treasuryDelta: 100 }]);

    // The existing report should still be there
    expect(state.stewardReport).toBe(existingReport);
  });
});
