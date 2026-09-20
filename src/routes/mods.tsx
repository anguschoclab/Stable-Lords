import { createFileRoute } from '@tanstack/react-router';
import Mods from '@/pages/Mods';

/**
 * Route.
 */
export const Route = createFileRoute('/mods')({
  component: Mods,
});
