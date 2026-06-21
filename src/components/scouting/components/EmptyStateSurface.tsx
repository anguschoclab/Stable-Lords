import { Shield } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 *
 */
export function EmptyStateSurface() {
  return (
    <EmptyState
      icon={Shield}
      title="Select Two Stables to Compare"
      description="Choose two rival stables to weigh their strength, doctrine, and warriors."
    />
  );
}
