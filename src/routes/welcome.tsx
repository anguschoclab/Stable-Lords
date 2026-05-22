import { createFileRoute } from '@tanstack/react-router';
import Orphanage from '@/pages/Orphanage';/**
 * Route.
 */


export const Route = createFileRoute('/welcome')({
  component: Orphanage,
});
