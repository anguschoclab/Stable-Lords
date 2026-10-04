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

/** One warrior slot row — accent bar, name, bye icon, champion trophy. */
function SlotRow(props: {
  label: string;
  isChosen: boolean;
  otherChosen: boolean;
  championship: boolean;
  isBye: boolean;
  /** Class applied to this slot when the bout is a bye. */
  byeClass: string;
  /** Show the step-forward icon (warrior A row only). */
  showByeIcon?: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  const { label, isChosen, otherChosen, championship, isBye } = props;
  const { byeClass, showByeIcon = false, ariaLabel, onClick } = props;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-between p-2 rounded-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none',
        isChosen
          ? 'bg-primary/10 text-primary font-bold shadow-inner'
          : otherChosen
            ? 'opacity-30 grayscale'
            : 'bg-background/40',
        isBye && byeClass,
        isChosen && championship && 'bg-arena-gold/20 text-arena-gold'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-2 truncate">
        <div
          className={cn(
            'w-1 h-4 rounded-full',
            isChosen ? (championship ? 'bg-arena-gold' : 'bg-primary') : 'bg-muted-foreground/20'
          )}
        />
        <span className="text-xs truncate">{label}</span>
        {isBye && showByeIcon && <StepForward className="h-3 w-3 text-muted-foreground/50" />}
      </div>
      {isChosen && championship && (
        <Trophy className="h-3 w-3 text-arena-gold animate-pulse motion-reduce:animate-none" />
      )}
      {isChosen && !championship && (
        <Trophy className="h-3 w-3 animate-bounce motion-reduce:animate-none shadow-glow text-arena-gold" />
      )}
    </div>
  );
}

/**
 *
 */
export function WarriorSlots(props: WarriorSlotsProps) {
  const { bout, boutKey, totalRounds, isAChosen, isDChosen } = props;
  const { isBye, gameState, onToggleExpand, isExpanded } = props;
  const bronze = isBronzeMatch(bout, totalRounds);
  const championship = isChampionshipFinal(bout, totalRounds);

  const handleClick = () => onToggleExpand(isExpanded ? null : boutKey);

  return (
    <div className="p-3 space-y-1">
      <SlotRow
        label={resolveWarriorName(gameState, bout.warriorIdA, 'Unknown')}
        ariaLabel={`Select ${resolveWarriorName(gameState, bout.warriorIdA, 'Unknown')}`}
        isChosen={isAChosen}
        otherChosen={isDChosen}
        championship={championship}
        isBye={isBye}
        byeClass="bg-muted/30"
        showByeIcon
        onClick={handleClick}
      />

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

      <SlotRow
        label={isBye ? '(bye)' : resolveWarriorName(gameState, bout.warriorIdD, 'Unknown')}
        ariaLabel={
          isBye ? 'Bye' : `Select ${resolveWarriorName(gameState, bout.warriorIdD, 'Unknown')}`
        }
        isChosen={isDChosen}
        otherChosen={isAChosen}
        championship={championship}
        isBye={isBye}
        byeClass="opacity-50 italic text-muted-foreground"
        onClick={handleClick}
      />
    </div>
  );
}
