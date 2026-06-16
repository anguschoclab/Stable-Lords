import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/')({
  beforeLoad: () => {
    throw redirect({ to: '/stable' });
  },
  component: () => null,
});
