/**
 * Unit tests for extracted aging helpers: applyAgePenalty, checkForcedRetirement, buildRetiredWarrior.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { applyAgePenalty, checkForcedRetirement, buildRetiredWarrior } from '@/engine/aging';
import type { Warrior, Attributes, WarriorId } from '@/types/game';
import { FightingStyle } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { SeededRNGService } from '@/utils/random';

function makeWarrior(id: string, age: number, attrs: Partial<Attributes> = {}): Warrior {
  const fullAttrs: Attributes = {
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
    ...attrs,
  };
  const { baseSkills, derivedStats } = computeWarriorStats(fullAttrs, FightingStyle.StrikingAttack);
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: fullAttrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── applyAgePenalty ──────────────────────────────────────────────────────

describe('applyAgePenalty', () => {
  it('returns no update when isAgeTick is false', () => {
    const w = makeWarrior('w1', 28, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, false, true);

    expect(result.currentAge).toBe(28);
    expect(result.update).toEqual({});
    expect(result.ageEvent).toBeUndefined();
  });

  it('sets update.age but no SP/DF penalty when age stays at penalty start (24→25)', () => {
    const w = makeWarrior('w1', 24, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, true, true);

    expect(result.currentAge).toBe(25);
    expect(result.update.age).toBe(25);
    expect(result.update.attributes).toBeUndefined();
    expect(result.ageEvent).toBeUndefined();
  });

  it('applies penalty=1 to SP and DF when age 27→28 (> 25, floor(3/3)=1)', () => {
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, true, true);

    expect(result.currentAge).toBe(28);
    expect(result.update.attributes!.SP).toBe(14);
    expect(result.update.attributes!.DF).toBe(14);
    expect(result.update.baseSkills).toBeDefined();
    expect(result.update.derivedStats).toBeDefined();
    expect(result.ageEvent).toContain('aging');
  });

  it('applies penalty=2 when age 30→31 (> 25, floor(6/3)=2)', () => {
    const w = makeWarrior('w1', 30, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, true, true);

    expect(result.currentAge).toBe(31);
    expect(result.update.attributes!.SP).toBe(13);
    expect(result.update.attributes!.DF).toBe(13);
  });

  it('floors SP at 3 when penalty exceeds current SP', () => {
    const w = makeWarrior('w1', 30, { SP: 3, DF: 15 });
    const result = applyAgePenalty(w, true, true);

    expect(result.update.attributes!.SP).toBe(3);
    expect(result.update.attributes!.DF).toBe(13);
  });

  it('floors DF at 3 when penalty exceeds current DF', () => {
    const w = makeWarrior('w1', 30, { SP: 15, DF: 3 });
    const result = applyAgePenalty(w, true, true);

    expect(result.update.attributes!.SP).toBe(13);
    expect(result.update.attributes!.DF).toBe(3);
  });

  it('does not produce ageEvent for non-player warriors', () => {
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, true, false);

    expect(result.ageEvent).toBeUndefined();
  });

  it('produces ageEvent for player warriors when penalty applied', () => {
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const result = applyAgePenalty(w, true, true);

    expect(result.ageEvent).toBeDefined();
    expect(result.ageEvent).toContain('Warrior w1');
  });
});

// ─── checkForcedRetirement ────────────────────────────────────────────────

describe('checkForcedRetirement', () => {
  it('returns retired=false for age below FORCED_RETIRE_MIN (25)', () => {
    const rng = new SeededRNGService(1);
    const result = checkForcedRetirement(25, true, rng, 'Test');

    expect(result.retired).toBe(false);
    expect(result.ageEvent).toBeUndefined();
  });

  it('guarantees retirement at FORCED_RETIRE_MAX (32)', () => {
    const rng = new SeededRNGService(1);
    const result = checkForcedRetirement(32, true, rng, 'Test');

    expect(result.retired).toBe(true);
    expect(result.ageEvent).toContain('forced to retire');
  });

  it('retires with low rng roll at age 29 (chance=0.075, roll=0.01)', () => {
    vi.spyOn(SeededRNGService.prototype, 'next').mockReturnValue(0.01);
    const rng = new SeededRNGService(1);
    const result = checkForcedRetirement(29, true, rng, 'Test');

    expect(result.retired).toBe(true);
    expect(result.ageEvent).toContain('hang up the blade');
  });

  it('does not retire with high rng roll at age 29 (roll=0.99)', () => {
    vi.spyOn(SeededRNGService.prototype, 'next').mockReturnValue(0.99);
    const rng = new SeededRNGService(1);
    const result = checkForcedRetirement(29, true, rng, 'Test');

    expect(result.retired).toBe(false);
  });

  it('does not produce ageEvent for non-player warriors even when retired', () => {
    const rng = new SeededRNGService(1);
    const result = checkForcedRetirement(32, false, rng, 'Test');

    expect(result.retired).toBe(true);
    expect(result.ageEvent).toBeUndefined();
  });
});

// ─── buildRetiredWarrior ──────────────────────────────────────────────────

describe('buildRetiredWarrior', () => {
  it('constructs a retired warrior with correct fields', () => {
    const w = makeWarrior('w1', 30, { SP: 15, DF: 15 });
    const result = buildRetiredWarrior(w, 31, 52);

    expect(result.status).toBe('Retired');
    expect(result.age).toBe(31);
    expect(result.retiredWeek).toBe(52);
    expect(result.id).toBe(w.id);
    expect(result.name).toBe(w.name);
    expect(result.attributes).toEqual(w.attributes);
  });
});
