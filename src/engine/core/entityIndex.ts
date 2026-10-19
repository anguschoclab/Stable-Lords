/**
 * Unified entity index — one WeakMap-cached lookup + search corpus per
 * state object. Replaces the parallel `buildWarriorMap` index and extends
 * the `historyResolver` name resolvers with substring search.
 *
 * ⚠️ The cache keys on the state OBJECT — callers must pass the store
 * state itself (`useGameStore((s) => searchEntities(s, q))`), never a
 * freshly assembled `{ roster, rivals }` literal, or every call misses.
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { STYLE_DISPLAY_NAMES, type FightingStyle } from '@/types/shared.types';

// ─── Public types ──────────────────────────────────────────────────────────

/** Entity kinds the index can surface in search. */
type SearchEntityType = 'warrior' | 'stable' | 'promoter' | 'trainer';
/** Collection badge shown next to a result. */
type SearchBadge = 'Yours' | 'Rival' | 'Fallen' | 'Retired';

/** One searchable entity — precomputed route + display fields. */
export interface SearchEntry {
  type: SearchEntityType;
  id: string;
  name: string;
  /** Pre-lowercased haystack: name + epithet + stable + style + owner fields. */
  searchText: string;
  /** Secondary line under the name (style · record · stable, tier, etc.). */
  subtitle: string;
  badge?: SearchBadge;
  /** Concrete route the result navigates to. */
  to: string;
}

/** Cached per-state index: exact lookups plus the flat search corpus. */
interface EntityIndex {
  warriorById: Map<string, Warrior>;
  warriorByName: Map<string, Warrior>;
  stableIdByName: Map<string, string>;
  stableNameById: Map<string, string>;
  corpus: SearchEntry[];
}

/** Minimal structural input — anything state-shaped (or a Pick of it). */
interface WarriorLike {
  id: string | import('@/types/shared.types').WarriorId;
  name: string;
  epithet?: string;
  style?: FightingStyle;
  status?: string;
  career?: { wins: number; losses: number; kills: number };
}

interface RivalLike {
  id?: string;
  owner?: { id?: string; stableName: string; name?: string; personality?: string };
  roster?: readonly WarriorLike[];
  tier?: string;
  philosophy?: string;
}

interface PromoterLike {
  id: string;
  name: string;
  tier?: string;
  personality?: string;
}

interface TrainerLike {
  id: string;
  name: string;
  tier?: string;
  focus?: string;
  specialty?: string;
}

/** Minimal state shape the index needs — GameState is a superset. */
export interface EntityIndexState {
  player?: { id: string; stableName: string; name?: string } | null;
  roster?: readonly WarriorLike[];
  graveyard?: readonly WarriorLike[];
  retired?: readonly WarriorLike[];
  rivals?: readonly RivalLike[];
  promoters?: Record<string, PromoterLike>;
  trainers?: readonly TrainerLike[];
}

// ─── Cache ─────────────────────────────────────────────────────────────────

let indexCache = new WeakMap<object, EntityIndex>();

/** Clears the entity index cache — called by clearHistoryResolverCaches. */
export function clearEntityIndexCaches(): void {
  indexCache = new WeakMap<object, EntityIndex>();
}

// ─── Corpus builders ───────────────────────────────────────────────────────

function styleLabel(w: WarriorLike): string {
  return w.style ? (STYLE_DISPLAY_NAMES[w.style] ?? w.style) : 'Unknown Style';
}

function warriorEntry(
  w: WarriorLike,
  bucket: SearchBadge,
  stableName: string
): SearchEntry {
  const record = w.career ? `${w.career.wins}W-${w.career.losses}L` : '0W-0L';
  const style = styleLabel(w);
  return {
    type: 'warrior',
    id: w.id as string,
    name: w.name,
    searchText: [w.name, w.epithet ?? '', style, stableName].join(' ').toLowerCase(),
    subtitle: `${style} · ${record} · ${stableName}`,
    badge: bucket,
    to: `/warrior/${w.id}`,
  };
}

function stableEntry(opts: {
  id: string;
  name: string;
  ownerName?: string;
  meta?: string;
  badge: SearchBadge;
  to: string;
}): SearchEntry {
  return {
    type: 'stable',
    id: opts.id,
    name: opts.name,
    searchText: [opts.name, opts.ownerName ?? '', opts.meta ?? ''].join(' ').toLowerCase(),
    subtitle: opts.meta || 'Stable',
    badge: opts.badge,
    to: opts.to,
  };
}

// ─── Index construction ────────────────────────────────────────────────────

type AddWarrior = (w: WarriorLike | undefined, bucket: SearchBadge, stable: string) => void;

/** Warriors, precedence-ordered: rivals < retired < graveyard < roster. */
function indexWarriors(state: EntityIndexState, add: AddWarrior): void {
  const rivals = state.rivals ?? [];
  for (let i = rivals.length - 1; i >= 0; i--) {
    const rival = rivals[i];
    if (!rival) continue;
    const stableName = rival.owner?.stableName ?? 'Unknown Stable';
    const roster = rival.roster ?? [];
    for (let j = roster.length - 1; j >= 0; j--) {
      add(roster[j], 'Rival', stableName);
    }
  }
  const retired = state.retired ?? [];
  for (let i = retired.length - 1; i >= 0; i--) add(retired[i], 'Retired', 'Hall of Fame');
  const graveyard = state.graveyard ?? [];
  for (let i = graveyard.length - 1; i >= 0; i--) add(graveyard[i], 'Fallen', 'Graveyard');
  const playerStable = state.player?.stableName ?? 'Your Stable';
  const roster = state.roster ?? [];
  for (let i = roster.length - 1; i >= 0; i--) add(roster[i], 'Yours', playerStable);
}

