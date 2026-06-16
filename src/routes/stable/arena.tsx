import { createFileRoute } from '@tanstack/react-router';
import ArenaHub from '@/pages/ArenaHub';

export const Route = createFileRoute('/stable/arena')({
  component: ArenaHub,
});
