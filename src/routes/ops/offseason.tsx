/**
 * Operations Hub - Offseason Page
 * Year-end retrospective + offseason transition flow.
 */
import { createFileRoute } from '@tanstack/react-router';
import Offseason from '@/pages/Offseason';/**
                                           * Route.
                                           */


/**
 * Route.
 */
export const Route = createFileRoute('/ops/offseason')({
  component: Offseason,
});
