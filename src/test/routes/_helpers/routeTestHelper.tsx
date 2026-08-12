import { expect } from 'vitest';
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
export function renderRouteComponent(route: RouteLike) {
  const Component = (route.options?.component ?? route.component) as ComponentType;
  expect(Component).toBeDefined();
  const result = render(<Component />);
  expect(result.container).toBeInTheDocument();
  return result;
}
