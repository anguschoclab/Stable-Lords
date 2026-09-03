/**
 * Characterization tests for src/data/names/nameValidation.ts.
 *
 * Locks the CURRENT behavior of every exported validator (including known
 * quirks) so the dedup refactor cannot silently change semantics.
 *
 * Known quirk captured below: STABLE_PREFIXES entries are all multi-word
 * ("The Bleeding", "The Iron", ...), so a 2-token split can never match a
 * prefix. As a result the 'prefixed' branch of isValidStableName /
 * getStableNameFormat is effectively unreachable with the current data,
 * and randomly generated prefixed stable names (e.g. "The Bleeding Wolves",
 * 3 tokens) are rejected. These tests assert that buggy behavior so the
 * refactor preserves it; a follow-up should fix the split logic.
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

  // NOTE: All STABLE_PREFIXES are multi-word ("The Bleeding", ...), so no
  // 2-token string can have a valid prefix as its first token. The
  // 'prefixed' branch is therefore unreachable with current data; we
  // assert that any 2-token string is rejected.
  it('returns false for a 2-token string (no single-token prefix exists)', () => {
    expect(isValidStableName('The Wolves')).toBe(false);
  });

  // F1 bug: a generated prefixed name like "The Bleeding Wolves" has 3
  // tokens, but isValidStableName requires exactly 2 -> rejected.
  it('returns false for a 3-token prefixed name (F1 bug preservation)', () => {
    expect(isValidStableName(`${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`)).toBe(false);
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
});

describe('getStableNameFormat', () => {
  it("returns 'alt' for a valid alt name", () => {
    expect(getStableNameFormat(STABLE_ALT[0]!)).toBe('alt');
  });

  it("returns 'invalid' for a 2-token string (no single-token prefix)", () => {
    expect(getStableNameFormat('The Wolves')).toBe('invalid');
  });

  it("returns 'invalid' for a 3-token prefixed name (F1 bug preservation)", () => {
    expect(getStableNameFormat(`${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`)).toBe('invalid');
  });

  it("returns 'invalid' for garbage", () => {
    expect(getStableNameFormat('some random garbage text')).toBe('invalid');
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
  it('keeps only valid stable names (alt names pass, prefixed do not due to F1)', () => {
    const validAlt = STABLE_ALT[0]!;
    const generatedPrefixed = `${STABLE_PREFIXES[0]!} ${STABLE_SUFFIXES[0]!}`; // 3 tokens -> invalid
    const input = [validAlt, generatedPrefixed, 'garbage'];
    expect(filterValidStableNames(input)).toEqual([validAlt]);
  });

  it('returns an empty array for empty input', () => {
    expect(filterValidStableNames([])).toEqual([]);
  });
});
