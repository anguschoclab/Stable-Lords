import { Skull, Zap } from 'lucide-react';
import type { FightOutcomeBy } from '@/types/game';

interface OutcomeIconProps {
  by: FightOutcomeBy;
}

/**
 *
 */
export function OutcomeIcon({ by }: OutcomeIconProps) {
  if (by === 'Kill') return <Skull className="h-4 w-4 text-destructive animate-pulse" />;
  if (by === 'KO') return <Zap className="h-4 w-4 text-arena-gold" />;
  return null;
}
