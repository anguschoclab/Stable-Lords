import { Trophy, StepForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveWarriorName, type NameResolutionState } from '@/engine/core/historyResolver';
import type { TournamentBout } from '@/types/game';
import { isBronzeMatch, isChampionshipFinal } from '@/engine/matchmaking/tournamentHelpers';

interface WarriorSlotsProps {
  bout: TournamentBout;
  boutKey: string;
  totalRounds: number;
  isAChosen: boolean;
  isDChosen: boolean;
  isBye: boolean;
  gameState: NameResolutionState;
  onToggleExpand: (key: string | null) => void;
  isExpanded: boolean;
}

/**
 *
 */
export function WarriorSlots({
  bout,
  boutKey,
  totalRounds,
  isAChosen,
  isDChosen,
  isBye,
  gameState,
  onToggleExpand,
  isExpanded,
}: WarriorSlotsProps) {
  const bronze = isBronzeMatch(bout);
  const championship = isChampionshipFinal(bout, totalRounds);

  const handleClick = () => onToggleExpand(isExpanded ? null : boutKey);

  return (
    <div className="p-3 space-y-1">
      {/* Warrior A */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Select ${resolveWarriorName(gameState, bout.warriorIdA, 'Unknown')}`}
        className={cn(
          'flex items-center justify-between p-2 rounded-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isAChosen
            ? 'bg-primary/10 text-primary font-bold shadow-inner'
            : isDChosen
              ? 'opacity-30 grayscale'
              : 'bg-background/40',
          isBye && 'bg-muted/30',
          isAChosen && championship && 'bg-arena-gold/20 text-arena-gold'
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <div
            className={cn(
              'w-1 h-4 rounded-full',
              isAChosen ? (championship ? 'bg-arena-gold' : 'bg-primary') : 'bg-muted-foreground/20'
            )}
          />
          <span className="text-xs truncate">
            {resolveWarriorName(gameState, bout.warriorIdA, 'Unknown')}
          </span>
          {isBye && <StepForward className="h-3 w-3 text-muted-foreground/50" />}
        </div>
        {isAChosen && championship && <Trophy className="h-3 w-3 text-arena-gold animate-pulse" />}
        {isAChosen && !championship && (
          <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />
        )}
      </div>

      {/* VS indicator - hide for byes */}
      {!isBye && (
        <div className="flex justify-center -my-2 relative z-10">
          <div
            className={cn(
              'bg-secondary px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground',
              bronze && 'bg-arena-gold/20 border-arena-gold/30 text-arena-gold'
            )}
          >
            {bronze ? '3RD PLACE' : 'VS'}
          </div>
        </div>
      )}

      {/* Bye indicator */}
      {isBye && (
        <div className="flex justify-center -my-1 relative z-10">
          <div className="bg-muted px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground">
            BYE
          </div>
        </div>
      )}

      {/* Warrior D */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          isBye ? 'Bye' : `Select ${resolveWarriorName(gameState, bout.warriorIdD, 'Unknown')}`
        }
        className={cn(
          'flex items-center justify-between p-2 rounded-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isDChosen
            ? 'bg-primary/10 text-primary font-bold shadow-inner'
            : isAChosen
              ? 'opacity-30 grayscale'
              : 'bg-background/40',
          isBye && 'opacity-50 italic text-muted-foreground'
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <div
            className={cn(
              'w-1 h-4 rounded-full',
              isDChosen ? (championship ? 'bg-arena-gold' : 'bg-primary') : 'bg-muted-foreground/20'
            )}
          />
          <span className="text-xs truncate">
            {isBye ? '(bye)' : resolveWarriorName(gameState, bout.warriorIdD, 'Unknown')}
          </span>
        </div>
        {isDChosen && championship && <Trophy className="h-3 w-3 text-arena-gold animate-pulse" />}
        {isDChosen && !championship && (
          <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />
        )}
      </div>
    </div>
  );
}
