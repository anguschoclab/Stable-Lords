import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/recruit')({
  component: () => <Navigate to="/ops/recruit" />,
});
