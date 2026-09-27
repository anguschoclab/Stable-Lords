import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/_setup/setup.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    testTimeout: 120000,
    hookTimeout: 10000,
    pool: 'threads',
    // isolate must stay on: with it off, files sharing a worker leak the
    // module registry — opfsArchiverFlush's vi.mock stops intercepting once a
    // sibling caches opfsArchiver, and jsdom/node env interleaving breaks RTL
    // unmount. Measured empirically during Phase 5; do not flip.
    dir: './src/test',
    exclude: ['node_modules/', '**/e2e/**', '**/*.slow.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.test.ts', '*.test.tsx'],
    },
  },
});
