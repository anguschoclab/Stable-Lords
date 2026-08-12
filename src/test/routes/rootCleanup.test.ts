import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

describe('__root route files are deleted (no pathless route shadowing)', () => {
  it('stable/__root.tsx does not exist', () => {
    const path = resolve(__dirname, '../../../src/routes/stable/__root.tsx');
    expect(existsSync(path)).toBe(false);
  });

  it('world/__root.tsx does not exist', () => {
    const path = resolve(__dirname, '../../../src/routes/world/__root.tsx');
    expect(existsSync(path)).toBe(false);
  });

  it('StableLayout.tsx does not exist', () => {
    const path = resolve(__dirname, '../../../src/components/layout/StableLayout.tsx');
    expect(existsSync(path)).toBe(false);
  });
});
