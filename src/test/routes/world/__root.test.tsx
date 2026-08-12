import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { expectRouteDefinition, expectRouteComponent } from '../_helpers/routeTestHelper';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet</div>,
  };
});

describe('Route: /world/__root (layout)', () => {
  it('has correct definition', async () => {
    const mod = await import('@/routes/world/__root');
    expectRouteDefinition(mod.Route, '/world/__root');
  });

  it('has a component defined', async () => {
    const mod = await import('@/routes/world/__root');
    expectRouteComponent(mod.Route);
  });

  it('renders WorldLayout with Outlet without crashing', async () => {
    const mod = await import('@/routes/world/__root');
    const Component = mod.Route.options?.component as ComponentType;
    expect(Component).toBeDefined();
    const { container } = render(<Component />);
    expect(container).toBeInTheDocument();
  });
});
