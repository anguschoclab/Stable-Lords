/**
 * N1 red test — narrative content must not contain mock/placeholder markers.
 * This test FAILS until the 15 mock entries in combatPassives.json are removed.
 * Canonical tokens (%A, %D, %W, %BP, %H) are NOT flagged — they are legitimate
 * per narrativePBPUtils.ts:23.
 */
import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';

const PLACEHOLDER_MARKERS = [
  '(Mock',
  'TODO',
  'FIXME',
  'PLACEHOLDER',
  'LOREM',
  'XXX',
  'TBD',
];

function collectAllStrings(obj: unknown, path: string = ''): { text: string; path: string }[] {
  const out: { text: string; path: string }[] = [];
  if (typeof obj === 'string') {
    out.push({ text: obj, path });
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      out.push(...collectAllStrings(obj[i], `${path}[${i}]`));
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      out.push(...collectAllStrings(val, path ? `${path}.${key}` : key));
    }
  }
  return out;
}

describe('narrative content has no mock/placeholder markers (N1)', () => {
  it('no string in narrative content contains a placeholder marker', () => {
    const allStrings = collectAllStrings(narrativeContent);
    const offenders: { text: string; path: string; marker: string }[] = [];

    for (const { text, path } of allStrings) {
      for (const marker of PLACEHOLDER_MARKERS) {
        if (text.includes(marker)) {
          offenders.push({ text, path, marker });
        }
      }
    }

    expect(offenders, `Found ${offenders.length} strings with placeholder markers:\n${offenders.map(o => `  ${o.path}: "${o.text}" (marker: ${o.marker})`).join('\n')}`).toEqual([]);
  });

  it('combatPassives has no (Mock N) entries', () => {
    const passives = (narrativeContent as any).passives ?? {};
    const mockEntries: string[] = [];

    for (const [style, entries] of Object.entries(passives) as [string, string[]][]) {
      for (const entry of entries) {
        if (/\(Mock\s+\d+\)/.test(entry)) {
          mockEntries.push(`${style}: "${entry}"`);
        }
      }
    }

    expect(mockEntries, `Found mock entries:\n${mockEntries.join('\n')}`).toEqual([]);
  });

  it('canonical %A-style tokens are NOT flagged as placeholders', () => {
    // This test passes NOW — it guards against the validator over-correcting.
    const canonicalTokenStrings = [
      '%A drives their %W into %D\'s %BP',
      '%H heals the wound',
      'The %W bites deep',
    ];

    for (const s of canonicalTokenStrings) {
      let hasMarker = false;
      for (const marker of PLACEHOLDER_MARKERS) {
        if (s.includes(marker)) {
          hasMarker = true;
          break;
        }
      }
      expect(hasMarker, `"${s}" should NOT be flagged as placeholder`).toBe(false);
    }
  });
});
