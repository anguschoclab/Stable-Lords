import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Gazette section header — icon tile, title, hairline rule, and corner badge.
 */
export function GazetteSectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeStyle = 'primary',
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge: string;
  badgeStyle?: 'primary' | 'gold';
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-2.5 border rounded-none',
            badgeStyle === 'gold'
              ? 'bg-arena-gold/10 border-arena-gold/20'
              : 'bg-arena-blood/10 border-arena-blood/20'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              badgeStyle === 'gold' ? 'text-arena-gold' : 'text-arena-blood'
            )}
          />
        </div>
        <div>
          <h3 className="text-base font-display font-black uppercase tracking-tight">{title}</h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            {subtitle}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'hidden md:block flex-1 h-px mx-8',
          badgeStyle === 'gold'
            ? 'bg-gradient-to-r from-arena-gold/20 via-border/20 to-transparent'
            : 'bg-gradient-to-r from-arena-blood/20 via-border/20 to-transparent'
        )}
      />
      <Badge
        variant="outline"
        className={cn(
          'hidden md:flex text-[9px] font-mono font-black tracking-widest px-3 h-7 rounded-none',
          badgeStyle === 'gold'
            ? 'border-arena-gold/25 bg-arena-gold/5 text-arena-gold'
            : 'border-arena-blood/25 bg-arena-blood/5 text-arena-blood'
        )}
      >
        {badge}
      </Badge>
    </div>
  );
}
