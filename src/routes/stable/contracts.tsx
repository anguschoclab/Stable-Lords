import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
                                                                     * Route.
                                                                     */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/contracts')({
  component: () => <Navigate to="/ops/contracts" />,
});
