import type { useNavigate } from '@tanstack/react-router';
import { buildWarriorMap } from '@/engine/core/warriorCollection';
import type { BookmarkEntityType } from '@/types/bookmark.types';
import type { GameStore } from '@/state/store.types';
import type { Bookmark } from '@/types/bookmark.types';

/** A display row derived from a bookmarked entity. */
interface BookmarkRow {
  id: string;
  name: string;
  subtitle?: string;
  createdAt?: string;
  onClick?: () => void;
}

/** Bookmark rows grouped by entity type for the bookmarks page sections. */
export type BookmarkGroups = Record<BookmarkEntityType, BookmarkRow[]>;

type Navigate = ReturnType<typeof useNavigate>;
type Slice = Pick<
  GameStore,
  | 'bookmarks'
  | 'roster'
  | 'graveyard'
  | 'retired'
  | 'rivals'
  | 'promoters'
  | 'trainers'
  | 'tournaments'
  | 'boutOffers'
  | 'scoutReports'
>;

type LookupMaps = ReturnType<typeof buildLookupMaps>;

/**
 * Build per-type lookup maps once — only for entity types actually
 * bookmarked — instead of re-scanning arrays inside the row loop.
 */
function buildLookupMaps(s: Slice) {
  const {
    roster,
    graveyard,
    retired,
    rivals,
    promoters,
    trainers,
    tournaments,
    boutOffers,
    scoutReports,
  } = s;
  const typesPresent = new Set(s.bookmarks.map((b) => b.entityType));

  const warriorMap = typesPresent.has('warrior')
    ? buildWarriorMap({ roster, graveyard, retired, rivals })
    : undefined;

  const rivalMap = typesPresent.has('rival')
    ? new Map<string, (typeof rivals)[number]>()
    : undefined;
  if (rivalMap) {
    for (const r of rivals ?? []) {
      rivalMap.set(r.id, r);
      rivalMap.set(r.owner.id, r);
    }
  }

  const promoterMap =
    typesPresent.has('promoter') || typesPresent.has('boutOffer')
      ? new Map<string, (typeof promoters)[keyof typeof promoters]>()
      : undefined;
  if (promoterMap) {
    for (const p of Object.values(promoters || {})) promoterMap.set(p.id, p);
  }

  const trainerMap = typesPresent.has('trainer')
    ? new Map<string, (typeof trainers)[number]>()
    : undefined;
  if (trainerMap) {
    for (const t of trainers ?? []) trainerMap.set(t.id, t);
  }

  const tournamentMap = typesPresent.has('tournament')
    ? new Map<string, (typeof tournaments)[number]>()
    : undefined;
  if (tournamentMap) {
    for (const t of tournaments ?? []) tournamentMap.set(t.id, t);
  }

  const boutOfferMap = typesPresent.has('boutOffer')
    ? new Map<string, (typeof boutOffers)[keyof typeof boutOffers]>()
    : undefined;
  if (boutOfferMap) {
    for (const o of Object.values(boutOffers || {})) boutOfferMap.set(o.id, o);
  }

  const scoutReportMap = typesPresent.has('scoutReport')
    ? new Map<string, (typeof scoutReports)[number]>()
    : undefined;
  if (scoutReportMap) {
    for (const r of scoutReports ?? []) scoutReportMap.set(r.id, r);
  }

  return {
    warriorMap,
    rivalMap,
    promoterMap,
    trainerMap,
    tournamentMap,
    boutOfferMap,
    scoutReportMap,
  };
}

/** Resolve a single bookmark's display name, subtitle, and navigation. */
function resolveBookmarkRow(
  b: Bookmark,
  maps: LookupMaps,
  navigate: Navigate
): Pick<BookmarkRow, 'name' | 'subtitle' | 'onClick'> {
  switch (b.entityType) {
    case 'warrior': {
      const w = maps.warriorMap?.get(b.entityId);
      if (!w) return { name: '[Entity Removed]' };
      return {
        name: w.name,
        subtitle: w.style,
        onClick: () => navigate({ to: '/warrior/$id', params: { id: w.id } }),
      };
    }
    case 'rival': {
      const r = maps.rivalMap?.get(b.entityId);
      if (!r) return { name: '[Entity Removed]' };
      return {
        name: r.owner.stableName,
        subtitle: r.owner.name,
        onClick: () => navigate({ to: '/world/stable/$id', params: { id: r.owner.id } }),
      };
    }
    case 'promoter': {
      const p = maps.promoterMap?.get(b.entityId);
      if (!p) return { name: '[Entity Removed]' };
      return {
        name: p.name,
        subtitle: `${p.tier} · ${p.personality}`,
        onClick: () => navigate({ to: '/stable/promoter/$id', params: { id: p.id } }),
      };
    }
    case 'trainer': {
      const t = maps.trainerMap?.get(b.entityId);
      if (!t) return { name: '[Entity Removed]' };
      return {
        name: t.name,
        subtitle: `${t.tier} · ${t.focus}`,
        onClick: () => navigate({ to: '/stable/trainers' }),
      };
    }
    case 'tournament': {
      const tour = maps.tournamentMap?.get(b.entityId);
      if (!tour) return { name: '[Entity Removed]' };
      return {
        name: tour.name,
        subtitle: `${tour.season} · Year ${tour.week}`,
        onClick: () => navigate({ to: '/world/tournaments' }),
      };
    }
    case 'boutOffer': {
      const offer = maps.boutOfferMap?.get(b.entityId);
      if (!offer) return { name: '[Entity Removed]' };
      const promoter = maps.promoterMap?.get(offer.promoterId);
      return {
        name: promoter ? `${promoter.name} · ${offer.purse}G` : `${offer.purse}G`,
        subtitle: offer.id,
        onClick: () => navigate({ to: '/stable/bouts' }),
      };
    }
    case 'scoutReport': {
      const report = maps.scoutReportMap?.get(b.entityId);
      if (!report) return { name: '[Entity Removed]' };
      return {
        name: report.warriorName,
        subtitle: `${report.quality} Report · Week ${report.week}`,
        onClick: () => navigate({ to: '/world/scouting' }),
      };
    }
  }
}

/**
 * Groups bookmarks by entity type, resolving each entity's display name,
 * subtitle, and click navigation. Lookup maps are built once per type —
 * only for types actually bookmarked — rather than re-scanning per row.
 */
export function groupBookmarks(s: Slice, navigate: Navigate): BookmarkGroups {
  const groups: BookmarkGroups = {
    warrior: [],
    rival: [],
    promoter: [],
    trainer: [],
    tournament: [],
    boutOffer: [],
    scoutReport: [],
  };

  const maps = buildLookupMaps(s);

  for (const b of s.bookmarks) {
    const resolved = resolveBookmarkRow(b, maps, navigate) ?? { name: 'Unknown Entity' };
    groups[b.entityType].push({
      id: b.entityId,
      name: resolved.name,
      subtitle: resolved.subtitle,
      createdAt: b.createdAt,
      onClick: resolved.onClick,
    });
  }

  return groups;
}
