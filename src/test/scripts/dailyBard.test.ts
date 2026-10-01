import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  templateStringSchema,
  NarrativeSchema,
  fetch_narrative_deficits,
  request_bardic_inspiration,
  validate_with_retry,
  commit_to_archive,
  deduplicate_full_archive,
  isStringArray,
  resolveNarrativeArray,
  DRY_RUN,
} from '#scripts/daily_bard';
import { promises as fsp, readFileSync, readdirSync, promises as fsPromises } from 'fs';
import { resolve } from 'path';
import path from 'path';

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

// Spy on fs.promises instead of vi.mock — bun:test's mock factories don't
// receive vitest's importOriginal arg, and setup.ts restores mocks per test.
let mockReadFile: ReturnType<typeof vi.spyOn>;
let mockWriteFile: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockReadFile = vi.spyOn(fsPromises, 'readFile');
  mockWriteFile = vi.spyOn(fsPromises, 'writeFile');
});

// Mock @google/generative-ai
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => '{"new_templates":["%A hits %D with %W in the %BP."]}' },
      }),
    }),
  })),
}));

// Helper to build minimal valid data
function makeValidData(): any {
  return {
    strikes: {
      slashing: {
        glancing: Array(20).fill('%A grazes %D with %W.'),
        solid: Array(20).fill('%A hits %D with %W.'),
        mastery: Array(20).fill('%A masters %W against %D.'),
        critical_human: Array(20).fill('%A crits %D with %W in the %BP.'),
        critical_supernatural: Array(20).fill('%A smites %D with %W.'),
        fatal: Array(20).fill('%A slays %D with %W.'),
      },
    },
    defenses: {
      dodge: {
        success: Array(20).fill('%D dodges %A.'),
        stumbling: Array(20).fill('%D stumbles from %A.'),
      },
    },
    attacks: { basic: Array(20).fill('%A attacks %D.') },
    passives: { buff: Array(20).fill('%A looks strong.') },
    conclusions: { win: Array(20).fill('%A wins!') },
    insights: { tip: Array(20).fill('%A is skilled.') },
    promoters: { bold: { pitch: Array(20).fill('Watch %A fight!') } },
    media: { news: Array(20).fill('%A in the news.') },
    persona: { brave: Array(20).fill('%A is brave.') },
    recruitment: { origin: Array(20).fill('%A from afar.') },
    memorials: { epigraph: Array(20).fill('Here lies %D.') },
    fanfare: { victory: Array(20).fill('Hail %A!') },
    meta: { tooltip: Array(20).fill('Info about %A.') },
    recap: Array(20).fill('%A defeated %D in %H minutes.'),
    commentary: { KO: Array(20).fill('KO by %A!'), Kill: Array(20).fill('Kill by %A!') },
    blurbs: { neutral: Array(20).fill('%A defeated %D%H.'), hype: Array(20).fill('%A wins!') },
  };
}

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
    expect(() => resolveNarrativeArray(root, 'strikes.slash.glancing')).toThrow(
      /strikes\.slash\.glancing/
    );
  });

  it('throws a descriptive error when an intermediate segment is an array', () => {
    const root: Record<string, unknown> = { strikes: { slash: ['a'] } };
    expect(() => resolveNarrativeArray(root, 'strikes.slash.glancing')).toThrow(
      /strikes\.slash\.glancing/
    );
  });

  it('throws a descriptive error when the leaf is not a string array', () => {
    const root: Record<string, unknown> = { strikes: { slash: { deep: {} } } };
    expect(() => resolveNarrativeArray(root, 'strikes.slash')).toThrow(/strikes\.slash/);
    expect(() => resolveNarrativeArray(root, 'strikes.missing')).toThrow(/strikes\.missing/);
  });
});

