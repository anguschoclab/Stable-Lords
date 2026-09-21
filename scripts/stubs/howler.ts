/** Headless stub for howler — only used when running engine scripts outside the app. */
export class Howl {
  constructor(_opts?: unknown) {}
  play(): number {
    return 0;
  }
  stop(): void {}
  pause(): void {}
  volume(): number {
    return 0;
  }
  unload(): void {}
}
export const Howler = { volume: () => {} };
export default { Howl, Howler };
