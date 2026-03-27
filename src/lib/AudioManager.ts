import { Howl } from "howler";

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

export type SfxType = "ui_click" | "hit" | "crit" | "clash" | "death" | "recovery" | "coin";

class AudioManager {
  private static instance: AudioManager;
  private sfx: Map<SfxType, Howl> = new Map();
  private amibent: Howl | null = null;
  private muted: boolean = false;

  private constructor() {
    this.muted = localStorage.getItem("sl_muted") === "true";
    this.loadSfx();
  }

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  private loadSfx() {
    const sfxMap: Record<SfxType, string> = {
      ui_click: "https://assets.mixkit.co/sfx/preview/mixkit-click-melodic-tone-1157.mp3",
      hit: "https://assets.mixkit.co/sfx/preview/mixkit-sword-clash-2160.mp3",
      crit: "https://assets.mixkit.co/sfx/preview/mixkit-heavy-sword-clash-2161.mp3",
      clash: "https://assets.mixkit.co/sfx/preview/mixkit-metal-blade-strike-2158.mp3",
      death: "https://assets.mixkit.co/sfx/preview/mixkit-horror-low-reverb-drum-hit-2250.mp3",
      recovery: "https://assets.mixkit.co/sfx/preview/mixkit-breath-of-relief-of-a-man-445.mp3",
      coin: "https://assets.mixkit.co/sfx/preview/mixkit-clinking-coins-752.mp3",
    };

    Object.entries(sfxMap).forEach(([key, url]) => {
      this.sfx.set(key as SfxType, new Howl({ src: [url], volume: 0.5 }));
    });
  }

  public play(type: SfxType) {
    if (this.muted) return;
    const sound = this.sfx.get(type);
    if (sound) sound.play();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    localStorage.setItem("sl_muted", String(muted));
  }

  public isMuted() {
    return this.muted;
  }
}

export const audioManager = AudioManager.getInstance();
