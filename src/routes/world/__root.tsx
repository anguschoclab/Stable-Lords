/**
 * World Hub Root Layout
 */
import { Outlet, createFileRoute } from '@tanstack/react-router';/**
                                                                  * Route.
                                                                  */


/**
 * Route.
 */
export const Route = createFileRoute('/world/__root')({
  component: WorldLayout,
});

function WorldLayout() {
  return <Outlet />;
}
