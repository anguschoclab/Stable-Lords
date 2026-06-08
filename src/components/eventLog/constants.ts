import {
  Swords,
  Skull,
  UserPlus,
  Trophy,
  Newspaper,
  AlertTriangle,
  Star,
  Dumbbell,
  Heart,
  Sparkles,
} from 'lucide-react';
import type { EventType } from '@/types/eventLog';

export const EVENT_ICONS: Record<EventType, { icon: React.ElementType; color: string }> = {
  fight: { icon: Swords, color: 'text-primary' },
  kill: { icon: Skull, color: 'text-arena-blood' },
  death: { icon: Skull, color: 'text-destructive' },
  recruit: { icon: UserPlus, color: 'text-arena-pop' },
  tournament: { icon: Trophy, color: 'text-arena-gold' },
  news: { icon: Newspaper, color: 'text-muted-foreground' },
  event: { icon: Sparkles, color: 'text-arena-gold' },
  injury: { icon: AlertTriangle, color: 'text-arena-gold' },
  retirement: { icon: Star, color: 'text-arena-fame' },
  training: { icon: Dumbbell, color: 'text-primary' },
  recovery: { icon: Heart, color: 'text-arena-pop' },
};
