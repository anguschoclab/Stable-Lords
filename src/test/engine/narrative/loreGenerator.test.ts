/**
 * Lore generator — verifies generateLore/generateOrigin produce valid output
 * and that the source arrays have no duplicate entries.
 */
import { describe, it, expect } from 'vitest';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { SeededRNG } from '@/utils/random';
import { LORE_SOURCE, extractStringArray } from './_helpers/loreSource';

describe('loreGenerator', () => {
  it('generateLore returns non-empty string containing the name', () => {
    const rng = new SeededRNG(42);
    const lore = generateLore('Brutus', rng);
    expect(lore.length).toBeGreaterThan(10);
    expect(lore).toContain('Brutus');
  });

  it('generateOrigin returns non-empty string', () => {
    const rng = new SeededRNG(42);
    const origin = generateOrigin(rng);
    expect(origin.length).toBeGreaterThan(10);
  });

  it('generateLore is deterministic for a given seed', () => {
    const a = generateLore('Test', new SeededRNG(99));
    const b = generateLore('Test', new SeededRNG(99));
    expect(a).toBe(b);
  });

  it('generateOrigin is deterministic for a given seed', () => {
    const a = generateOrigin(new SeededRNG(99));
    const b = generateOrigin(new SeededRNG(99));
    expect(a).toBe(b);
  });

  it('ORIGINS array has no duplicate entries', () => {
    const source = LORE_SOURCE;
    const origins = extractStringArray(source, 'ORIGINS');
    const unique = new Set(origins);
    expect(unique.size, `${origins.length - unique.size} duplicate origins`).toBe(origins.length);
  });

  it('CHILDHOOD_TRAITS array has no duplicate entries', () => {
    const source = LORE_SOURCE;
    const traits = extractStringArray(source, 'CHILDHOOD_TRAITS');
    const unique = new Set(traits);
    expect(unique.size, `${traits.length - unique.size} duplicate childhood traits`).toBe(
      traits.length
    );
  });

  it('DEFINING_MOMENTS array has no duplicate entries', () => {
    const source = LORE_SOURCE;
    const moments = extractStringArray(source, 'DEFINING_MOMENTS');
    const unique = new Set(moments);
    expect(unique.size, `${moments.length - unique.size} duplicate defining moments`).toBe(
      moments.length
    );
  });

  it('ORIGINS contains new entries from both narrative branches', () => {
    const source = LORE_SOURCE;
    const origins = extractStringArray(source, 'ORIGINS');
    const expectedNew = [
      'Left shivering in a discarded coal sack near the Silent Keep',
      'Torn from a smuggling ring that traded orphans for obsidian blades',
      'Tossed into the corpse-carts during the Red Fever, only to crawl back out days later',
      'Raised by the silent, scarred monks of the Obsidian Spire who communicate only in blows',
      'Discovered hiding in the hollowed chest cavity of a slain wyvern in the Bone Wastes',
    ];
    for (const entry of expectedNew) {
      expect(origins, `missing origin: ${entry}`).toContain(entry);
    }
  });

  it('CHILDHOOD_TRAITS contains new entries from both narrative branches', () => {
    const source = LORE_SOURCE;
    const traits = extractStringArray(source, 'CHILDHOOD_TRAITS');
    const expectedNew = [
      'was known for collecting the teeth of feral dogs slain in the alleys',
      'developed a terrifyingly serene smile right before physical conflict erupted',
      'was caught repeatedly catching scorpions with their bare hands',
      'learned to fashion razor-sharp shivs from the rusted iron rungs of their crib',
    ];
    for (const entry of expectedNew) {
      expect(traits, `missing childhood trait: ${entry}`).toContain(entry);
    }
  });

  it('DEFINING_MOMENTS contains new entries from both narrative branches', () => {
    const source = LORE_SOURCE;
    const moments = extractStringArray(source, 'DEFINING_MOMENTS');
    const expectedNew = [
      'until they strangled a corrupted guard with the very chains meant to bind them',
      'carrying the heavy chains of their past not as a burden, but as a weapon',
      'now seeking the arena not for glory, but for a public stage to exact a terrible revenge',
      'realizing that pain is simply the currency demanded by the gods of the arena',
    ];
    for (const entry of expectedNew) {
      expect(moments, `missing defining moment: ${entry}`).toContain(entry);
    }
  });

  it('ORIGINS contains new entries from narrative-content-expansion', () => {
    const source = LORE_SOURCE;
    const origins = extractStringArray(source, 'ORIGINS');
    const expectedNew = [
      'Born in the sunless cells of the Deep Ward penitentiary',
      'Found clutching a rusted blade in the ruins of the Ashwood Orphanage',
      'Raised by the grim executioners of the High Court',
      'Abandoned in the freezing canals of the Lower Dross',
      'Survived the gruesome cullings of the Black Sun fighting pits',
    ];
    for (const entry of expectedNew) {
      expect(origins, `missing origin: ${entry}`).toContain(entry);
    }
  });

  it('CHILDHOOD_TRAITS contains new entries from narrative-content-expansion', () => {
    const source = LORE_SOURCE;
    const traits = extractStringArray(source, 'CHILDHOOD_TRAITS');
    const expectedNew = [
      'would compulsively trace the veins of slaughtered livestock to learn anatomy',
      'learned to mask their breath entirely when hiding from the night wardens',
      'developed a bone-chilling hum before engaging in street brawls',
    ];
    for (const entry of expectedNew) {
      expect(traits, `missing childhood trait: ${entry}`).toContain(entry);
    }
  });

  it('DEFINING_MOMENTS contains new entries from narrative-content-expansion', () => {
    const source = LORE_SOURCE;
    const moments = extractStringArray(source, 'DEFINING_MOMENTS');
    const expectedNew = [
      'until they shattered a warden\u2019s jaw with a single, perfectly timed kick',
      'knowing that only the roar of the colosseum could silence the screams of their past',
    ];
    for (const entry of expectedNew) {
      expect(moments, `missing defining moment: ${entry}`).toContain(entry);
    }
  });

  it('removed entries are not in source arrays', () => {
    const source = LORE_SOURCE;
    const traits = extractStringArray(source, 'CHILDHOOD_TRAITS');
    const moments = extractStringArray(source, 'DEFINING_MOMENTS');
    expect(traits).not.toContain('learned to sleep with one eye open after the workhouse riots');
    expect(moments).not.toContain(
      'waiting for the moment the iron portcullis would rise on their destiny'
    );
  });

  it('ORIGINS array entries are all valid string literals', () => {
    const source = LORE_SOURCE;
    const origins = extractStringArray(source, 'ORIGINS');
    expect(origins.length).toBeGreaterThan(0);
    for (const entry of origins) {
      expect(typeof entry).toBe('string');
      expect(entry.length).toBeGreaterThan(5);
    }
  });
});
