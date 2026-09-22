import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'fs';
import path from 'path';
import {
  fetch_narrative_deficits,
  deduplicate_full_archive,
  validate_with_retry,
  commit_to_archive,
  isStringArray,
  resolveNarrativeArray,
} from '@/scripts/daily_bard';

type Narrative = Parameters<typeof fetch_narrative_deficits>[0];

function makeNarrative(over: Partial<Narrative> = {}): Narrative {
  return {
    strikes: {},
    passives: {},
    conclusions: {},
    persona: {},
    recruitment: {},
    memorials: {},
    fanfare: {},
    meta: {},
    recap: many(12),
    commentary: {},
    blurbs: {},
    ...over,
  };
}

const many = (n: number, prefix = 't') => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

describe('fetch_narrative_deficits', () => {
  it('flags a flat strikes array with fewer than 15 templates', () => {
    const data = makeNarrative({ strikes: { slash: many(10) } });
    expect(fetch_narrative_deficits(data)).toEqual(['strikes.slash']);
  });

  it('does not flag a flat strikes array with 15+ templates', () => {
    const data = makeNarrative({ strikes: { slash: many(15) } });
    expect(fetch_narrative_deficits(data)).toEqual([]);
  });

  it('flags nested severity buckets under 15 templates', () => {
    const data = makeNarrative({
      strikes: {
        slash: {
          glancing: many(15),
          solid: many(3),
          mastery: many(15),
          critical_human: many(15),
          critical_supernatural: many(15),
          fatal: many(15),
        },
      },
    });
    expect(fetch_narrative_deficits(data)).toEqual(['strikes.slash.solid']);
  });

  it('flags defense outcomes with fewer than 12 templates', () => {
    const data = makeNarrative({
      defenses: { parry: { success: many(12), stumbling: many(4) } },
    });
    expect(fetch_narrative_deficits(data)).toEqual(['defenses.parry.stumbling']);
  });

  it('flags flat extra categories with fewer than 12 templates', () => {
    const data = makeNarrative({ conclusions: { ko: many(5) } });
    expect(fetch_narrative_deficits(data)).toEqual(['conclusions.ko']);
  });

  it('flags nested extra categories (e.g. promoters) at depth 3', () => {
    const data = makeNarrative({
      promoters: { Greedy: { pitch: many(2), followup: many(12) } },
    });
    expect(fetch_narrative_deficits(data)).toEqual(['promoters.Greedy.pitch']);
  });

  it('flags recap when the flat array has fewer than 12 entries', () => {
    expect(fetch_narrative_deficits(makeNarrative({ recap: many(3) }))).toEqual(['recap']);
    expect(fetch_narrative_deficits(makeNarrative({ recap: many(12) }))).toEqual([]);
  });
});

describe('deduplicate_full_archive', () => {
  it('dedupes flat strikes arrays in place', () => {
    const data = makeNarrative({ strikes: { slash: ['a', 'b', 'a'] } });
    deduplicate_full_archive(data);
    expect(data.strikes['slash']).toEqual(['a', 'b']);
  });

  it('dedupes nested strikes severity buckets', () => {
    const data = makeNarrative({
      strikes: {
        slash: {
          glancing: ['x', 'x', 'y'],
          solid: ['s'],
          mastery: ['m'],
          critical_human: ['c'],
          critical_supernatural: ['cs'],
          fatal: ['f'],
        },
      },
    });
    deduplicate_full_archive(data);
    const slash = data.strikes['slash'] as Record<string, string[]>;
    expect(slash['glancing']).toEqual(['x', 'y']);
  });

  it('dedupes defense outcome arrays', () => {
    const data = makeNarrative({
      defenses: { parry: { success: ['p', 'p'], stumbling: ['s', 's', 't'] } },
    });
    deduplicate_full_archive(data);
    expect(data.defenses?.['parry']).toEqual({ success: ['p'], stumbling: ['s', 't'] });
  });

  it('dedupes flat extra categories and nested leaf arrays', () => {
    const data = makeNarrative({
      conclusions: { ko: ['k', 'k', 'j'] },
      promoters: { Greedy: { pitch: ['p', 'p', 'q'] } },
    });
    deduplicate_full_archive(data);
    expect(data.conclusions['ko']).toEqual(['k', 'j']);
    const greedy = data.promoters?.['Greedy'] as Record<string, string[]>;
    expect(greedy['pitch']).toEqual(['p', 'q']);
  });

  it('dedupes recap', () => {
    const data = makeNarrative({ recap: ['r1', 'r1', 'r2'] });
    deduplicate_full_archive(data);
    expect(data.recap).toEqual(['r1', 'r2']);
  });
});

