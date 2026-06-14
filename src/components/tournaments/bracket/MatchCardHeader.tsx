import { Badge } from '@/components/ui/badge';
import { Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TournamentBout } from '@/types/game';
import { isBronzeMatch, isChampionshipFinal } from '@/engine/matchmaking/tournamentHelpers';

interface MatchCardHeaderProps {
  bout: TournamentBout;
  totalRounds: number;
  isPending: boolean;
  isBye: boolean;
}

/**
 *
 */
export function MatchCardHeader({ bout, totalRounds, isPending, isBye }: MatchCardHeaderProps) {
  const bronze = isBronzeMatch(bout);
  const championship = isChampionshipFinal(bout, totalRounds);

  return (
    <div
      className={cn(
        'px-3 py-1 border-b border-border/20 flex items-center justify-between bg-secondary/20',
        bronze && 'bg-arena-gold/10 border-arena-gold/20',
        championship && !isPending && 'bg-arena-gold/20 border-arena-gold/30'
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest uppercase">
          {bronze ? 'BRONZE' : championship ? 'FINAL' : `MATCH ${bout.matchIndex + 1}`}
        </span>
        {bronze && <Medal className="h-3 w-3 text-arena-gold" />}
        {championship && !isPending && <Crown className="h-3 w-3 text-arena-gold" />}
      </div>
      {isPending ? (
        isBye ? (
          <Badge className="h-3 px-1.5 text-[7px] bg-muted-foreground/20 text-muted-foreground border-none">
            BYE
          </Badge>
        ) : (
          <Badge className="h-3 px-1.5 text-[7px] bg-muted-foreground/20 text-muted-foreground border-none">
            PENDING
          </Badge>
        )
      ) : championship ? (
        <Badge className="h-3 px-1.5 text-[7px] bg-arena-gold/30 text-arena-gold border-arena-gold/30">
          CHAMPION
        </Badge>
      ) : bronze ? (
        <Badge className="h-3 px-1.5 text-[7px] bg-arena-gold/30 text-arena-gold border-arena-gold/30">
          BRONZE
        </Badge>
      ) : (
        <Badge className="h-3 px-1.5 text-[7px] bg-primary/20 text-primary border-none">
          RESOLVED
        </Badge>
      )}
    </div>
  );
}
