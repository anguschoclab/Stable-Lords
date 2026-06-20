import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/world/intelligence')({
  beforeLoad: () => {
    throw redirect({ to: '/world/scouting' });
  },
  component: () => null,
});
