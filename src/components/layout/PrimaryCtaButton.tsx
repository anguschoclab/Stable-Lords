import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ExecuteWeekButton } from '@/components/layout/ExecuteWeekButton';
import { useGameStore } from '@/state/useGameStore';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import {
  resolvePrimaryCta,
  resolvePrimaryCtaKey,
  useCtaRegistry,
} from './primaryCta';

const ctaClass =
  'flex items-center gap-3 h-10 px-6 font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-none shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-300 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black';

/**
 * Route-aware primary CTA — DESIGN_PAGE_SYSTEM_v1.0 §1. The shared top bar
 * shows one blood-crimson action whose label and behavior swap by route.
 * Detail/lore routes resolve to null and render no CTA.
 */
export function PrimaryCtaButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const def = resolvePrimaryCta(location.pathname);
  const routeKey = resolvePrimaryCtaKey(location.pathname);
  const pageAction = useCtaRegistry((s) => (routeKey ? s.actions[routeKey] : undefined));

  const isSimulating = useGameStore((s) => s.isSimulating);
  const { running } = useWeekExecution();

  if (!def) return null;

  const busy = running || isSimulating;

  if (def.intent === 'navigate' && def.to) {
    return (
      <Button onClick={() => navigate({ to: def.to })} aria-label={def.label} className={ctaClass}>
        <Zap className="h-4 w-4 fill-current" />
        {def.label}
        <ArrowRight className="h-3 w-3" />
      </Button>
    );
  }

  if (def.intent === 'page') {
    return (
      <Button
        onClick={() => void pageAction?.run()}
        disabled={busy || !pageAction?.enabled}
        aria-label={def.label}
        className={ctaClass}
      >
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Zap className="h-4 w-4 fill-current" />
        )}
        {running ? 'Working…' : def.label}
      </Button>
    );
  }

  // intent === 'advance' — the week/day advance pipeline, label swapped by route.
  return <ExecuteWeekButton ctaLabel={def.label} />;
}
