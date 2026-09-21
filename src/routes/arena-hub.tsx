import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Legacy alias — `/arena-hub` predates the hub navigation reorganization.
 * Canonical surface is `/stable/arena`; redirect preserves external links.
 */
export const Route = createFileRoute('/arena-hub')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/arena' });
  },
});
