import { cn } from '@/lib/utils';

type StatCardVariant = 'default' | 'primary' | 'destructive' | 'fame' | 'accent';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  variant?: StatCardVariant;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const variantStyles: Record<StatCardVariant, { label: string; value: string }> = {
  default: { label: 'text-muted-foreground/50', value: 'text-foreground' },
  primary: { label: 'text-muted-foreground/50', value: 'text-primary' },
  destructive: { label: 'text-muted-foreground/50', value: 'text-destructive' },
  fame: { label: 'text-muted-foreground/50', value: 'text-arena-fame' },
  accent: { label: 'text-muted-foreground/50', value: 'text-accent' },
};

export function StatCard({
  label,
  value,
  variant = 'default',
  className,
  labelClassName,
  valueClassName,
}: StatCardProps) {
  const styles = variantStyles[variant] ?? variantStyles.default;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className={cn(
          'text-[10px] font-black uppercase tracking-widest',
          styles.label,
          labelClassName
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-display font-black text-xl tracking-tighter',
          styles.value,
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}
