import { describe, it, expect } from 'vitest';
import { truncateState } from '@/engine/storage/truncation';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { FightSummary } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

function makeFightSummary(id: string, week: number): FightSummary {
  return {
    id: id as any,
    week,
    warriorIdA: 'w1' as any,
    warriorIdD: 'w2' as any,
    stableIdA: 's-a' as any,
    stableIdD: 's-d' as any,
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.TotalParry,
    winner: 'A',
    by: 'KO',
    title: 'Test Fight',
    transcript: ['line1', 'line2'],
    createdAt: new Date().toISOString(),
  };
}

describe('truncationBounds', () => {
  it('arenaHistory is truncated to 500 entries', () => {
    const state = createFreshState('truncation-test');
    state.arenaHistory = Array.from({ length: 1000 }, (_, i) => makeFightSummary(`f${i}`, i + 1));

    const truncated = truncateState(state);
    expect(truncated.arenaHistory!.length).toBe(500);
  });

  it('transcripts are stripped from fights older than 20 entries', () => {
    const state = createFreshState('truncation-transcript-test');
    state.arenaHistory = Array.from({ length: 100 }, (_, i) => makeFightSummary(`f${i}`, i + 1));

    const truncated = truncateState(state);
    // Last 20 should have transcripts
    const last20 = truncated.arenaHistory!.slice(-20);
    const older = truncated.arenaHistory!.slice(0, -20);

    for (const f of last20) {
      expect(f.transcript).toBeDefined();
    }
    for (const f of older) {
      expect(f.transcript).toBeUndefined();
    }
  });

  it('newsletter is truncated to 100 entries', () => {
    const state = createFreshState('truncation-newsletter-test');
    state.newsletter = Array.from({ length: 200 }, (_, i) => ({ week: i + 1 }) as any);

    const truncated = truncateState(state);
    expect(truncated.newsletter!.length).toBe(100);
  });

  it('ledger is truncated to 500 entries', () => {
    const state = createFreshState('truncation-ledger-test');
    state.ledger = Array.from(
      { length: 1000 },
      (_, i) => ({ id: `l${i}`, amount: 100, week: i + 1, type: 'income' }) as any
    );

    const truncated = truncateState(state);
    expect(truncated.ledger!.length).toBe(500);
  });

  it('graveyard is truncated to 200 entries', () => {
    const state = createFreshState('truncation-graveyard-test');
    state.graveyard = Array.from(
      { length: 300 },
      (_, i) => ({ id: `g${i}`, name: `Warrior${i}`, isDead: true }) as any
    );

    const truncated = truncateState(state);
    expect(truncated.graveyard!.length).toBe(200);
  });

  it('lastWeekBoutDisplay is cleared', () => {
    const state = createFreshState('truncation-boutdisplay-test');
    state.lastWeekBoutDisplay = { results: [], deathNames: [], injuryNames: [] } as any;

    const truncated = truncateState(state);
    expect(truncated.lastWeekBoutDisplay).toBeUndefined();
  });

  it('truncation preserves core fields (treasury, week, year, roster)', () => {
    const state = createFreshState('truncation-preserve-test');
    state.treasury = 5000;
    state.week = 10;
    state.year = 2;

    const truncated = truncateState(state);
    expect(truncated.treasury).toBe(5000);
    expect(truncated.week).toBe(10);
    expect(truncated.year).toBe(2);
    expect(truncated.roster).toBe(state.roster);
  });
});
