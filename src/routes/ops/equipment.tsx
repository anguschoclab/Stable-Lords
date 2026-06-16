import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/equipment')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/equipment' });
  },
  component: () => null,
});
