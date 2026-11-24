import { describe, it, expect } from 'vitest';
import {
  loadAvatarCatalog,
  getAvatarCatalog,
  getCatalogEntries,
  setAvatarCatalog,
  clearAvatarCatalog,
} from '@/engine/avatar/avatarCatalog';
import { createTestPortraitCatalog } from '@/test/_fixtures/avatarCatalog';

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

  it('setAvatarCatalog injects a catalog and clearAvatarCatalog resets it', () => {
    const pool = createTestPortraitCatalog();
    setAvatarCatalog(pool);
    expect(getAvatarCatalog()).toBe(pool);
    clearAvatarCatalog();
    expect(getAvatarCatalog()).toBeNull();
  });

  it('accepts a portraits-only catalog (portraits satisfy validation)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify(createTestPortraitCatalog()), { status: 200 })
        )
      )
    );
    clearAvatarCatalog();
    const catalog = await loadAvatarCatalog();
    expect(getCatalogEntries(catalog, 'portraits').length).toBeGreaterThan(0);
  });

  it('rejects a catalog with no usable categories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify({ categories: {} }), { status: 200 })
        )
      )
    );
    clearAvatarCatalog();
    await expect(loadAvatarCatalog()).rejects.toThrow(/missing required categories/i);
  });
});
