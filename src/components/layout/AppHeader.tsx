import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Swords,
  RotateCcw,
  LogOut,
  Save,
  Activity,
  Volume2,
  VolumeX,
  Coins,
  Crown,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  Flame,
  Wind,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Factory,
  Droplets,
  Sparkles,
  Moon,
  Circle,
  Waves,
  CloudSun,
} from 'lucide-react';
import { audioManager } from '@/lib/AudioManager';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MOOD_ICONS } from '@/engine/crowdMood';
import { getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileNav } from '@/components/navigation/MobileNav';
import { ImperialRing } from '@/components/ui/ImperialRing';
import type { WeatherType } from '@/types/state.types';

const WEATHER_ICONS: Record<string, React.ElementType> = {
  Clear: Sun,
  Overcast: CloudSun,
  Rainy: CloudRain,
  Sweltering: Flame,
  Breezy: Wind,
  'Blazing Sun': Sun,
  Gale: CloudLightning,
  'Blood Moon': Moon,
  Eclipse: Circle,
  Sandstorm: Waves,
  Blizzard: CloudSnow,
  'Dense Fog': CloudFog,
  Thunderstorm: CloudLightning,
  Ashfall: Factory,
  'Acid Rain': Droplets,
  'Mana Surge': Sparkles,
};

const WEATHER_COLORS: Record<string, string> = {
  Clear: 'text-arena-gold',
  Overcast: 'text-arena-steel',
  Rainy: 'text-arena-pop',
  Sweltering: 'text-arena-blood',
  Breezy: 'text-primary',
  'Blazing Sun': 'text-destructive',
  Gale: 'text-arena-pop',
  'Blood Moon': 'text-destructive',
  Eclipse: 'text-arena-fame',
  Sandstorm: 'text-arena-gold',
  Blizzard: 'text-arena-pop',
  'Dense Fog': 'text-arena-steel',
  Thunderstorm: 'text-arena-gold',
  Ashfall: 'text-muted-foreground',
  'Acid Rain': 'text-arena-gold',
  'Mana Surge': 'text-arena-fame',
};

interface AppHeaderProps {
  week: number;
  day: number;
  isTournamentWeek: boolean;
  treasury: number;
  fame: number;
  crowdMood: number;
  weather: WeatherType;
  isSimulating: boolean;
  lastSavedAt: string | null;
  onResetPrompt: () => void;
  returnToTitle: () => void;
}/**
  * Render the AppHeader component.
  * @param  - {
  week,
  day,
  is tournament week,
  treasury,
  fame,
  crowd mood,
  weather,
  is simulating,
  last saved at,
  on reset prompt,
  return to title,
}.
  * @returns The result.
  */


/**
 * Render the AppHeader component.
 * @param  - {
  week,
  day,
  is tournament week,
  treasury,
  fame,
  crowd mood,
  weather,
  is simulating,
  last saved at,
  on reset prompt,
  return to title,
}.
 * @returns The result.
 */
export function AppHeader({
  week,
  day,
  isTournamentWeek,
  treasury,
  fame,
  crowdMood,
  weather,
  isSimulating,
  lastSavedAt,
  onResetPrompt,
  returnToTitle,
}: AppHeaderProps) {
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [saveFlash, setSaveFlash] = useState(false);
  const moodIcon = MOOD_ICONS[crowdMood as keyof typeof MOOD_ICONS] ?? '😐';

  const toggleMute = () => {
    const next = !isMuted;
    audioManager.setMuted(next);
    setIsMuted(next);
  };

  useEffect(() => {
    if (!lastSavedAt) return;
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 1500);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  const formatSaveTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#080604]/90 backdrop-blur-2xl z-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0 shadow-2xl">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link
            to="/"
            className="flex items-center gap-4 group active:scale-95 transition-all duration-300"
          >
            <ImperialRing
              size="md"
              variant="blood"
              className="group-hover:rotate-[225deg] transition-all duration-700"
            >
              <Swords className="w-5 h-5" />
            </ImperialRing>
            <div className="flex flex-col">
              <span className="font-display font-black text-base tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
                Stable Lords
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
                Codex Sanguis · v1.0
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden xl:flex items-center gap-1">
          {/* Cycle Status */}
          <div className="flex flex-col px-4 border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
              Temporal Cycle
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xs text-foreground uppercase tracking-tight">
                {isSimulating ? (
                  <span className="animate-pulse opacity-40 italic">Syncing Archive...</span>
                ) : (
                  `Week ${week} · ${isTournamentWeek ? `Day ${day + 1}` : 'Planning Phase'}`
                )}
              </span>
            </div>
          </div>

          {/* Treasury */}
          <div className="flex flex-col px-4 border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
              Registry Balance
            </span>
            <span className="font-mono font-black text-xs text-arena-gold flex items-center gap-1.5">
              {(treasury ?? 0).toLocaleString()} <Coins className="h-3 w-3 opacity-40" />
            </span>
          </div>

          {/* Influence */}
          <div className="flex flex-col px-4 border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
              Total Influence
            </span>
            <span className="font-mono font-black text-xs text-arena-fame flex items-center gap-1.5">
              {fame} <Crown className="h-3 w-3 opacity-40" />
            </span>
          </div>

          {/* Crowd Mood */}
          <div className="flex flex-col px-4 border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
              Arena Favor
            </span>
            <span className="font-mono font-black text-xs text-arena-pop flex items-center gap-1.5">
              {moodIcon} <Activity className="h-3 w-3 opacity-40" />
            </span>
          </div>

          {/* Environmental Status */}
          <div className="flex flex-col px-4 border-l border-white/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
              Environment
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'font-mono font-black text-[10px] flex items-center gap-1.5 px-2 py-0.5 rounded-none border border-white/5 bg-white/5 cursor-help transition-all hover:bg-white/10 uppercase tracking-widest',
                    WEATHER_COLORS[weather] || 'text-arena-pop'
                  )}
                >
                  {(() => {
                    const Icon = WEATHER_ICONS[weather] || Cloud;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {weather || 'Clear'}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-[#0C0806] border-white/10 p-3 max-w-[220px] rounded-none"
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 text-primary">
                  Environmental Record
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  {getWeatherEffect(weather).description}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/command/combat"
          className={cn(
            'flex items-center gap-3 h-10 px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-[0.16,1,0.3,1]',
            isSimulating
              ? 'bg-neutral-900 text-muted-foreground/20 pointer-events-none'
              : 'bg-primary text-primary-foreground shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0'
          )}
        >
          {isSimulating ? (
            <span className="animate-pulse italic">Processing Cycle...</span>
          ) : (
            <>
              {isTournamentWeek ? `EXECUTE DAY ${day + 1}` : `FINALIZE WEEK ${week}`}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Link>
        <Separator orientation="vertical" className="h-6 bg-white/5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none hover:bg-white/5 transition-colors"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              aria-pressed={!isMuted}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-destructive" />
              ) : (
                <Volume2 className="h-4 w-4 text-primary" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
          >
            Toggle Acoustic Signal ({isMuted ? 'Muted' : 'Active'})
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-none transition-all',
                saveFlash ? 'bg-primary/20 text-primary scale-110' : 'hover:bg-white/5'
              )}
              aria-label="Save status"
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
          >
            {lastSavedAt ? `Auto-Saved: ${formatSaveTime(lastSavedAt)}` : 'Registry Idle'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={onResetPrompt}
              aria-label="Reset game"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
          >
            Expunge Ledger (Delete Save)
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 bg-white/5 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
              onClick={returnToTitle}
              disabled={isSimulating}
              aria-label="Exit to title"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
          >
            Exit to Command Center
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