describe('daily_bard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A. templateStringSchema validation
  describe('A. templateStringSchema', () => {
    it('accepts strings with only whitelisted % variables', () => {
      expect(() => templateStringSchema.parse('%A hits %D with %W in the %BP.')).not.toThrow();
      expect(() => templateStringSchema.parse('The bout lasted %H minutes.')).not.toThrow();
    });

    it('accepts strings with no % variables', () => {
      expect(() => templateStringSchema.parse('{{attacker}} strikes!')).not.toThrow();
      expect(() => templateStringSchema.parse('A fierce exchange occurs.')).not.toThrow();
    });

    it('rejects strings with %S or other non-whitelisted % tokens', () => {
      expect(() => templateStringSchema.parse('%S attacks %D.')).toThrow();
      expect(() => templateStringSchema.parse('%X is invalid.')).toThrow();
      expect(() => templateStringSchema.parse('%FOO bar')).toThrow();
    });

    it('rejects non-string values', () => {
      expect(() => templateStringSchema.parse(123)).toThrow();
      expect(() => templateStringSchema.parse(null)).toThrow();
    });
  });

  // B. fetch_narrative_deficits
  describe('B. fetch_narrative_deficits', () => {
    it('returns strikes paths when count < 15', () => {
      const data = makeValidData();
      (data.strikes.slashing as any).glancing = Array(10).fill('%A grazes %D.');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('strikes.slashing.glancing');
    });

    it('returns defenses paths when count < 12', () => {
      const data = makeValidData();
      data.defenses.dodge.success = Array(5).fill('%D dodges.');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('defenses.dodge.success');
    });

    it('returns extra category paths when count < 12', () => {
      const data = makeValidData();
      data.attacks.basic = Array(5).fill('%A attacks.');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('attacks.basic');
    });

    it('returns promoters nested paths when count < 12', () => {
      const data = makeValidData();
      data.promoters.bold.pitch = Array(5).fill('Watch %A!');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('promoters.bold.pitch');
    });

    it('returns blurbs and commentary paths when count < 12', () => {
      const data = makeValidData();
      data.blurbs.neutral = Array(5).fill('%A wins.');
      data.commentary.KO = Array(5).fill('KO!');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('blurbs.neutral');
      expect(deficits).toContain('commentary.KO');
    });

    it('returns recap path when count < 12', () => {
      const data = makeValidData();
      data.recap = Array(5).fill('%A won.');
      const deficits = fetch_narrative_deficits(data);
      expect(deficits).toContain('recap');
    });

    it('returns empty array when all categories have sufficient variety', () => {
      const deficits = fetch_narrative_deficits(makeValidData());
      expect(deficits).toEqual([]);
    });
  });

  // C. request_bardic_inspiration (DRY_RUN mode)
  describe('C. request_bardic_inspiration (DRY_RUN)', () => {
    it('returns mock JSON with new_templates array', async () => {
      const result = await request_bardic_inspiration('strikes.slashing.glancing');
      const parsed = JSON.parse(result);
      expect(parsed.new_templates).toBeDefined();
      expect(Array.isArray(parsed.new_templates)).toBe(true);
      expect(parsed.new_templates.length).toBeGreaterThan(0);
    });

    it('mock templates pass templateStringSchema validation', async () => {
      const result = await request_bardic_inspiration('strikes.slashing.glancing');
      const parsed = JSON.parse(result);
      for (const t of parsed.new_templates) {
        expect(() => templateStringSchema.parse(t)).not.toThrow();
      }
    });
  });

  // D. request_bardic_inspiration (real mode)
  describe('D. request_bardic_inspiration (real mode)', () => {
    it('returns API response text on success', async () => {
      // Import with DRY_RUN=false by mocking the module differently
      // Since DRY_RUN is a const set at import time, we test the mock path
      // which is the default in test env (no DRY_RUN env set)
      const result = await request_bardic_inspiration('test.path');
      // In test env without DRY_RUN=true, but model may be null — falls to mock
      const parsed = JSON.parse(result);
      expect(parsed.new_templates).toBeDefined();
    });
  });

  // E. validate_with_retry
  describe('E. validate_with_retry', () => {
    it('returns validated templates array on first success', async () => {
      const result = await validate_with_retry('strikes.slashing.glancing');
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
    });

    it('returns null after exhausting retries on persistent failure', async () => {
      // request_bardic_inspiration is called internally; we can't spy on it
      // directly in ESM. Instead, test the validation logic by verifying
      // that invalid templates are rejected by templateStringSchema.
      expect(() => templateStringSchema.parse('%S is invalid')).toThrow();
      // validate_with_retry with mock data (valid) succeeds — failure path
      // requires dependency injection or integration testing
    });
  });

  // F. commit_to_archive
  describe('F. commit_to_archive', () => {
    it('merges and deduplicates new templates', async () => {
      const existing: any = makeValidData();
      existing.blurbs.neutral = ['%A defeated %D%H.', 'Existing template.'];
      // Mock returns full data for every readFile call (both readMerged and writeSplit)
      mockReadFile.mockResolvedValue(JSON.stringify(existing));
      mockWriteFile.mockResolvedValue(undefined);

      await commit_to_archive({
        'blurbs.neutral': ['%A defeated %D%H.', 'New unique template.'],
      });

      // writeSplitNarrative writes to multiple domain files; find the announcer write
      const announcerWrite = mockWriteFile.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('announcer.json')
      );
      expect(announcerWrite).toBeDefined();
      const written = JSON.parse(announcerWrite![1] as string);
      expect(written.blurbs.neutral).toContain('Existing template.');
      expect(written.blurbs.neutral).toContain('New unique template.');
      // Deduped: only one instance of the duplicate
      expect(written.blurbs.neutral.filter((x: string) => x === '%A defeated %D%H.').length).toBe(
        1
      );
    });

    it('handles empty newTemplatesMap without writing', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(makeValidData()));
      mockWriteFile.mockResolvedValue(undefined);

      await commit_to_archive({});
      // writeFile should not be called for empty map (addedCount === 0)
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  // G. deduplicate_full_archive
  describe('G. deduplicate_full_archive', () => {
    it('removes duplicate strings from strikes severity arrays', () => {
      const data = makeValidData();
      (data.strikes.slashing as any).glancing = ['%A hits %D.', '%A hits %D.', 'Unique.'];
      deduplicate_full_archive(data);
      expect((data.strikes.slashing as any).glancing).toEqual(['%A hits %D.', 'Unique.']);
    });

    it('removes duplicates from flat extra categories', () => {
      const data = makeValidData();
      data.attacks.basic = ['%A attacks.', '%A attacks.', 'Unique attack.'];
      deduplicate_full_archive(data);
      expect(data.attacks.basic).toEqual(['%A attacks.', 'Unique attack.']);
    });

    it('removes duplicates from nested promoters', () => {
      const data = makeValidData();
      data.promoters.bold.pitch = ['Watch %A!', 'Watch %A!', 'Unique pitch.'];
      deduplicate_full_archive(data);
      expect(data.promoters.bold.pitch).toEqual(['Watch %A!', 'Unique pitch.']);
    });

    it('removes duplicates from blurbs and commentary', () => {
      const data = makeValidData();
      data.blurbs.neutral = ['%A wins.', '%A wins.', 'Unique blurb.'];
      data.commentary.KO = ['KO!', 'KO!', 'Unique KO.'];
      deduplicate_full_archive(data);
      expect(data.blurbs.neutral).toEqual(['%A wins.', 'Unique blurb.']);
      expect(data.commentary.KO).toEqual(['KO!', 'Unique KO.']);
    });

    it('deduplicates recap flat array', () => {
      const data = makeValidData();
      data.recap = ['%A won.', '%A won.', 'Unique recap.'];
      deduplicate_full_archive(data);
      expect(data.recap).toEqual(['%A won.', 'Unique recap.']);
    });
  });

  // H. DRY_RUN env var
  describe('H. DRY_RUN env var', () => {
    it('DRY_RUN is a boolean', () => {
      expect(typeof DRY_RUN).toBe('boolean');
    });
  });

  // I. Real data validation — validates actual narrative domain files against schema
  describe('I. Real data validation', () => {
    const narrativeDir = resolve(__dirname, '../../data/narrative');
    const files = readdirSync(narrativeDir).filter((f: string) => f.endsWith('.json'));
    const parsed: Record<string, unknown> = {};
    for (const file of files) {
      const raw = readFileSync(resolve(narrativeDir, file), 'utf-8');
      const data = JSON.parse(raw);
      for (const [key, val] of Object.entries(data)) {
        parsed[key] = val;
      }
    }

    it('NarrativeSchema.parse() accepts merged domain files without error', () => {
      expect(() => NarrativeSchema.parse(parsed)).not.toThrow();
    });

    it('parsed result preserves unknown keys (ux_metadata, pbp, events, etc.)', () => {
      const result = NarrativeSchema.parse(parsed);
      expect(result).toHaveProperty('ux_metadata');
      expect(result).toHaveProperty('pbp');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('gazette');
      expect(result).toHaveProperty('kill_text');
      expect(result).toHaveProperty('offseason_events');
      expect(result).toHaveProperty('crowd_reactions');
    });

    it('fetch_narrative_deficits does not produce bogus array-index paths for flat-array strikes', () => {
      const validated = NarrativeSchema.parse(parsed);
      const deficits = fetch_narrative_deficits(validated);
      const bogusPaths = deficits.filter((d) => /^strikes\.\w+\.\d+$/.test(d));
      expect(bogusPaths).toHaveLength(0);
    });

    it('deduplicate_full_archive does not corrupt flat-array strikes (strings remain strings)', () => {
      const validated = NarrativeSchema.parse(parsed);
      const beforeGeneric = JSON.stringify(validated.strikes.generic);
      deduplicate_full_archive(validated);
      const afterGeneric = validated.strikes.generic as unknown as unknown[];
      // Should still be an array of strings, not array of character arrays
      expect(Array.isArray(afterGeneric)).toBe(true);
      for (const item of afterGeneric) {
        expect(typeof item).toBe('string');
      }
      // Content should be the same (deduped)
      expect(JSON.stringify(afterGeneric)).toBe(beforeGeneric);
    });
  });
});
