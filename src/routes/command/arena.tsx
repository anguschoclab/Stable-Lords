import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/arena')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/arena' });
  },
  component: () => null,
});
