import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Trainer } from '@/types/game';

interface TrainerTierBadgeProps {
  tier: Trainer['tier'];
}

/**
 *
 */
export function TrainerTierBadge({ tier }: TrainerTierBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] font-black border-none uppercase tracking-[0.2em] px-3 py-0.5 h-auto',
        tier === 'Master'
          ? 'bg-arena-gold/20 text-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.1)]'
          : tier === 'Seasoned'
            ? 'bg-primary/20 text-primary'
            : 'bg-secondary/40 text-muted-foreground'
      )}
    >
      {tier}
    </Badge>
  );
}
