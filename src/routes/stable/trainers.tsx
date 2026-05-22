import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/trainers')({
  component: () => <Navigate to="/ops/personnel" />,
});
