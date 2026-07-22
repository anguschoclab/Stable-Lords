import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  icon: LucideIcon;
  iconClass: string;
  borderClass: string;
  label: string;
  value: string;
  sublabel: string;
}

/**
 *
 */
export function SummaryCard({
  icon: Icon,
  iconClass,
  borderClass,
  label,
  value,
  sublabel,
}: SummaryCardProps) {
  return (
    <Surface
      variant="glass"
      padding="md"
      className={cn(
        'bg-background/90 border-border/10 flex items-center gap-6 group transition-all',
        borderClass
      )}
    >
      <div className={cn('p-4 rounded-none border transition-all', iconClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
          {label}
        </p>
        <p className="text-xl font-mono font-black">{value}</p>
        <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
          {sublabel}
        </p>
      </div>
    </Surface>
  );
}
