import type { RecruitTier } from '@/engine/recruitment';

export const TIER_CONFIG: Record<
  RecruitTier,
  { border: string; text: string; bg: string; ring: 'bronze' | 'silver' | 'gold' | 'blood' }
> = {
  Common: {
    border: 'border-white/10',
    text: 'text-muted-foreground',
    bg: 'bg-white/5',
    ring: 'bronze',
  },
  Promising: {
    border: 'border-white/20',
    text: 'text-foreground',
    bg: 'bg-white/10',
    ring: 'silver',
  },
  Exceptional: {
    border: 'border-primary/30',
    text: 'text-primary',
    bg: 'bg-primary/5',
    ring: 'blood',
  },
  Prodigy: {
    border: 'border-arena-gold/30',
    text: 'text-arena-gold',
    bg: 'bg-arena-gold/5',
    ring: 'gold',
  },
};
