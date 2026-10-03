/**
 * MEGAPLAN-V10 union gate for narrative curation PR #1021.
 * RED until the synthesis lands: thin-category floors rise, signature
 * additions exist, and the dedupe/token invariants still hold.
 */
import { describe, it, expect } from 'vitest';
import killTextJson from '@/data/narrative/combatKillText.json';
import pbpJson from '@/data/narrative/combatPbp.json';
import strikesJson from '@/data/narrative/combatStrikes.json';

type Json = any;
const kill = killTextJson as Json;
const pbp = pbpJson as Json;
const strikes = strikesJson as Json;

function allStrings(node: Json, out: Set<string> = new Set()): Set<string> {
  if (typeof node === 'string') out.add(node);
  else if (Array.isArray(node)) node.forEach((e) => allStrings(e, out));
  else if (node && typeof node === 'object')
    Object.values(node).forEach((v) => allStrings(v, out));
  return out;
}

function leafArrays(node: Json, out: string[][] = []): string[][] {
  if (Array.isArray(node) && node.every((e) => typeof e === 'string')) out.push(node);
  else if (node && typeof node === 'object' && !Array.isArray(node))
    Object.values(node).forEach((v) => leafArrays(v, out));
  return out;
}

/** Lowercase, strip punctuation/whitespace — semantic identity for dedupe. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9{}]/g, '');

// Verified-unique additions extracted from the #1021 diff (one per leaf).
const PR_SIGNATURES = [
  "{{defender}} collapses, their saga ended abruptly by {{attacker}}'s ruthless precision.",
  '{{name}} struggles to rise, movements sluggish and pained.',
  "{{defender}}'s bones rattle under the tremendous impact of {{attacker}}'s strike.",
  'A swift jab from {{attacker}} pops {{defender}} squarely.',
  'With a swift jab, {{attacker}} perforates {{defender}}.',
  'A swift slice from {{attacker}} catches {{defender}} deep in the flesh.',
];

// Thin-category floors the union must reach (post-merge counts from the diff).
const FLOORS: [string, number][] = [
  ['kill_text.default', 94],
  ['pbp.knockdown.pacing.recovery_slow', 76],
  ['strikes.bashing.solid', 115],
  ['strikes.fist.solid', 111],
  ['strikes.piercing.solid', 105],
  ['strikes.slashing.solid', 106],
];

const leafAt = (path: string): string[] => {
  const [root, ...rest] = path.split('.');
  const file = { kill_text: kill.kill_text, pbp: pbp.pbp, strikes: strikes.strikes }[root!];
  return rest.reduce((o: Json, k) => o?.[k], file) as string[];
};

const TOKEN_WHITELIST = new Set([
  'attacker',
  'defender',
  'name',
  'bodyPart',
  'weapon',
  'defenseWeapon',
  'gender',
  'origin',
  'possessive',
  'pronoun',
  'race',
  'reflexive',
  'style',
]);

describe('narrative union V10 gate (#1021)', () => {
  const all = allStrings(kill, allStrings(pbp, allStrings(strikes)));

  it.each(PR_SIGNATURES.map((s) => [s]))('lands union addition: %s', (sig: string) => {
    expect(all.has(sig), sig).toBe(true);
  });

  it.each(FLOORS.map(([p, n]) => [p, n] as const))(
    'thin-category floor: %s >= %i',
    (path: string, floor: number) => {
      const leaf = leafAt(path);
      expect(
        Array.isArray(leaf) ? leaf.length : -1,
        `${path} has ${Array.isArray(leaf) ? leaf.length : 'no'} strings`
      ).toBeGreaterThanOrEqual(floor);
    }
  );

  it('no normalized-duplicate string inside any leaf array', () => {
    for (const leaf of [...leafArrays(kill), ...leafArrays(pbp), ...leafArrays(strikes)]) {
      const seen = new Set<string>();
      for (const s of leaf) {
        const n = norm(s);
        expect(seen.has(n), `normalized duplicate: ${s.slice(0, 80)}`).toBe(false);
        seen.add(n);
      }
    }
  });

  it('every {{token}} stays inside the 13-token render whitelist', () => {
    for (const s of all) {
      for (const m of s.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(TOKEN_WHITELIST.has(m[1]!), `unknown token {{${m[1]}}} in: ${s.slice(0, 80)}`).toBe(
          true
        );
      }
    }
  });
});
