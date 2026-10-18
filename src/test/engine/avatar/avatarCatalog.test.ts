import { describe, it, expect } from 'vitest';
import { loadAvatarCatalog, getCatalogEntries } from '@/engine/avatar/avatarCatalog';

describe('avatarCatalog', () => {
  it('parses and stores a fixture catalog', async () => {
    const catalog = await loadAvatarCatalog();
    expect(getCatalogEntries(catalog, 'base', ['young', 'masc']).length).toBe(1);
    expect(getCatalogEntries(catalog, 'hair').length).toBe(3);
  });

  it('filters entries by tags with AND semantics', async () => {
    const catalog = await loadAvatarCatalog();
    const heavyShoulders = getCatalogEntries(catalog, 'shoulders', ['heavy']);
    expect(heavyShoulders.length).toBe(1);
    expect(heavyShoulders[0]?.src).toContain('pauldron');
  });
});
