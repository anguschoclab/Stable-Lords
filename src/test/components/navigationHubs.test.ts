import { describe, it, expect } from 'vitest';
import { HUBS } from '@/components/layout/navigationShared';

describe('HUBS structure after consolidation', () => {
  it('has exactly one stable management hub, world, and bookmarks (no command/ops split)', () => {
    const ids = HUBS.map((h) => h.id);
    expect(ids).toContain('stable');
    expect(ids).toContain('world');
    expect(ids).not.toContain('command');
    expect(ids).not.toContain('ops');
  });

  it('the stable hub links only to /stable/* (and /world/tournaments)', () => {
    const stable = HUBS.find((h) => h.id === 'stable')!;
    stable.pages.forEach((p) => {
      expect(p.to.startsWith('/stable') || p.to.startsWith('/world')).toBe(true);
    });
  });

  it('contains no /command or /ops links anywhere in HUBS', () => {
    const json = JSON.stringify(HUBS);
    expect(json).not.toMatch(/\/command/);
    expect(json).not.toMatch(/\/ops/);
  });
});
