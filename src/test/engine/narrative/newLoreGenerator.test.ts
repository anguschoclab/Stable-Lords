/**
 * New loreGenerator entries from lore expansion — verifies new origins,
 * childhood traits, and defining moments are present and that all arrays
 * remain duplicate-free after the expansion.
 *
 * Pre-merge test: these will FAIL on main (entries don't exist yet) and
 * PASS after the jules-lore-expansion branch is merged.
 */
import { describe, it, expect } from 'vitest';
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
describe('new loreGenerator entries', () => {
  const source = fs.readFileSync(LORE_FILE, 'utf-8');
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
      'realizing that mercy in the undercity is just an invitation to be killed',
      'waiting for the moment the gates would close and the true test would begin',
    ];
    for (const entry of newMoments) {
      it(`contains "${entry.substring(0, 50)}..."`, () => {
        expect(definingMoments).toContain(entry);
      });
    }
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
