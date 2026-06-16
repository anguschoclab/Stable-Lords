import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/promoters')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/promoters' });
  },
  component: () => null,
});
