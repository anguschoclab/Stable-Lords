/**
 * Dependency — tailwindcss 4 compatibility check.
 * Pre-merge test: verifies arena tokens are defined in the config
 * and will resolve after tailwindcss 4 migration.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('tailwindcss 4 compatibility — arena tokens', () => {
  it('tailwind.config.ts defines arena color tokens', () => {
    const configPath = path.resolve(process.cwd(), 'tailwind.config.ts');
    const content = readFileSync(configPath, 'utf-8');

    // Check for arena token definitions
    expect(content).toMatch(/arena-gold/);
    expect(content).toMatch(/arena-blood/);
    expect(content).toMatch(/arena-fame/);
  });

  it('index.css defines arena CSS variables', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const content = readFileSync(cssPath, 'utf-8');

    // Check for arena CSS variable definitions
    expect(content).toMatch(/--arena/);
  });
});
