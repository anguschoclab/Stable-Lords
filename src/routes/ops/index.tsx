/**
 * Operations Hub - Index Page
 * Redirects to Personnel (first tab in Operations hub)
 */
import { createFileRoute, Navigate } from '@tanstack/react-router'; /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createFileRoute('/ops/')({
  component: () => <Navigate to="/ops/overview" />,
});
