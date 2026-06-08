import { Users } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';

export function EmptyWarriorState() {
  return (
    <Surface
      variant="glass"
      className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4"
    >
      <Users className="h-12 w-12 text-muted-foreground opacity-20" />
      <div className="space-y-1">
        <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
          Insufficient Warriors Available
        </p>
        <p className="text-xs text-muted-foreground/60 italic">
          At least two active warriors are required for comparison.
        </p>
      </div>
    </Surface>
  );
}
