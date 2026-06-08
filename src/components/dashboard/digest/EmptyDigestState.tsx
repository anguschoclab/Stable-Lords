import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export interface EmptyDigestStateProps {
  week: number;
  season: string;
}

/** Empty state when no weekly activity recorded */
export function EmptyDigestState({ week, season }: EmptyDigestStateProps) {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-6 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-bold uppercase tracking-wider text-muted-foreground">
          Week {week} — {season}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">No activity recorded yet this week.</p>
        <Link to="/ops/contracts">
          <Button variant="outline" size="sm" className="mt-4 text-[10px] uppercase">
            Browse Offers <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
