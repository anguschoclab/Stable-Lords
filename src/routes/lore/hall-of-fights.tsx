import { createFileRoute } from '@tanstack/react-router';
import HallOfFights from '@/lore/HallOfFights'; /**
                                                 * Route.
                                                 */

/**
 * Route.
 */
export const Route = createFileRoute('/lore/hall-of-fights')({
  component: HallOfFights,
});
