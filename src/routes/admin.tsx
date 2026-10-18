import { createFileRoute } from '@tanstack/react-router';
import AdminTools from '@/pages/AdminTools';
import NotFound from '@/pages/NotFound';

/**
 * Development-only route; production renders the canonical 404 surface.
 */
export const Route = createFileRoute('/admin')({
  component: import.meta.env.DEV ? AdminTools : NotFound,
});
