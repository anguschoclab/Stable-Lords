// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { describeRoutes } from './_helpers/routeTestHelper';

vi.mock('@/pages/AdminTools', () => ({
  default: () => <div data-testid="admin-tools">AdminTools</div>,
}));
vi.mock('@/pages/ArenaHub', () => ({
  default: () => <div data-testid="arena-hub">ArenaHub</div>,
}));
vi.mock('@/pages/Bookmarks', () => ({
  default: () => <div data-testid="bookmarks">Bookmarks</div>,
}));
vi.mock('@/pages/Help', () => ({
  default: () => <div data-testid="help">Help</div>,
}));
vi.mock('@/pages/Orphanage', () => ({
  default: () => <div data-testid="orphanage">Orphanage</div>,
}));
vi.mock('@/lore/HallOfFights', () => ({
  HallOfFights: () => <div data-testid="hall-of-fights">HallOfFights</div>,
}));
vi.mock('@/pages/PhysicalsSimulator', () => ({
  default: () => <div data-testid="physicals-simulator">PhysicalsSimulator</div>,
}));
vi.mock('@/pages/WarriorDetail', () => ({
  default: () => <div data-testid="warrior-detail">WarriorDetail</div>,
}));

const routes = [
  { name: 'admin', path: '/admin', importPath: '@/routes/admin' },
  { name: 'bookmarks', path: '/bookmarks', importPath: '@/routes/bookmarks' },
  { name: 'help', path: '/help', importPath: '@/routes/help' },
  { name: 'welcome', path: '/welcome', importPath: '@/routes/welcome' },
  {
    name: 'lore/hall-of-fights',
    path: '/lore/hall-of-fights',
    importPath: '@/routes/lore/hall-of-fights',
  },
  {
    name: 'tools/physicals-simulator',
    path: '/tools/physicals-simulator',
    importPath: '@/routes/tools/physicals-simulator',
  },
  { name: 'warrior/$id', path: '/warrior/$id', importPath: '@/routes/warrior/$id' },
];

describeRoutes(routes);

describe('Route: arena-hub (legacy alias)', () => {
  it('redirects to the canonical /stable/arena surface', async () => {
    const mod = await import('@/routes/arena-hub');
    const beforeLoad = mod.Route.options.beforeLoad;
    expect(typeof beforeLoad).toBe('function');
    if (typeof beforeLoad !== 'function') throw new Error('expected redirect beforeLoad');
    expect(() => beforeLoad({} as never)).toThrow();
    try {
      beforeLoad({} as never);
    } catch (e) {
      expect((e as { options?: { to?: string } }).options?.to ?? (e as { to?: string }).to).toBe(
        '/stable/arena'
      );
    }
  });
});
