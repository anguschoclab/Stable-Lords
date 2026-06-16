import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/overview')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/roster' });
  },
  component: () => null,
});
