import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getWeatherConfig } from '@/constants/weather';
import type { WeatherType } from '@/types/shared.types';

interface WeatherBadgeProps {
  weather: WeatherType | string;
}

/**
 *
 */
export function WeatherBadge({ weather }: WeatherBadgeProps) {
  const config = getWeatherConfig(weather);
  const WeatherIcon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help mt-1">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-mono font-black uppercase tracking-widest gap-1',
              config.bgClass,
              config.borderClass,
              config.colorClass,
              config.extraClass
            )}
          >
            <WeatherIcon className="h-3 w-3" />
            {weather}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest w-full max-w-xs">
        {config.description}
      </TooltipContent>
    </Tooltip>
  );
}
