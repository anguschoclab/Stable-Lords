/**
 * Command Hub - Overview Page
 * Merged Dashboard + Critical Alerts
 */
import { createFileRoute } from '@tanstack/react-router';
import ControlCenter from '@/pages/ControlCenter';/**
                                                   * Route.
                                                   */


/**
 * Route.
 */
export const Route = createFileRoute('/command/')({
  component: ControlCenter,
});
