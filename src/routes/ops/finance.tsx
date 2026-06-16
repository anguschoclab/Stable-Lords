import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/finance')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/finance' });
  },
  component: () => null,
});
