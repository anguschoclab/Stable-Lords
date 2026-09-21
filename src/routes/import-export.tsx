import { createFileRoute } from '@tanstack/react-router';
import ImportExport from '@/pages/ImportExport';

/**
 * Route.
 */
export const Route = createFileRoute('/import-export')({
  component: ImportExport,
});
