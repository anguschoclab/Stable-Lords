import { createFileRoute, Navigate } from '@tanstack/react-router';/**
 * Route.
 */


export const Route = createFileRoute('/')({
  component: () => <Navigate to="/command" />,
});
