import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/')({
  component: () => <Navigate to="/stable" />,
});
