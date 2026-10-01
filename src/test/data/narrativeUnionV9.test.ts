/**
 * MEGAPLAN-V9 union gate for the four narrative PRs (#1000/#1002/#1007/#1009).
 * Mirror of narrativeUnionV7. RED until the synthesis lands the consensus union.
 */
import { describe, it, expect } from 'vitest';
import killTextJson from '@/data/narrative/combatKillText.json';
import pbpJson from '@/data/narrative/combatPbp.json';
import strikesJson from '@/data/narrative/combatStrikes.json';

type Json = any;
const pbp = pbpJson as Json;

/** Collect every string leaf under a JSON node. */
function allStrings(node: Json, out: Set<string> = new Set()): Set<string> {
  if (typeof node === 'string') out.add(node);
  else if (Array.isArray(node)) node.forEach((e) => allStrings(e, out));
  else if (node && typeof node === 'object')
    Object.values(node).forEach((v) => allStrings(v, out));
  return out;
}

/** Collect every array-of-strings leaf under a JSON node. */
function leafArrays(node: Json, out: string[][] = []): string[][] {
  if (Array.isArray(node) && node.every((e) => typeof e === 'string')) out.push(node);
  else if (node && typeof node === 'object' && !Array.isArray(node))
    Object.values(node).forEach((v) => leafArrays(v, out));
  return out;
}

/** All string leaves under any key named like knockdown/recovery, at any depth. */
const KNOCKDOWN_KEYS = new Set(['knockdown', 'knocked_down', 'knockedDown', 'recovery']);
function knockdownStrings(node: Json, out: string[] = []): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return out;
  for (const [k, v] of Object.entries(node)) {
    if (KNOCKDOWN_KEYS.has(k)) allStrings(v).forEach((s) => out.push(s));
    else knockdownStrings(v, out);
  }
  return out;
}

const files = {
  combatKillText: killTextJson as Json,
  combatPbp: pbpJson as Json,
  combatStrikes: strikesJson as Json,
};

const all = new Set<string>();
for (const j of Object.values(files)) allStrings(j, all);

// One verified-unique string per contributing PR (extracted from the diffs;
// absent from main and from every other PR's addition set).
const PR_SIGNATURES = [
  'A casual dodge sets up a devastating counterstrike from {{defender}}.', // #1000
  'A brutal shockwave of force throws {{name}} violently to the arena floor.', // #1002
  /A bleak, joyless end\. .*slumps over/, // #1007 (truncated in diff view)
  'A brutal, silent retaliation from {{defender}} follows the deflection.', // #1009
];

describe('narrative union V9 gate', () => {
  it.each([...PR_SIGNATURES.map((s) => [s])])(
    'lands union addition: %s',
    (sig: string | RegExp) => {
      const hit = [...all].some((s) =>
        sig instanceof RegExp ? sig.test(s) : s === sig
      );
      expect(hit, String(sig)).toBe(true);
    }
  );

  it('knockdown/recovery leaves use {{name}} — never {{defender}}', () => {
    // narrateKnockdown interpolates with { name } only; {{defender}} there
    // renders the literal "the opponent".
    const pools = knockdownStrings(pbp).concat(knockdownStrings(files.combatStrikes));
    expect(pools.length).toBeGreaterThan(20);
    for (const s of pools) {
      expect(s, s).not.toContain('{{defender}}');
    }
  });

  it('no exact-duplicate string inside any leaf array', () => {
    for (const leaf of leafArrays(files.combatKillText)
      .concat(leafArrays(files.combatPbp))
      .concat(leafArrays(files.combatStrikes))) {
      const seen = new Set<string>();
      for (const s of leaf) {
        expect(seen.has(s), `duplicate: ${s.slice(0, 80)}`).toBe(false);
        seen.add(s);
      }
    }
  });

  it('cross-file: no template text is duplicated across the three narrative pools', () => {
    // Only interpolation templates — plain labels like body-part names
    // legitimately repeat across files.
    const counts = new Map<string, number>();
    const bump = (s: string) => {
      if (s.includes('{{')) counts.set(s, (counts.get(s) ?? 0) + 1);
    };
    for (const j of Object.values(files)) leafArrays(j).forEach((l) => l.forEach(bump));
    for (const [s, n] of counts) {
      expect(n, `appears ${n}x: ${s.slice(0, 80)}`).toBe(1);
    }
  });
});
