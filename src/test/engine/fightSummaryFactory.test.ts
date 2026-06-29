import { describe, it, expect } from 'vitest';
import {
  createFightSummary,
  createBoutSummary,
  createMinimalFightSummary,
} from '@/engine/core/fightSummaryFactory';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';

describe('fightSummaryFactory attaches analysis', () => {
  it('includes analysis built from the outcome exchangeLog', () => {
    const warriorA: Warrior = {
      id: 'a' as any,
      name: 'Aulus',
      style: FightingStyle.LungingAttack,
      attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
      baseSkills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
      derivedStats: { hp: 30, endurance: 20, damage: 5, encumbrance: 0 },
      fame: 10,
      popularity: 5,
      titles: [],
      injuries: [],
      flair: [],
      career: { wins: 0, losses: 0, kills: 0 },
      champion: false,
      status: 'Active',
      stableId: 's1' as any,
      traits: [],
    };

    const warriorD: Warrior = {
      id: 'd' as any,
      name: 'Bran',
      style: FightingStyle.TotalParry,
      attributes: { ST: 12, CN: 14, SZ: 11, WT: 10, WL: 12, SP: 10, DF: 11 },
      baseSkills: { ATT: 10, PAR: 12, DEF: 11, INI: 10, RIP: 8, DEC: 8 },
      derivedStats: { hp: 32, endurance: 22, damage: 4, encumbrance: 0 },
      fame: 8,
      popularity: 4,
      titles: [],
      injuries: [],
      flair: [],
      career: { wins: 0, losses: 0, kills: 0 },
      champion: false,
      status: 'Active',
      stableId: 's2' as any,
      traits: [],
    };

    const outcome: FightOutcome = {
      winner: 'A',
      by: 'Kill',
      minutes: 7,
      log: [],
      exchangeLog: [
        {
          exchangeIndex: 0,
          minute: 1,
          iniWinner: 'A',
          attResult: 'hit',
          damage: 4,
          endDeltas: { a: -3, d: -5 },
        },
        {
          exchangeIndex: 1,
          minute: 2,
          iniWinner: 'A',
          attResult: 'hit',
          damage: 6,
          endDeltas: { a: -3, d: -6 },
        },
        {
          exchangeIndex: 2,
          minute: 3,
          iniWinner: 'A',
          attResult: 'crit',
          damage: 12,
          killWindow: true,
          executionFlag: true,
          reasonCodes: ['AI_PUSH_FATIGUE'],
        },
      ],
      post: {
        xpA: 10,
        xpD: 2,
        hitsA: 3,
        hitsD: 0,
        gotKillA: true,
        causeBucket: 'FATAL_DAMAGE',
        fatalExchangeIndex: 2,
      },
    };

    const summary = createFightSummary({
      warriorA,
      warriorD,
      outcome,
      week: 1,
      rng: { uuid: () => 'test-id' },
    });

    expect(summary.analysis).toBeDefined();
    expect(summary.analysis?.styleMatchup).toBeDefined();
    expect(summary.analysis?.factors.length).toBeGreaterThan(0);
  });
});

// ─── Shared mock helpers ──────────────────────────────────────────────────────

const makeWarriorA = (overrides: Partial<Warrior> = {}): Warrior => ({
  id: 'a' as any,
  name: 'Aulus',
  style: FightingStyle.LungingAttack,
  attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
  baseSkills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
  derivedStats: { hp: 30, endurance: 20, damage: 5, encumbrance: 0 },
  fame: 10,
  popularity: 5,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 0, losses: 0, kills: 0 },
  champion: false,
  status: 'Active',
  stableId: 's1' as any,
  traits: [],
  ...overrides,
});

const makeWarriorD = (overrides: Partial<Warrior> = {}): Warrior => ({
  id: 'd' as any,
  name: 'Bran',
  style: FightingStyle.TotalParry,
  attributes: { ST: 12, CN: 14, SZ: 11, WT: 10, WL: 12, SP: 10, DF: 11 },
  baseSkills: { ATT: 10, PAR: 12, DEF: 11, INI: 10, RIP: 8, DEC: 8 },
  derivedStats: { hp: 32, endurance: 22, damage: 4, encumbrance: 0 },
  fame: 8,
  popularity: 4,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 0, losses: 0, kills: 0 },
  champion: false,
  status: 'Active',
  stableId: 's2' as any,
  traits: [],
  ...overrides,
});

const makeOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome => ({
  winner: 'A',
  by: 'Kill',
  minutes: 7,
  log: [],
  ...overrides,
});

// ─── createFightSummary field-mapping tests ───────────────────────────────────

