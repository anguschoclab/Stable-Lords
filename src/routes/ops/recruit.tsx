import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/recruit')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/recruit' });
  },
  component: () => null,
});
