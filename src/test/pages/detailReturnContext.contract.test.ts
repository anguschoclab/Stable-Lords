import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..', '..');

function source(file: string) {
  return readFileSync(path.join(SRC, file), 'utf8');
}

describe('detail-page return context contract', () => {
  it.each([
    ['pages/WarriorDetail.tsx', 'returnContext.to'],
    ['pages/StableDetail.tsx', '/world/scouting'],
    ['pages/PromoterDetail.tsx', '/stable/promoters'],
    ['pages/ArenaDetail.tsx', '/world/arenas'],
  ])('%s exposes its real parent through ReturnLink', (file, destination) => {
    const text = source(file);
    expect(text).toContain('ReturnLink');
    expect(text).toContain('<ReturnLink');
    expect(text).toContain(destination);
  });

  it('returns missing warriors to scouting instead of the root redirect', () => {
    expect(source('pages/WarriorDetail.tsx')).toContain('to="/world/scouting"');
  });
});
