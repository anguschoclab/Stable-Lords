import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
                                                                     * Route.
                                                                     */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/')({
  component: () => <Navigate to="/ops/overview" />,
});
