import { createFileRoute, Navigate } from '@tanstack/react-router';/**
                                                                    * Route.
                                                                    */


/**
 * Route.
 */
export const Route = createFileRoute('/stable/equipment')({
  component: () => <Navigate to="/ops/equipment" />,
});
