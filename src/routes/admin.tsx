import { createFileRoute } from '@tanstack/react-router';
import AdminTools from '@/pages/AdminTools';/**
 * Route.
 */


export const Route = createFileRoute('/admin')({
  component: AdminTools,
});
