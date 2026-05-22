import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/training')({
  component: () => <Navigate to="/command/training" />,
});
