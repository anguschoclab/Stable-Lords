import { describe, it, vi } from 'vitest';
import { expectRouteDefinition, expectRouteComponent, renderRouteComponent } from './_helpers/routeTestHelper';

vi.mock('@/pages/ControlCenter', () => ({
  default: () => <div data-testid="control-center">ControlCenter</div>,
}));
vi.mock('@/pages/ArenaHub', () => ({
  default: () => <div data-testid="arena-hub">ArenaHub</div>,
}));
vi.mock('@/pages/BookingOffice', () => ({
  default: () => <div data-testid="booking-office">BookingOffice</div>,
}));
vi.mock('@/pages/StableEquipment', () => ({
  default: () => <div data-testid="stable-equipment">StableEquipment</div>,
}));
vi.mock('@/pages/StableLedger', () => ({
  default: () => <div data-testid="stable-ledger">StableLedger</div>,
}));
vi.mock('@/pages/Offseason', () => ({
  default: () => <div data-testid="offseason">Offseason</div>,
}));
vi.mock('@/pages/TrainingPlanner', () => ({
  default: () => <div data-testid="training-planner">TrainingPlanner</div>,
}));
vi.mock('@/pages/PromoterDirectory', () => ({
  default: () => <div data-testid="promoter-directory">PromoterDirectory</div>,
}));
vi.mock('@/pages/PromoterDetail', () => ({
  default: () => <div data-testid="promoter-detail">PromoterDetail</div>,
}));
vi.mock('@/pages/Recruit', () => ({
  default: () => <div data-testid="recruit">Recruit</div>,
}));
vi.mock('@/pages/StableHall', () => ({
  default: () => <div data-testid="stable-hall">StableHall</div>,
}));
vi.mock('@/pages/Trainers', () => ({
  default: () => <div data-testid="trainers">Trainers</div>,
}));
vi.mock('@/pages/Training', () => ({
  default: () => <div data-testid="training">Training</div>,
}));

const routes = [
  { name: 'stable/index', path: '/stable/', importPath: '@/routes/stable/index' },
  { name: 'stable/arena', path: '/stable/arena', importPath: '@/routes/stable/arena' },
  { name: 'stable/bouts', path: '/stable/bouts', importPath: '@/routes/stable/bouts' },
  { name: 'stable/equipment', path: '/stable/equipment', importPath: '@/routes/stable/equipment' },
  { name: 'stable/finance', path: '/stable/finance', importPath: '@/routes/stable/finance' },
  { name: 'stable/offseason', path: '/stable/offseason', importPath: '@/routes/stable/offseason' },
  { name: 'stable/planner', path: '/stable/planner', importPath: '@/routes/stable/planner' },
  { name: 'stable/promoters', path: '/stable/promoters', importPath: '@/routes/stable/promoters' },
  { name: 'stable/promoter/$id', path: '/stable/promoter/$id', importPath: '@/routes/stable/promoter.$id' },
  { name: 'stable/recruit', path: '/stable/recruit', importPath: '@/routes/stable/recruit' },
  { name: 'stable/roster', path: '/stable/roster', importPath: '@/routes/stable/roster' },
  { name: 'stable/trainers', path: '/stable/trainers', importPath: '@/routes/stable/trainers' },
  { name: 'stable/training', path: '/stable/training', importPath: '@/routes/stable/training' },
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
