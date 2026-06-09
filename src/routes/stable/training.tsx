import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
                                                                     * Route.
                                                                     */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/training')({
  component: () => <Navigate to="/command/training" />,
});
