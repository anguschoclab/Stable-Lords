import { createFileRoute } from '@tanstack/react-router';
import WarriorDetail from '@/pages/WarriorDetail';/**
 * Route.
 */


export const Route = createFileRoute('/warrior/$id')({
  component: WarriorDetail,
});
