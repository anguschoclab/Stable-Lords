import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { expectRouteDefinition, expectRouteComponent } from '../_helpers/routeTestHelper';

vi.mock('@/components/layout/StableLayout', () => ({
  default: () => <div data-testid="stable-layout">StableLayout</div>,
}));

describe('Route: /stable/__root (layout)', () => {
  it('has correct definition', async () => {
    const mod = await import('@/routes/stable/__root');
    expectRouteDefinition(mod.Route, '/stable/__root');
  });

  it('has a component defined', async () => {
    const mod = await import('@/routes/stable/__root');
    expectRouteComponent(mod.Route);
  });

  it('renders StableLayout without crashing', async () => {
    const mod = await import('@/routes/stable/__root');
    const Component = mod.Route.options?.component as ComponentType;
    expect(Component).toBeDefined();
    render(<Component />);
    expect(screen.getByTestId('stable-layout')).toBeInTheDocument();
  });
});
