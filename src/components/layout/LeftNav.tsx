/**
 * LeftNav — Vertical sidebar navigation
 * Replaces HubNav (top bar) + SubTabNav (secondary tabs) with a single
 * collapsible left rail: hub switcher + per-hub sub-pages + alert badges.
 */
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  HUBS,
  type HubId,
  useNavAlerts,
  HubSwitcher,
  SubPageList,
  AlertStrip,
} from './navigationShared';

// ─── Component ───────────────────────────────────────────────────────────────

interface LeftNavProps {
  className?: string;
}

/**
 *
 */
export function LeftNav({ className }: LeftNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { counts: alerts, links: alertLinks } = useNavAlerts({ trackWeek: true });

  const activeHubId = (HUBS.find((h) => currentPath === h.to || currentPath.startsWith(`${h.to}/`))
    ?.id ?? null) as HubId | null;

  return (
    <nav
      className={cn(
        'w-52 flex-shrink-0 flex flex-col h-full',
        'bg-[#0C0806] border-r border-white/5',
        className
      )}
    >
      {/* Hub switcher */}
      <HubSwitcher
        activeHubId={activeHubId}
        alerts={alerts}
        alertLinks={alertLinks}
        LinkComponent={Link}
        showChevron={true}
      />

      {/* Sub-page list for active hub */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <SubPageList
          activeHubId={activeHubId}
          currentPath={currentPath}
          LinkComponent={Link}
          useMotionIndicator={true}
          animationDuration={0.3}
        />
      </div>

      {/* Bottom alert strip */}
      <AlertStrip alerts={alerts} LinkComponent={Link} />
    </nav>
  );
}

export { HUBS, type HubId };
