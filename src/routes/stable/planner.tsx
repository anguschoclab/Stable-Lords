import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/planner')({
  component: () => <Navigate to="/command/tactics" />,
});
