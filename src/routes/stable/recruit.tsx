import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/stable/recruit')({
  component: () => <Navigate to="/ops/recruit" />,
});
