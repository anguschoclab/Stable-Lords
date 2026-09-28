// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { expectRouteDefinition, expectRouteComponent } from './_helpers/routeTestHelper';

// Sync factory — bun:test deadlocks on async vi.mock factories (see
// bunRunnerSafety). `createFileRoute` is stubbed to preserve the Route shape
// this spec asserts (id + options.component); Navigate renders a marker div.
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (path: string) => (opts: { component?: unknown }) => ({
    id: path,
    options: opts,
  }),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to}>
      Navigate
    </div>
  ),
}));

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
