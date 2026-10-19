/**
 * Breadcrumbs — canonical hierarchy + referrer-aware back chip.
 * The chain always names the entity's real parent (ownership-derived);
 * a leading "← {referrer}" chip appears only when the recorded referrer
 * differs from that canonical parent, so "back" returns where you were.
 */
import { Fragment, useMemo, useSyncExternalStore } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { getCanonicalCrumbs } from './routeCrumbs';
import { getReferrer, getNavTrailSnapshot, subscribeNavTrail } from './navTrail';
import type { EntityIndexState } from '@/engine/core/entityIndex';

const CRUMB_TEXT = 'text-[10px] font-black uppercase tracking-[0.15em]';

/**
 *
 */
export function Breadcrumbs() {
  const pathname = useLocation().pathname;
  const crumbState = useGameStore(
    useShallow(
      (s): EntityIndexState => ({
        player: s.player,
        roster: s.roster,
        graveyard: s.graveyard,
        retired: s.retired,
        rivals: s.rivals,
        promoters: s.promoters,
      })
    )
  );
  const crumbs = useMemo(
    () => getCanonicalCrumbs(pathname, crumbState),
    [pathname, crumbState]
  );
  const trail = useSyncExternalStore(subscribeNavTrail, getNavTrailSnapshot);
  const referrer = useMemo(() => getReferrer(trail, pathname), [trail, pathname]);

  if (!crumbs || crumbs.length === 0) return null;

  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;
  const showReferrer = referrer !== undefined && referrer.pathname !== parent?.to;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 ${CRUMB_TEXT}`}
    >
      {showReferrer && (
        <>
          <Link
            to={referrer.pathname}
            className="flex items-center gap-1.5 text-muted-foreground/70 transition-colors hover:text-primary motion-reduce:transition-none"
            aria-label={`Back to ${referrer.label}`}
          >
            <ArrowLeft className="h-3 w-3" />
            {referrer.label}
          </Link>
          <ChevronRight
            className="h-3 w-3 text-muted-foreground/30"
            aria-hidden
          />
        </>
      )}
      {crumbs.map((crumb, i) => {
        const isLeaf = i === crumbs.length - 1;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden />
            )}
            {isLeaf || !crumb.to ? (
              <span aria-current="page" className="text-foreground/80">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="text-muted-foreground/60 transition-colors hover:text-foreground motion-reduce:transition-none"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
