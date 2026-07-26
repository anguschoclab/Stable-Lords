/**
 * Arena lore dedup — verifies no duplicate arena lore IDs or narratives.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_LORE, getAllArenas } from '@/data/arenas';

describe('arena lore dedup', () => {
  it('ARENA_LORE has no duplicate IDs', () => {
    const ids = ARENA_LORE.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size, `Duplicate arena lore IDs found`).toBe(ids.length);
  });

  it('ARENA_LORE has no duplicate narratives', () => {
    const narratives = ARENA_LORE.map((entry) => entry.narrative);
    const uniqueNarratives = new Set(narratives);
    expect(uniqueNarratives.size, `Duplicate arena lore narratives found`).toBe(narratives.length);
  });

  it('all entries use narrative field (not description)', () => {
    for (const entry of ARENA_LORE) {
      expect(entry.narrative, `${entry.id} missing narrative field`).toBeDefined();
      expect(entry.narrative.length).toBeGreaterThan(0);
    }
  });

  it('no entries have unlockRequirement field', () => {
    for (const entry of ARENA_LORE) {
      expect((entry as any).unlockRequirement, `${entry.id} has invalid unlockRequirement field`).toBeUndefined();
    }
  });

  it('no entries have discovered field', () => {
    for (const entry of ARENA_LORE) {
      expect((entry as any).discovered, `${entry.id} has invalid discovered field`).toBeUndefined();
    }
  });

  it('all arenaId values reference valid arenas', () => {
    const validArenaIds = new Set(getAllArenas().map((a) => a.id));
    for (const entry of ARENA_LORE) {
      expect(validArenaIds.has(entry.arenaId), `${entry.id} references invalid arenaId: ${entry.arenaId}`).toBe(true);
    }
  });

  it('no entry references proving_grounds (invalid arena ID)', () => {
    for (const entry of ARENA_LORE) {
      expect(entry.arenaId, `${entry.id} references invalid arena proving_grounds`).not.toBe('proving_grounds');
    }
  });
});
