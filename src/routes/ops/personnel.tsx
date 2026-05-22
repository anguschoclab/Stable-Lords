/**
 * Operations Hub - Personnel Page
 * Trainers and Recruitment unified
 */
import { createFileRoute } from '@tanstack/react-router';
import Trainers from '@/pages/Trainers';/**
 * Route.
 */


/**
 * Route.
 */
export const Route = createFileRoute('/ops/personnel')({
  component: Trainers,
});
