import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES, type FightingStyle } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/ui/WarriorBadges';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Timer, Trophy, Swords } from 'lucide-react';

interface BoutHeaderProps {
  nameA: string;
  nameD: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  winner: 'A' | 'D' | null;
  isRivalry?: boolean;
  minutes: number;
  totalEvents: number;
  visibleCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
}/**
 * Bout header.
 * @param  - {
  name a,
  name d,
  style a,
  style d,
  winner,
  is rivalry,
  minutes,
  total events,
  visible count,
  expanded,
  on toggle expanded,
}.
 * @returns The result.
 */


/**
 * Bout header.
 * @param  - {
  name a,
  name d,
  style a,
  style d,
  winner,
  is rivalry,
  minutes,
  total events,
  visible count,
  expanded,
  on toggle expanded,
}.
 * @returns The result.
 */
export default function BoutHeader({
  nameA,
  nameD,
  styleA,
  styleD,
  winner,
  isRivalry,
  minutes,
  totalEvents,
  visibleCount,
  expanded,
  onToggleExpanded,
}: BoutHeaderProps) {
  return (
    <div className="relative p-8 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative">
        {/* Header Controls */}
        <div className="absolute -top-4 -right-4 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleExpanded}
                className="p-2 rounded-none bg-neutral-900 border border-white/10 text-muted-foreground hover:text-foreground transition-all hover:border-white/30"
                aria-label={expanded ? 'Minimize battle log' : 'Reveal battle log'}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[10px] font-black uppercase tracking-widest">
              {expanded ? 'MINIMIZE LOG' : 'REVEAL INTEL'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between gap-12">
          {/* Asset Alpha */}
          <div className="text-center flex-1 space-y-4">
            <div className="space-y-1">
              <h4 className="text-[9px] font-black tracking-[0.4em] text-primary uppercase opacity-40">
                ASSET ALPHA
              </h4>
              <h3
                className={cn(
                  'font-display font-black uppercase text-2xl tracking-tighter transition-all duration-700',
                  winner === 'A'
                    ? 'text-primary scale-110 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]'
                    : winner === 'D'
                      ? 'text-muted-foreground/30 grayscale'
                      : 'text-foreground'
                )}
              >
                {nameA}
              </h3>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 text-muted-foreground/60 rounded-none px-3"
              >
                {STYLE_DISPLAY_NAMES[styleA] ?? styleA}
              </Badge>
              {winner === 'A' && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary tracking-[0.2em] animate-pulse">
                  <Trophy className="h-3 w-3" /> VICTOR_SYNC
                </div>
              )}
            </div>
          </div>

          {/* Tactical Interlink */}
          <div className="flex flex-col items-center justify-center gap-4 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-arena-gold/20 blur-xl rounded-full animate-pulse" />
              <div className="w-14 h-14 rounded-full border-2 border-white/10 bg-neutral-900 flex items-center justify-center relative z-10 shadow-[inner_0_0_15px_rgba(0,0,0,0.5)]">
                <Swords className="h-6 w-6 text-arena-gold" />
              </div>
            </div>
            {isRivalry && (
              <div className="flex flex-col items-center gap-1">
                <TagBadge
                  tag="BLOOD FEUD"
                  type="injury"
                  className="animate-pulse shadow-[0_0_10px_rgba(var(--destructive-rgb),0.3)]"
                />
                <span className="text-[7px] font-black text-destructive uppercase tracking-widest opacity-40">
                  HIGH HOSTILITY SYNC
                </span>
              </div>
            )}
          </div>

          {/* Asset Beta */}
          <div className="text-center flex-1 space-y-4">
            <div className="space-y-1">
              <h4 className="text-[9px] font-black tracking-[0.4em] text-accent uppercase opacity-40">
                ASSET BETA
              </h4>
              <h3
                className={cn(
                  'font-display font-black uppercase text-2xl tracking-tighter transition-all duration-700',
                  winner === 'D'
                    ? 'text-accent scale-110 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]'
                    : winner === 'A'
                      ? 'text-muted-foreground/30 grayscale'
                      : 'text-foreground'
                )}
              >
                {nameD}
              </h3>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5 text-muted-foreground/60 rounded-none px-3"
              >
                {STYLE_DISPLAY_NAMES[styleD] ?? styleD}
              </Badge>
              {winner === 'D' && (
                <div className="flex items-center gap-2 text-[10px] font-black text-accent tracking-[0.2em] animate-pulse">
                  <Trophy className="h-3 w-3" /> VICTOR_SYNC
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Timer className="h-3 w-3" /> T-MIN 00
            </div>
            <div className="flex items-center gap-2">
              FINAL_RESOLUTION <Timer className="h-3 w-3" /> {minutes.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="relative h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary via-arena-gold to-accent opacity-20"
              style={{ width: `${totalEvents > 0 ? (visibleCount / totalEvents) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-primary to-arena-gold rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
              style={{ width: `${totalEvents > 0 ? (visibleCount / totalEvents) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-0 h-full w-4 bg-white/40 blur-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
