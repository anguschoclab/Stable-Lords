/**
 * Rival stable naming — roster warriors get culture-aware generated names,
 * unique across every generated stable, never a positional fallback.
 */
import { describe, it, expect } from 'vitest';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '@/engine/rivals';
import { ALL_TEMPLATES } from '@/data/templates';

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

  it('keeps stable names unique past the [V] generation cap', () => {
    // ~21 templates — iterating well past it exercises the unbounded numeral.
    const rivals = generateRivalStables(ALL_TEMPLATES.length * 7, 777);
    const names = rivals.map((r) => r.owner.stableName);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain(`${ALL_TEMPLATES[0]!.stableName} [VI]`);
  });
});

describe('uniqueStableName / uniqueOwnerName', () => {
  it('passes through a free name', () => {
    expect(uniqueStableName('Steel Serpents', new Set())).toBe('Steel Serpents');
    expect(uniqueOwnerName('Marcus Vael', new Set())).toBe('Marcus Vael');
  });

  it('suffixes collisions until free', () => {
    const used = new Set(['Steel Serpents', 'Steel Serpents [II]']);
    expect(uniqueStableName('Steel Serpents', used)).toBe('Steel Serpents [III]');
    const owners = new Set(['Marcus Vael', 'Marcus Vael B']);
    expect(uniqueOwnerName('Marcus Vael', owners)).toBe('Marcus Vael C');
  });

  it('strips an existing suffix before re-suffixing', () => {
    const used = new Set(['Steel Serpents', 'Steel Serpents [II]']);
    expect(uniqueStableName('Steel Serpents [II]', used)).toBe('Steel Serpents [III]');
  });

  it('startAt shifts the scan origin for same-week shard mints', () => {
    const used = new Set(['Steel Serpents']);
    expect(uniqueStableName('Steel Serpents', used, 5)).toBe('Steel Serpents [V]');
  });
});
