import { useWorldState } from '@/state/useGameStore';
import { Cloud, Sun, CloudRain, ThermometerSun, Wind, Info, Moon, Sparkles, Flame } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const WEATHER_METADATA = {
  Clear: {
    icon: Sun,
    color: 'text-arena-gold',
    bg: 'bg-arena-gold/10',
    border: 'border-arena-gold/20',
    description: 'Optimal conditions. No environmental modifiers applied to combat resolution.',
    stats: 'NORMAL VISIBILITY // ZERO DRAIN',
  },
  Overcast: {
    icon: Cloud,
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    description: 'Cloudy skies. Slight reduction in precision for ranged and lunging attacks.',
    stats: 'LOW VISIBILITY // STABLE ENDURANCE',
  },
  Rainy: {
    icon: CloudRain,
    color: 'text-stone-400',
    bg: 'bg-stone-400/10',
    border: 'border-stone-400/20',
    description:
      'Driving rain. Significant penalties to precision and initiative. Footing is uncertain.',
    stats: 'PRECISION PENALTY 15% // INITIATIVE -10',
  },
  Gale: {
    icon: Wind,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    description: 'Fierce winds. Substantial penalty to stamina.',
    stats: 'STAMINA DRAIN 115%',
  },
  Tornado: {
    icon: Wind,
    color: 'text-arena-blood',
    bg: 'bg-arena-blood/10',
    border: 'border-arena-blood/20',
    description: 'Violent swirling winds. Severe penalty to coordination and stamina.',
    stats: 'STAMINA DRAIN 140% // SEVERE INITIATIVE PENALTY',
  },
  Sweltering: {
    icon: ThermometerSun,
    color: 'text-arena-blood',
    bg: 'bg-arena-blood/10',
    border: 'border-arena-blood/20',
    description:
      'Oppressive heat. Endurance consumption is doubled. High-constitution warriors favored.',
    stats: 'ENDURANCE DRAIN 200% // FATIGUE ACCEL',
  },
  Breezy: {
    icon: Wind,
    color: 'text-stone-300',
    bg: 'bg-stone-300/10',
    border: 'border-stone-300/20',
    description: 'Strong shifting winds. Erratic initiative modifiers and slight energy drain.',
    stats: 'INITIATIVE FLUX // STAMINA DRAIN 120%',
  },
  Eclipse: {
    icon: Moon,
    color: 'text-arena-fame',
    bg: 'bg-arena-fame/10',
    border: 'border-arena-fame/20',
    description:
      'Eerie darkness descends. Fights become slow and methodical as combatants hesitate.',
    stats: 'STAMINA CONSERVATION 20% // HESITATION',
  },
  'Meteor Shower': {
    icon: Sparkles,
    color: 'text-arena-gold',
    bg: 'bg-arena-gold/10',
    border: 'border-arena-gold/20',
    description:
      'Falling stars light up the sky. The chaotic spectacle distracts fighters and exhausts stamina.',
    stats: 'INITIATIVE & RIPOSTE PENALTY -3 // STAMINA DRAIN 120%',
  },
  'Solar Flare': {
    icon: Flame,
    color: 'text-arena-blood',
    bg: 'bg-arena-blood/10',
    border: 'border-arena-blood/20',
    description:
      'A blinding flash of light bakes the arena, draining stamina aggressively while giving eager attackers a burst of destructive energy.',
    stats: 'STAMINA DRAIN 150% // DAMAGE +25%',
  },
  'Abyssal Gloom': {
    icon: Moon,
    color: 'text-indigo-900',
    bg: 'bg-indigo-900/10',
    border: 'border-indigo-900/20',
    description:
      'Impenetrable darkness. Drastic penalties to initiative, but strikes from the shadows are lethal.',
    stats: 'INITIATIVE -5 // RIPOSTE +5 // DAMAGE 115%',
  },
  'Cursed Miasma': {
    icon: Cloud,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-600/10',
    border: 'border-fuchsia-600/20',
    description: 'A vile purple mist clings to the arena, draining stamina and clouding the mind.',
    stats: 'INITIATIVE & RIPOSTE PENALTY // STAMINA DRAIN 130%',
  },
  Hailstorm: {
    icon: CloudRain,
    color: 'text-cyan-300',
    bg: 'bg-cyan-300/10',
    border: 'border-cyan-300/20',
    description: 'Pummeling hail batters the fighters, hurting momentum and stamina.',
    stats: 'INITIATIVE -4 // RIPOSTE -2 // DAMAGE 95% // STAMINA DRAIN 120%',
  },
  'Arcane Storm': {
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    description: 'Raw magic warps reality, supercharging strikes and quickening reflexes.',
    stats: 'INITIATIVE +8 // RIPOSTE +5 // DAMAGE 140% // STAMINA CONSERVATION 20%',
  },
  'Blood Rain': {
    icon: CloudRain,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    description: 'Red rain slickens the sand. Violence feels inevitable.',
    stats: 'INITIATIVE -2 // RIPOSTE +2 // DAMAGE 120% // STAMINA DRAIN 110%',
  },
};/**
   * Weather widget.
   * @returns The result.
   */


/**
 * Weather widget.
 * @returns The result.
 */
export function WeatherWidget() {
  const state = useWorldState();
  const weather = state.weather || 'Clear';
  const meta = WEATHER_METADATA[weather as keyof typeof WEATHER_METADATA] || WEATHER_METADATA.Clear;
  const Icon = meta.icon;

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
            meta.border,
            meta.bg,
            meta.color
          )}
        >
          {weather}
        </Badge>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Icon
          className={cn(
            'h-10 w-10 drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]',
            meta.color
          )}
        />
        <div className="text-right">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">
            Atmospheric Data
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight w-full max-w-36 border-r-2 border-primary/20 pr-3">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-none border border-white/5 p-2 bg-white/[0.02] cursor-help transition-all hover:bg-white/[0.05] hover:border-white/10 flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">
                  Active Modifiers
                </span>
                <Info className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/10 p-3 w-full max-w-xs">
              <p className="text-[10px] font-mono leading-relaxed text-primary/80 uppercase tracking-wider">
                {meta.stats}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Surface>
  );
}
