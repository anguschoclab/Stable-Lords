import { createFileRoute } from '@tanstack/react-router';
import StableHall from '@/pages/StableHall';

export const Route = createFileRoute('/stable/roster')({
  component: StableHall,
});
