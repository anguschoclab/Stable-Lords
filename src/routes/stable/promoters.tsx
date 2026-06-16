import { createFileRoute } from '@tanstack/react-router';
import PromoterDirectory from '@/pages/PromoterDirectory';

export const Route = createFileRoute('/stable/promoters')({
  component: PromoterDirectory,
});
