import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/contracts')({
  component: () => <Navigate to="/ops/contracts" />,
});
