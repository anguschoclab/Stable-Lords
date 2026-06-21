import { createFileRoute } from '@tanstack/react-router';
import WorldOverview from '@/pages/WorldOverview'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/world/')({
  component: WorldOverview,
});
