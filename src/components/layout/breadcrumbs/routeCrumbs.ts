/**
 * Canonical breadcrumb chains per detail route. The parent is derived
 * from entity ownership (absorbs the old getWarriorReturnContext cases),
 * not from where the user happened to come from — the referrer chip in
 * Breadcrumbs handles the actual-history case.
 */
import { getAllArenas } from '@/data/arenas';
import { ensureEntityIndex, type EntityIndexState } from '@/engine/core/entityIndex';
import { HUBS, UTILITY_LINKS } from '@/components/layout/navigationHubs';

/** One breadcrumb segment — the leaf crumb has no `to`. */
interface Crumb {
  label: string;
  to?: string;
}

const WORLD: Crumb = { label: 'World', to: '/world' };
const STABLE: Crumb = { label: 'Stable', to: '/stable' };
const SCOUTING: Crumb = { label: 'Scouting', to: '/world/scouting' };

function warriorCrumbs(id: string, s: EntityIndexState): Crumb[] {
  const name = ensureEntityIndex(s).warriorById.get(id)?.name ?? 'Unknown Warrior';
  const leaf: Crumb = { label: name };

  if ((s.roster ?? []).some((w) => w.id === id)) {
    return [STABLE, { label: 'Roster', to: '/stable/roster' }, leaf];
  }
  if ((s.graveyard ?? []).some((w) => w.id === id)) {
    return [WORLD, { label: 'Graveyard', to: '/world/graveyard' }, leaf];
  }
  if ((s.retired ?? []).some((w) => w.id === id)) {
    return [WORLD, { label: 'Hall of Fame', to: '/world/history' }, leaf];
  }
  const rival = (s.rivals ?? []).find((r) => r.roster?.some((w) => w.id === id));
  if (rival) {
    return [
      WORLD,
      SCOUTING,
      {
        label: rival.owner?.stableName ?? 'Unknown Stable',
        to: rival.id ? `/world/stable/${rival.id}` : undefined,
      },
      leaf,
    ];
  }
  return [WORLD, SCOUTING, leaf];
}

function stableCrumbs(id: string, s: EntityIndexState): Crumb[] {
  if (s.player && s.player.id === id) {
    return [STABLE, { label: 'Roster', to: '/stable/roster' }, { label: s.player.stableName }];
  }
  const rival = (s.rivals ?? []).find((r) => r.id === id || r.owner?.id === id);
  return [WORLD, SCOUTING, { label: rival?.owner?.stableName ?? 'Unknown Stable' }];
}

function arenaCrumbs(id: string): Crumb[] {
  const arena = getAllArenas().find((a) => a.id === id);
  return [WORLD, { label: 'Arenas', to: '/world/arenas' }, { label: arena?.name ?? id }];
}

function promoterCrumbs(id: string, s: EntityIndexState): Crumb[] {
  const promoter = Object.values(s.promoters ?? {}).find((p) => p?.id === id);
  return [
    STABLE,
    { label: 'Promoters', to: '/stable/promoters' },
    { label: promoter?.name ?? 'Unknown Promoter' },
  ];
}

/**
 * The canonical crumb chain for a pathname, or null when the route has
 * no detail-page breadcrumb (list pages render no trail).
 */
export function getCanonicalCrumbs(pathname: string, s: EntityIndexState): Crumb[] | null {
  const warrior = /^\/warrior\/([^/]+)$/.exec(pathname);
  if (warrior?.[1]) return warriorCrumbs(warrior[1], s);
  const stable = /^\/world\/stable\/([^/]+)$/.exec(pathname);
  if (stable?.[1]) return stableCrumbs(stable[1], s);
  const arena = /^\/world\/arenas\/([^/]+)$/.exec(pathname);
  if (arena?.[1]) return arenaCrumbs(arena[1]);
  const promoter = /^\/stable\/promoter\/([^/]+)$/.exec(pathname);
  if (promoter?.[1]) return promoterCrumbs(promoter[1], s);
  return null;
}

/** Display label for a pathname — detail-page leaf or nav registry label. */
export function labelForPathname(pathname: string, s: EntityIndexState): string {
  const crumbs = getCanonicalCrumbs(pathname, s);
  const leaf = crumbs?.[crumbs.length - 1];
  if (leaf) return leaf.label;

  for (const hub of HUBS) {
    if (hub.to === pathname) return hub.label;
    for (const page of hub.pages) {
      if (page.to === pathname) return page.label;
    }
  }
  for (const link of UTILITY_LINKS) {
    if (link.to === pathname) return link.label;
  }
  if (pathname === '/') return 'Command';
  return pathname;
}
