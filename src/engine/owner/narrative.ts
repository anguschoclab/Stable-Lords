import type { GameState } from '@/types/state.types';
import type { Season } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getRecentFights } from '@/engine/core/historyUtils';
import { resolveRng } from '@/utils/random';
import { getStablePairKey } from '@/utils/keyUtils';

/**
 * Generate personality-driven gazette events based on recent performance.
 * Runs once per season change.
 */
export function generateOwnerNarratives(
  state: GameState,
  newSeason: Season,
  rng?: IRNGService
): string[] {
  const rngService = resolveRng(rng, state.week * 7919 + 7);
  if (newSeason === state.season) return [];

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);
  const rivals = state.rivals || [];

  for (const rival of rivals) {
    gazetteItems.push(...rivalSeasonNarratives(rival, recentFights, state.season, rngService));
  }

  // Add Blood Feud public taunts for player rivalry
  const rivalryMap = new Map(
    (state.rivalries || []).map((rv) => [getStablePairKey(rv.stableIdA, rv.stableIdB), rv])
  );
  for (const rival of rivals) {
    const rivalry = rivalryMap.get(getStablePairKey(state.player.id, rival.owner.id));

    if (rivalry && rivalry.intensity >= 4 && rngService.next() < 0.25) {
      const tauntTemplates = [
        `"${state.player.stableName} is a disgrace to the sands. I will see them bleed," vows ${rival.owner.name} (${rival.owner.stableName}).`,
        `${rival.owner.name} (${rival.owner.stableName}) issues a public challenge: "My warriors will hunt down the dogs of ${state.player.stableName}."`,
        `"The feud with ${state.player.stableName} ends when their stable is ash," declares ${rival.owner.name}.`,
        `Public Grudge: ${rival.owner.name} (${rival.owner.stableName}) was heard mocking the recent performances of ${state.player.stableName}.`,
      ];
      gazetteItems.push(rngService.pick(tauntTemplates));
    }
  }

  return gazetteItems;
}

/** Personality-driven gazette lines for one rival's just-finished season. */
function rivalSeasonNarratives(
  rival: GameState['rivals'][number],
  recentFights: FightSummary[],
  season: Season,
  rngService: IRNGService
): string[] {
  const items: string[] = [];
  const personality = rival.owner.personality ?? 'Pragmatic';
  const ids = new Set(rival.roster.map((w) => w.id));

  const { wins, losses, kills, deaths } = calculateRecentRecord(recentFights, ids);

  const totalFights = wins + losses;
  if (totalFights === 0) return items;
  const winRate = wins / totalFights;

  // Aggressive owner losing badly
  if (personality === 'Aggressive' && winRate < 0.35 && totalFights >= 4) {
    const templates = [
      `${rival.owner.name} (${rival.owner.stableName}) rages: "Heads will roll if results don't improve!"`,
      `${rival.owner.name} fires ${rival.owner.stableName}'s head trainer after a dismal ${season}!`,
      `${rival.owner.name} declares: "Next season, we fight with fury or not at all!"`,
    ];
    items.push(rngService.pick(templates));
  }

  // Methodical owner on a winning streak
  if (personality === 'Methodical' && winRate >= 0.7 && totalFights >= 4) {
    items.push(
      `${rival.owner.name} (${rival.owner.stableName}): "Our preparation is paying dividends — ${wins}W/${losses}L this ${season}."`
    );
  }

  // Showman with lots of kills
  if (personality === 'Showman' && kills >= 2) {
    items.push(
      `${rival.owner.name} (${rival.owner.stableName}) boasts: "${kills} kills this ${season}! The crowd demands blood, and we deliver!"`
    );
  }

  // Pragmatic owner suffering deaths
  if (personality === 'Pragmatic' && deaths >= 2) {
    items.push(
      `${rival.owner.name} (${rival.owner.stableName}) grimly assesses: "${deaths} warriors lost this ${season}. Costs are unsustainable."`
    );
  }

  // Tactician dominating
  if (personality === 'Tactician' && winRate >= 0.65 && kills === 0 && totalFights >= 3) {
    items.push(
      `${rival.owner.name} (${rival.owner.stableName}): "Clean victories, no unnecessary bloodshed — ${wins}W/${losses}L. Strategy prevails."`
    );
  }

  // Any owner with a dominant season
  if (winRate >= 0.8 && totalFights >= 5) {
    items.push(
      `${rival.owner.stableName} dominated ${season} with a record of ${wins}-${losses}!`
    );
  }

  // Any owner with devastating losses
  if (deaths >= 3) {
    items.push(
      `A grim ${season} for ${rival.owner.stableName} — ${deaths} warriors fell in the arena.`
    );
  }

  return items;
}

function calculateRecentRecord(recentFights: FightSummary[], rosterIds: Set<string>) {
  let wins = 0,
    losses = 0,
    kills = 0,
    deaths = 0;
  for (const f of recentFights) {
    const isA = rosterIds.has(f.warriorIdA),
      isD = rosterIds.has(f.warriorIdD);
    if (isA || isD) {
      const isWin = (isA && f.winner === 'A') || (isD && f.winner === 'D');
      const isLoss = (isA && f.winner === 'D') || (isD && f.winner === 'A');
      if (isWin) wins++;
      if (isLoss) losses++;
      if (f.by === 'Kill') {
        if (isWin) kills++;
        if (isLoss) deaths++;
      }
    }
  }
  return { wins, losses, kills, deaths };
}
