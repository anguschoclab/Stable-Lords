import { createFileRoute, redirect } from '@tanstack/react-router';/**
 * Route.
 */


/**
 * Route.
 */
export const Route = createFileRoute('/command/combat')({
  beforeLoad: () => {
    throw redirect({ to: '/command/arena' });
  },
  component: () => null,
});
