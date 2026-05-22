import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/')({
  component: () => <Navigate to="/ops/overview" />,
});
