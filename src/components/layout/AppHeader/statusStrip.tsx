import { cn } from '@/lib/utils';
import { Activity, Coins, Crown } from 'lucide-react';
import { MOOD_ICONS, type CrowdMood } from '@/engine/bout/crowdMood';
import { getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { WeatherType } from '@/types/state.types';
import { getWeatherConfig } from '@/constants/arena/weather';

interface CycleStatusProps {
  week: number;
  day: number;
  isTournamentWeek: boolean;
  isSimulating: boolean;
}

function CycleStatus({ week, day, isTournamentWeek, isSimulating }: CycleStatusProps) {
  return (
    <div className="flex flex-col px-4 border-l border-white/5">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
        Week
      </span>
      <div className="flex items-center gap-2">
        <span className="font-display font-black text-xs text-foreground uppercase tracking-tight">
          {isSimulating ? (
            <span className="animate-pulse motion-reduce:animate-none opacity-40 italic">
              Simulating...
            </span>
          ) : (
            `Week ${week} · ${isTournamentWeek ? `Day ${day + 1}` : 'Planning Phase'}`
          )}
        </span>
      </div>
    </div>
  );
}

interface TreasuryDisplayProps {
  treasury: number;
}

function TreasuryDisplay({ treasury }: TreasuryDisplayProps) {
  return (
    <div className="flex flex-col px-4 border-l border-white/5">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
        Gold
      </span>
      <span className="font-mono font-black text-xs text-arena-gold flex items-center gap-1.5">
        {(treasury ?? 0).toLocaleString()} <Coins className="h-3 w-3 opacity-40" />
      </span>
    </div>
  );
}

interface InfluenceDisplayProps {
  fame: number;
}

function InfluenceDisplay({ fame }: InfluenceDisplayProps) {
  return (
    <div className="flex flex-col px-4 border-l border-white/5">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
        Fame
      </span>
      <span className="font-mono font-black text-xs text-arena-fame flex items-center gap-1.5">
        {fame} <Crown className="h-3 w-3 opacity-40" />
      </span>
    </div>
  );
}

interface CrowdMoodDisplayProps {
  crowdMood: CrowdMood;
}

function CrowdMoodDisplay({ crowdMood }: CrowdMoodDisplayProps) {
  const moodIcon = MOOD_ICONS[crowdMood] ?? '😐';
  return (
    <div className="flex flex-col px-4 border-l border-white/5">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
        Crowd Mood
      </span>
      <span className="font-mono font-black text-xs text-arena-pop flex items-center gap-1.5">
        {moodIcon} <Activity className="h-3 w-3 opacity-40" />
      </span>
    </div>
  );
}

interface WeatherDisplayProps {
  weather: WeatherType;
}

function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const config = getWeatherConfig(weather);
  const Icon = config.icon;
  return (
    <div className="flex flex-col px-4 border-l border-white/5">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
        Weather
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'font-mono font-black text-[10px] flex items-center gap-1.5 px-2 py-0.5 rounded-none border border-white/5 bg-white/5 cursor-help transition-all motion-reduce:transition-none motion-reduce:transform-none hover:bg-white/10 uppercase tracking-widest',
              config.colorClass
            )}
          >
            <Icon className="h-3 w-3" />
            {weather || 'Clear'}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-background border-white/10 p-3 max-w-[220px] rounded-none"
        >
          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 text-primary">
            Weather Effect
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            {getWeatherEffect(weather).description}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * Status strip props — the header's readout slice.
 */
interface StatusStripProps {
  week: number;
  day: number;
  isTournamentWeek: boolean;
  isSimulating: boolean;
  treasury: number;
  fame: number;
  crowdMood: CrowdMood;
  weather: WeatherType;
}

/**
 * Status strip.
 */
export function StatusStrip(props: StatusStripProps) {
  return (
    <div className="hidden xl:flex items-center gap-1">
      <CycleStatus
        week={props.week}
        day={props.day}
        isTournamentWeek={props.isTournamentWeek}
        isSimulating={props.isSimulating}
      />
      <TreasuryDisplay treasury={props.treasury} />
      <InfluenceDisplay fame={props.fame} />
      <CrowdMoodDisplay crowdMood={props.crowdMood} />
      <WeatherDisplay weather={props.weather} />
    </div>
  );
}
