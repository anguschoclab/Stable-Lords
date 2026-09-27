import { createFileRoute } from '@tanstack/react-router';
import ArenaDetail from '@/pages/ArenaDetail';

export const Route = createFileRoute('/world/arenas/$arenaId')({
  component: ArenaDetail,
});
