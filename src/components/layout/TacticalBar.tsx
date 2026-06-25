/**
 * TacticalBar — Persistent bottom alerts panel
 * Shows critical operational alerts with quick actions
 */
import { useState } from 'react';
import { useLocation, Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useTacticalAlerts, type TacticalAlert } from '@/hooks/useTacticalAlerts';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

interface TacticalBarHeaderProps {
  hasAlerts: boolean;
  alerts: TacticalAlert[];
  week: number;
  expanded: boolean;
  onToggle: () => void;
}

function TacticalBarHeader({
  hasAlerts,
  alerts,
  week,
  expanded,
  onToggle,
}: TacticalBarHeaderProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:bg-white/10',
        expanded && 'border-b border-white/5'
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        {hasAlerts ? (
          <>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-arena-gold" />
              <span className="text-xs font-black uppercase tracking-wider text-arena-gold">
                {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {alerts[0]?.message}
            </span>
          </>
        ) : (
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            No Active Alerts
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">W{week}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title={expanded ? 'Collapse alerts' : 'Expand alerts'}
          aria-label={expanded ? 'Collapse alerts' : 'Expand alerts'}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: TacticalAlert;
}

function AlertItem({ alert }: AlertItemProps) {
  const Icon = alert.icon;
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-none border',
        alert.type === 'warning' && 'bg-arena-gold/10 border-arena-gold/20',
        alert.type === 'info' && 'bg-muted/30 border-border/30',
        alert.type === 'urgent' && 'bg-destructive/10 border-destructive/20',
        alert.type === 'success' && 'bg-primary/10 border-primary/20'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            'h-4 w-4',
            alert.type === 'warning' && 'text-arena-gold',
            alert.type === 'info' && 'text-muted-foreground',
            alert.type === 'urgent' && 'text-destructive',
            alert.type === 'success' && 'text-primary'
          )}
        />
        <span className="text-xs font-medium">{alert.message}</span>
      </div>

      {alert.action && (
        <Link to={alert.action.to}>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 text-[10px] font-black uppercase tracking-wider',
              alert.type === 'warning' && 'border-arena-gold/30 hover:bg-arena-gold/20',
              alert.type === 'info' && 'border-border/30 hover:bg-muted/20',
              alert.type === 'urgent' && 'border-destructive/30 hover:bg-destructive/20',
              alert.type === 'success' && 'border-primary/30 hover:bg-primary/20'
            )}
          >
            {alert.action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}

interface TacticalBarContentProps {
  alerts: TacticalAlert[];
}

function TacticalBarContent({ alerts }: TacticalBarContentProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No alerts. All is well.
          </div>
        ) : (
          alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * Tactical bar.
 */
export function TacticalBar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const { week } = useGameStore(useShallow((s) => ({ week: s.week })));
  const alerts = useTacticalAlerts();

  // Don't show on certain pages (welcome, warrior detail)
  const hiddenPaths = ['/welcome', '/help'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  // Don't show if no alerts and not expanded
  if (alerts.length === 0 && !expanded) {
    return null;
  }

  const hasAlerts = alerts.length > 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10',
        'transition-all duration-300'
      )}
    >
      <TacticalBarHeader
        hasAlerts={hasAlerts}
        alerts={alerts}
        week={week}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />

      <AnimatePresence>{expanded && <TacticalBarContent alerts={alerts} />}</AnimatePresence>
    </motion.div>
  );
}
