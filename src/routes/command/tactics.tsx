import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/tactics')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/planner' });
  },
  component: () => null,
});
