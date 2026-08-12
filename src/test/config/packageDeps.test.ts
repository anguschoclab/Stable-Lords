import { describe, it, expect } from 'vitest';
import packageJson from '../../../package.json';

const RUNTIME_PACKAGES = [
  'zustand',
  '@tanstack/react-router',
  'comlink',
  'howler',
  'immer',
] as const;

describe('package.json — runtime packages in dependencies', () => {
  for (const pkg of RUNTIME_PACKAGES) {
    it(`${pkg} is in dependencies (not devDependencies)`, () => {
      expect(packageJson.dependencies).toHaveProperty(pkg);
      expect(packageJson.devDependencies).not.toHaveProperty(pkg);
    });
  }
});
