import { Calendar, Clock, Hexagon, PartyPopper } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WeatherBadge } from './WeatherBadge';
import { SeasonProgressBar } from './SeasonProgressBar';
import { SeasonPhaseTicks } from './SeasonPhaseTicks';

/**
 *
 */
export function SeasonWidget() {
  const state = useGameStore(
    useShallow((s) => ({
      week: s.week,
      season: s.season,
      newsletter: s.newsletter,
      weather: s.weather,
    }))
  );
  const week = ((state.week - 1) % 13) + 1;
  const season = state.season;

  const progress = (week / 13) * 100;

  const phase = week <= 4 ? 'Opening Rounds' : week <= 9 ? 'Mid Season' : 'Championship Run';
  const phaseDesc =
    week <= 4
      ? 'Early season scouting and roster preparation.'
      : week <= 9
        ? 'Intense rivalries and divisional combat heat up.'
        : 'Final bouts and championship glory await.';

  const isOffseason = week === 1;
  const latestOffseasonEvent = state.newsletter
    ?.filter(
      (item) =>
        item.week === state.week &&
        ['Festival of Blades', 'A Bitter Winter', "Wandering Merchant's Favor"].includes(item.title)
    )
    .pop();

  const weather = state.weather || 'Clear';

  return (
    <Surface variant="glass" className="h-full border-border/10 group overflow-hidden relative p-0">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Calendar className="h-12 w-12" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-[0.2em] text-carved">
              Season Chronicle
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Arena Calendar // WK {week.toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mb-1">
                CURRENT SEASON
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-black text-foreground uppercase tracking-tighter">
                  {season}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono font-black border-primary/20 bg-primary/10 text-primary uppercase tracking-widest"
                >
                  ACTIVE
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mb-1">
                WEEK
              </span>
              <div className="text-xl font-mono font-black text-foreground/80">{week} / 13</div>
            </div>
          </div>

          {isOffseason && latestOffseasonEvent && (
            <div className="flex items-center gap-3 p-3 bg-arena-gold/10 border border-arena-gold/20 rounded-none animate-in fade-in slide-in-from-top-2 duration-700">
              <PartyPopper className="h-5 w-5 text-arena-gold" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
                  {latestOffseasonEvent.title}
                </span>
                <span className="text-[9px] font-medium text-arena-gold/70 leading-tight">
                  {latestOffseasonEvent.items?.[0] ?? ''}
                </span>
              </div>
            </div>
          )}

          <SeasonProgressBar progress={progress} />

          <SeasonPhaseTicks currentWeek={week} className="mt-6 pt-1" />

          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-1 cursor-help group/stat">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 group-hover/stat:text-primary transition-colors">
                    Season Phase
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                    <Hexagon className="h-2.5 w-2.5 text-primary opacity-60" /> {phase}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest w-full max-w-52">
                {phaseDesc}
              </TooltipContent>
            </Tooltip>

            <div className="flex flex-col gap-1 items-end text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                Weather Condition
              </span>
              <WeatherBadge weather={weather} />
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
