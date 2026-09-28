// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { describeRoutes } from './_helpers/routeTestHelper';

vi.mock('@/pages/WorldOverview', () => ({
  default: () => <div data-testid="world-overview">WorldOverview</div>,
}));
vi.mock('@/pages/ArenaCircuit', () => ({
  default: () => <div data-testid="arena-circuit">ArenaCircuit</div>,
}));
vi.mock('@/pages/ArenaDetail', () => ({
  default: () => <div data-testid="arena-detail">ArenaDetail</div>,
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
  { name: 'world/arenas', path: '/world/arenas', importPath: '@/routes/world/arenas' },
  {
    name: 'world/arenas/$arenaId',
    path: '/world/arenas/$arenaId',
    importPath: '@/routes/world/arenas.$arenaId',
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

describeRoutes(routes);

describe('Route: world/arena-leaderboards (legacy redirect)', () => {
  it('redirects to /world/arenas', async () => {
    const mod = await import('@/routes/world/arena-leaderboards');
    const beforeLoad = (mod.Route.options as { beforeLoad?: () => void }).beforeLoad;
    expect(beforeLoad).toBeDefined();
    expect(() => beforeLoad!()).toThrow();
    try {
      beforeLoad!();
    } catch (e) {
      expect((e as { to?: string }).to ?? (e as { options?: { to?: string } }).options?.to).toBe(
        '/world/arenas'
      );
    }
  });
});