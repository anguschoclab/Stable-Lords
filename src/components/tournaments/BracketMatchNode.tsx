import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronUp, ChevronDown, Medal, Crown, StepForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import BoutViewer from '@/components/BoutViewer';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/button';
import { resolveWarriorName } from '@/utils/historyResolver';
import type { TournamentBout, FightSummary } from '@/types/game';

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

function isBronzeMatch(bout: TournamentBout): boolean {
  return bout.round === 6 && bout.matchIndex === 1;
}

function isChampionshipFinal(bout: TournamentBout, totalRounds: number): boolean {
  return bout.round === totalRounds && bout.round >= 6;
}

const MIN_DISTANCE = 20;

export function BracketMatchNode({
  bout,
  boutKey,
  isExpanded,
  onToggleExpand,
  fightSummary,
  rIdx,
  bIdx,
  totalRounds,
  gameState,
}: BracketMatchNodeProps) {
  const hasTranscript = fightSummary?.transcript && fightSummary.transcript.length > 0;
  const isAChosen = bout.winner === 'A';
  const isDChosen = bout.winner === 'D';
  const isPending = bout.winner === undefined;
  const isBye = bout.d === '(bye)' || bout.warriorIdD === 'bye';
  const bronze = isBronzeMatch(bout);
  const championship = isChampionshipFinal(bout, totalRounds);

  return (
    <div className={cn('relative group', bronze && 'opacity-90')}>
      {/* Connection lines to previous round */}
      {rIdx > 0 && !isBye && (
        <svg
          className={cn(
            'absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none fill-none overflow-visible',
            isPending ? 'stroke-border/10' : 'stroke-primary/30',
            bronze && 'stroke-amber-500/30'
          )}
        >
          <path d="M 0 -12 L 24 -12 L 24 0 L 48 0" className="stroke-1" />
          <path d="M 0 12 L 24 12 L 24 0 L 48 0" className="stroke-1" />
        </svg>
      )}
      {/* Simple line for byes */}
      {rIdx > 0 && isBye && (
        <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-8 pointer-events-none stroke-border/10 fill-none overflow-visible">
          <path d="M 0 0 L 48 0" className="stroke-1" />
        </svg>
      )}

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
        <div
          className={cn(
            'px-3 py-1 border-b border-border/20 flex items-center justify-between bg-secondary/20',
            bronze && 'bg-arena-gold/10 border-arena-gold/20',
            championship && !isPending && 'bg-arena-gold/20 border-arena-gold/30'
          )}
        >
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest uppercase">
              {bronze
                ? 'BRONZE'
                : championship
                  ? 'FINAL'
                  : `MATCH ${bout.matchIndex + 1}`}
            </span>
            {bronze && <Medal className="h-3 w-3 text-arena-gold" />}
            {championship && !isPending && (
              <Crown className="h-3 w-3 text-arena-gold" />
            )}
          </div>
          {isPending ? (
            isBye ? (
              <Badge className="h-3 px-1.5 text-[7px] bg-stone-500/20 text-stone-400 border-none">
                BYE
              </Badge>
            ) : (
              <Badge className="h-3 px-1.5 text-[7px] bg-stone-500/20 text-stone-400 border-none">
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

        <div className="p-3 space-y-1">
          {/* Warrior A */}
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded-none transition-colors',
              isAChosen
                ? 'bg-primary/10 text-primary font-bold shadow-inner'
                : isDChosen
                  ? 'opacity-30 grayscale'
                  : 'bg-background/40',
              isBye && 'bg-muted/30',
              isAChosen && championship && 'bg-arena-gold/20 text-arena-gold'
            )}
            onClick={() => onToggleExpand(isExpanded ? null : boutKey)}
          >
            <div className="flex items-center gap-2 truncate">
              <div
                className={cn(
                  'w-1 h-4 rounded-full',
                  isAChosen
                    ? championship
                      ? 'bg-arena-gold'
                      : 'bg-primary'
                    : 'bg-muted-foreground/20'
                )}
              />
              <span className="text-xs truncate">
                {resolveWarriorName(gameState, bout.warriorIdA, bout.a)}
              </span>
              {isBye && <StepForward className="h-3 w-3 text-muted-foreground/50" />}
            </div>
            {isAChosen && championship && (
              <Crown className="h-3 w-3 text-arena-gold animate-pulse" />
            )}
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
            className={cn(
              'flex items-center justify-between p-2 rounded-none transition-colors',
              isDChosen
                ? 'bg-primary/10 text-primary font-bold shadow-inner'
                : isAChosen
                  ? 'opacity-30 grayscale'
                  : 'bg-background/40',
              isBye && 'opacity-50 italic text-muted-foreground'
            )}
            onClick={() => onToggleExpand(isExpanded ? null : boutKey)}
          >
            <div className="flex items-center gap-2 truncate">
              <div
                className={cn(
                  'w-1 h-4 rounded-full',
                  isDChosen
                    ? championship
                      ? 'bg-arena-gold'
                      : 'bg-primary'
                    : 'bg-muted-foreground/20'
                )}
              />
              <span className="text-xs truncate">
                {isBye ? '(bye)' : resolveWarriorName(gameState, bout.warriorIdD, bout.d)}
              </span>
            </div>
            {isDChosen && championship && (
              <Crown className="h-3 w-3 text-arena-gold animate-pulse" />
            )}
            {isDChosen && !championship && (
              <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />
            )}
          </div>
        </div>

        {hasTranscript && (
          <button
            aria-label={
              isExpanded ? 'Collapse Engagement Log' : 'Expand Engagement Log'
            }
            onClick={() => onToggleExpand(isExpanded ? null : boutKey)}
            className="w-full py-1.5 px-3 border-t border-border/10 flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors group"
          >
            <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary">
              Engagement Log
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3 text-primary animate-pulse" />
            )}
          </button>
        )}
      </div>

      {isExpanded && hasTranscript && fightSummary && (
        <div className="absolute top-0 left-full ml-4 z-50 w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-300">
          <Surface
            variant="glass"
            padding="none"
            className="border-primary/50 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-secondary/40 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate max-w-[80%]">
                Archive: {resolveWarriorName(gameState, bout.warriorIdA, bout.a)} vs{' '}
                {resolveWarriorName(gameState, bout.warriorIdD, bout.d)}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase border-white/10"
              >
                {fightSummary.by || '???'}
              </Badge>
            </div>
            <div className="p-0 max-h-[500px] overflow-y-auto thin-scrollbar bg-background/60">
              <BoutViewer
                nameA={resolveWarriorName(
                  gameState,
                  fightSummary.warriorIdA,
                  fightSummary.a
                )}
                nameD={resolveWarriorName(
                  gameState,
                  fightSummary.warriorIdD,
                  fightSummary.d
                )}
                styleA={fightSummary.styleA || ''}
                styleD={fightSummary.styleD || ''}
                log={(fightSummary.transcript || []).map((text, idx) => ({
                  minute: idx + 1,
                  text,
                }))}
                winner={fightSummary.winner}
                by={fightSummary.by ?? null}
                isRivalry={fightSummary.isRivalry}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-none border-t border-white/5 h-10 text-[9px] font-black uppercase tracking-widest hover:bg-primary/5"
              onClick={() => onToggleExpand(null)}
            >
              Deactivate Archive
            </Button>
          </Surface>
        </div>
      )}
    </div>
  );
}
