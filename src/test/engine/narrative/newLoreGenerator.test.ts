/**
 * New loreGenerator entries from lore expansion — verifies new origins,
 * childhood traits, and defining moments are present and that all arrays
 * remain duplicate-free after the expansion.
 */
import { describe, it, expect } from 'vitest';
import { LORE_SOURCE, extractStringArray } from './_helpers/loreSource';

describe('new loreGenerator entries', () => {
  const source = LORE_SOURCE;
  const origins = extractStringArray(source, 'ORIGINS');
  const childhoodTraits = extractStringArray(source, 'CHILDHOOD_TRAITS');
  const definingMoments = extractStringArray(source, 'DEFINING_MOMENTS');

  describe('ORIGINS contains new entries from lore expansion branch', () => {
    const newOrigins = [
      'Torn from the suffocating grasp of the sunken asylum of Dross',
      'Surviving the Night of Ash by hiding beneath the floorboards of a ruined cathedral',
      'Raised among the stray hounds that roam the forgotten plague wards',
      'Discovered half-starved in the rusted cages of the Black Iron Orphanage',
      'Emerging from the smoke-choked alleys where the unwanted are left to the rats',
      'Found wandering the silent, frozen catacombs below the city',
    ];

    for (const entry of newOrigins) {
      it(`contains "${entry.substring(0, 50)}..."`, () => {
        expect(origins).toContain(entry);
      });
    }
  });

  describe('CHILDHOOD_TRAITS contains new entries from lore expansion branch', () => {
    const newTraits = [
      'would systematically dissect caught rodents to understand their anatomy',
      'learned to sleep with a clenched fist and one eye open',
      'was infamous for throwing blinding dust into the eyes of older bullies',
      'would practice parrying strikes with a splintered table leg in the dark',
    ];

    for (const entry of newTraits) {
      it(`contains "${entry.substring(0, 50)}..."`, () => {
        expect(childhoodTraits).toContain(entry);
      });
    }
  });

  describe('DEFINING_MOMENTS contains new entries from lore expansion branch', () => {
    const newMoments = [
      'until the day they dragged their abuser into the light and left them broken',
      'waiting for the moment the gates would close and the true test would begin',
    ];

    for (const entry of newMoments) {
      it(`contains "${entry.substring(0, 50)}..."`, () => {
        expect(definingMoments).toContain(entry);
      });
    }
  });

  describe('V10 entries (PR #1020)', () => {
    const v10 = [
      ['origins', origins, 'Found half-frozen among the forgotten catacombs beneath the Iron Spire'],
      ['origins', origins, 'Sold for a handful of silver to the merciless flesh-peddlers of the Lower Wards'],
      ['origins', origins, 'Abandoned to the feral dog packs that roam the Ash Quarter'],
      ['childhood', childhoodTraits, 'developed a habit of whispering to the blades of their enemies'],
      ['childhood', childhoodTraits, 'would purposefully step on broken glass to harden the soles of their feet'],
      ['moments', definingMoments, 'until they drowned a corrupt warden in the icy waters of the Drowned Bridge'],
      ['moments', definingMoments, 'knowing that every scar they gained was simply a map to their eventual revenge'],
    ] as const;
    for (const [pool, arr, entry] of v10) {
      it(`${pool} contains "${entry.substring(0, 50)}..."`, () => {
        expect(arr).toContain(entry);
      });
    }

    it('removes the three verified near-duplicates', () => {
      expect(origins).not.toContain('Survived the cruel discipline of the Iron Spire Orphanage');
      expect(origins).not.toContain('Raised in the soot-choked rafters of the Grand Foundry');
      expect(definingMoments).not.toContain(
        'discovering that a rusted spoon could be sharpened into a deadly shiv'
      );
      // …while the retained near-identical variants survive.
      expect(origins).toContain('Survived the cruel culling of the Iron Spire Orphanage');
      expect(origins).toContain('Raised in the soot-choked rafters of the Iron-Gale Foundry');
      expect(definingMoments).toContain(
        'discovering that a rusted spoon could be sharpened into a deadly shiv in the dark'
      );
    });
  });

  it('ORIGINS array has no duplicate entries', () => {
    const seen = new Set<string>();
    for (const entry of origins) {
      expect(seen.has(entry), `Duplicate origin: "${entry}"`).toBe(false);
      seen.add(entry);
    }
  });

  it('CHILDHOOD_TRAITS array has no duplicate entries', () => {
    const seen = new Set<string>();
    for (const entry of childhoodTraits) {
      expect(seen.has(entry), `Duplicate childhood trait: "${entry}"`).toBe(false);
      seen.add(entry);
    }
  });

  it('DEFINING_MOMENTS array has no duplicate entries', () => {
    const seen = new Set<string>();
    for (const entry of definingMoments) {
      expect(seen.has(entry), `Duplicate defining moment: "${entry}"`).toBe(false);
      seen.add(entry);
    }
  });
});
