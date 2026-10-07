/**
 * Store key constants for Electron persistent storage
 * Centralized to prevent key conflicts and ensure type safety
 */

export const STORE_KEYS = {
  SAVE_SLOTS: 'stable-lords-save-slots',
  UI_PREFS: 'sl.ui.prefs',
  AUDIO_MUTED: 'sl_muted',
  AUDIO_VOLUME: 'sl_audio_volume',
  WINDOW_BOUNDS: 'windowBounds',
} as const;

/**
 * Store key type.
 */
export type StoreKey = (typeof STORE_KEYS)[keyof typeof STORE_KEYS];
