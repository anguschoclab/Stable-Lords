/**
 * Name validation utilities for Stable Lords.
 * Provides validation functions for warrior, owner, and stable names.
 */

import { WARRIOR_NAMES } from './warriorNames';
import { OWNER_FIRST, OWNER_LAST } from './ownerNames';
import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './stableNames';

/**
 * Returns true if `name` is present in `list`. When `caseInsensitive` is
 * true the input is upper-cased before lookup (used for warrior names,
 * which are stored uppercase).
 */
function isInNameList(name: string, list: readonly string[], caseInsensitive = false): boolean {
  return list.includes(caseInsensitive ? name.toUpperCase() : name);
}

/**
 * Splits a full name into exactly two whitespace-separated parts after
 * trimming. Returns null if the name does not contain exactly two parts.
 */
function splitTwoParts(fullName: string): [string, string] | null {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  return [parts[0] ?? '', parts[1] ?? ''];
}

/**
 * Filters `names` using `validator`.
 */
function filterValid(names: string[], validator: (name: string) => boolean): string[] {
  return names.filter(validator);
}

/**
 * Attempts to match a stable name against a known prefix (from
 * `STABLE_PREFIXES`) followed by a valid suffix (from `STABLE_SUFFIXES`).
 *
 * Unlike a naive whitespace split, this correctly handles multi-word
 * prefixes like "The Bleeding" by checking the name against every known
 * prefix. Returns true if any prefix+suffix combination matches.
 */
function matchesPrefixedStableName(stableName: string): boolean {
  const trimmed = stableName.trim();
  for (const prefix of STABLE_PREFIXES) {
    if (trimmed.startsWith(prefix + ' ')) {
      const suffix = trimmed.slice(prefix.length + 1);
      if (isValidStableSuffix(suffix)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates if a name is a valid warrior name.
 *
 * @param name - The name to validate
 * @returns True if the name is in the WARRIOR_NAMES array
 */
export function isValidWarriorName(name: string): boolean {
  return isInNameList(name, WARRIOR_NAMES, true);
}

/**
 * Validates if a name is a valid owner first name.
 *
 * @param name - The name to validate
 * @returns True if the name is in the OWNER_FIRST array
 */
export function isValidOwnerFirstName(name: string): boolean {
  return isInNameList(name, OWNER_FIRST);
}

/**
 * Validates if a name is a valid owner last name.
 *
 * @param name - The name to validate
 * @returns True if the name is in the OWNER_LAST array
 */
export function isValidOwnerLastName(name: string): boolean {
  return isInNameList(name, OWNER_LAST);
}

/**
 * Validates if a full owner name is valid (both first and last names).
 *
 * @param fullName - The full name to validate (e.g., "John Smith")
 * @returns True if both first and last names are valid
 */
export function isValidOwnerName(fullName: string): boolean {
  const parts = splitTwoParts(fullName);
  if (!parts) return false;
  return isValidOwnerFirstName(parts[0]) && isValidOwnerLastName(parts[1]);
}

/**
 * Validates if a name is a valid stable prefix.
 *
 * @param prefix - The prefix to validate
 * @returns True if the prefix is in the STABLE_PREFIXES array
 */
export function isValidStablePrefix(prefix: string): boolean {
  return isInNameList(prefix, STABLE_PREFIXES);
}

/**
 * Validates if a name is a valid stable suffix.
 *
 * @param suffix - The suffix to validate
 * @returns True if the suffix is in the STABLE_SUFFIXES array
 */
export function isValidStableSuffix(suffix: string): boolean {
  return isInNameList(suffix, STABLE_SUFFIXES);
}

/**
 * Validates if a name is a valid alternative stable name.
 *
 * @param altName - The alternative name to validate
 * @returns True if the name is in the STABLE_ALT array
 */
export function isValidAltStableName(altName: string): boolean {
  return isInNameList(altName, STABLE_ALT);
}

/**
 * Validates if a stable name is valid (either alt format or prefix+suffix).
 *
 * @param stableName - The stable name to validate
 * @returns True if the stable name is valid in any format
 */
export function isValidStableName(stableName: string): boolean {
  // Check if it's an alt name
  if (isValidAltStableName(stableName)) {
    return true;
  }

  // Check if it's prefix+suffix format (handles multi-word prefixes)
  return matchesPrefixedStableName(stableName);
}

/**
 * Gets the format type of a stable name.
 *
 * @param stableName - The stable name to analyze
 * @returns The format type: 'alt', 'prefixed', or 'invalid'
 */
export function getStableNameFormat(stableName: string): 'alt' | 'prefixed' | 'invalid' {
  if (isValidAltStableName(stableName)) {
    return 'alt';
  }

  if (matchesPrefixedStableName(stableName)) {
    return 'prefixed';
  }

  return 'invalid';
}

/**
 * Filters a list of warrior names to only include valid names.
 *
 * @param names - Array of names to filter
 * @returns Array of valid warrior names
 */
export function filterValidWarriorNames(names: string[]): string[] {
  return filterValid(names, isValidWarriorName);
}

/**
 * Filters a list of owner names to only include valid names.
 *
 * @param names - Array of full names to filter
 * @returns Array of valid owner names
 */
export function filterValidOwnerNames(names: string[]): string[] {
  return filterValid(names, isValidOwnerName);
}

/**
 * Filters a list of stable names to only include valid names.
 *
 * @param names - Array of stable names to filter
 * @returns Array of valid stable names
 */
export function filterValidStableNames(names: string[]): string[] {
  return filterValid(names, isValidStableName);
}
