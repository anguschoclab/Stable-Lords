import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 *
 */
export interface EmptyDigestStateProps {
  week: number;
  season: string;
}

/**
 *
 */
export function EmptyDigestState({ week, season }: EmptyDigestStateProps) {
  return (
    <EmptyState
      icon={Calendar}
      title={`Week ${week} — ${season}`}
      description="No activity recorded yet this week."
      className="py-6"
      action={
        <Link to="/stable/bouts">
          <Button variant="outline" size="sm" className="text-[10px] uppercase">
            Browse Offers <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      }
    />
  );
}
