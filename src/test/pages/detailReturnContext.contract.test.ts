import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..', '..');

function source(file: string) {
  return readFileSync(path.join(SRC, file), 'utf8');
}

describe('detail-page return context contract', () => {
  it.each([
    'pages/WarriorDetail.tsx',
    'pages/StableDetail.tsx',
    'pages/PromoterDetail.tsx',
    'pages/ArenaDetail.tsx',
  ])('%s renders the hybrid Breadcrumbs trail', (file) => {
    const text = source(file);
    expect(text).toContain('Breadcrumbs');
    expect(text).toContain('<Breadcrumbs');
  });

  it('returns missing warriors to scouting instead of the root redirect', () => {
    // The canonical fallback now lives in the route registry — unknown
    // warrior ids chain to World › Scouting (asserted behaviorally in
    // routeCrumbs.test.ts).
    expect(source('components/layout/breadcrumbs/routeCrumbs.ts')).toContain("'/world/scouting'");
  });
});
