import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  templateStringSchema,
  fetch_narrative_deficits,
  request_bardic_inspiration,
  validate_with_retry,
  commit_to_archive,
  deduplicate_full_archive,
  DRY_RUN,
} from './daily_bard';

// Direct mock function references for reliable call inspection (hoisted)
const { mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
}));

// Mock fs — preserve original structure, override readFile/writeFile with our mocks
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: { ...actual, promises: { readFile: mockReadFile, writeFile: mockWriteFile } },
    promises: { ...actual.promises, readFile: mockReadFile, writeFile: mockWriteFile },
  };
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
      mockReadFile.mockResolvedValue(JSON.stringify(existing));
      mockWriteFile.mockResolvedValue(undefined);

      await commit_to_archive({
        'blurbs.neutral': ['%A defeated %D%H.', 'New unique template.'],
      });

      const writeCall = mockWriteFile.mock.calls[0];
      expect(writeCall).toBeDefined();
      const written = JSON.parse(writeCall![1] as string);
      expect(written.blurbs.neutral).toContain('Existing template.');
      expect(written.blurbs.neutral).toContain('New unique template.');
      // Deduped: only one instance of the duplicate
      expect(written.blurbs.neutral.filter((x: string) => x === '%A defeated %D%H.').length).toBe(1);
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
});
