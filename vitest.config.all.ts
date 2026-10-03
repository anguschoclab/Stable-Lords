import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/_setup/setup.node.ts', './src/test/_setup/setup.dom.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '#scripts': path.resolve(import.meta.dirname, './scripts'),
    },
    testTimeout: 120000,
    hookTimeout: 10000,
    pool: 'threads',
    dir: './src/test',
    exclude: ['node_modules/', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.test.ts', '*.test.tsx'],
    },
  },
});
