import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { useReputationState } from '@/state/selectors';
import { computeStableReputation } from '@/engine/stable/stableReputation';
import { Star, Skull, Shield, Zap } from 'lucide-react';

type Rep = ReturnType<typeof computeStableReputation>;

const DIMS: {
  key: keyof Rep;
  label: string;
  color: string;
  bar: string;
  icon: React.ElementType;
  desc: string;
  effect: string;
}[] = [
  {
    key: 'fame',
    label: 'Fame',
    color: 'text-arena-gold',
    bar: 'bg-arena-gold',
    icon: Star,
    desc: 'Public acclaim from victories and showmanship.',
    effect: 'Attracts better promoter offers and higher purses.',
  },
  {
    key: 'notoriety',
    label: 'Notoriety',
    color: 'text-destructive',
    bar: 'bg-destructive',
    icon: Skull,
    desc: 'Feared reputation built on kills and ruthlessness.',
    effect: 'Rivals think twice before accepting your bouts.',
  },
  {
    key: 'honor',
    label: 'Honor',
    color: 'text-primary',
    bar: 'bg-primary',
    icon: Shield,
    desc: 'Moral standing and respect from the arena elite.',
    effect: 'Unlocks Honorable promoter preference and trainer discounts.',
  },
  {
    key: 'adaptability',
    label: 'Adaptability',
    color: 'text-arena-pop',
    bar: 'bg-arena-pop',
    icon: Zap,
    desc: 'How well your stable adapts to the shifting combat meta.',
    effect: 'Earns higher hype bonuses in style-clash matchups.',
  },
];

/** One reputation dimension card: value, meter, description, effect. */
function ReputationCard({
  dim,
  val,
}: {
  dim: (typeof DIMS)[number];
  val: number;
}) {
  const Icon = dim.icon;
  return (
    <Surface variant="glass" className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', dim.color)} />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {dim.label}
        </span>
      </div>
      <div
        className={cn('font-display font-black text-4xl tracking-tighter leading-none', dim.color)}
      >
        {val}
        <span className="text-lg text-muted-foreground/30 ml-1">/100</span>
      </div>
      <div className="h-1 bg-white/5 rounded-none overflow-hidden">
        <div
          className={cn(
            'h-full rounded-none transition-all motion-reduce:transition-none',
            dim.bar
          )}
          style={{ width: `${val}%` }}
        />
      </div>
      <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{dim.desc}</p>
      <p className="text-[9px] text-muted-foreground/55 italic leading-relaxed">{dim.effect}</p>
    </Surface>
  );
}

/**
 *
 */
export function ReputationTab() {
  const worldState = useReputationState();
  const rep = useMemo(() => computeStableReputation(worldState), [worldState]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {DIMS.map((dim) => (
        <ReputationCard key={dim.key} dim={dim} val={rep[dim.key] as number} />
      ))}
    </div>
  );
}
