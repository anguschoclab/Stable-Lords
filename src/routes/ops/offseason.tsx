import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/offseason')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/offseason' });
  },
  component: () => null,
});
