import {
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Moon,
  CloudSun,
  Flame,
  CloudLightning,
  Circle,
  Waves,
  CloudSnow,
  CloudFog,
  Factory,
  Droplets,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherType } from '@/types/shared.types';

export interface WeatherConfig {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  extraClass?: string;
  description: string;
}

export const WEATHER_CONFIG: Record<string, WeatherConfig> = {
  Clear: {
    icon: Sun,
    colorClass: 'text-arena-gold',
    bgClass: 'bg-arena-gold/10',
    borderClass: 'border-arena-gold/20',
    description: 'Standard atmospheric conditions.',
  },
  Rainy: {
    icon: CloudRain,
    colorClass: 'text-stone-400',
    bgClass: 'bg-stone-400/10',
    borderClass: 'border-stone-400/20',
    description: 'Poor visibility and slick ground penalize initiative and attack.',
  },
  Overcast: {
    icon: CloudSun,
    colorClass: 'text-arena-steel',
    bgClass: 'bg-arena-steel/10',
    borderClass: 'border-arena-steel/20',
    description: 'Standard atmospheric conditions.',
  },
  Sweltering: {
    icon: Flame,
    colorClass: 'text-arena-blood',
    bgClass: 'bg-arena-blood/10',
    borderClass: 'border-arena-blood/20',
    description: '20% more stamina drain in combat.',
  },
  Breezy: {
    icon: Wind,
    colorClass: 'text-stone-300',
    bgClass: 'bg-stone-300/10',
    borderClass: 'border-stone-300/20',
    description: '10% less stamina drain in combat.',
  },
  'Blazing Sun': {
    icon: Sun,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
    description: '30% more stamina drain in combat.',
  },
  Gale: {
    icon: CloudLightning,
    colorClass: 'text-arena-pop',
    bgClass: 'bg-arena-pop/10',
    borderClass: 'border-arena-pop/20',
    description: 'Fierce winds. 15% more stamina drain in combat.',
  },
  'Blood Moon': {
    icon: Moon,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
    description: 'A crimson moon rises. Fighters are bloodthirsty, vastly increasing lethality.',
  },
  Eclipse: {
    icon: Circle,
    colorClass: 'text-arena-fame',
    bgClass: 'bg-arena-fame/10',
    borderClass: 'border-arena-fame/20',
    description: '20% less stamina drain in combat. Fights are slow and methodical.',
  },
  Sandstorm: {
    icon: Waves,
    colorClass: 'text-arena-gold',
    bgClass: 'bg-arena-gold/10',
    borderClass: 'border-arena-gold/20',
    description: 'Standard atmospheric conditions.',
  },
  Mist: {
    icon: Cloud,
    colorClass: 'text-stone-300',
    bgClass: 'bg-stone-300/10',
    borderClass: 'border-stone-300/20',
    description: 'Reduced visibility makes initial strikes trickier.',
  },
  'Scorching Wind': {
    icon: Wind,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
    description: '30% more stamina drain in combat. Fighters push harder and act rashly.',
  },
  'Spooky Night': {
    icon: Moon,
    colorClass: 'text-arena-fame',
    bgClass: 'bg-arena-fame/10',
    borderClass: 'border-arena-fame/20',
    extraClass: 'glow-neon-purple',
    description: 'An unnatural chill and eerie shadows make fighters nervous and jumpy.',
  },
  Blizzard: {
    icon: CloudSnow,
    colorClass: 'text-arena-pop',
    bgClass: 'bg-arena-pop/10',
    borderClass: 'border-arena-pop/20',
    description: 'Freezing conditions. 25% more stamina drain in combat.',
  },
  'Dense Fog': {
    icon: CloudFog,
    colorClass: 'text-arena-steel',
    bgClass: 'bg-arena-steel/10',
    borderClass: 'border-arena-steel/20',
    description: 'Reduced visibility makes initial strikes trickier.',
  },
  Thunderstorm: {
    icon: CloudLightning,
    colorClass: 'text-arena-gold',
    bgClass: 'bg-arena-gold/10',
    borderClass: 'border-arena-gold/20',
    description: 'Electrical storms. 20% more stamina drain in combat.',
  },
  Ashfall: {
    icon: Factory,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/10',
    borderClass: 'border-border/40',
    description: 'Volcanic ash reduces visibility and irritates eyes.',
  },
  'Acid Rain': {
    icon: Droplets,
    colorClass: 'text-arena-gold',
    bgClass: 'bg-arena-gold/10',
    borderClass: 'border-arena-gold/20',
    description: 'Corrosive rain damages equipment and increases injury risk.',
  },
  'Mana Surge': {
    icon: Sparkles,
    colorClass: 'text-arena-fame',
    bgClass: 'bg-arena-fame/10',
    borderClass: 'border-arena-fame/20',
    description: 'Magical energy surges through the arena, enhancing special abilities.',
  },
};

export function getWeatherConfig(weather: WeatherType | string): WeatherConfig {
  return WEATHER_CONFIG[weather] ?? WEATHER_CONFIG.Clear!;
}
