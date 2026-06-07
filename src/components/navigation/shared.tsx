/**
 * Shared navigation components and utilities
 * Eliminates duplication between LeftNav and MobileNav
 */
import { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Users,
  Globe,
  LayoutDashboard,
  BookUser,
  Dumbbell,
  Flame,
  Skull,
  Wrench,
  Coins,
  ScrollText,
  Building2,
  Sunset,
  Trophy,
  Radar,
  Newspaper,
  ChevronRight,
  AlertCircle,
  CalendarClock,
  ShieldAlert,
  BrainCircuit,
  UserPlus,
} from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useTacticalAlerts } from '@/hooks/useTacticalAlerts';

// ─── Hub + sub-page definitions ─────────────────────────────────────────────

/**
 * Hubs.
 */
export const HUBS = [
  {
    id: 'command',
    label: 'Command',
    icon: Swords,
    to: '/command',
    pages: [
      { to: '/command', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/command/roster', label: 'Roster', icon: BookUser },
      { to: '/command/training', label: 'Training', icon: Dumbbell },
      { to: '/command/tactics', label: 'Planner', icon: BrainCircuit },
      { to: '/command/arena', label: 'Arena', icon: Flame },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
    ],
  },
  {
    id: 'ops',
    label: 'Stable',
    icon: Users,
    to: '/ops',
    pages: [
      { to: '/ops/overview', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/ops/roster', label: 'Roster', icon: BookUser },
      { to: '/ops/equipment', label: 'Equipment', icon: Wrench },
      { to: '/ops/contracts', label: 'Bouts', icon: ScrollText },
      { to: '/ops/promoters', label: 'Promoters', icon: Building2 },
      { to: '/ops/personnel', label: 'Trainers', icon: Dumbbell },
      { to: '/ops/finance', label: 'Finance', icon: Coins },
      { to: '/ops/recruit', label: 'Recruit', icon: UserPlus },
      { to: '/ops/offseason', label: 'Offseason', icon: Sunset },
    ],
  },
  {
    id: 'world',
    label: 'World',
    icon: Globe,
    to: '/world',
    pages: [
      { to: '/world', label: 'Rankings', icon: Trophy, exact: true },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
      { to: '/world/intelligence', label: 'Scouting', icon: Radar },
      { to: '/world/chronicle', label: 'Chronicle', icon: Newspaper },
      { to: '/world/history', label: 'Hall of Fame', icon: Trophy },
      { to: '/world/graveyard', label: 'Graveyard', icon: Skull },
    ],
  },
] as const;

/**
 * Hub id type.
 */
export type HubId = (typeof HUBS)[number]['id'];

// ─── Alert badge helper ──────────────────────────────────────────────────────

interface UseNavAlertsOptions {
  trackWeek?: boolean;
}

export function useNavAlerts(options: UseNavAlertsOptions = {}) {
  const { trackWeek = false } = options;
  const { week, isTournamentWeek } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      isTournamentWeek: s.isTournamentWeek,
    }))
  );
  const alerts = useTacticalAlerts();
  const location = useLocation();
  const onOpsSection = location.pathname.startsWith('/ops');
  const onCommandSection = location.pathname.startsWith('/command');

  // Track the week when user last visited each section — badge only shows for newer weeks
  const lastSeenOpsWeek = useRef(trackWeek && onOpsSection ? week : -1);
  const lastSeenCommandWeek = useRef(trackWeek && onCommandSection ? week : -1);

  useEffect(() => {
    if (trackWeek && onOpsSection) lastSeenOpsWeek.current = week;
  }, [onOpsSection, week, trackWeek]);

  useEffect(() => {
    if (trackWeek && onCommandSection) lastSeenCommandWeek.current = week;
  }, [onCommandSection, week, trackWeek]);

  // Extract counts from tactical alerts
  const untrainedCount = alerts.find((a) => a.id === 'unassigned-training')
    ? parseInt(alerts.find((a) => a.id === 'unassigned-training')!.message.match(/\d+/)?.[0] || '0')
    : 0;
  const pendingOffers = alerts.find((a) => a.id === 'pending-offers')
    ? parseInt(alerts.find((a) => a.id === 'pending-offers')!.message.match(/\d+/)?.[0] || '0')
    : 0;

  const showOpsAlert = trackWeek
    ? pendingOffers > 0 && !onOpsSection && week > lastSeenOpsWeek.current
    : pendingOffers > 0;
  const showCommandAlert = trackWeek
    ? untrainedCount > 0 && !onCommandSection && week > lastSeenCommandWeek.current
    : untrainedCount > 0;

  return {
    counts: {
      command: showCommandAlert ? untrainedCount : 0,
      ops: showOpsAlert ? pendingOffers : 0,
      world: isTournamentWeek ? 1 : 0,
    } as Record<HubId, number>,
    links: {
      command: '/command/training',
      ops: '/ops/contracts',
      world: '/world/tournaments',
    } as Record<HubId, string>,
  };
}

