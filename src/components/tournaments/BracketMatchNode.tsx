import { cn } from '@/lib/utils';
import type { TournamentBout, FightSummary } from '@/types/game';
import { isBronzeMatch, isChampionshipFinal } from '@/utils/tournamentHelpers';
import {
  ConnectionLines,
  MatchCardHeader,
  WarriorSlots,
  MatchActions,
  MatchViewer,
} from './bracket';

interface BracketMatchNodeProps {
  bout: TournamentBout;
  boutKey: string;
  isExpanded: boolean;
  onToggleExpand: (key: string | null) => void;
  fightSummary: FightSummary | null;
  rIdx: number;
  bIdx: number;
  totalRounds: number;
  gameState: any; // The state object returned by useGameStore()
}

/**
 *
 */
export function BracketMatchNode({
  bout,
  boutKey,
  isExpanded,
  onToggleExpand,
  fightSummary,
  rIdx,
  bIdx: _bIdx,
  totalRounds,
  gameState,
}: BracketMatchNodeProps) {
  const hasTranscript = !!(fightSummary?.transcript && fightSummary.transcript.length > 0);
  const isAChosen = bout.winner === 'A';
  const isDChosen = bout.winner === 'D';
  const isPending = bout.winner === undefined;
  const isBye = bout.warriorIdD === 'bye';
  const bronze = isBronzeMatch(bout);
  const championship = isChampionshipFinal(bout, totalRounds);

  return (
    <div className={cn('relative group', bronze && 'opacity-90')}>
      <ConnectionLines rIdx={rIdx} isBye={isBye} isPending={isPending} bronze={bronze} />

      <div
        className={cn(
          'w-64 rounded-none border transition-all duration-300 relative z-10',
          isPending
            ? 'bg-background/20 border-border/40'
            : 'bg-secondary/10 border-primary/30 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]',
          isExpanded &&
            'ring-2 ring-primary/50 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]',
          bronze && 'border-arena-gold/40 bg-arena-gold/5',
          championship &&
            !isPending &&
            'border-arena-gold/50 bg-arena-gold/10 shadow-[0_0_20px_-5px_rgba(255,215,0,0.3)]',
          isBye && 'border-dashed border-border/30 bg-muted/10'
        )}
      >
        <MatchCardHeader
          bout={bout}
          totalRounds={totalRounds}
          isPending={isPending}
          isBye={isBye}
        />

        <WarriorSlots
          bout={bout}
          boutKey={boutKey}
          totalRounds={totalRounds}
          isAChosen={isAChosen}
          isDChosen={isDChosen}
          isBye={isBye}
          gameState={gameState}
          onToggleExpand={onToggleExpand}
          isExpanded={isExpanded}
        />

        <MatchActions
          hasTranscript={hasTranscript}
          isExpanded={isExpanded}
          boutKey={boutKey}
          onToggleExpand={onToggleExpand}
        />
      </div>

      {isExpanded && hasTranscript && fightSummary && (
        <MatchViewer
          bout={bout}
          fightSummary={fightSummary}
          gameState={gameState}
          onToggleExpand={onToggleExpand}
        />
      )}
    </div>
  );
}