describe('createFightSummary field mapping', () => {
  it('builds title without tournament name', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.title).toBe('Aulus vs Bran');
  });

  it('builds title with tournament name', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 1,
      tournamentName: 'Spring Cup',
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.title).toBe('Aulus vs Bran (Spring Cup)');
  });

  it('extracts transcript from outcome.log entries', () => {
    const outcome = makeOutcome({
      log: [
        { minute: 1, text: 'Aulus strikes!' },
        { minute: 2, text: 'Bran parries!' },
      ],
    });
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome,
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.transcript).toEqual(['Aulus strikes!', 'Bran parries!']);
  });

  it('returns empty transcript when outcome.log is empty', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome({ log: [] }),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.transcript).toEqual([]);
  });

  it('returns empty transcript when outcome.log is undefined', () => {
    const outcome = makeOutcome();
    delete (outcome as any).log;
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome,
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.transcript).toEqual([]);
  });

  it('generates id via rng.uuid with bout prefix', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: (prefix?: string) => `id-${prefix}` },
    });
    expect(summary.id).toBe('id-bout' as any);
  });

  it('calculates createdAt for week 1', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('calculates createdAt for week 10', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 10,
      rng: { uuid: () => 'test-id' },
    });
    // Week 10 = Jan 1 + 9*7 days = Jan 1 + 63 days = Mar 5
    expect(summary.createdAt).toBe(new Date(Date.UTC(2026, 0, 1) + 9 * 7 * 24 * 60 * 60 * 1000).toISOString());
  });

  it('maps warriorIdA and warriorIdD from warrior objects', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA({ id: 'warrior-aaa' as any }),
      warriorD: makeWarriorD({ id: 'warrior-ddd' as any }),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.warriorIdA).toBe('warrior-aaa' as any);
    expect(summary.warriorIdD).toBe('warrior-ddd' as any);
  });

  it('maps stableIdA and stableIdD from warrior objects', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA({ stableId: 'stable-aaa' as any }),
      warriorD: makeWarriorD({ stableId: 'stable-ddd' as any }),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.stableIdA).toBe('stable-aaa');
    expect(summary.stableIdD).toBe('stable-ddd');
  });

  it('maps winner and by from outcome', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome({ winner: 'D', by: 'KO' }),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.winner).toBe('D');
    expect(summary.by).toBe('KO');
  });

  it('maps styleA and styleD from warrior styles', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA({ style: FightingStyle.BashingAttack }),
      warriorD: makeWarriorD({ style: FightingStyle.WallOfSteel }),
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.styleA).toBe(FightingStyle.BashingAttack);
    expect(summary.styleD).toBe(FightingStyle.WallOfSteel);
  });

  it('passes tournamentId through', () => {
    const summary = createFightSummary({
      warriorA: makeWarriorA(),
      warriorD: makeWarriorD(),
      outcome: makeOutcome(),
      week: 1,
      tournamentId: 'tourn-123',
      rng: { uuid: () => 'test-id' },
    });
    expect(summary.tournamentId).toBe('tourn-123' as any);
  });

  it('falls back to zeroSkills when warrior.baseSkills is undefined', () => {
    const warriorA = makeWarriorA();
    delete warriorA.baseSkills;
    const warriorD = makeWarriorD();
    delete warriorD.baseSkills;
    const summary = createFightSummary({
      warriorA,
      warriorD,
      outcome: makeOutcome(),
      week: 1,
      rng: { uuid: () => 'test-id' },
    });
    // analysis should still be built (not throw) with zeroed skills
    expect(summary.analysis).toBeDefined();
  });
});

// ─── createBoutSummary (previously untested) ──────────────────────────────────

describe('createBoutSummary', () => {
  it('creates a valid FightSummary with correct fields', () => {
    const summary = createBoutSummary(
      makeWarriorA(),
      makeWarriorD(),
      makeOutcome({ winner: 'A', by: 'Kill' }),
      3,
      { uuid: () => 'bout-id' }
    );
    expect(summary.id).toBe('bout-id' as any);
    expect(summary.week).toBe(3);
    expect(summary.title).toBe('Aulus vs Bran');
    expect(summary.winner).toBe('A');
    expect(summary.by).toBe('Kill');
    expect(summary.phase).toBe('resolution');
  });

  it('does not set tournamentId (non-tournament bout)', () => {
    const summary = createBoutSummary(
      makeWarriorA(),
      makeWarriorD(),
      makeOutcome(),
      1,
      { uuid: () => 'bout-id' }
    );
    expect(summary.tournamentId).toBeUndefined();
  });
});

// ─── createMinimalFightSummary (previously untested) ──────────────────────────

describe('createMinimalFightSummary', () => {
  it('generates id via rng.uuid', () => {
    const summary = createMinimalFightSummary(
      makeWarriorA(),
      makeWarriorD(),
      'A',
      'Kill',
      1,
      { uuid: (prefix?: string) => `min-${prefix}` }
    );
    expect(summary.id).toBe('min-bout' as any);
  });

  it('builds title without tournament context', () => {
    const summary = createMinimalFightSummary(
      makeWarriorA(),
      makeWarriorD(),
      'A',
      'Kill',
      1,
      { uuid: () => 'min-id' }
    );
    expect(summary.title).toBe('Aulus vs Bran');
  });

  it('has empty transcript and no analysis field', () => {
    const summary = createMinimalFightSummary(
      makeWarriorA(),
      makeWarriorD(),
      'D',
      'KO',
      5,
      { uuid: () => 'min-id' }
    );
    expect(summary.transcript).toEqual([]);
    expect(summary.analysis).toBeUndefined();
  });
});
