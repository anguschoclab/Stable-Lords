import { createFileRoute } from '@tanstack/react-router';
import Bookmarks from '@/pages/Bookmarks';

export const Route = createFileRoute('/bookmarks')({
  component: Bookmarks,
});
