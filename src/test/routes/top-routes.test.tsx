import { describe, it, vi } from 'vitest';
import { expectRouteDefinition, expectRouteComponent, renderRouteComponent } from './_helpers/routeTestHelper';

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
  default: () => <div data-testid="hall-of-fights">HallOfFights</div>,
}));
vi.mock('@/pages/PhysicalsSimulator', () => ({
  default: () => <div data-testid="physicals-simulator">PhysicalsSimulator</div>,
}));
vi.mock('@/pages/WarriorDetail', () => ({
  default: () => <div data-testid="warrior-detail">WarriorDetail</div>,
}));

const routes = [
  { name: 'admin', path: '/admin', importPath: '@/routes/admin' },
  { name: 'arena-hub', path: '/arena-hub', importPath: '@/routes/arena-hub' },
  { name: 'bookmarks', path: '/bookmarks', importPath: '@/routes/bookmarks' },
  { name: 'help', path: '/help', importPath: '@/routes/help' },
  { name: 'welcome', path: '/welcome', importPath: '@/routes/welcome' },
  { name: 'lore/hall-of-fights', path: '/lore/hall-of-fights', importPath: '@/routes/lore/hall-of-fights' },
  { name: 'tools/physicals-simulator', path: '/tools/physicals-simulator', importPath: '@/routes/tools/physicals-simulator' },
  { name: 'warrior/$id', path: '/warrior/$id', importPath: '@/routes/warrior/$id' },
];

describe.each(routes)('Route: $name', (routeConfig) => {
  it('has correct definition', async () => {
    const mod = await import(routeConfig.importPath);
    expectRouteDefinition(mod.Route, routeConfig.path);
  });

  it('has a component defined', async () => {
    const mod = await import(routeConfig.importPath);
    expectRouteComponent(mod.Route);
  });

  it('renders component without crashing', async () => {
    const mod = await import(routeConfig.importPath);
    renderRouteComponent(mod.Route);
  });
});
