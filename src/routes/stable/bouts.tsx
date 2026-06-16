import { createFileRoute } from '@tanstack/react-router';
import BookingOffice from '@/pages/BookingOffice';

export const Route = createFileRoute('/stable/bouts')({
  component: BookingOffice,
});
