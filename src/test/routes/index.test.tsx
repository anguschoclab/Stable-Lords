import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { expectRouteDefinition, expectRouteComponent } from './_helpers/routeTestHelper';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to}>
        Navigate
      </div>
    ),
  };
});

describe('Route: / (index redirect)', () => {
  it('has correct definition', async () => {
    const mod = await import('@/routes/index');
    expectRouteDefinition(mod.Route, '/');
  });

  it('has a component defined', async () => {
    const mod = await import('@/routes/index');
    expectRouteComponent(mod.Route);
  });

  it('renders Navigate to /stable', async () => {
    const mod = await import('@/routes/index');
    const Component = mod.Route.options?.component as ComponentType;
    expect(Component).toBeDefined();
    render(<Component />);
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/stable');
  });
});
