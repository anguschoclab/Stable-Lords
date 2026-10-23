/**
 * Stub `window.FileReader` so `readAsText` synchronously invokes the
 * caller-assigned `onload`/`onerror` with a canned result.
 *
 * `function` (not arrow) implementations so `this` binds to the reader
 * instance the code under test assigns handlers to (bun-safe).
 */
export function mockFileReader(result: string | null, opts: { error?: boolean } = {}): void {
  window.FileReader = vi.fn().mockImplementation(function () {
    return {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (opts.error) {
          this.onerror?.(new Error('read failed'));
        } else if (this.onload) {
          this.onload({ target: { result } });
        }
      }),
      onload: null,
      onerror: null,
    };
  }) as any;
}
