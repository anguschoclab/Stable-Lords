/**
 * Null Safety Utilities
 * Centralized null/undefined checking to eliminate DRY violations
 * Replaces scattered `typeof x === 'undefined'` and `x || default` patterns
 */

/**
 * Check if a value is defined (not null or undefined)
 * Replaces: `typeof x !== 'undefined' && x !== null` and `!!x` checks
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Check if a value is undefined or null
 * Replaces: `typeof x === 'undefined' || x === null`
 */
export function isNil<T>(value: T | undefined | null): value is undefined | null {
  return value === undefined || value === null;
}

/**
 * Return a default value if the input is undefined or null
 * Replaces: `x || default` (which also catches falsy values like 0, '', false)
 */
export function defaultTo<T>(value: T | undefined | null, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue;
}

/**
 * Check if an array is non-empty
 * Replaces: `arr && arr.length > 0`
 */
export function isNonEmptyArray<T>(arr: T[] | undefined | null): arr is T[] {
  return isDefined(arr) && arr.length > 0;
}

/**
 * Get the first element of an array safely
 * Replaces: `arr && arr[0]` or `arr?.[0]` with proper typing
 */
export function first<T>(arr: T[] | undefined | null): T | undefined {
  return isNonEmptyArray(arr) ? arr[0] : undefined;
}

/**
 * Check if an object has a specific property defined
 * Replaces: `obj && obj.prop !== undefined`
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safely access nested properties
 * Replaces: `obj && obj.prop1 && obj.prop1.prop2`
 */
export function getNested<T>(
  obj: Record<string, unknown> | undefined | null,
  ...keys: string[]
): T | undefined {
  let current: unknown = obj;
  for (const key of keys) {
    if (
      !isDefined(current) ||
      typeof current !== 'object' ||
      current === null ||
      !(key in current)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current as T | undefined;
}
