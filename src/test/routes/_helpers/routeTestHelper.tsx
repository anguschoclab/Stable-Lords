import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';

interface RouteLike {
  id?: string;
  options?: { component?: ComponentType };
  component?: ComponentType;
}

/**
 *
 */
export function expectRouteDefinition(route: RouteLike, expectedPath: string) {
  expect(route).toBeDefined();
  if (route.id !== undefined) {
    expect(route.id).toBe(expectedPath);
  }
}

/**
 *
 */
export function expectRouteComponent(route: RouteLike) {
  const component = route.options?.component ?? route.component;
  expect(component).toBeDefined();
  expect(typeof component).toBe('function');
}

/**
 *
 */
function renderRouteComponent(route: RouteLike) {
  const Component = (route.options?.component ?? route.component) as ComponentType;
  expect(Component).toBeDefined();
  const result = render(<Component />);
  expect(result.container).toBeInTheDocument();
  return result;
}

interface RouteConfig {
  name: string;
  path: string;
  importPath: string;
}

/** Shared spec block: every route defines a component that renders. */
export function describeRoutes(routes: RouteConfig[]) {
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
}