/** Stables — rival id is the canonical route param (findStableId contract). */
function indexStables(
  state: EntityIndexState,
  corpusById: Map<string, SearchEntry>,
  stableIdByName: Map<string, string>,
  stableNameById: Map<string, string>
): void {
  const rivals = state.rivals ?? [];
  for (let i = rivals.length - 1; i >= 0; i--) {
    const rival = rivals[i];
    if (!rival?.owner || !rival.id) continue;
    stableIdByName.set(rival.owner.stableName, rival.id);
    stableNameById.set(rival.id, rival.owner.stableName);
    corpusById.set(
      `stable:${rival.id}`,
      stableEntry({
        id: rival.id,
        name: rival.owner.stableName,
        ownerName: rival.owner.name,
        meta: [rival.tier, rival.philosophy, rival.owner.personality]
          .filter(Boolean)
          .join(' · '),
        badge: 'Rival',
        to: `/world/stable/${rival.id}`,
      })
    );
  }
  if (state.player) {
    stableIdByName.set(state.player.stableName, state.player.id);
    stableNameById.set(state.player.id, state.player.stableName);
    corpusById.set(
      `stable:${state.player.id}`,
      stableEntry({
        id: state.player.id,
        name: state.player.stableName,
        ownerName: state.player.name,
        meta: 'Your Stable',
        badge: 'Yours',
        to: '/stable/roster',
      })
    );
  }
}

/** Promoters + trainers — flat corpus entries, no lookup maps. */
function indexPeople(state: EntityIndexState, corpusById: Map<string, SearchEntry>): void {
  for (const p of Object.values(state.promoters ?? {})) {
    if (!p) continue;
    corpusById.set(`promoter:${p.id}`, {
      type: 'promoter',
      id: p.id,
      name: p.name,
      searchText: [p.name, p.tier ?? '', p.personality ?? ''].join(' ').toLowerCase(),
      subtitle: `${p.tier ?? 'Local'} Promoter`,
      to: `/stable/promoter/${p.id}`,
    });
  }

  for (const t of state.trainers ?? []) {
    if (!t) continue;
    corpusById.set(`trainer:${t.id}`, {
      type: 'trainer',
      id: t.id,
      name: t.name,
      searchText: [t.name, t.tier ?? '', t.focus ?? '', t.specialty ?? '']
        .join(' ')
        .toLowerCase(),
      subtitle: `${t.tier ?? 'Novice'} Trainer`,
      to: '/stable/trainers',
    });
  }
}

function buildIndex(state: EntityIndexState): EntityIndex {
  const warriorById = new Map<string, Warrior>();
  const warriorByName = new Map<string, Warrior>();
  const corpusById = new Map<string, SearchEntry>();
  const stableIdByName = new Map<string, string>();
  const stableNameById = new Map<string, string>();

  // Last-write-wins precedence for the maps: rivals < retired < graveyard <
  // roster. Corpus entries dedupe by id through the same ordering, so the
  // highest-precedence bucket also owns the search result.
  indexWarriors(state, (w, bucket, stable) => {
    if (!w) return;
    warriorById.set(w.id as string, w as Warrior);
    warriorByName.set(w.name, w as Warrior);
    corpusById.set(`warrior:${w.id}`, warriorEntry(w, bucket, stable));
  });
  indexStables(state, corpusById, stableIdByName, stableNameById);
  indexPeople(state, corpusById);

  return {
    warriorById,
    warriorByName,
    stableIdByName,
    stableNameById,
    corpus: [...corpusById.values()],
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Returns the cached per-state entity index, building it on first access. */
export function ensureEntityIndex(state: EntityIndexState | GameState): EntityIndex {
  const cached = indexCache.get(state as object);
  if (cached) return cached;
  const index = buildIndex(state);
  indexCache.set(state as object, index);
  return index;
}

/**
 * The shared warrior id → warrior map (roster + graveyard + retired + rival
 * rosters). Read-only — callers needing a mutable map must copy it.
 */
export function getWarriorIndex(state: EntityIndexState | GameState): Map<string, Warrior> {
  return ensureEntityIndex(state).warriorById;
}

const EXACT = 0;
const NAME_PREFIX = 1;
const WORD_PREFIX = 2;
const SUBSTRING = 3;

/** Ranked substring search over the entity corpus. */
export function searchEntities(
  state: EntityIndexState | GameState,
  query: string,
  limit = 12
): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { corpus } = ensureEntityIndex(state);
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of corpus) {
    const name = entry.name.toLowerCase();
    let score = -1;
    if (name === q) score = EXACT;
    else if (name.startsWith(q)) score = NAME_PREFIX;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = WORD_PREFIX;
    else if (entry.searchText.includes(q)) score = SUBSTRING;
    if (score >= 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name));
  return scored.slice(0, limit).map((s) => s.entry);
}
