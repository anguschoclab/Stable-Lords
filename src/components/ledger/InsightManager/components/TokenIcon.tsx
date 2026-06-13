import { Swords, RotateCw, Zap, TrendingUp, Brain, Fingerprint } from 'lucide-react';
import type { InsightTokenType } from '@/types/state.types';

const TOKEN_CFG: Record<
  InsightTokenType,
  { Icon: React.ElementType; color: string; label: string }
> = {
  Weapon: { Icon: Swords, color: 'bg-arena-blood/20 text-arena-blood', label: 'Weapon' },
  Rhythm: { Icon: RotateCw, color: 'bg-arena-pop/20 text-arena-pop', label: 'Rhythm' },
  Style: { Icon: Zap, color: 'bg-arena-gold/20 text-arena-gold', label: 'Style' },
  Attribute: { Icon: TrendingUp, color: 'bg-primary/20 text-primary', label: 'Attribute' },
  Tactic: { Icon: Brain, color: 'bg-arena-fame/20 text-arena-fame', label: 'Tactic' },
  Trait: { Icon: Fingerprint, color: 'bg-accent/20 text-accent', label: 'Trait' },
};

interface TokenIconProps {
  type: InsightTokenType;
}

export function TokenIcon({ type }: TokenIconProps) {
  const cfg = TOKEN_CFG[type] ?? TOKEN_CFG.Weapon;
  const Icon = cfg.Icon;
  return (
    <div className={`p-2 rounded-none ${cfg.color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
