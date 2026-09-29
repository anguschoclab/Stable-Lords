/**
 * Rival stable naming — roster warriors get culture-aware generated names,
 * unique across every generated stable, never a positional fallback.
 */
import { describe, it, expect } from 'vitest';
import { generateRivalStables } from '@/engine/rivals';

const NAME_RE = /^[A-Z][A-Z '-]{1,19}$/;

describe('generateRivalStables — warrior naming', () => {
  it('gives every rival warrior a valid arena-format name', () => {
    const rivals = generateRivalStables(10, 12345);
    const names = rivals.flatMap((r) => r.roster.map((w) => w.name));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      expect(n, `bad format: ${n}`).toMatch(NAME_RE);
    }
  });

  it('produces globally unique names across all stables', () => {
    const rivals = generateRivalStables(15, 777);
    const names = rivals.flatMap((r) => r.roster.map((w) => w.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('never emits the STABLE_# positional fallback', () => {
    const rivals = generateRivalStables(15, 4242);
    for (const w of rivals.flatMap((r) => r.roster)) {
      expect(w.name).not.toMatch(/^STABLE_\d+$/);
    }
  });

  it('is deterministic for a seed', () => {
    const a = generateRivalStables(5, 999).flatMap((r) => r.roster.map((w) => w.name));
    const b = generateRivalStables(5, 999).flatMap((r) => r.roster.map((w) => w.name));
    expect(a).toEqual(b);
  });
});
