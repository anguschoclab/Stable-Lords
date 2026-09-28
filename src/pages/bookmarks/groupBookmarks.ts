import type { useNavigate } from '@tanstack/react-router';
import { buildWarriorMap } from '@/engine/core/warriorCollection';
import type { BookmarkEntityType } from '@/types/bookmark.types';
import type { GameStore } from '@/state/store.types';

/** A display row derived from a bookmarked entity. */
export interface BookmarkRow {
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
  | 'bookmarks' | 'roster' | 'graveyard' | 'retired' | 'rivals'
  | 'promoters' | 'trainers' | 'tournaments' | 'boutOffers' | 'scoutReports'
>;

/**
 * Groups bookmarks by entity type, resolving each entity's display name,
 * subtitle, and click navigation. Lookup maps are built once per type —
 * only for types actually bookmarked — rather than re-scanning per row.
 */
export function groupBookmarks(
  s: Slice,
  navigate: Navigate
): BookmarkGroups {
  const { bookmarks, roster, graveyard, retired, rivals, promoters, trainers, tournaments, boutOffers, scoutReports } = s;
  const groups: BookmarkGroups = {
    warrior: [],
    rival: [],
    promoter: [],
    trainer: [],
    tournament: [],
    boutOffer: [],
    scoutReport: [],
  };

  // Build per-type lookup maps once — only for entity types actually
  // bookmarked — instead of re-scanning arrays inside the loop.
  const typesPresent = new Set(bookmarks.map((b) => b.entityType));

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

  for (const b of bookmarks) {
    let name = 'Unknown Entity';
    let subtitle: string | undefined;
    let onClick: (() => void) | undefined;

    switch (b.entityType) {
      case 'warrior': {
        const w = warriorMap?.get(b.entityId);
        if (w) {
          name = w.name;
          subtitle = w.style;
          onClick = () => navigate({ to: '/warrior/$id', params: { id: w.id } });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'rival': {
        const r = rivalMap?.get(b.entityId);
        if (r) {
          name = r.owner.stableName;
          subtitle = r.owner.name;
          onClick = () => navigate({ to: '/world/stable/$id', params: { id: r.owner.id } });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'promoter': {
        const p = promoterMap?.get(b.entityId);
        if (p) {
          name = p.name;
          subtitle = `${p.tier} · ${p.personality}`;
          onClick = () => navigate({ to: '/stable/promoter/$id', params: { id: p.id } });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'trainer': {
        const t = trainerMap?.get(b.entityId);
        if (t) {
          name = t.name;
          subtitle = `${t.tier} · ${t.focus}`;
          onClick = () => navigate({ to: '/stable/trainers' });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'tournament': {
        const tour = tournamentMap?.get(b.entityId);
        if (tour) {
          name = tour.name;
          subtitle = `${tour.season} · Year ${tour.week}`;
          onClick = () => navigate({ to: '/world/tournaments' });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'boutOffer': {
        const offer = boutOfferMap?.get(b.entityId);
        if (offer) {
          const promoter = promoterMap?.get(offer.promoterId);
          name = promoter ? `${promoter.name} · ${offer.purse}G` : `${offer.purse}G`;
          subtitle = offer.id;
          onClick = () => navigate({ to: '/stable/bouts' });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
      case 'scoutReport': {
        const report = scoutReportMap?.get(b.entityId);
        if (report) {
          name = report.warriorName;
          subtitle = `${report.quality} Report · Week ${report.week}`;
          onClick = () => navigate({ to: '/world/scouting' });
        } else {
          name = '[Entity Removed]';
        }
        break;
      }
    }

    groups[b.entityType].push({
      id: b.entityId,
      name,
      subtitle,
      createdAt: b.createdAt,
      onClick,
    });
  }

  return groups;
}
