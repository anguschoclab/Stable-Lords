import { Link, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { HUBS, type HubId } from './navigationHubs';

interface HubSwitcherProps {
  activeHubId: HubId | null;
  alerts: Record<HubId, number>;
  alertLinks: Record<HubId, string>;
  LinkComponent?: React.ComponentType<{
    to: string;
    children: React.ReactNode;
    className?: string;
  }>;
  linkClassName?: string;
  iconClassName?: string;
  showChevron?: boolean;
  onAlertClick?: (hubId: HubId, link: string) => void;
}

/**
 *
 */
export function HubSwitcher(props: HubSwitcherProps) {
  const { activeHubId, alerts, alertLinks, LinkComponent = Link, linkClassName } = props;
  const { iconClassName, showChevron = true, onAlertClick } = props;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-0.5 p-2 border-b border-white/5">
      {HUBS.map((hub) => {
        const isActive = activeHubId === hub.id;
        const Icon = hub.icon;
        const alertCount = alerts[hub.id as HubId] ?? 0;
        const alertLink = alertLinks[hub.id as HubId];

        return (
          <LinkComponent
            key={hub.id}
            to={hub.to}
            className={cn(
              'relative flex items-center gap-2.5 px-3 py-2 rounded-none',
              'text-[11px] font-black uppercase tracking-widest transition-all motion-reduce:transition-none motion-reduce:transform-none duration-150',
              isActive
                ? 'text-primary bg-primary/10 border-l-2 border-primary'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5 border-l-2 border-transparent',
              linkClassName
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', iconClassName)} />
            <span className="flex-1">{hub.label}</span>
            {alertCount > 0 && (
              <button
                aria-label={`${alertCount} alerts for ${hub.label}`}
                className="flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-[10px] font-mono font-black h-5 min-w-[20px] px-1 rounded-none border border-primary/30 motion-reduce:transition-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAlertClick) {
                    onAlertClick(hub.id as HubId, alertLink);
                  } else {
                    navigate({ to: alertLink });
                  }
                }}
              >
                {alertCount}
              </button>
            )}
            {showChevron && isActive && (
              <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
            )}
          </LinkComponent>
        );
      })}
    </div>
  );
}
