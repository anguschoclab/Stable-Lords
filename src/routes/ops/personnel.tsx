import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/personnel')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/trainers' });
  },
  component: () => null,
});
