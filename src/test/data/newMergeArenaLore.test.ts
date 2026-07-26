/**
 * New merge arena lore entries — verifies 10 new entries from lore
 * expansion branches are present, reference valid arena IDs, and
 * have valid structure.
 * Pre-merge test: will FAIL on main (entries don't exist yet).
 */
import { describe, it, expect } from 'vitest';
import { ARENA_LORE, getAllArenas } from '@/data/arenas';

const NEW_ENTRY_IDS = [
  'sundered_coliseum_blood_tide',
  'standard_arena_iron_gate',
  'sundered_coliseum_blood_spire',
  'charnel_pits_dance_of_blades',
  'standard_arena_orphan_triumph',
  'standard_arena_first_blood_v2',
  'mudpit_the_sinking_giant',
  'sundered_coliseum_weeping_stones',
  'sundered_coliseum_fallen_emperor',
  'crystal_cavern_shattering_blow',
] as const;

describe('new merge arena lore entries', () => {
  const validArenaIds = new Set(getAllArenas().map((a) => a.id));

  describe('all new entries are present', () => {
    for (const id of NEW_ENTRY_IDS) {
      it(`${id} is present in ARENA_LORE`, () => {
        const entry = ARENA_LORE.find((e) => e.id === id);
        expect(entry).toBeDefined();
      });
    }
  });

  describe('all new entries reference valid arena IDs', () => {
    for (const id of NEW_ENTRY_IDS) {
      const entry = ARENA_LORE.find((e) => e.id === id);
      if (!entry) continue;

      it(`${id} references valid arenaId`, () => {
        expect(validArenaIds.has(entry.arenaId)).toBe(true);
      });

      it(`${id} does not reference proving_grounds`, () => {
        expect(entry.arenaId).not.toBe('proving_grounds');
      });

      it(`${id} has valid type`, () => {
        expect(entry.type).toBeDefined();
        expect(entry.type.length).toBeGreaterThan(0);
      });

      it(`${id} has valid title (>3 chars)`, () => {
        expect(entry.title.length).toBeGreaterThan(3);
      });

      it(`${id} has valid narrative (>20 chars)`, () => {
        expect(entry.narrative.length).toBeGreaterThan(20);
      });

      it(`${id} does not use description field (uses narrative)`, () => {
        expect((entry as any).description).toBeUndefined();
      });

      it(`${id} does not have unlockRequirement field`, () => {
        expect((entry as any).unlockRequirement).toBeUndefined();
      });

      it(`${id} does not have discovered field`, () => {
        expect((entry as any).discovered).toBeUndefined();
      });
    }
  });

  it('no entry references proving_grounds (invalid arena ID)', () => {
    for (const entry of ARENA_LORE) {
      expect(entry.arenaId, `Entry ${entry.id} references invalid arena proving_grounds`).not.toBe('proving_grounds');
    }
  });
});
