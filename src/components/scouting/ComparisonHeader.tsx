import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData, Warrior } from '@/types/game';
import { AvatarForEntity } from '@/components/avatar';

type ComparisonHeaderProps =
  | { kind: 'stable'; rivalA: RivalStableData; rivalB: RivalStableData }
  | { kind: 'warrior'; warriorA: Warrior | undefined; warriorB: Warrior | undefined };

function SideColumn({
  label,
  colorClass,
  title,
  children,
}: {
  label: string;
  colorClass: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center flex-1 relative z-10 space-y-4">
      <h4
        className={`text-[10px] font-black tracking-[0.15em] ${colorClass} uppercase leading-none opacity-60`}
      >
        {label}
      </h4>
      <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface ComparisonSideProps {
  props: ComparisonHeaderProps;
  label: string;
  colorClass: string;
  title: string;
  side: 'A' | 'B';
}

const SIDE_CLASSES = {
  primary: {
    color: 'text-primary',
    avatar: 'border border-primary/20 bg-neutral-950',
    badge:
      'text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/10 text-primary py-1 px-3 rounded-none',
  },
  accent: {
    color: 'text-accent',
    avatar: 'border border-accent/20 bg-neutral-950',
    badge:
      'text-[10px] font-black tracking-widest uppercase border-accent/20 bg-accent/10 text-accent py-1 px-3 rounded-none',
  },
} as const;

/** One side of the versus header: avatar + tier badge / warrior vitals. */
function ComparisonSide({ props, label, colorClass, title, side }: ComparisonSideProps) {
  const rival = props.kind === 'stable' ? (side === 'A' ? props.rivalA : props.rivalB) : undefined;
  const warrior =
    props.kind === 'warrior' ? (side === 'A' ? props.warriorA : props.warriorB) : undefined;
  const source = props.kind === 'stable' ? rival?.owner : warrior;
  const entityType = props.kind === 'stable' ? 'owner' : 'warrior';
  const cls = SIDE_CLASSES[colorClass === 'text-primary' ? 'primary' : 'accent'];

  return (
    <SideColumn label={label} colorClass={cls.color} title={title}>
      {source && (
        <div className="flex justify-center">
          <AvatarForEntity
            entityId={source.id}
            entityType={entityType}
            source={source}
            size="md"
            className={cls.avatar}
          />
        </div>
      )}
      {rival ? (
        <div className="flex justify-center">
          <Badge variant="outline" className={cls.badge}>
            {rival.tier}
          </Badge>
        </div>
      ) : (
        warrior && (
          <div className="flex justify-center">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
              {warrior.age} years · {warrior.status}
            </span>
          </div>
        )
      )}
    </SideColumn>
  );
}

/**
 *
 */
export function ComparisonHeader(props: ComparisonHeaderProps) {
  const leftTitle =
    props.kind === 'stable'
      ? props.rivalA.owner.stableName
      : props.warriorA?.name || 'Not Selected';
  const rightTitle =
    props.kind === 'stable'
      ? props.rivalB.owner.stableName
      : props.warriorB?.name || 'Not Selected';

  return (
    <Surface
      variant="glass"
      padding="none"
      className="p-8 border-border/40 relative overflow-hidden flex items-center justify-between"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <ComparisonSide
        props={props}
        label="Challenger"
        colorClass="text-primary"
        title={leftTitle}
        side="A"
      />

      <div className="flex flex-col items-center justify-center mx-12 relative z-10">
        <div className="p-3 rounded-full bg-neutral-900 border border-white/5 shadow-inner">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <span className="text-[9px] font-black text-muted-foreground/20 tracking-[0.15em] uppercase mt-4">
          VS
        </span>
      </div>

      <ComparisonSide
        props={props}
        label="Defender"
        colorClass="text-accent"
        title={rightTitle}
        side="B"
      />
    </Surface>
  );
}
