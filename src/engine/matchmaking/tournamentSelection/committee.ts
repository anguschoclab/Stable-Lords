import type {
  GameState,
  Warrior,
  TournamentEntry,
  TournamentBout,
  Season,
} from '@/types/state.types';
import { FightingStyle, type TournamentId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { committeeWeatherSkip } from '@/engine/ai/weatherSuitability';
import { generateFreelancer } from './utils';
import { isActive } from '@/engine/warriorStatus';

/**
 * Committee selection.
 */
export function committeeSelection(
  state: GameState,
  tier: string,
  seed: number,
  lockedIds: Set<string>
): { warriors: Warrior[]; updatedLockedIds: Set<string> } {
  const rng = new SeededRNG(seed);
  const rankings = state.realmRankings || {};
  const qualified: Warrior[] = [];
  const newLocks = new Set<string>();

  // Gather all active, unlocked warriors
  const pool: { w: Warrior; rank: number; score: number }[] = [];

  const collect = (roster: Warrior[], stable?: (typeof state.rivals)[number]) => {
    // G13 decline hook: a stable in crisis (RECOVERY/SURVIVAL intent) declines
    // tournament conscription for its warriors — agency over preparation,
    // not over selection math.
    const declines =
      stable?.strategy?.intent === 'RECOVERY' || stable?.strategy?.intent === 'SURVIVAL';
    if (declines) return;
    for (const w of roster) {
      if (!isActive(w)) continue;
      if (!lockedIds.has(w.id)) {
        // 🌩️ Tournament Entry Skepticism: Weather Check — consolidated gate (G16)
        if (committeeWeatherSkip(w, state.weather)) continue;

        const r = rankings[w.id];
        if (r) pool.push({ w, rank: r.overallRank, score: r.compositeScore });
      }
    }
  };

  collect(state.roster);
  state.rivals.forEach((r) => collect(r.roster, r));

  // Sort pool by rank
  const sortedPool = pool.sort((a, b) => a.rank - b.rank);

  // 1. Mandatory Invites (Top 40 of available)
  const top40 = sortedPool.slice(0, 40);
  top40.forEach((p) => {
    qualified.push(p.w);
    newLocks.add(p.w.id);
  });

  // 2. Style Champions Auto-Bid (Top 1 of each style not yet invited)
  // Single pass over the rank-sorted pool: first unlocked entry per style is
  // that style's champion. Equivalent to a per-style find() — warriors carry
  // exactly one style, so a lead locked for one style can never lead another.
  const styleLeads = new Map<FightingStyle, (typeof sortedPool)[number]>();
  for (const p of sortedPool) {
    if (newLocks.has(p.w.id)) continue;
    if (!styleLeads.has(p.w.style)) styleLeads.set(p.w.style, p);
  }
  for (const style of Object.values(FightingStyle)) {
    if (qualified.length >= 50) break;
    const lead = styleLeads.get(style);
    if (lead && !newLocks.has(lead.w.id)) {
      qualified.push(lead.w);
      newLocks.add(lead.w.id);
    }
  }

  // 3. Bubble Watch (Fill to 64 from the next 40 candidates)
  const remainingNeeded = 64 - qualified.length;
  const bubblePool = sortedPool.filter((p) => !newLocks.has(p.w.id)).slice(0, 40);
  const shuffledBubble = rng.shuffle(bubblePool);

  shuffledBubble.slice(0, remainingNeeded).forEach((p) => {
    qualified.push(p.w);
    newLocks.add(p.w.id);
  });

  // 4. Emergency Fillers (If world population is decimated)
  if (qualified.length < 64) {
    const fillersNeeded = 64 - qualified.length;
    for (let i = 0; i < fillersNeeded; i++) {
      const freelancer = generateFreelancer(tier, i, rng);
      qualified.push(freelancer);
    }
  }

  return { warriors: qualified.slice(0, 64), updatedLockedIds: newLocks };
}

/**
 * Build tournament.
 */
export function buildTournament(
  tierId: string,
  tierName: string,
  warriors: Warrior[],
  week: number,
  season: Season,
  rng: SeededRNG,
  year = 1
): TournamentEntry {
  // The year must be in the id: the same season+week recurs annually, and a
  // year-2 tournament sharing an id with a completed year-1 entry makes every
  // find-by-id resolution target the stale one.
  const id = `t-${tierId.toLowerCase()}-${season.toLowerCase()}-y${year}-w${week}` as TournamentId;
  const shuffled = rng.shuffle([...warriors]);
  const bracket: TournamentBout[] = [];

  for (let i = 0; i < shuffled.length && i < 64; i += 2) {
    const wA = shuffled[i];
    const wD = shuffled[i + 1];
    if (!wA || !wD) break;
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      warriorIdA: wA.id,
      warriorIdD: wD.id,
      stableIdA: wA.stableId,
      stableIdD: wD.stableId,
    });
  }

  return {
    id,
    season,
    week,
    tierId,
    name: tierName,
    bracket,
    participants: warriors,
    completed: false,
  };
}
