import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/training')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/training' });
  },
  component: () => null,
});
