/**
 * Tests for src/data/names/nameValidation.ts.
 *
 * Covers the dedup refactor (helpers: isInNameList, splitTwoParts,
 * filterValid) and the F1 fix (matchesPrefixedStableName correctly
 * handles multi-word prefixes like "The Bleeding").
 */
import { describe, it, expect } from 'vitest';
import {
  isValidWarriorName,
  isValidOwnerFirstName,
  isValidOwnerLastName,
  isValidOwnerName,
  isValidStablePrefix,
  isValidStableSuffix,
  isValidAltStableName,
  isValidStableName,
  getStableNameFormat,
  filterValidWarriorNames,
  filterValidOwnerNames,
  filterValidStableNames,
} from '@/data/names/nameValidation';
import { WARRIOR_NAMES, OWNER_FIRST, OWNER_LAST, STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from '@/data/names';

describe('isValidWarriorName', () => {
  it('returns true for an exact uppercase match', () => {
    expect(isValidWarriorName(WARRIOR_NAMES[0]!)).toBe(true);
  });

  it('returns true for lowercase input (case-insensitive)', () => {
    expect(isValidWarriorName((WARRIOR_NAMES[0]!).toLowerCase())).toBe(true);
  });

  it('returns true for mixed-case input (case-insensitive)', () => {
    const name = WARRIOR_NAMES[0]!;
    const mixed = name.charAt(0) + name.slice(1).toLowerCase();
    expect(isValidWarriorName(mixed)).toBe(true);
  });

  it('returns false for a non-existent name', () => {
    expect(isValidWarriorName('NOT_A_REAL_WARRIOR_NAME_XYZ')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidWarriorName('')).toBe(false);
  });
});

describe('isValidOwnerFirstName', () => {
  it('returns true for a valid first name', () => {
    expect(isValidOwnerFirstName(OWNER_FIRST[0]!)).toBe(true);
  });

  it('returns false for an invalid first name', () => {
    expect(isValidOwnerFirstName('NotARealFirstName')).toBe(false);
  });

  it('is case-sensitive (lowercase input rejected)', () => {
    expect(isValidOwnerFirstName((OWNER_FIRST[0]!).toLowerCase())).toBe(false);
  });
});

describe('isValidOwnerLastName', () => {
  it('returns true for a valid last name', () => {
    expect(isValidOwnerLastName(OWNER_LAST[0]!)).toBe(true);
  });

  it('returns false for an invalid last name', () => {
    expect(isValidOwnerLastName('NotARealLastName')).toBe(false);
  });
});

describe('isValidOwnerName', () => {
  const validFirst = OWNER_FIRST[0]!;
  const validLast = OWNER_LAST[0]!;
  const validFull = `${validFirst} ${validLast}`;

  it('returns true for a valid "First Last"', () => {
    expect(isValidOwnerName(validFull)).toBe(true);
  });

  it('returns false for valid first + invalid last', () => {
    expect(isValidOwnerName(`${validFirst} NotARealLastName`)).toBe(false);
  });

  it('returns false for invalid first + valid last', () => {
    expect(isValidOwnerName(`NotARealFirstName ${validLast}`)).toBe(false);
  });

  it('returns false for a single token', () => {
    expect(isValidOwnerName(validFirst)).toBe(false);
  });

  it('returns false for three tokens', () => {
    expect(isValidOwnerName(`${validFirst} ${validLast} Jr`)).toBe(false);
  });

  it('trims leading/trailing whitespace', () => {
    expect(isValidOwnerName(`  ${validFull}  `)).toBe(true);
  });

  it('collapses multiple internal spaces', () => {
    expect(isValidOwnerName(`${validFirst}   ${validLast}`)).toBe(true);
  });
});

describe('isValidStablePrefix', () => {
  it('returns true for a valid (multi-word) prefix', () => {
    expect(isValidStablePrefix(STABLE_PREFIXES[0]!)).toBe(true);
  });

  it('returns false for an invalid prefix', () => {
    expect(isValidStablePrefix('NotARealPrefix')).toBe(false);
  });
});

describe('isValidStableSuffix', () => {
  it('returns true for a valid suffix', () => {
    expect(isValidStableSuffix(STABLE_SUFFIXES[0]!)).toBe(true);
  });

  it('returns false for an invalid suffix', () => {
    expect(isValidStableSuffix('NotARealSuffix')).toBe(false);
  });
});

describe('isValidAltStableName', () => {
  it('returns true for a valid alt name', () => {
    expect(isValidAltStableName(STABLE_ALT[0]!)).toBe(true);
  });

  it('returns false for an invalid alt name', () => {
    expect(isValidAltStableName('NotARealAltStableName')).toBe(false);
  });
});

describe('isValidStableName', () => {
  it('returns true for a valid alt name', () => {
    expect(isValidStableName(STABLE_ALT[0]!)).toBe(true);
  });

  // F1 fix: multi-word prefixes are now matched correctly. A generated
  // prefixed name like "The Bleeding Wolves" (3 tokens) should validate.
  it('returns true for a multi-word prefix + suffix (F1 fix)', () => {
    const prefixed = `${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`;
    expect(isValidStableName(prefixed)).toBe(true);
  });

  it('returns true for another multi-word prefix + suffix combination', () => {
    const prefixed = `${STABLE_PREFIXES[5]!} ${STABLE_SUFFIXES[10]!}`;
    expect(isValidStableName(prefixed)).toBe(true);
  });

  it('returns false for a valid prefix + invalid suffix', () => {
    expect(isValidStableName(`${STABLE_PREFIXES[0]!} NotARealSuffix`)).toBe(false);
  });

  it('returns false for an invalid prefix + valid suffix', () => {
    expect(isValidStableName(`NotARealPrefix ${STABLE_SUFFIXES[0]!}`)).toBe(false);
  });

  it('returns false for a single token', () => {
    expect(isValidStableName('Wolves')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidStableName('')).toBe(false);
  });

  it('returns false for garbage', () => {
    expect(isValidStableName('some random garbage text')).toBe(false);
  });

  it('returns false for a prefix with no suffix', () => {
    expect(isValidStableName(STABLE_PREFIXES[0]!)).toBe(false);
  });
});

describe('getStableNameFormat', () => {
  it("returns 'alt' for a valid alt name", () => {
    expect(getStableNameFormat(STABLE_ALT[0]!)).toBe('alt');
  });

  it("returns 'prefixed' for a multi-word prefix + suffix (F1 fix)", () => {
    const prefixed = `${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`;
    expect(getStableNameFormat(prefixed)).toBe('prefixed');
  });

  it("returns 'invalid' for a valid prefix + invalid suffix", () => {
    expect(getStableNameFormat(`${STABLE_PREFIXES[0]!} NotARealSuffix`)).toBe('invalid');
  });

  it("returns 'invalid' for garbage", () => {
    expect(getStableNameFormat('some random garbage text')).toBe('invalid');
  });

  it("returns 'invalid' for a prefix with no suffix", () => {
    expect(getStableNameFormat(STABLE_PREFIXES[0]!)).toBe('invalid');
  });
});

describe('filterValidWarriorNames', () => {
  it('keeps only valid warrior names (case-insensitive)', () => {
    const valid = WARRIOR_NAMES[0]!;
    const input = [valid, valid.toLowerCase(), 'NOT_A_REAL_WARRIOR_XYZ'];
    const out = filterValidWarriorNames(input);
    expect(out).toEqual([valid, valid.toLowerCase()]);
  });

  it('returns an empty array for empty input', () => {
    expect(filterValidWarriorNames([])).toEqual([]);
  });
});

describe('filterValidOwnerNames', () => {
  it('keeps only valid full owner names', () => {
    const validFull = `${OWNER_FIRST[0]!} ${OWNER_LAST[0]!}`;
    const input = [validFull, 'Bad First BadLast', 'SingleToken'];
    expect(filterValidOwnerNames(input)).toEqual([validFull]);
  });

  it('returns an empty array for empty input', () => {
    expect(filterValidOwnerNames([])).toEqual([]);
  });
});

describe('filterValidStableNames', () => {
  it('keeps both alt and prefixed stable names (F1 fix)', () => {
    const validAlt = STABLE_ALT[0]!;
    const validPrefixed = `${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`;
    const input = [validAlt, validPrefixed, 'garbage'];
    expect(filterValidStableNames(input)).toEqual([validAlt, validPrefixed]);
  });

  it('returns an empty array for empty input', () => {
    expect(filterValidStableNames([])).toEqual([]);
  });
});
