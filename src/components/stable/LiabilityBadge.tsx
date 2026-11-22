import { TooltipBadge } from '@/components/ui/TooltipBadge';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { computeWarriorLiability } from '@/engine/warrior/warriorValue';
import type { Warrior } from '@/types/warrior.types';

interface LiabilityBadgeProps {
  warrior: Warrior;
}

/** "Watch / consider releasing" badge on underperforming warriors. */
export function LiabilityBadge({ warrior }: LiabilityBadgeProps) {
  const liab = computeWarriorLiability(warrior);
  if (liab.recommendation === 'Keep') return null;

  const label = liab.recommendation === 'Release' ? 'Consider releasing' : 'Watch';
  const color =
    liab.recommendation === 'Release'
      ? 'text-arena-gold border-arena-gold/40'
      : 'text-muted-foreground border-white/10';

  return (
    <TooltipBadge
      color={color}
      tooltip={liab.factors.map((f) => (
        <div key={f.name} className="text-[9px] font-mono">
          {f.name}: {f.weight > 0 ? '+' : ''}
          {f.weight}
        </div>
      ))}
    >
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </TooltipBadge>
  );
}
