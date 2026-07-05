import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData, Warrior } from '@/types/game';

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
      <h4 className={`text-[10px] font-black tracking-[0.4em] ${colorClass} uppercase leading-none opacity-60`}>
        {label}
      </h4>
      <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ComparisonHeader(props: ComparisonHeaderProps) {
  const leftTitle = props.kind === 'stable' ? props.rivalA.owner.stableName : (props.warriorA?.name || 'Not Selected');
  const rightTitle = props.kind === 'stable' ? props.rivalB.owner.stableName : (props.warriorB?.name || 'Not Selected');

  return (
    <Surface
      variant="glass"
      padding="none"
      className="p-8 border-border/40 relative overflow-hidden flex items-center justify-between"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <SideColumn label="Challenger" colorClass="text-primary" title={leftTitle}>
        {props.kind === 'stable' ? (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/10 text-primary py-1 px-3 rounded-none"
            >
              {props.rivalA.tier}
            </Badge>
          </div>
        ) : (
          props.warriorA && (
            <div className="flex justify-center">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                {props.warriorA.age} years · {props.warriorA.status}
              </span>
            </div>
          )
        )}
      </SideColumn>

      <div className="flex flex-col items-center justify-center mx-12 relative z-10">
        <div className="p-3 rounded-full bg-neutral-900 border border-white/5 shadow-inner">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <span className="text-[9px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase mt-4">
          VS
        </span>
      </div>

      <SideColumn label="Defender" colorClass="text-accent" title={rightTitle}>
        {props.kind === 'stable' ? (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="text-[10px] font-black tracking-widest uppercase border-accent/20 bg-accent/10 text-accent py-1 px-3 rounded-none"
            >
              {props.rivalB.tier}
            </Badge>
          </div>
        ) : (
          props.warriorB && (
            <div className="flex justify-center">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                {props.warriorB.age} years · {props.warriorB.status}
              </span>
            </div>
          )
        )}
      </SideColumn>
    </Surface>
  );
}
