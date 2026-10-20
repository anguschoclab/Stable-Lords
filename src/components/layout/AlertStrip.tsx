import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { UTILITY_LINKS, type HubId } from './navigationHubs';

type LinkComp = React.ComponentType<{
  to: string;
  children: React.ReactNode;
  className?: string;
}>;

interface AlertStripProps {
  alerts: Record<HubId, number>;
  LinkComponent?: LinkComp;
  itemClassName?: string;
}

/**
 *
 */
export function AlertStrip({ alerts, LinkComponent = Link, itemClassName }: AlertStripProps) {
  const { isTournamentWeek } = useGameStore(
    useShallow((s) => ({ isTournamentWeek: s.isTournamentWeek }))
  );

  const alertItems: { icon: React.ElementType; label: string; color: string; to: string }[] = [];

  if (alerts.stable > 0)
    alertItems.push({
      icon: ShieldAlert,
      label: `${alerts.stable} alerts`,
      color: 'text-arena-gold',
      to: '/stable',
    });

  if (isTournamentWeek)
    alertItems.push({
      icon: AlertCircle,
      label: 'Tournament week',
      color: 'text-arena-blood',
      to: '/world/tournaments',
    });

  if (alertItems.length === 0) return null;

  return (
    <div className="border-t border-white/5 p-2 flex flex-col gap-1">
      {alertItems.map((a) => {
        const Icon = a.icon;
        return (
          <LinkComponent
            key={a.label}
            to={a.to as never}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-70 motion-reduce:transition-none',
              a.color,
              itemClassName
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span>{a.label}</span>
          </LinkComponent>
        );
      })}
    </div>
  );
}

interface UtilityStripProps {
  LinkComponent?: LinkComp;
  itemClassName?: string;
}

/**
 * Bottom-of-nav utility links (Help, dev-only Admin).
 */
export function UtilityStrip({ LinkComponent = Link, itemClassName }: UtilityStripProps) {
  const links = UTILITY_LINKS.filter((l) => !('devOnly' in l && l.devOnly) || import.meta.env.DEV);
  return (
    <div className="border-t border-white/5 p-2 flex flex-col gap-1">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <LinkComponent
            key={l.to}
            to={l.to}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 transition-opacity hover:opacity-70 motion-reduce:transition-none',
              itemClassName
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span>{l.label}</span>
          </LinkComponent>
        );
      })}
    </div>
  );
}
