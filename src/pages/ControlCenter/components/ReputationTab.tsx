import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { useReputationState } from '@/state/selectors';
import { computeStableReputation } from '@/engine/stableReputation';
import { Star, Skull, Shield, Zap } from 'lucide-react';

/**
 *
 */
export function ReputationTab() {
  const worldState = useReputationState();
  const rep = useMemo(() => computeStableReputation(worldState), [worldState]);

  const dims: {
    key: keyof typeof rep;
    label: string;
    color: string;
    icon: React.ElementType;
    desc: string;
    effect: string;
  }[] = [
    {
      key: 'fame',
      label: 'Fame',
      color: 'text-arena-gold',
      icon: Star,
      desc: 'Public acclaim from victories and showmanship.',
      effect: 'Attracts better promoter offers and higher purses.',
    },
    {
      key: 'notoriety',
      label: 'Notoriety',
      color: 'text-destructive',
      icon: Skull,
      desc: 'Feared reputation built on kills and ruthlessness.',
      effect: 'Rivals think twice before accepting your bouts.',
    },
    {
      key: 'honor',
      label: 'Honor',
      color: 'text-primary',
      icon: Shield,
      desc: 'Moral standing and respect from the arena elite.',
      effect: 'Unlocks Honorable promoter preference and trainer discounts.',
    },
    {
      key: 'adaptability',
      label: 'Adaptability',
      color: 'text-arena-pop',
      icon: Zap,
      desc: 'How well your stable adapts to the shifting combat meta.',
      effect: 'Earns higher hype bonuses in style-clash matchups.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {dims.map(({ key, label, color, icon: Icon, desc, effect }) => {
        const val = rep[key] as number;
        return (
          <Surface key={key} variant="glass" className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {label}
              </span>
            </div>
            <div
              className={cn(
                'font-display font-black text-4xl tracking-tighter leading-none',
                color
              )}
            >
              {val}
              <span className="text-lg text-muted-foreground/30 ml-1">/100</span>
            </div>
            <div className="h-1 bg-white/5 rounded-none overflow-hidden">
              <div
                className={cn('h-full rounded-none transition-all', color.replace('text-', 'bg-'))}
                style={{ width: `${val}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{desc}</p>
            <p className="text-[9px] text-muted-foreground/55 italic leading-relaxed">{effect}</p>
          </Surface>
        );
      })}
    </div>
  );
}
