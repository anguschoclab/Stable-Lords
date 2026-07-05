/**
 * Lore generator — verifies generateLore/generateOrigin produce valid output
 * and that the source arrays have no duplicate entries.
 */
import { describe, it, expect } from 'vitest';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { SeededRNGService } from '@/utils/random';
import * as fs from 'fs';
import * as path from 'path';

const LORE_FILE = path.resolve(__dirname, '../../../engine/narrative/loreGenerator.ts');

function extractStringArray(source: string, varName: string): string[] {
  const regex = new RegExp(`const ${varName} = \\[([\\s\\S]*?)\\];`);
  const m = regex.exec(source);
  if (!m || !m[1]) throw new Error(`Could not find ${varName} in loreGenerator.ts`);
  const items = m[1].match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g);
  if (!items) return [];
  return items.map((s) => {
    const quote = s[0];
    const content = s.slice(1, -1);
    if (quote === "'") return content.replace(/\\'/g, "'");
    return content.replace(/\\"/g, '"');
  });
}

describe('loreGenerator', () => {
  it('generateLore returns non-empty string containing the name', () => {
    const rng = new SeededRNGService(42);
    const lore = generateLore('Brutus', rng);
    expect(lore.length).toBeGreaterThan(10);
    expect(lore).toContain('Brutus');
  });

  it('generateOrigin returns non-empty string', () => {
    const rng = new SeededRNGService(42);
    const origin = generateOrigin(rng);
    expect(origin.length).toBeGreaterThan(10);
  });

  it('generateLore is deterministic for a given seed', () => {
    const a = generateLore('Test', new SeededRNGService(99));
    const b = generateLore('Test', new SeededRNGService(99));
    expect(a).toBe(b);
  });

  it('generateOrigin is deterministic for a given seed', () => {
    const a = generateOrigin(new SeededRNGService(99));
    const b = generateOrigin(new SeededRNGService(99));
    expect(a).toBe(b);
  });

  it('ORIGINS array has no duplicate entries', () => {
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
    const origins = extractStringArray(source, 'ORIGINS');
    const unique = new Set(origins);
    expect(unique.size, `${origins.length - unique.size} duplicate origins`).toBe(origins.length);
  });

  it('CHILDHOOD_TRAITS array has no duplicate entries', () => {
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
    const traits = extractStringArray(source, 'CHILDHOOD_TRAITS');
    const unique = new Set(traits);
    expect(unique.size, `${traits.length - unique.size} duplicate childhood traits`).toBe(
      traits.length
    );
  });

  it('DEFINING_MOMENTS array has no duplicate entries', () => {
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
    const moments = extractStringArray(source, 'DEFINING_MOMENTS');
    const unique = new Set(moments);
    expect(unique.size, `${moments.length - unique.size} duplicate defining moments`).toBe(
      moments.length
    );
  });

  it('ORIGINS contains new entries from both narrative branches', () => {
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
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
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
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
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
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

  it('ORIGINS array uses only single-quoted strings (no double quotes)', () => {
    const source = fs.readFileSync(LORE_FILE, 'utf-8');
    const originsBlock = source.match(/const ORIGINS = \[([\s\S]*?)\];/);
    expect(originsBlock).not.toBeNull();
    if (!originsBlock || !originsBlock[1]) return;
    const block: string = originsBlock[1];
    const doubleQuoted = block.match(/"[^"]*"/g);
    expect(doubleQuoted, `found double-quoted strings in ORIGINS`).toBeNull();
  });
});
