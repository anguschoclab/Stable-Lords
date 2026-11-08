/**
 * Season record rollup — turns persisted FightSummary outcomes into the
 * per-stable W/L/K record that intent selection reads (previously dead state:
 * the record was reset at week 1 but never incremented).
 */
import type { RivalStableData, FightSummary } from '@/types/state.types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { logAgentAction } from '@/engine/ai/agentCore';
import { recordPlanOutcome, cloneStrategyMemory } from '@/engine/ai/plan/strategyLab';

type SeasonRecord = NonNullable<import('@/types/state.types').AIAgentMemory['seasonRecord']>;

const freshRecord = (rival: RivalStableData): SeasonRecord => ({
  wins: 0,
  losses: 0,
  kills: 0,
  rosterSizeAtSeasonStart: rival.roster.reduce((count, w) => (isActive(w) ? count + 1 : count), 0),
});

/** The analysis factor the debrief credited against this stable's side. */
function opponentFavoredFactor(
  fight: FightSummary,
  side: 'A' | 'D'
): string | undefined {
  const opp = side === 'A' ? 'D' : 'A';
  return fight.analysis?.factors.find((f) => f.favored === opp)?.label;
}

/** Which side of a fight belongs to this stable, if any. */
function sideFor(rival: RivalStableData, fight: FightSummary): 'A' | 'D' | null {
  for (const w of rival.roster) {
    if (w.id === fight.warriorIdA) return 'A';
    if (w.id === fight.warriorIdD) return 'D';
  }
  return null;
}

/**
 * Accumulate this week's bout outcomes into agentMemory.seasonRecord.
 * At the week-1 season boundary the prior record is preserved on
 * `lastSeasonRecord` before the new record starts counting.
 */
export function updateSeasonRecord(
  rival: RivalStableData,
  weekFights: FightSummary[],
  week: number
): RivalStableData {
  const memory = rival.agentMemory;
  if (!memory) return rival;

  let record = memory.seasonRecord;
  const lastSeasonRecord = week === 1 ? record : memory.lastSeasonRecord;
  if (week === 1 || !record) record = freshRecord(rival);

  const next = { ...record };
  for (const fight of weekFights) {
    const side = sideFor(rival, fight);
    if (!side || !fight.winner) continue;
    if (fight.winner === side) {
      next.wins++;
      if (fight.by === 'Kill') next.kills++;
    } else {
      next.losses++;
    }
  }

  return {
    ...rival,
    agentMemory: {
      ...memory,
      seasonRecord: next,
      ...(lastSeasonRecord ? { lastSeasonRecord } : {}),
    },
  };
}

/**
 * Appends a typed 'BOUT' rollup event to actionHistory (one per week the
 * stable actually fought) and maintains `lastLossFactors` — the labels of
 * the top factors that decided recent losses, capped at 3.
 */
export function recordBoutOutcome(
  rival: RivalStableData,
  weekFights: FightSummary[],
  week: number
): RivalStableData {
  const fights = weekFights.filter((f) => sideFor(rival, f) !== null);
  if (fights.length === 0) return rival;

  let wins = 0;
  let losses = 0;
  let kills = 0;
  const lossFactors: string[] = [];
  for (const fight of fights) {
    const side = sideFor(rival, fight);
    if (!side) continue;
    if (fight.winner === side) {
      wins++;
      if (fight.by === 'Kill') kills++;
    } else if (fight.winner) {
      losses++;
      const factor = fight.analysis?.factors.find((f) => f.favored === (side === 'A' ? 'D' : 'A'));
      lossFactors.push(factor?.label ?? fight.by ?? 'Unknown');
    }
  }

  // Strategy Lab: score each fighter's plan cell against this week's outcome.
  // The ledger is what `pickStrategyTarget` exploits/probes next week.
  // Loss factors are also filed per-warrior (`recentLossFactors`) — the
  // turnaround engine's "why am I losing" ledger.
  const rosterById = new Map(rival.roster.map((x) => [String(x.id), x]));
  const outcomes = new Map<string, { oe: number; al: number; won: boolean }[]>();
  const lossFactorByWarrior = new Map<string, string>();
  for (const fight of fights) {
    const side = sideFor(rival, fight);
    if (!side) continue;
    const wid = String(side === 'A' ? fight.warriorIdA : fight.warriorIdD);
    const w = rosterById.get(wid);
    if (fight.winner && fight.winner !== side) {
      const factor = opponentFavoredFactor(fight, side);
      lossFactorByWarrior.set(wid, factor ?? fight.by ?? 'Unknown');
    }
    if (!w?.plan) continue;
    const list = outcomes.get(wid) ?? [];
    outcomes.set(wid, list);
    list.push({
      oe: w.plan.OE ?? 5,
      al: w.plan.AL ?? 5,
      won: fight.winner === side,
    });
  }
  const touched = new Set([...outcomes.keys(), ...lossFactorByWarrior.keys()]);
  const roster = touched.size
    ? rival.roster.map((w) => {
        const wid = String(w.id);
        if (!touched.has(wid)) return w;
        const memory = cloneStrategyMemory(w.strategyMemory);
        for (const o of outcomes.get(wid) ?? []) {
          recordPlanOutcome(memory, o.oe, o.al, o.won);
        }
        const thisLoss = lossFactorByWarrior.get(wid);
        if (thisLoss) {
          memory.recentLossFactors = [thisLoss, ...(memory.recentLossFactors ?? [])].slice(0, 5);
        }
        return { ...w, strategyMemory: memory };
      })
    : rival.roster;

  const summary = `Week ${week}: ${wins}W-${losses}L${kills > 0 ? `, ${kills} kill${kills > 1 ? 's' : ''}` : ''}`;
  let out = logAgentAction({
    rival: { ...rival, roster },
    type: 'BOUT',
    description: summary,
    riskTier: 'Low',
    week: week,
    cause: 'BOUT_OUTCOME',
  });

  if (lossFactors.length > 0 && out.agentMemory) {
    const prior = out.agentMemory.lastLossFactors ?? [];
    out = {
      ...out,
      agentMemory: {
        ...out.agentMemory,
        lastLossFactors: [...lossFactors.reverse(), ...prior].slice(0, 3),
      },
    };
  }
  return out;
}
