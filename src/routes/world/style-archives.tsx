/**
 * World Hub - Style Archives Page
 * Encyclopedia for the ten canonical fighting styles
 */
import { createFileRoute } from '@tanstack/react-router';
import StyleArchives from '@/pages/StyleArchives';

export const Route = createFileRoute('/world/style-archives')({
  component: StyleArchives,
});
