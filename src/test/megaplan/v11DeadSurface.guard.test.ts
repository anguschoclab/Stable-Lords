import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V11 dead-surface spec (test-first, skipped until Phase 3):
 *
 * Pins the dead-code elimination targets found by the V11 knip/orphan audit.
 * Each assertion describes the post-purge shape; the spec flips green as
 * Phase 3 lands each unit. Skipped under ticket MEGAPLAN-V11 per the
 * skip-count guard convention.
 *
 * Targets:
 *  - src/schemas/schemaObjects.ts — pure re-export barrel (imported only by
 *    gameStateSchema.ts). Canonical homes are warriorSchemas/fightSchemas/
 *    economySchemas/schemaEnums.
 *  - gameStateSchema.ts "Re-export all schemas for backward compatibility"
 *    block — removed; consumers import canonical domain files.
 *  - utils/random.ts `SeededRNGService` alias → callers use `SeededRNG`.
 *  - utils/keyUtils.ts `getStablePairKey` alias → callers use `getPairKey`.
 *  - lore/HallOfFights.tsx `export default` → named export only.
 *  - useGameStore.ts dead hook re-exports (8 unused convenience selectors).
 *  - src/data/equipment/weapons.ts — zero-consumer style-list file.
 *  - data/templates/templateCache.ts dead query API (only ALL_TEMPLATES used).
 */

const REPO = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO, 'src');

function* srcFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* srcFiles(full);
    else if (/\.(ts|tsx)$/.test(entry)) yield full;
  }
}

const allSrc = [...srcFiles(SRC)];

function body(rel: string): string {
  return readFileSync(path.join(REPO, rel), 'utf8');
}

function referencesSymbol(symbol: string): string[] {
  const re = new RegExp(`\\b${symbol}\\b`);
  return allSrc.filter((f) => re.test(readFileSync(f, 'utf8')));
}

describe('megaplan V11: dead-surface elimination', () => {
describe.skip('MEGAPLAN-V11', () => {
  it('schemaObjects.ts re-export barrel is deleted', () => {
    expect(
      existsSync(path.join(SRC, 'schemas/schemaObjects.ts')),
      'schemaObjects.ts still exists — repoint gameStateSchema imports to domain files'
    ).toBe(false);
  });

  it('gameStateSchema.ts carries no schema re-export block', () => {
    const lines = body('src/schemas/gameStateSchema.ts').split('\n');
    const reExports = lines.filter((l) => /^export\s*\{/.test(l.trim()));
    expect(
      reExports,
      `gameStateSchema.ts still re-exports schemas:\n${reExports.join('\n')}`
    ).toEqual([]);
  });

  it('no SeededRNGService alias anywhere in src', () => {
    expect(referencesSymbol('SeededRNGService')).toEqual([]);
  });

  it('no getStablePairKey alias anywhere in src', () => {
    expect(referencesSymbol('getStablePairKey')).toEqual([]);
  });

  it('HallOfFights has no default export', () => {
    expect(body('src/lore/HallOfFights.tsx')).not.toMatch(/export\s+default/);
  });

  it('useGameStore.ts no longer re-exports dead convenience hooks', () => {
    const dead = [
      'usePlayer',
      'useRoster',
      'useRivals',
      'useTreasury',
      'useWeek',
      'useIsSimulating',
      'useStyleStats',
      'useReputationState',
    ];
    const src = body('src/state/useGameStore.ts');
    const survivors = dead.filter((h) => new RegExp(`\\b${h}\\b`).test(src));
    expect(survivors).toEqual([]);
  });

  it('data/equipment/weapons.ts dead style-list file is deleted', () => {
    expect(existsSync(path.join(SRC, 'data/equipment/weapons.ts'))).toBe(false);
  });

  it('templateCache.ts dead query API is removed', () => {
    const p = path.join(SRC, 'data/templates/templateCache.ts');
    if (!existsSync(p)) return; // whole-file removal also satisfies this
    const src = readFileSync(p, 'utf8');
    const deadFns = src.match(/export\s+(?:function|const)\s+getTemplatesBy\w+/g) ?? [];
    expect(deadFns).toEqual([]);
    expect(src).not.toMatch(/export\s+function\s+searchTemplates/);
    expect(src).not.toMatch(/export\s+(?:function|const)\s+getCacheStats/);
  });
});
});
