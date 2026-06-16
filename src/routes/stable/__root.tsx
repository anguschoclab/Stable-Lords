import { createFileRoute } from '@tanstack/react-router';
import StableLayout from '@/components/layout/StableLayout';

export const Route = createFileRoute('/stable/__root')({
  component: StableLayout,
});
