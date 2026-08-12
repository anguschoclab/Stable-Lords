import { describe, it, expect } from 'vitest';
import { narrativeContent, loadCombatNarrative } from '@/data/narrative';
import { getFromArchive, peekArchive, richHitLocation } from '@/engine/narrative/narrativePBPUtils';
import { SeededRNG } from '@/utils/random';

describe('lazy-load combat narrative — after load', () => {
  it('loadCombatNarrative populates combat data', async () => {
    await loadCombatNarrative();
    expect(narrativeContent.pbp).toBeDefined();
    expect(narrativeContent.strikes).toBeDefined();
    expect(narrativeContent.conclusions).toBeDefined();
    expect(narrativeContent.passives).toBeDefined();
  });

  it('after load, getFromArchive retrieves pbp.openers', async () => {
    await loadCombatNarrative();
    const rng = new SeededRNG(1);
    const template = getFromArchive(rng, ['pbp', 'openers']);
    expect(template).toBeDefined();
    expect(typeof template).toBe('string');
    expect(template.length).toBeGreaterThan(0);
    expect(template).not.toBe('A fierce exchange occurs.');
  });

  it('after load, peekArchive finds strikes.slashing.glancing', async () => {
    await loadCombatNarrative();
    const result = peekArchive(['strikes', 'slashing', 'glancing']);
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it('after load, richHitLocation returns non-empty string', async () => {
    await loadCombatNarrative();
    const rng = new SeededRNG(1);
    const result = richHitLocation(rng, 'chest');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('loadCombatNarrative is idempotent (calling twice is a no-op)', async () => {
    await loadCombatNarrative();
    const pbpBefore = narrativeContent.pbp;
    await loadCombatNarrative();
    expect(narrativeContent.pbp).toBe(pbpBefore);
  });

  it('loadCombatNarrative caches the promise (same promise returned)', async () => {
    const p1 = loadCombatNarrative();
    const p2 = loadCombatNarrative();
    expect(Object.is(p1, p2)).toBe(true);
    await p1;
  });
});
