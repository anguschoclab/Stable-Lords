/**
 * World Hub - Intelligence Page
 * Scouting and rival analysis
 */
import { createFileRoute } from '@tanstack/react-router';
import Scouting from '@/pages/Scouting'; /**
                                          * Route.
                                          */

/**
 * Route.
 */
export const Route = createFileRoute('/world/intelligence')({
  component: Scouting,
});
