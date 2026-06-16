import { createFileRoute } from '@tanstack/react-router';
import ControlCenter from '@/pages/ControlCenter';

export const Route = createFileRoute('/stable/')({
  component: ControlCenter,
});
