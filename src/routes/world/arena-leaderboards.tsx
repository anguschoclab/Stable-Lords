import { createFileRoute, redirect } from '@tanstack/react-router';

// Legacy route — the per-arena boards now live on the arena cards.
export const Route = createFileRoute('/world/arena-leaderboards')({
  beforeLoad: () => {
    throw redirect({ to: '/world/arenas' });
  },
});
