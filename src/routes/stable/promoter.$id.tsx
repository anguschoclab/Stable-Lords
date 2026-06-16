import { createFileRoute } from '@tanstack/react-router';
import PromoterDetail from '@/pages/PromoterDetail';

export const Route = createFileRoute('/stable/promoter/$id')({
  component: PromoterDetail,
});
