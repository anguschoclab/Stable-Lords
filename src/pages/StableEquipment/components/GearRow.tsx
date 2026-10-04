import { cn } from '@/lib/utils';

interface GearRowStatus {
  error?: boolean;
  blocked?: boolean;
}

interface GearRowProps {
  icon: React.ElementType;
  name: string;
  weight: number;
  high?: boolean;
  status?: GearRowStatus;
}

/**
 *
 */
export function GearRow({ icon: Icon, name, weight, high, status }: GearRowProps) {
  const { error, blocked } = status ?? {};
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 transition-all motion-reduce:transition-none',
        high ? 'bg-white/[0.03]' : 'bg-black/20'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-none',
          error ? 'bg-destructive/20 text-destructive' : 'bg-white/5 text-muted-foreground/40'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-[10px] font-black uppercase tracking-widest truncate',
            error
              ? 'text-destructive'
              : blocked
                ? 'text-muted-foreground/20 line-through'
                : 'text-foreground/70'
          )}
        >
          {name} {blocked && '(CONFLICT)'}
        </div>
      </div>
      <span className="font-mono text-[9px] text-muted-foreground/30">+{weight}E</span>
    </div>
  );
}
