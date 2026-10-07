import { Howl } from 'howler';
import { STORE_KEYS } from '@/constants/core/storeKeys';

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

/**
 * Supported sound effect types for audio playback.
 */
export type SfxType = 'ui_click' | 'hit' | 'crit' | 'clash' | 'death' | 'recovery' | 'coin';

/**
 * The AudioManager class.
 */
export class AudioManager {
  private static instance: AudioManager | undefined;
  private sfx: Map<SfxType, Howl> = new Map();
  private muted: boolean = false;
  private volume: number = 1;
  private ready: Promise<void>;

  /**
   * Constructor.
   */
  private constructor() {
    this.loadSfx();
    this.ready = this.loadSettings();
  }

  /**
   * Load sound effect Howl instances for all SFX types.
   */
  private loadSfx() {
    const sfxFiles: Record<Exclude<SfxType, never>, string> = {
      ui_click: '/audio/ui_click.mp3',
      hit: '/audio/hit.mp3',
      crit: '/audio/crit.mp3',
      clash: '/audio/clash.mp3',
      death: '/audio/death.mp3',
      recovery: '/audio/recovery.mp3',
      coin: '/audio/coin.mp3',
    };
    for (const [type, src] of Object.entries(sfxFiles)) {
      this.sfx.set(type as SfxType, new Howl({ src: [src] }));
    }
  }

  /**
   * Load the persisted mute/volume settings (Electron or localStorage).
   */
  private async loadSettings() {
    const parseVolume = (raw: unknown) => {
      const parsed = raw == null ? NaN : Number(raw);
      return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1;
    };
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const [muted, volume] = await Promise.all([
          window.electronAPI.storeGet(STORE_KEYS.AUDIO_MUTED),
          window.electronAPI.storeGet(STORE_KEYS.AUDIO_VOLUME),
        ]);
        this.muted = muted === 'true';
        this.applyVolume(parseVolume(volume));
      } catch {
        this.muted = false;
      }
    } else if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem(STORE_KEYS.AUDIO_MUTED) === 'true';
      this.applyVolume(parseVolume(localStorage.getItem(STORE_KEYS.AUDIO_VOLUME)));
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
  public async play(type: SfxType) {
    await this.ready;
    if (this.muted) return;
    const sound = this.sfx.get(type);
    if (sound) sound.play();
  }

  /**
   * Set the mute state and persist it to storage.
   * @param muted - Whether audio should be muted.
   */
  public async setMuted(muted: boolean) {
    await this.ready;
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
   * Resolves once persisted settings have been loaded — the UI hydration
   * point for mute/volume prefs.
   */
  public whenReady(): Promise<void> {
    return this.ready;
  }

  /**
   * Current playback volume (0–1).
   */
  public getVolume() {
    return this.volume;
  }

  private applyVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    for (const sound of this.sfx.values()) {
      sound.volume(this.volume);
    }
  }

  /**
   * Set playback volume (0–1) for all sound effects and persist it.
   */
  public async setVolume(volume: number) {
    await this.ready;
    this.applyVolume(volume);
    const raw = String(this.volume);
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.storeSet(STORE_KEYS.AUDIO_VOLUME, raw);
      } catch (error) {
        console.error('Failed to save volume to electron-store', error);
      }
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORE_KEYS.AUDIO_VOLUME, raw);
      } catch (error) {
        if ((error as Error)?.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded when saving volume', error);
        } else {
          console.error('Failed to save volume', error);
        }
      }
    }
  }

  /**
   * Reset the singleton instance for test cleanup.
   * This should be called in test beforeEach hooks to ensure a fresh state.
   */
  public static resetForTesting(): void {
    AudioManager.instance = undefined;
  }
}

/**
 * Audio manager.
 */
export const audioManager = AudioManager.getInstance();
