import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/roster')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/roster' });
  },
  component: () => null,
});
