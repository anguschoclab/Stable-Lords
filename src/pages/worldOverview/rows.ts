import { isActive } from '@/engine/warrior/warriorStatus';
import type { Warrior, RivalStableData } from '@/types/game';
import type { StableRow, WarriorRow } from '@/types/leaderboard';
import type { getStableTemplates } from '@/engine/rivals';

/** Sortable fields on the stable leaderboard rows. */
export type StableSortField =
  'rank' | 'name' | 'fame' | 'wins' | 'losses' | 'kills' | 'winRate' | 'roster' | 'tier';
/** Sortable fields on the warrior leaderboard rows. */
export type WarriorSortField =
  | 'name' | 'stable' | 'fame' | 'wins' | 'losses' | 'kills'
  | 'winRate' | 'style' | 'officialRank' | 'compositeScore';
type SortDir = 'asc' | 'desc';

interface WorldSlice {
  roster: Warrior[];
  player: { id: string; name: string; stableName: string };
  rivals: RivalStableData[] | undefined;
  fame: number;
  realmRankings?: Record<string, { overallRank: number; compositeScore: number } | undefined>;
}

/** Builds the stable league table (player first row, then rivals), sorted. */
export function buildStableRows(
  state: WorldSlice,
  sort: { field: StableSortField; dir: SortDir },
  templates: ReturnType<typeof getStableTemplates>
): StableRow[] {
  const rows: StableRow[] = [];
  let pWins = 0;
  let pLosses = 0;
  let pKills = 0;
  for (const w of state.roster) {
    pWins += w.career.wins;
    pLosses += w.career.losses;
    pKills += w.career.kills;
  }
  let pActive = 0;
  for (const w of state.roster) {
    if (isActive(w)) pActive++;
  }
  const pTotal = pWins + pLosses;

  rows.push({
    id: state.player.id,
    name: state.player.stableName,
    ownerName: state.player.name,
    fame: state.fame,
    wins: pWins,
    losses: pLosses,
    kills: pKills,
    winRate: pTotal > 0 ? Math.round((pWins / pTotal) * 100) : 0,
    roster: pActive,
    tier: 'Player',
    motto: '',
    isPlayer: true,
  });

  for (const r of state.rivals || []) {
    let rWins = 0;
    let rLosses = 0;
    let rKills = 0;
    let rActive = 0;
    for (const w of r.roster) {
      rWins += w.career.wins;
      rLosses += w.career.losses;
      rKills += w.career.kills;
      if (isActive(w)) rActive++;
    }
    const rTotal = rWins + rLosses;
    const tmpl = templates.find((t) => t.stableName === r.owner.stableName);
    rows.push({
      id: r.owner.id,
      name: r.owner.stableName,
      ownerName: r.owner.name,
      fame: r.owner.fame,
      wins: rWins,
      losses: rLosses,
      kills: rKills,
      winRate: rTotal > 0 ? Math.round((rWins / rTotal) * 100) : 0,
      roster: rActive,
      tier: r.tier || 'Minor',
      motto: tmpl?.motto ?? '',
      isPlayer: false,
    });
  }

  return rows.sort((a, b) => {
    const f = sort.field;
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (f === 'name') return a.name.localeCompare(b.name) * dir;
    if (f === 'tier') return a.tier.localeCompare(b.tier) * dir;
    const va = a[f as keyof StableRow] as number;
    const vb = b[f as keyof StableRow] as number;
    return (va - vb) * dir;
  });
}

/** Builds the realm-wide warrior leaderboard rows, sorted (rank-pinned default). */
export function buildWarriorRows(
  state: WorldSlice,
  sort: { field: WarriorSortField; dir: SortDir }
): WarriorRow[] {
  const mapWarrior = (
    w: Warrior,
    stableName: string,
    stableId: string,
    isPlayer: boolean
  ): WarriorRow => {
    const total = w.career.wins + w.career.losses;
    const ranking = state.realmRankings?.[w.id];
    return {
      id: w.id,
      name: w.name,
      stableName,
      stableId,
      fame: w.fame,
      wins: w.career.wins,
      losses: w.career.losses,
      kills: w.career.kills,
      winRate: total > 0 ? Math.round((w.career.wins / total) * 100) : 0,
      style: w.style,
      isPlayer,
      officialRank: ranking?.overallRank || 999,
      compositeScore: ranking?.compositeScore || 0,
    };
  };

  const rows: WarriorRow[] = [];
  for (const w of state.roster) {
    if (isActive(w)) {
      rows.push(mapWarrior(w, state.player.stableName, state.player.id, true));
    }
  }

  if (state.rivals) {
    for (const r of state.rivals) {
      const rRoster = r.roster;
      const rName = r.owner.stableName;
      const rId = r.owner.id;
      for (const w of rRoster) {
        if (isActive(w)) {
          rows.push(mapWarrior(w, rName, rId, false));
        }
      }
    }
  }

  // Sort by official rank by default, or the selected field
  return rows.sort((a, b) => {
    const f = sort.field;
    const dir = sort.dir === 'asc' ? 1 : -1;

    // If default (fame), use official rank instead for better meritocracy
    if (f === 'fame' && dir === -1) {
      return a.officialRank - b.officialRank;
    }

    if (f === 'name' || f === 'stable' || f === 'style') {
      const va = f === 'stable' ? a.stableName : a[f as keyof WarriorRow];
      const vb = f === 'stable' ? b.stableName : b[f as keyof WarriorRow];
      return String(va).localeCompare(String(vb)) * dir;
    }
    return ((a[f as keyof WarriorRow] as number) - (b[f as keyof WarriorRow] as number)) * dir;
  });
}
