/**
 * Narrative union gates — one file covering each curated merge:
 *   V7 (PRs #983/#989/#993/#994), V9 (#1000/#1002/#1007/#1009), V10 (#1021).
 * Each gate locks in that merge's signature additions, consensus removals,
 * thin-category floors, and dedupe/token invariants. Helpers are shared.
 */
import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';
import killTextJson from '@/data/narrative/combatKillText.json';
import pbpJson from '@/data/narrative/combatPbp.json';
import strikesJson from '@/data/narrative/combatStrikes.json';

type Json = any;
const kill = killTextJson as Json;
const pbp = pbpJson as Json;
const strikes = strikesJson as Json;

const files = {
  combatKillText: kill,
  combatPbp: pbp,
  combatStrikes: strikes,
};

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

const key = (x: unknown): string =>
  typeof x === 'string' ? x : ((x as { text?: string })?.text ?? JSON.stringify(x));

/** Typed-content tree leaf: narrativeContent lookup by path segments. */
function leaf(path: string[]): unknown[] {
  let cur: unknown = narrativeContent;
  for (const k of path) cur = (cur as Record<string, unknown>)[k];
  return (cur as unknown[]) ?? [];
}

/** All string leaves under any key named like knockdown/recovery, at any depth. */
const KNOCKDOWN_KEYS = new Set([
  'knockdown',
  'knockdowns',
  'knocked_down',
  'knockedDown',
  'recovery',
]);
function knockdownStrings(node: Json, out: string[] = []): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return out;
  for (const [k, v] of Object.entries(node)) {
    if (KNOCKDOWN_KEYS.has(k)) allStrings(v).forEach((s) => out.push(s));
    else knockdownStrings(v, out);
  }
  return out;
}

/** Lowercase, strip punctuation/whitespace — semantic identity for dedupe. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9{}]/g, '');

/** Raw-JSON leaf lookup: 'kill_text.x' / 'pbp.x.y' / 'strikes.x.y'. */
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

describe('V7 narrative union — curated merge of PRs #983/#989/#993/#994', () => {
  it('pbp.defenses.dodge.confident gains union additions', () => {
    const texts = leaf(['pbp', 'defenses', 'dodge', 'confident']).map(key);
    expect(texts).toContain(
      'Without breaking eye contact, {{defender}} casually side-steps the incoming blow.'
    );
  });

  it('pbp.defenses.dodge.confident drops consensus-removed entry', () => {
    const texts = leaf(['pbp', 'defenses', 'dodge', 'confident']).map(key);
    expect(texts).not.toContain("With a bored sigh, {{defender}} leans out of the weapon's reach.");
  });

  it('pbp.defenses.parry.grim drops consensus-removed entry', () => {
    const texts = leaf(['pbp', 'defenses', 'parry', 'grim']).map(key);
    expect(texts).not.toContain(
      'With cold, lethal intent, {{defender}} intercepts the strike and immediately readies their lethal counter.'
    );
  });

  it('pbp.hits.generic drops consensus-removed entry', () => {
    const texts = leaf(['pbp', 'hits', 'generic']).map(key);
    expect(texts).not.toContain(
      "The blow lands true, biting deep into {{defender}}'s flesh and bone."
    );
  });

  it('new leaf pbp.knockdowns exists and is populated', () => {
    const arr = leaf(['pbp', 'knockdowns']);
    expect(arr.length).toBeGreaterThanOrEqual(3);
  });

  it('new leaf pbp.recoveries exists and is populated', () => {
    const arr = leaf(['pbp', 'recoveries']);
    expect(arr.length).toBeGreaterThanOrEqual(3);
  });

  it('strikes.bashing.critical gains union additions', () => {
    const texts = leaf(['strikes', 'bashing', 'critical']).map(key);
    expect(texts).toContain(
      "{{attacker}} caves in {{defender}}'s {{bodyPart}} with a terrifying, devastating swing."
    );
  });

  it('kill_text.default gains union additions', () => {
    const texts = leaf(['kill_text', 'default']).map(key);
    expect(texts).toContain(
      "The light slowly fades from {{defender}}'s eyes as {{attacker}} claims final, undisputed victory."
    );
  });

  it('no leaf contains duplicate text keys after union (mixed string/{text,min} safe)', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    const walk = (o: unknown, path: string) => {
      if (Array.isArray(o)) {
        const keys = o.map(key);
        const local = new Set<string>();
        for (const k of keys) {
          if (local.has(k)) dupes.push(`${path} :: ${k.slice(0, 60)}`);
          local.add(k);
          if (seen.has(`${path}::${k}`)) dupes.push(`${path} :: ${k.slice(0, 60)}`);
          seen.add(`${path}::${k}`);
        }
      } else if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
      }
    };
    walk(narrativeContent, '');
    expect(dupes).toEqual([]);
  });
});

describe('narrative union V9 gate', () => {
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
    for (const leafArr of leafArrays(files.combatKillText)
      .concat(leafArrays(files.combatPbp))
      .concat(leafArrays(files.combatStrikes))) {
      const seen = new Set<string>();
      for (const s of leafArr) {
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

describe('narrative union V10 gate (#1021)', () => {
  const all = allStrings(kill, allStrings(pbp, allStrings(strikes)));

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

  it.each(PR_SIGNATURES.map((s) => [s]))('lands union addition: %s', (sig: string) => {
    expect(all.has(sig), sig).toBe(true);
  });

  it.each(FLOORS.map(([p, n]) => [p, n] as const))(
    'thin-category floor: %s >= %i',
    (path: string, floor: number) => {
      const leafArr = leafAt(path);
      expect(
        Array.isArray(leafArr) ? leafArr.length : -1,
        `${path} has ${Array.isArray(leafArr) ? leafArr.length : 'no'} strings`
      ).toBeGreaterThanOrEqual(floor);
    }
  );

  it('no normalized-duplicate string inside any leaf array', () => {
    for (const leafArr of [...leafArrays(kill), ...leafArrays(pbp), ...leafArrays(strikes)]) {
      const seen = new Set<string>();
      for (const s of leafArr) {
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
