import { cn } from '@/lib/utils';

interface HeaderMetricDisplayProps {
  title: string;
  subtitle?: string;
  metrics: { label: string; value: React.ReactNode; className?: string }[];
  className?: string;
}

/**
 *
 */
export function HeaderMetricDisplay({
  title,
  subtitle,
  metrics,
  className,
}: HeaderMetricDisplayProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <h2 className="font-display font-black text-2xl uppercase tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex gap-6">
        {metrics.map((m, i) => (
          <div key={i} className={cn('flex flex-col gap-0.5', m.className)}>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              {m.label}
            </span>
            <span className="font-display font-black text-xl tracking-tighter text-foreground">
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
