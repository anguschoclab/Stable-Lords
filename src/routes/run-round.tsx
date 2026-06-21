import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/run-round')({
  component: () => <Navigate to="/stable/arena" />,
});
