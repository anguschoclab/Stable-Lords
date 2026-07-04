/**
 * New arena lore entries from lore expansion — verifies
 * flesh_gardens_thorny_path and walled_court_kings_fall are present,
 * reference valid arena IDs, and have valid structure.
 *
 * Pre-merge test: these will FAIL on main (entries don't exist yet) and
 * PASS after the jules-lore-expansion branch is merged.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_LORE, getAllArenas } from '@/data/arenas';

describe('new arena lore entries', () => {
  const validArenaIds = new Set(getAllArenas().map((a) => a.id));

  describe('flesh_gardens_thorny_path', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'flesh_gardens_thorny_path');

    it('IS present in ARENA_LORE', () => {
      expect(entry).toBeDefined();
    });

    it('references valid arenaId (flesh_gardens)', () => {
      expect(validArenaIds.has(entry!.arenaId)).toBe(true);
    });

    it('has valid type, title, and narrative', () => {
      expect(entry!.type).toBeDefined();
      expect(entry!.title.length).toBeGreaterThan(3);
      expect(entry!.narrative.length).toBeGreaterThan(20);
    });
  });

  describe('walled_court_kings_fall', () => {
    const entry = ARENA_LORE.find((e) => e.id === 'walled_court_kings_fall');

    it('IS present in ARENA_LORE', () => {
      expect(entry).toBeDefined();
    });

    it('references valid arenaId (walled_court_arena)', () => {
      expect(validArenaIds.has(entry!.arenaId)).toBe(true);
    });

    it('has valid type, title, and narrative', () => {
      expect(entry!.type).toBeDefined();
      expect(entry!.title.length).toBeGreaterThan(3);
      expect(entry!.narrative.length).toBeGreaterThan(20);
    });
  });
});
