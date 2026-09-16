import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Info, Cloud } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getWeatherConfig } from '@/constants/arena/weather';
import { WEATHER_STATS } from '@/constants/arena/weatherStats';
import type { WeatherType } from '@/types/shared.types';

/**
 * Weather widget.
 */
export function WeatherWidget() {
  const state = useGameStore(
    useShallow((s) => ({
      weather: s.weather,
    }))
  );
  const weather = state.weather || 'Clear';
  const config = getWeatherConfig(weather);
  const Icon = config.icon;

  return (
    <Surface
      variant="glass"
      className="h-full flex flex-col p-5 border-l-4 border-l-primary animate-in motion-reduce:animate-none fade-in zoom-in-95 duration-500 delay-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            Arena Environment
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] font-black tracking-widest uppercase',
            config.borderClass,
            config.bgClass,
            config.colorClass
          )}
        >
          {weather}
        </Badge>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Icon
          className={cn(
            'h-10 w-10 drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]',
            config.colorClass
          )}
        />
        <div className="text-right">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">
            Conditions
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight w-full max-w-36 border-r-2 border-primary/20 pr-3">
            {config.description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-none border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all motion-reduce:transition-none motion-reduce:transform-none hover:bg-white/[0.05] hover:border-white/10 flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">
                  Combat Modifiers
                </span>
                <Info className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/10 p-3 w-full max-w-xs">
              <p className="text-[10px] font-mono leading-relaxed text-primary/80 uppercase tracking-wider">
                {WEATHER_STATS[weather as WeatherType] || ''}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Surface>
  );
}
