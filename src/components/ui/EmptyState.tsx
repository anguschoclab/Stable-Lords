import { Surface } from '@/components/ui/Surface';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 *
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Surface
      variant="glass"
      className={`py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4 ${className || ''}`}
    >
      <Icon className="h-12 w-12 text-muted-foreground opacity-20" />
      <div className="space-y-1">
        <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
          {title}
        </p>
        {description && <p className="text-xs text-muted-foreground/60 italic">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </Surface>
  );
}
