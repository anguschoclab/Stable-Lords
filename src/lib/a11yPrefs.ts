/**
 * Accessibility preferences — high-contrast theme + text scaling.
 * Persisted to localStorage (not game state: a client-side display concern).
 * Applied to `document.documentElement` via `data-contrast` + `zoom`.
 */

export const A11Y_KEY = 'sl.a11y';

/**
 * Contrast mode type.
 */
export type ContrastMode = 'standard' | 'high';

/**
 * Defines the shape of a11y prefs.
 */
export interface A11yPrefs {
  contrast: ContrastMode;
  /** Text zoom percentage: 100 | 112 | 125 | 150 */
  textScale: number;
}

export const DEFAULT_A11Y_PREFS: A11yPrefs = { contrast: 'standard', textScale: 100 };

export const TEXT_SCALE_OPTIONS = [100, 112, 125, 150] as const;

/**
 * Load accessibility prefs.
 */
export function loadA11yPrefs(): A11yPrefs {
  if (typeof localStorage === 'undefined') return DEFAULT_A11Y_PREFS;
  try {
    const parsed = JSON.parse(localStorage.getItem(A11Y_KEY) ?? '{}');
    const contrast: ContrastMode = parsed.contrast === 'high' ? 'high' : 'standard';
    const textScale = (TEXT_SCALE_OPTIONS as readonly number[]).includes(parsed.textScale)
      ? (parsed.textScale as number)
      : 100;
    return { contrast, textScale };
  } catch {
    return DEFAULT_A11Y_PREFS;
  }
}

/**
 * Save accessibility prefs.
 */
export function saveA11yPrefs(prefs: A11yPrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch {
    // Non-critical — prefs just won't persist
  }
}

/**
 * Apply accessibility prefs.
 */
export function applyA11yPrefs(prefs: A11yPrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (prefs.contrast === 'high') {
    root.dataset.contrast = 'high';
  } else {
    delete root.dataset.contrast;
  }
  // zoom scales px-based text too, which this codebase uses almost exclusively
  root.style.zoom = prefs.textScale === 100 ? '' : String(prefs.textScale / 100);
}
