import { describe, it, expect } from 'vitest';

describe('vite-plugin-pwa is wired into vite.config.ts', () => {
  it('vite config includes VitePWA in the plugins array', async () => {
    const configPath = '../../../vite.config';
    const viteConfig = await import(configPath);
    const config = (viteConfig as any).default;
    expect(config).toBeDefined();
    expect(config.plugins).toBeDefined();
    expect(Array.isArray(config.plugins)).toBe(true);

    const pluginNames = config.plugins
      .map((p: any) => p?.name ?? (Array.isArray(p) ? p.map((pp: any) => pp?.name) : null))
      .flat()
      .filter(Boolean);
    expect(pluginNames).toContain('vite-plugin-pwa');
  });
});
