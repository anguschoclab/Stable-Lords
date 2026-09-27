import { createFileRoute } from '@tanstack/react-router';
import ArenaCircuit from '@/pages/ArenaCircuit';

export const Route = createFileRoute('/world/arenas')({
  component: ArenaCircuit,
});
