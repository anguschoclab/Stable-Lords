import { describe, it, expect } from 'vitest';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

describe('populateInitialWorld', () => {
  const baseState = createFreshState('test-seed');

  it('returns a new GameState (not the same object reference as input)', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result).not.toBe(baseState);
  });

  it('generates exactly 45 rival stables', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.rivals).toHaveLength(45);
  });

  it('generates exactly 4 player roster warriors', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.roster).toHaveLength(4);
  });

  it('player roster warriors have the 4 distinct styles', () => {
    const result = populateInitialWorld(baseState, 42);
    const styles = result.roster.map((w) => w.style);
    expect(styles).toContain(FightingStyle.StrikingAttack);
    expect(styles).toContain(FightingStyle.WallOfSteel);
    expect(styles).toContain(FightingStyle.ParryRiposte);
    expect(styles).toContain(FightingStyle.LungingAttack);
    expect(new Set(styles).size).toBe(4);
  });

  it('sets treasury to 500', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.treasury).toBe(500);
  });

  it('sets week to 1 and year to 1', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.week).toBe(1);
    expect(result.year).toBe(1);
  });

  it('sets isFTUE to false and ftueComplete to true', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.isFTUE).toBe(false);
    expect(result.ftueComplete).toBe(true);
  });

  it('sets boutOffers to empty object', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.boutOffers).toEqual({});
  });

  it('sets realmRankings to empty object', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.realmRankings).toEqual({});
  });

  it('generates a non-empty recruitPool with 12 entries', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.recruitPool).toHaveLength(12);
  });

  it('generates a non-empty hiringPool with 8 entries', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.hiringPool).toHaveLength(8);
  });

  it('generates promoters with 30 entries', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(Object.keys(result.promoters)).toHaveLength(30);
  });

  it('all rival rosters are non-empty', () => {
    const result = populateInitialWorld(baseState, 42);
    for (const rival of result.rivals) {
      expect(rival.roster.length).toBeGreaterThan(0);
    }
  });

  it('player roster warriors have valid attributes (ST/CN/SP/DF in 8-11, SZ/WT/WL = 10)', () => {
    const result = populateInitialWorld(baseState, 42);
    for (const w of result.roster) {
      expect(w.attributes.ST).toBeGreaterThanOrEqual(8);
      expect(w.attributes.ST).toBeLessThanOrEqual(11);
      expect(w.attributes.CN).toBeGreaterThanOrEqual(8);
      expect(w.attributes.CN).toBeLessThanOrEqual(11);
      expect(w.attributes.SP).toBeGreaterThanOrEqual(8);
      expect(w.attributes.SP).toBeLessThanOrEqual(11);
      expect(w.attributes.DF).toBeGreaterThanOrEqual(8);
      expect(w.attributes.DF).toBeLessThanOrEqual(11);
      expect(w.attributes.SZ).toBe(10);
      expect(w.attributes.WT).toBe(10);
      expect(w.attributes.WL).toBe(10);
    }
  });

  it('determinism: same seed produces identical state', () => {
    const s1 = populateInitialWorld(createFreshState('test-seed'), 42);
    const s2 = populateInitialWorld(createFreshState('test-seed'), 42);
    expect(s1.rivals).toHaveLength(s2.rivals!.length);
    expect(s1.roster.map((w) => w.name)).toEqual(s2.roster.map((w) => w.name));
    expect(s1.roster.map((w) => w.style)).toEqual(s2.roster.map((w) => w.style));
    expect(s1.roster.map((w) => w.attributes)).toEqual(s2.roster.map((w) => w.attributes));
  });

  it('different seeds produce different states', () => {
    const s1 = populateInitialWorld(createFreshState('test-seed'), 42);
    const s2 = populateInitialWorld(createFreshState('test-seed'), 999);
    // Rival names or roster attributes should differ
    const names1 = s1.rivals.map((r) => r.owner.stableName);
    const names2 = s2.rivals.map((r) => r.owner.stableName);
    expect(names1).not.toEqual(names2);
  });

  it('accepts custom rng parameter', () => {
    const customRng = new SeededRNGService(12345);
    const result = populateInitialWorld(baseState, 42, customRng);
    expect(result.roster).toHaveLength(4);
    // With custom RNG, player roster attributes should be deterministic from seed 12345
    const expected = populateInitialWorld(baseState, 42, new SeededRNGService(12345));
    expect(result.roster.map((w) => w.attributes)).toEqual(expected.roster.map((w) => w.attributes));
  });

  it('preserves base state fields from input (player, meta spread through)', () => {
    const result = populateInitialWorld(baseState, 42);
    expect(result.player).toEqual(baseState.player);
    expect(result.meta).toEqual(baseState.meta);
  });
});
