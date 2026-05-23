import { createFileRoute, Navigate } from '@tanstack/react-router';/**
                                                                    * Route.
                                                                    */


/**
 * Route.
 */
export const Route = createFileRoute('/stable/finance')({
  component: () => <Navigate to="/ops/finance" />,
});
