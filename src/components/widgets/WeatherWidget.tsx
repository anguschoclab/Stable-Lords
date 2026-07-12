import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Info, Cloud } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getWeatherConfig } from '@/constants/arena/weather';
import type { WeatherType } from '@/types/shared.types';

export const WEATHER_STATS: Record<WeatherType, string> = {
  Zephyr: 'STAMINA CONSERVATION 15% | INITIATIVE +2',
  'Wild Magic': 'UNPREDICTABLE SURGES | DAMAGE +10%',
  Clear: 'NORMAL VISIBILITY | ZERO DRAIN',
  'Eldritch Eclipse': 'STAMINA DRAIN 95% | INITIATIVE +2 | RIPOSTE +2 | DAMAGE +20%',
  'Moonlight Duel': 'STAMINA DRAIN 110% | INITIATIVE +1',
  'Crimson Snow': 'STAMINA DRAIN 140% | INITIATIVE -3 | RIPOSTE +2 | DAMAGE +15%',
  Overcast: 'LOW VISIBILITY | STABLE ENDURANCE',
  Rainy: 'INITIATIVE -3 | RIPOSTE +5 | DAMAGE -10%',
  Sweltering: 'STAMINA DRAIN 130%',
  Breezy: 'STAMINA CONSERVATION 10% | INITIATIVE +2',
  'Blazing Sun': 'STAMINA DRAIN 140% | INITIATIVE -2 | DAMAGE +10%',
  Gale: 'STAMINA DRAIN 120% | INITIATIVE -5 | RIPOSTE +3',
  'Blood Moon': 'STAMINA CONSERVATION 10% | INITIATIVE +3 | DAMAGE +20%',
  Eclipse: 'STAMINA CONSERVATION 20% | INITIATIVE +5 | RIPOSTE +5',
  Sandstorm: 'STAMINA DRAIN 120% | INITIATIVE -4',
  Tornado: 'STAMINA DRAIN 140% | INITIATIVE -6 | DAMAGE -20%',
  Blizzard: 'STAMINA DRAIN 150% | INITIATIVE -4 | DAMAGE -20%',
  'Dense Fog': 'INITIATIVE -8 | RIPOSTE +12 | DAMAGE +10%',
  Mist: 'INITIATIVE -2 | RIPOSTE +2',
  'Glittering Frost': 'STAMINA DRAIN 110% | INITIATIVE -2 | DAMAGE +10%',
  Thunderstorm: 'STAMINA DRAIN 120% | INITIATIVE -2 | DAMAGE +25%',
  Ashfall: 'STAMINA DRAIN 140% | INITIATIVE -3',
  'Acid Rain': 'STAMINA DRAIN 130% | RIPOSTE -6 | DAMAGE +20%',
  'Mana Surge': 'STAMINA CONSERVATION 30% | INITIATIVE +10 | RIPOSTE +10 | DAMAGE +50%',
  'Astral Dust': 'STAMINA DRAIN 120% | INITIATIVE +3 | DAMAGE -10%',
  'Scorching Wind': 'STAMINA DRAIN 130% | INITIATIVE +1',
  'Spooky Night': 'STAMINA DRAIN 110% | INITIATIVE -2 | RIPOSTE -2',
  'Meteor Shower': 'INITIATIVE -3 | RIPOSTE -3 | DAMAGE +15%',
  'Solar Flare': 'STAMINA DRAIN 150% | DAMAGE +25%',
  'Abyssal Gloom': 'INITIATIVE -5 | RIPOSTE +5 | DAMAGE +15%',
  'Cursed Miasma': 'STAMINA DRAIN 130% | INITIATIVE -4 | RIPOSTE -2',
  Hailstorm: 'INITIATIVE -4 | RIPOSTE -2 | DAMAGE -5%',
  'Arcane Storm': 'STAMINA CONSERVATION 20% | INITIATIVE +8 | RIPOSTE +5 | DAMAGE +40%',
  'Blood Rain': 'INITIATIVE -2 | RIPOSTE +2 | DAMAGE +20%',
  'Locust Swarm': 'INITIATIVE -3 | DAMAGE -10% | STAMINA DRAIN 120%',
  'Aurora Borealis': 'STAMINA CONSERVATION 15% | INITIATIVE +2',
  'Chaotic Winds': 'INITIATIVE -4 | RIPOSTE +3 | DAMAGE -15% | STAMINA DRAIN 130%',
  'Aether Storm': 'STAMINA CONSERVATION 20% | INITIATIVE +8 | RIPOSTE +3 | DAMAGE +30%',
  Mirage: 'INITIATIVE -5 | RIPOSTE -2 | DAMAGE -10%',
  Rainbow: 'STAMINA CONSERVATION 10% | INITIATIVE +1',
  'Ember Rain': 'STAMINA DRAIN 120% | INITIATIVE -3',
  'Wildfire Smoke': 'STAMINA DRAIN 135% | INITIATIVE -4 | RIPOSTE +2 | DAMAGE -10%',
  'Gravity Anomaly': 'STAMINA CONSERVATION 10% | INITIATIVE -3 | RIPOSTE +5 | DAMAGE +20%',
  'Blood Fog': 'INITIATIVE -6 | RIPOSTE +6 | DAMAGE +25% | STAMINA DRAIN 110%',
  'Shimmering Heat': 'STAMINA DRAIN 120% | INITIATIVE -2',
  'Crystal Rain': 'INITIATIVE -3 | DAMAGE +20% | STAMINA DRAIN 110%',
  'Rain of Frogs': 'INITIATIVE -4 | RIPOSTE -2 | DAMAGE -10% | STAMINA DRAIN 110%',
  'Chaos Storm': 'STAMINA DRAIN 125% | INITIATIVE -5 | RIPOSTE +10 | DAMAGE +50%',
  'Whispering Winds': 'INITIATIVE -1 | RIPOSTE +2 | DAMAGE -5%',
  'Chaos Squall': 'STAMINA DRAIN 115% | INITIATIVE +3 | RIPOSTE -2 | DAMAGE +10%',
}; /**
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
      className="h-full flex flex-col p-5 border-l-4 border-l-primary animate-in fade-in zoom-in-95 duration-500 delay-100"
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
              <div className="rounded-none border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all hover:bg-white/[0.05] hover:border-white/10 flex items-center justify-between">
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