// ─── Hub Switcher Component ───────────────────────────────────────────────────

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

export function HubSwitcher({
  activeHubId,
  alerts,
  alertLinks,
  LinkComponent = Link,
  linkClassName,
  iconClassName,
  showChevron = true,
  onAlertClick,
}: HubSwitcherProps) {
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
              'text-[11px] font-black uppercase tracking-widest transition-all duration-150',
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
                className="flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-[10px] font-mono font-black h-5 min-w-[20px] px-1 rounded-none border border-primary/30"
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

// ─── Sub-Page List Component ──────────────────────────────────────────────────

interface SubPageListProps {
  activeHubId: HubId | null;
  currentPath: string;
  LinkComponent?: React.ComponentType<{
    to: string;
    children: React.ReactNode;
    className?: string;
  }>;
  pageLinkClassName?: string;
  iconClassName?: string;
  useMotionIndicator?: boolean;
  animationDuration?: number;
}

export function SubPageList({
  activeHubId,
  currentPath,
  LinkComponent = Link,
  pageLinkClassName,
  iconClassName,
  useMotionIndicator = true,
  animationDuration = 0.3,
}: SubPageListProps) {
  return (
    <AnimatePresence mode="wait">
      {activeHubId && (
        <motion.div
          key={activeHubId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: animationDuration, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-0.5 px-2"
        >
          {HUBS.find((h) => h.id === activeHubId)?.pages.map((page) => {
            const pageAny = page as { to: string; exact?: boolean };
            const isActive = pageAny.exact
              ? currentPath === page.to
              : currentPath === page.to || currentPath.startsWith(`${page.to}/`);
            const PageIcon = page.icon;

            return (
              <LinkComponent
                key={page.to}
                to={page.to}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-1.5 rounded-none',
                  'text-[10px] font-black uppercase tracking-wider transition-all duration-150 group',
                  isActive
                    ? 'text-foreground bg-white/8'
                    : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5',
                  pageLinkClassName
                )}
              >
                {useMotionIndicator && isActive && (
                  <motion.div
                    layoutId="leftnav-page-indicator"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                    transition={{ duration: animationDuration, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                {!useMotionIndicator && isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <PageIcon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/40 group-hover:text-muted-foreground/70',
                    iconClassName
                  )}
                />
                <span className="relative">{page.label}</span>
              </LinkComponent>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Alert Strip Component ─────────────────────────────────────────────────────

interface AlertStripProps {
  alerts: Record<HubId, number>;
  LinkComponent?: React.ComponentType<{
    to: string;
    children: React.ReactNode;
    className?: string;
  }>;
  itemClassName?: string;
}

export function AlertStrip({ alerts, LinkComponent = Link, itemClassName }: AlertStripProps) {
  const { isTournamentWeek } = useGameStore(
    useShallow((s) => ({ isTournamentWeek: s.isTournamentWeek }))
  );

  const alertItems: { icon: React.ElementType; label: string; color: string; to: string }[] = [];

  if (alerts.command > 0)
    alertItems.push({
      icon: ShieldAlert,
      label: `${alerts.command} unassigned`,
      color: 'text-arena-gold',
      to: '/command/training',
    });

  if (alerts.ops > 0)
    alertItems.push({
      icon: ScrollText,
      label: `${alerts.ops} offers`,
      color: 'text-arena-pop',
      to: '/ops/contracts',
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
              'flex items-center gap-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-70',
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
