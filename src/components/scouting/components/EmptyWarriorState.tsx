import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function EmptyWarriorState() {
  return (
    <EmptyState
      icon={Users}
      title="Insufficient Warriors Available"
      description="At least two active warriors are required for comparison."
    />
  );
}
