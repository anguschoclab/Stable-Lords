import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/contracts')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/bouts' });
  },
  component: () => null,
});
