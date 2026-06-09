import { createFileRoute, Navigate } from '@tanstack/react-router';

function StableRedirect() {
  const { id } = Route.useParams();
  return <Navigate to="/world/stable/$id" params={{ id }} />;
} /**
   * Route.
   */

/**
 * Route.
 */
export const Route = createFileRoute('/stable/$id')({
  component: StableRedirect,
});
