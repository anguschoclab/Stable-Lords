import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveWarriorName, type NameResolutionState } from '@/engine/core/historyResolver';
import type { TournamentBout } from '@/types/game';
import { isByeMatch, isBronzeMatch } from '@/engine/matchmaking/tournamentHelpers';

interface TournamentBoutRowProps {
  bout: TournamentBout;
  state: NameResolutionState;
  round: number;
}

/**
 *
 */
export function TournamentBoutRow({ bout, state, round: _round }: TournamentBoutRowProps) {
  const isBye = isByeMatch(bout);
  const isResolved = bout.winner !== undefined;
  const bronze = isBronzeMatch(bout);

  return (
    <div
      className={cn(
        'p-3 flex items-center justify-between',
        isResolved && 'bg-secondary/10',
        bronze && 'bg-arena-gold/5'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground font-mono w-8">#{bout.matchIndex + 1}</div>
        <div className="space-y-1">
          <ParticipantLine
            state={state}
            warriorId={bout.warriorIdA}
            won={bout.winner === 'A'}
            dimmed={bout.winner === 'D'}
          />
          {!isBye ? (
            <ParticipantLine
              state={state}
              warriorId={bout.warriorIdD}
              won={bout.winner === 'D'}
              dimmed={bout.winner === 'A'}
            />
          ) : (
            <div className="flex items-center gap-2 opacity-50 italic">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <span className="text-sm">(bye)</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {bronze && (
          <Badge variant="outline" className="text-[9px] border-arena-gold/30 text-arena-gold">
            Bronze
          </Badge>
        )}
        {isBye ? (
          <Badge variant="outline" className="text-[9px] text-muted-foreground">
            Auto-win
          </Badge>
        ) : isResolved ? (
          <Badge className="text-[9px] bg-primary/20 text-primary border-none">
            {bout.by || 'Win'}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] text-muted-foreground">
            Pending
          </Badge>
        )}
      </div>
    </div>
  );
}

/** One bracket entrant line: seed dot, name, winner trophy. */
function ParticipantLine({
  state,
  warriorId,
  won,
  dimmed,
}: {
  state: NameResolutionState;
  warriorId: TournamentBout['warriorIdA'];
  won: boolean;
  dimmed: boolean;
}) {
  return (
    <div
      className={cn('flex items-center gap-2', won && 'text-primary font-bold', dimmed && 'opacity-40')}
    >
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          won ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      />
      <span className="text-sm truncate max-w-32">
        {resolveWarriorName(state, warriorId, 'Unknown')}
      </span>
      {won && <Trophy className="h-3 w-3 text-arena-gold" />}
    </div>
  );
}
