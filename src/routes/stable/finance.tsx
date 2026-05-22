import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/finance')({
  component: () => <Navigate to="/ops/finance" />,
});
