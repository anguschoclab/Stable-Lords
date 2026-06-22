import { describe, it, expect } from 'vitest';
import { HUBS, type HubId } from '@/components/layout/navigationShared';

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

describe('HUBS extended structure', () => {
  it('has exactly 3 hubs', () => {
    expect(HUBS).toHaveLength(3);
  });

  it('each hub has id, label, icon, to, and pages properties', () => {
    HUBS.forEach((hub) => {
      expect(hub.id).toBeDefined();
      expect(hub.label).toBeDefined();
      expect(hub.icon).toBeDefined();
      expect(hub.to).toBeDefined();
      expect(hub.pages).toBeDefined();
      expect(Array.isArray(hub.pages)).toBe(true);
    });
  });

  it('stable hub has exactly 13 pages', () => {
    const stable = HUBS.find((h) => h.id === 'stable')!;
    expect(stable.pages).toHaveLength(13);
  });

  it('world hub has exactly 7 pages', () => {
    const world = HUBS.find((h) => h.id === 'world')!;
    expect(world.pages).toHaveLength(7);
  });

  it('bookmarks hub has exactly 0 pages', () => {
    const bookmarks = HUBS.find((h) => h.id === 'bookmarks')!;
    expect(bookmarks.pages).toHaveLength(0);
  });

  it('all hub `to` paths start with /', () => {
    HUBS.forEach((hub) => {
      expect(hub.to.startsWith('/')).toBe(true);
    });
  });

  it('all page `to` paths start with /', () => {
    HUBS.forEach((hub) => {
      hub.pages.forEach((page) => {
        expect(page.to.startsWith('/')).toBe(true);
      });
    });
  });

  it('no duplicate hub id values', () => {
    const ids = HUBS.map((h) => h.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('no duplicate page `to` paths within the same hub', () => {
    HUBS.forEach((hub) => {
      const paths = hub.pages.map((p) => p.to);
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length);
    });
  });

  it('pages with exact: true are correctly flagged (Overview, Rankings)', () => {
    const stable = HUBS.find((h) => h.id === 'stable')!;
    const overview = stable.pages.find((p) => p.label === 'Overview');
    expect(overview).toBeDefined();
    expect((overview as any).exact).toBe(true);

    const world = HUBS.find((h) => h.id === 'world')!;
    const rankings = world.pages.find((p) => p.label === 'Rankings');
    expect(rankings).toBeDefined();
    expect((rankings as any).exact).toBe(true);
  });

  it('HubId type is inferred correctly (compile-time check via type assignment)', () => {
    const id: HubId = 'stable';
    expect(id).toBe('stable');
  });

  it('stable hub pages include expected labels', () => {
    const stable = HUBS.find((h) => h.id === 'stable')!;
    const labels = stable.pages.map((p) => p.label);
    expect(labels).toContain('Overview');
    expect(labels).toContain('Roster');
    expect(labels).toContain('Training');
    expect(labels).toContain('Planner');
    expect(labels).toContain('Arena');
    expect(labels).toContain('Equipment');
    expect(labels).toContain('Bouts');
    expect(labels).toContain('Promoters');
    expect(labels).toContain('Trainers');
    expect(labels).toContain('Finance');
    expect(labels).toContain('Recruit');
    expect(labels).toContain('Offseason');
    expect(labels).toContain('Tournaments');
  });

  it('world hub pages include expected labels', () => {
    const world = HUBS.find((h) => h.id === 'world')!;
    const labels = world.pages.map((p) => p.label);
    expect(labels).toContain('Rankings');
    expect(labels).toContain('Arenas');
    expect(labels).toContain('Tournaments');
    expect(labels).toContain('Scouting');
    expect(labels).toContain('Chronicle');
    expect(labels).toContain('Hall of Fame');
    expect(labels).toContain('Graveyard');
  });
});
