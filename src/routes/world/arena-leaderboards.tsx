import { createFileRoute } from '@tanstack/react-router';
import ArenaLeaderboards from '@/pages/ArenaLeaderboards';

export const Route = createFileRoute('/world/arena-leaderboards')({
  component: ArenaLeaderboards,
});
