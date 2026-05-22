import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/run-round')({
  component: () => <Navigate to="/command/combat" />,
});
