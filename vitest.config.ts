import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/_setup/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    dir: './src',
    exclude: ['node_modules/', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.test.ts', '*.test.tsx'],
    },
  },
});
