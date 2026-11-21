import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/** Empty state when fewer than two warriors are available to compare. */
export function EmptyWarriorState() {
  return (
    <EmptyState
      icon={Users}
      title="Insufficient Warriors Available"
      description="At least two active warriors are required for comparison."
    />
  );
}
