import { createFileRoute } from '@tanstack/react-router';
import Tournaments from '@/pages/Tournaments'; /**
                                                * Route.
                                                */

/**
 * Route.
 */
export const Route = createFileRoute('/world/tournaments')({
  component: Tournaments,
});
