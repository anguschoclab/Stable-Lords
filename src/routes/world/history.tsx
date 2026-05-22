import { createFileRoute } from '@tanstack/react-router';
import HallOfFame from '@/pages/HallOfFame';/**
 * Route.
 */


/**
 * Route.
 */
export const Route = createFileRoute('/world/history')({
  component: HallOfFame,
});