describe('validate_with_retry', () => {
  it('returns the mock-generated templates when no model is configured', async () => {
    const result = await validate_with_retry('strikes.slash');
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    for (const t of result!) expect(typeof t).toBe('string');
  });
});

describe('commit_to_archive', () => {
  // fs.promises is a shared singleton: spying on its methods intercepts the
  // script's `import { promises as fs }` calls regardless of module mocking.
  let readFileMock: ReturnType<typeof vi.fn>;
  let writeFileMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    readFileMock = vi.spyOn(fsp, 'readFile') as unknown as ReturnType<typeof vi.fn>;
    writeFileMock = vi.spyOn(fsp, 'writeFile') as unknown as ReturnType<typeof vi.fn>;
    readFileMock.mockImplementation(async (p: unknown) => {
      const file = path.basename(String(p));
      if (file === 'combatStrikes.json') {
        return JSON.stringify({ strikes: { slash: ['existing'] } });
      }
      return '{}';
    });
    writeFileMock.mockImplementation(async () => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges new templates into the domain file and writes a report', async () => {
    await commit_to_archive({ 'strikes.slash': ['existing', 'brand new %A line'] });

    const writes = writeFileMock.mock.calls as [string, string][];
    const combatWrite = writes.find(([p]) => String(p).endsWith('combatStrikes.json'));
    expect(combatWrite).toBeDefined();
    const written = JSON.parse(String(combatWrite![1]));
    expect(written.strikes.slash).toEqual(['existing', 'brand new %A line']);

    expect(writes.some(([p]) => String(p).endsWith('Daily_Bard_Report.md'))).toBe(true);
  });

  it('writes nothing when every supplied template is a duplicate', async () => {
    await commit_to_archive({ 'strikes.slash': ['existing'] });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('throws a descriptive error for a malformed deficit path', async () => {
    await expect(commit_to_archive({ 'strikes.nope.deep': ['x'] })).rejects.toThrow(
      /strikes\.nope\.deep/
    );
  });
});

describe('isStringArray', () => {
  it('returns true for arrays of strings', () => {
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isStringArray([])).toBe(true);
  });

  it('returns false for non-arrays and mixed arrays', () => {
    expect(isStringArray('a')).toBe(false);
    expect(isStringArray(null)).toBe(false);
    expect(isStringArray(undefined)).toBe(false);
    expect(isStringArray({})).toBe(false);
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray([['a']])).toBe(false);
  });
});

describe('resolveNarrativeArray', () => {
  it('resolves a depth-2 path to its parent record and leaf', () => {
    const root: Record<string, unknown> = { strikes: { slash: ['a', 'b'] } };
    const res = resolveNarrativeArray(root, 'strikes.slash');
    expect(res.leaf).toBe('slash');
    expect(res.existing).toEqual(['a', 'b']);
    expect(res.parent).toBe(root['strikes']);
  });

  it('resolves a depth-3 path', () => {
    const root: Record<string, unknown> = {
      strikes: { slash: { glancing: ['g1'] } },
    };
    const res = resolveNarrativeArray(root, 'strikes.slash.glancing');
    expect(res.leaf).toBe('glancing');
    expect(res.existing).toEqual(['g1']);
  });

  it('throws a descriptive error when an intermediate segment is missing', () => {
    const root: Record<string, unknown> = { strikes: {} };
    expect(() => resolveNarrativeArray(root, 'strikes.slash.glancing')).toThrow(/strikes\.slash\.glancing/);
  });

  it('throws a descriptive error when an intermediate segment is an array', () => {
    const root: Record<string, unknown> = { strikes: { slash: ['a'] } };
    expect(() => resolveNarrativeArray(root, 'strikes.slash.glancing')).toThrow(/strikes\.slash\.glancing/);
  });

  it('throws a descriptive error when the leaf is not a string array', () => {
    const root: Record<string, unknown> = { strikes: { slash: { deep: {} } } };
    expect(() => resolveNarrativeArray(root, 'strikes.slash')).toThrow(/strikes\.slash/);
    expect(() => resolveNarrativeArray(root, 'strikes.missing')).toThrow(/strikes\.missing/);
  });
});
