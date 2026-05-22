import { Howl } from 'howler';
import { STORE_KEYS } from '@/constants/storeKeys';

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

/**
 * Supported sound effect types for audio playback.
 */
export type SfxType =
  | 'ui_click'
  | 'hit'
  | 'crit'
  | 'clash'
  | 'death'
  | 'recovery'
  | 'coin'
  | 'arena_ambient';/**
 * The AudioManager class.
 */


export class AudioManager {
  private static instance: AudioManager | undefined;
  private sfx: Map<SfxType, Howl> = new Map();
  private muted: boolean = false;

  private constructor() {
    // Initialize HowlerGlobal for Electron environment
    // Note: Howler.js types expect HowlerGlobal to be a class, but we initialize
    // as empty object for Electron compatibility. This is intentional.
    if (typeof window !== 'undefined' && typeof window.HowlerGlobal === 'undefined') {
      (window as any).HowlerGlobal = {};
    }
    this.loadMuteState();
  }

  /**
   * Load the mute state from persistent storage (Electron or localStorage).
   */
  private async loadMuteState() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const muted = await window.electronAPI.storeGet(STORE_KEYS.AUDIO_MUTED);
        this.muted = muted === 'true';
      } catch {
        this.muted = false;
      }
    } else if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem(STORE_KEYS.AUDIO_MUTED) === 'true';
    }
  }

  /**
   * Get the singleton instance of AudioManager.
   * @returns The AudioManager singleton instance.
   */
  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  /**
   * Play a sound effect of the specified type.
   * @param type - The type of sound effect to play.
   */
  public play(type: SfxType) {
    if (this.muted) return;
    const sound = this.sfx.get(type);
    if (sound) sound.play();
  }

  /**
   * Set the mute state and persist it to storage.
   * @param muted - Whether audio should be muted.
   */
  public async setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.storeSet(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        console.error('Failed to save mute state to electron-store', error);
      }
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        if ((error as Error)?.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded when saving mute state', error);
          // Mute state is not critical, just log and continue
        } else {
          console.error('Failed to save mute state', error);
        }
      }
    }
  }

  /**
   * Check if audio is currently muted.
   * @returns True if audio is muted, false otherwise.
   */
  public isMuted() {
    return this.muted;
  }

  /**
   * Reset the singleton instance for test cleanup.
   * This should be called in test beforeEach hooks to ensure a fresh state.
   */
  public static resetForTesting(): void {
    AudioManager.instance = undefined;
  }
}/**
 * Audio manager.
 */


export const audioManager = AudioManager.getInstance();
