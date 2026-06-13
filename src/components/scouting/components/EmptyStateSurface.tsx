import { Shield } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function EmptyStateSurface() {
  return (
    <EmptyState
      icon={Shield}
      title="Select Rival Stables for Analysis"
      description="Choose two rival stables from the selector panels above to begin comparative analysis."
    />
  );
}
