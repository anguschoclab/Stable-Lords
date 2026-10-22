import { beforeEach, afterEach } from 'vitest';

/** Save and restore `globalThis.window` around each test — for specs that
 *  stub the electron window surface. */
export function installWindowSnapshot(): void {
  let originalWindow: typeof window;
  beforeEach(() => {
    originalWindow = (global as any).window;
  });
  afterEach(() => {
    (global as any).window = originalWindow;
  });
}

/** Window snapshot + fresh service per test — shared electron-archive scaffold. */
export function archiveServiceEach<T>(ctor: () => T, set: (s: T) => void): void {
  installWindowSnapshot();
  beforeEach(() => set(ctor()));
}
