import { createFileRoute } from '@tanstack/react-router';
import Offseason from '@/pages/Offseason';

export const Route = createFileRoute('/stable/offseason')({
  component: Offseason,
});
