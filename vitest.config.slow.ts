import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/_setup/setup.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    testTimeout: 600000,
    hookTimeout: 30000,
    pool: 'threads',
    fileParallelism: false,
    include: ['src/test/**/*.slow.test.ts'],
    exclude: ['node_modules/', '**/e2e/**'],
  },
});
