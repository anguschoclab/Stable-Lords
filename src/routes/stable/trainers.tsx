import { createFileRoute, Navigate } from '@tanstack/react-router';/**
                                                                    * Route.
                                                                    */


/**
 * Route.
 */
export const Route = createFileRoute('/stable/trainers')({
  component: () => <Navigate to="/ops/personnel" />,
});
