import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NameResolutionState } from '@/utils/historyResolver';
import type { TournamentBout } from '@/types/game';
import { getRoundName, getEstimatedWeek } from '@/utils/tournamentHelpers';
import { TournamentBoutRow } from './TournamentBoutRow';

interface TournamentRoundCardProps {
  round: number;
  bouts: TournamentBout[];
  isExpanded: boolean;
  tournamentWeek: number;
  currentWeek: number;
  totalRounds: number;
  toggleRound: (round: number) => void;
  state: NameResolutionState;
}

export function TournamentRoundCard({
  round,
  bouts,
  isExpanded,
  tournamentWeek,
  currentWeek,
  totalRounds,
  toggleRound,
  state,
}: TournamentRoundCardProps) {
  const estimatedWeek = getEstimatedWeek(tournamentWeek, round);
  const isPast = estimatedWeek < currentWeek;
  const isCurrent = estimatedWeek === currentWeek;

  const completedCount = bouts.filter((b) => b.winner !== undefined).length;
  const isComplete = completedCount === bouts.length;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300',
        isComplete && 'border-primary/30',
        isCurrent && 'border-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]'
      )}
    >
      <CardHeader
        className={cn(
          'p-3 cursor-pointer hover:bg-secondary/20 transition-colors',
          isComplete && 'bg-primary/5',
          isCurrent && 'bg-primary/5'
        )}
        onClick={() => toggleRound(round)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black',
                isComplete
                  ? 'bg-primary/20 text-primary'
                  : isCurrent
                    ? 'bg-primary/20 text-primary animate-pulse'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {isComplete ? '✓' : round}
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                {getRoundName(round, totalRounds)}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Week {estimatedWeek}</span>
                {isPast && <span className="text-primary">(Completed)</span>}
                {isCurrent && <span className="text-primary font-bold">(Current)</span>}
                {!isPast && !isCurrent && <span>(Upcoming)</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {completedCount}/{bouts.length} matches
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${getRoundName(round, totalRounds)}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {bouts.map((bout, idx) => (
              <TournamentBoutRow key={`${round}-${idx}`} bout={bout} state={state} round={round} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
