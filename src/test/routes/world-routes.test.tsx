import { describe, it, vi } from 'vitest';
import {
  expectRouteDefinition,
  expectRouteComponent,
  renderRouteComponent,
} from './_helpers/routeTestHelper';

vi.mock('@/pages/WorldOverview', () => ({
  default: () => <div data-testid="world-overview">WorldOverview</div>,
}));
vi.mock('@/pages/ArenaLeaderboards', () => ({
  default: () => <div data-testid="arena-leaderboards">ArenaLeaderboards</div>,
}));
vi.mock('@/pages/Gazette', () => ({
  default: () => <div data-testid="gazette">Gazette</div>,
}));
vi.mock('@/pages/Graveyard', () => ({
  default: () => <div data-testid="graveyard">Graveyard</div>,
}));
vi.mock('@/pages/HallOfFame', () => ({
  default: () => <div data-testid="hall-of-fame">HallOfFame</div>,
}));
vi.mock('@/pages/Scouting', () => ({
  default: () => <div data-testid="scouting">Scouting</div>,
}));
vi.mock('@/pages/Tournaments', () => ({
  default: () => <div data-testid="tournaments">Tournaments</div>,
}));
vi.mock('@/pages/StableDetail', () => ({
  default: () => <div data-testid="stable-detail">StableDetail</div>,
}));

const routes = [
  { name: 'world/index', path: '/world/', importPath: '@/routes/world/index' },
  {
    name: 'world/arena-leaderboards',
    path: '/world/arena-leaderboards',
    importPath: '@/routes/world/arena-leaderboards',
  },
  { name: 'world/chronicle', path: '/world/chronicle', importPath: '@/routes/world/chronicle' },
  { name: 'world/graveyard', path: '/world/graveyard', importPath: '@/routes/world/graveyard' },
  { name: 'world/history', path: '/world/history', importPath: '@/routes/world/history' },
  { name: 'world/scouting', path: '/world/scouting', importPath: '@/routes/world/scouting' },
  {
    name: 'world/tournaments',
    path: '/world/tournaments',
    importPath: '@/routes/world/tournaments',
  },
  { name: 'world/stable/$id', path: '/world/stable/$id', importPath: '@/routes/world/stable/$id' },
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
