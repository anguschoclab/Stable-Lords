import { describe, it, expect } from 'vitest';
import packageJson from '../../../package.json';

describe('electron-forge config accessibility', () => {
  it('forge config is accessible at top-level config (not nested in build)', () => {
    // After the fix, forge config should be at packageJson.config.forge
    // or a separate forge.config.js — NOT at packageJson.build.config.forge
    const forgeConfig = (packageJson as any).config?.forge;
    expect(forgeConfig).toBeDefined();
    expect(forgeConfig.makers).toBeDefined();
    expect(Array.isArray(forgeConfig.makers)).toBe(true);
    expect(forgeConfig.makers.length).toBeGreaterThan(0);
  });

  it('dead electron-builder "build" block is removed', () => {
    // The electron-builder "build" block should no longer exist
    expect((packageJson as any).build).toBeUndefined();
  });
});
