import { Crown, Star, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { StatBadge, WarriorNameTag } from '@/components/ui/WarriorBadges';
import { StatBattery } from '@/components/ui/StatBattery';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { potentialRating, potentialGrade } from '@/engine/potential';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type FightingStyle } from '@/types/game';
import type { AttributePotential, CareerRecord } from '@/types/warrior.types';
import type { Attributes } from '@/types/shared.types';

interface RosterWarriorRowProps {
  warrior: {
    id: string;
    name: string;
    fame: number;
    style: string;
    champion: boolean;
    potential?: AttributePotential | null;
    attributes: Attributes;
    career: CareerRecord;
    injuries?: any[];
    flair?: any[];
  };
  rankIndex: number;
  onClick: () => void;
}

/**
 *
 */
export function RosterWarriorRow({ warrior, rankIndex, onClick }: RosterWarriorRowProps) {
  const fights = warrior.career.wins + warrior.career.losses;
  const winRate = fights > 0 ? Math.round((warrior.career.wins / fights) * 100) : 0;
  const injuryCount = (warrior.injuries ?? []).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="w-full relative group cursor-pointer"
      aria-label={`View profile for ${warrior.name}`}
    >
      <Surface
        variant="paper"
        padding="none"
        className="flex flex-col md:flex-row items-stretch border border-white/5 bg-neutral-900/60 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
      >
        {/* Ranking Vertical Strip */}
        <div
          className={cn(
            'w-full md:w-20 shrink-0 flex flex-row md:flex-col items-center justify-center p-4 md:p-0 gap-4 border-b md:border-b-0 md:border-r border-white/5 relative',
            rankIndex === 0 ? 'bg-arena-gold/5' : rankIndex === 1 ? 'bg-primary/5' : 'bg-white/2'
          )}
        >
          <div className="absolute top-0 left-0 w-full md:w-1 h-1 md:h-full bg-primary opacity-40 group-hover:opacity-100 transition-all duration-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 md:mb-1">
            RANK
          </span>
          <span
            className={cn(
              'text-4xl font-display font-black tracking-tighter leading-none',
              rankIndex === 0
                ? 'text-arena-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                : rankIndex === 1
                  ? 'text-primary'
                  : 'text-muted-foreground/40'
            )}
          >
            {rankIndex + 1}
          </span>
          {rankIndex === 0 && <Crown className="h-4 w-4 mt-1 text-arena-gold animate-bounce" />}
        </div>

        {/* Main Body */}
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
          {/* Personnel Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <WarriorNameTag
                  id={warrior.id}
                  name={warrior.name}
                  isChampion={warrior.champion}
                  injuryCount={injuryCount}
                  useCrown
                />
                <div className="flex items-center gap-3">
                  <StatBadge styleName={warrior.style as FightingStyle} career={warrior.career} />
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-black border border-white/5 opacity-80 group-hover:border-primary/30 group-hover:opacity-100 transition-all">
                    <Star
                      className={cn(
                        'h-3 w-3',
                        warrior.fame > 1000 ? 'text-arena-gold' : 'text-muted-foreground/60'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-mono font-black',
                        warrior.fame > 1000 ? 'text-arena-gold' : 'text-muted-foreground'
                      )}
                    >
                      {warrior.fame}G
                    </span>
                  </div>
                  {warrior.potential &&
                    (() => {
                      const grade = potentialGrade(potentialRating(warrior.potential));
                      const color =
                        grade === 'S'
                          ? 'text-arena-gold border-arena-gold/40'
                          : grade === 'A'
                            ? 'text-primary border-primary/40'
                            : grade === 'B'
                              ? 'text-primary border-primary/40'
                              : grade === 'C'
                                ? 'text-muted-foreground border-white/10'
                                : 'text-muted-foreground/60 border-white/5';
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded-none bg-black border opacity-80 group-hover:opacity-100 transition-all',
                                color
                              )}
                            >
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                POT
                              </span>
                              <span className="text-[10px] font-mono font-black">{grade}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Potential grade — ceiling for training gains.
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                </div>
              </div>

              <div className="flex items-center gap-6 px-6 py-3 rounded-none bg-black/40 border border-white/5 group-hover:border-primary/10 transition-all">
                <div className="text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">
                    Victory
                  </span>
                  <span className="font-mono font-black text-primary text-sm">{winRate}%</span>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">
                    Kills
                  </span>
                  <span
                    className={cn(
                      'font-mono font-black text-sm',
                      warrior.career.kills > 0 ? 'text-destructive' : 'text-muted-foreground/40'
                    )}
                  >
                    {warrior.career.kills}
                  </span>
                </div>
              </div>
            </div>

            {/* Attribute Matrix Overlay */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {ATTRIBUTE_KEYS.map((k) => {
                const val = warrior.attributes?.[k as keyof typeof warrior.attributes] ?? 0;
                return (
                  <Tooltip key={k}>
                    <TooltipTrigger asChild>
                      <StatBattery
                        label={k}
                        value={val}
                        max={25}
                        colorClass={
                          val >= 20
                            ? 'bg-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.5)] group-hover:animate-pulse'
                            : val >= 15
                              ? 'bg-primary group-hover:animate-pulse'
                              : 'bg-neutral-800'
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                      {ATTRIBUTE_LABELS[k]}: {val} / 25
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Tactical Summary Vertical */}
          <div className="w-full md:w-32 shrink-0 flex flex-col justify-center gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 block">
                  Condition
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Activity
                    className={cn('h-3 w-3', injuryCount > 0 ? 'text-destructive' : 'text-primary')}
                  />
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase tracking-widest',
                      injuryCount > 0 ? 'text-destructive' : 'text-primary'
                    )}
                  >
                    {injuryCount > 0 ? 'Compromised' : 'Nominal'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 group/btn px-4 py-1.5 rounded-none bg-white/5 border border-white/5 hover:border-primary/50 transition-all">
                <span className="text-[9px] font-black uppercase tracking-widest group-hover/btn:text-primary transition-colors">
                  Tactical Report
                </span>
                <ChevronRight className="h-3 w-3 opacity-20 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
