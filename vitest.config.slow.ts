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
    testTimeout: 600000,
    hookTimeout: 30000,
    pool: 'threads',
    fileParallelism: true,
    include: ['src/test/**/*.slow.test.ts', 'src/test/**/*.slow.test.tsx'],
    exclude: ['node_modules/', '**/e2e/**'],
  },
});
