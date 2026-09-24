import { createFileRoute } from '@tanstack/react-router';
import AdvisorPage from '@/pages/Advisor';

export const Route = createFileRoute('/stable/advisor')({
  component: AdvisorPage,
});
