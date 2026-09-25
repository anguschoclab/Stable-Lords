import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';

const key = (x: unknown): string =>
  typeof x === 'string'
    ? x
    : ((x as { text?: string })?.text ?? JSON.stringify(x));

function leaf(path: string[]): unknown[] {
  let cur: unknown = narrativeContent;
  for (const k of path) cur = (cur as Record<string, unknown>)[k];
  return (cur as unknown[]) ?? [];
}

describe('V7 narrative union — curated merge of PRs #983/#989/#993/#994', () => {
  it('pbp.defenses.dodge.confident gains union additions', () => {
    const texts = leaf(['pbp', 'defenses', 'dodge', 'confident']).map(key);
    expect(texts).toContain(
      "Without breaking eye contact, {{defender}} casually side-steps the incoming blow."
    );
  });

  it('pbp.defenses.dodge.confident drops consensus-removed entry', () => {
    const texts = leaf(['pbp', 'defenses', 'dodge', 'confident']).map(key);
    expect(texts).not.toContain(
      "With a bored sigh, {{defender}} leans out of the weapon's reach."
    );
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
