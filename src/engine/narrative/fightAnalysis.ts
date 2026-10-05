/**
 * Pure builder that distills a resolved FightOutcome into the handful of
 * factors that actually decided the bout. Consumed by FightAnalysisPanel and
 * persisted onto FightSummary so historical fights can explain themselves.
 */
import type { FightOutcome, ExchangeLogEntry } from '@/types/combat.types';
import { getMatchupBonus } from '@/constants/combat/combat';
import type { FightingStyle, Attributes, BaseSkills } from '@/types/shared.types';

/** A single ranked, human-readable reason the fight went the way it did. */
export interface AnalysisFactor {
  /** Short label, e.g. "Style matchup". */
  label: string;
  /** One-sentence plain-English explanation. */
  detail: string;
  /** 'A' | 'D' | null — who this factor favored. */
  favored: 'A' | 'D' | null;
  /** Relative weight 0..1 used only for ordering. */
  weight: number;
}

/**
 *
 */
export interface FightAnalysis {
  styleMatchup: { styleA: string; styleD: string; edge: number };
  decisiveExchange: {
    index: number | null;
    minute: number | null;
    reasonCodes: string[];
    summary: string;
  };
  fatigue: { fatiguedSide: 'A' | 'D' | null; crossoverExchange: number | null };
  tale: {
    hitsA: number;
    hitsD: number;
    damageA: number;
    damageD: number;
    ripostesA: number;
    ripostesD: number;
  };
  factors: AnalysisFactor[];
}

/**
 *
 */
interface AnalysisWarrior {
  id: string;
  name: string;
  style: string;
  attributes: Attributes;
  skills: BaseSkills;
}

function summarizeTale(log: ExchangeLogEntry[]) {
  let hitsA = 0;
  let hitsD = 0;
  let damageA = 0;
  let damageD = 0;
  let ripostesA = 0;
  let ripostesD = 0;
  for (const e of log) {
    const dmg = e.damage ?? 0;
    const hit = e.attResult === 'hit' || e.attResult === 'crit';
    // attacker side per exchange is whoever won initiative when recorded; fall back to iniWinner
    // NOTE: This is an approximation. If ExchangeLogEntry later gains an explicit attackerSide, switch to it.
    const side = e.iniWinner ?? 'A';
    if (hit) {
      if (side === 'A') {
        hitsA += 1;
        damageA += dmg;
      } else {
        hitsD += 1;
        damageD += dmg;
      }
    }
    if (e.ripResult === 'hit') {
      if (side === 'A') ripostesD += 1;
      else ripostesA += 1;
    }
  }
  return { hitsA, hitsD, damageA, damageD, ripostesA, ripostesD };
}

function findFatigueCrossover(log: ExchangeLogEntry[]): {
  fatiguedSide: 'A' | 'D' | null;
  crossoverExchange: number | null;
} {
  let cumA = 0;
  let cumD = 0;
  for (const e of log) {
    cumA += e.endDeltas?.a ?? 0;
    cumD += e.endDeltas?.d ?? 0;
    const gap = cumA - cumD; // more negative = A more drained
    if (Math.abs(gap) >= 8) {
      return { fatiguedSide: gap < 0 ? 'A' : 'D', crossoverExchange: e.exchangeIndex };
    }
  }
  const finalGap = cumA - cumD;
  if (Math.abs(finalGap) >= 4) {
    return { fatiguedSide: finalGap < 0 ? 'A' : 'D', crossoverExchange: null };
  }
  return { fatiguedSide: null, crossoverExchange: null };
}

const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

function biggestSkillGap(
  a: AnalysisWarrior,
  d: AnalysisWarrior
): { skill: string; gap: number; favored: 'A' | 'D' } {
  let best = { skill: 'ATT', gap: 0, favored: 'A' as 'A' | 'D' };
  for (const k of SKILL_KEYS) {
    const gap = (a.skills[k] ?? 0) - (d.skills[k] ?? 0);
    if (Math.abs(gap) > Math.abs(best.gap)) {
      best = { skill: k, gap: Math.abs(gap), favored: gap >= 0 ? 'A' : 'D' };
    }
  }
  return best;
}

/** Ranked analysis factors: style edge, skill gap, fatigue, damage, outcome. */
function buildFactors(
  ctx: {
    edge: number;
    skillGap: ReturnType<typeof biggestSkillGap>;
    fatigue: ReturnType<typeof findFatigueCrossover>;
    tale: ReturnType<typeof summarizeTale>;
    decisiveExchangeSummary: string;
  },
  outcome: FightOutcome,
  warriorA: AnalysisWarrior,
  warriorD: AnalysisWarrior
): AnalysisFactor[] {
  const factors: AnalysisFactor[] = [];

  if (ctx.edge !== 0) {
    factors.push({
      label: 'Style matchup',
      detail: `${warriorA.style} vs ${warriorD.style} favored ${ctx.edge > 0 ? warriorA.name : warriorD.name} (${ctx.edge > 0 ? '+' : ''}${ctx.edge}).`,
      favored: ctx.edge > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(ctx.edge) / 4),
    });
  }

  if (ctx.skillGap.gap >= 3) {
    const who = ctx.skillGap.favored === 'A' ? warriorA.name : warriorD.name;
    factors.push({
      label: `${ctx.skillGap.skill} edge`,
      detail: `${who} held a ${ctx.skillGap.gap}-point ${ctx.skillGap.skill} advantage.`,
      favored: ctx.skillGap.favored,
      weight: Math.min(1, ctx.skillGap.gap / 8),
    });
  }

  if (ctx.fatigue.fatiguedSide) {
    const tiredName = ctx.fatigue.fatiguedSide === 'A' ? warriorA.name : warriorD.name;
    factors.push({
      label: 'Endurance',
      detail:
        ctx.fatigue.crossoverExchange != null
          ? `${tiredName} began gassing out around exchange ${ctx.fatigue.crossoverExchange}.`
          : `${tiredName} finished the more drained fighter.`,
      favored: ctx.fatigue.fatiguedSide === 'A' ? 'D' : 'A',
      weight: 0.5,
    });
  }

  const dmgGap = ctx.tale.damageA - ctx.tale.damageD;
  if (Math.abs(dmgGap) >= 4) {
    factors.push({
      label: 'Damage output',
      detail: `${dmgGap > 0 ? warriorA.name : warriorD.name} dealt ${Math.abs(dmgGap)} more total damage.`,
      favored: dmgGap > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(dmgGap) / 20),
    });
  }

  factors.push({
    label: 'Outcome',
    detail: ctx.decisiveExchangeSummary,
    favored: outcome.winner,
    weight: 0.1,
  });

  factors.sort((x, y) => y.weight - x.weight);
  return factors.slice(0, 5);
}

/**
 *
 */
export function buildFightAnalysis(
  outcome: FightOutcome,
  warriorA: AnalysisWarrior,
  warriorD: AnalysisWarrior
): FightAnalysis {
  const log = outcome.exchangeLog ?? [];
  const edge = getMatchupBonus(warriorA.style as FightingStyle, warriorD.style as FightingStyle);

  const fatalIdx = outcome.post?.fatalExchangeIndex ?? null;
  const decisiveEntry =
    fatalIdx != null ? (log.find((e) => e.exchangeIndex === fatalIdx) ?? null) : null;

  const tale = summarizeTale(log);
  const fatigue = findFatigueCrossover(log);
  const skillGap = biggestSkillGap(warriorA, warriorD);

  const winnerName =
    outcome.winner === 'A' ? warriorA.name : outcome.winner === 'D' ? warriorD.name : 'No one';

  const decisiveExchange = {
    index: decisiveEntry?.exchangeIndex ?? null,
    minute: decisiveEntry?.minute ?? null,
    reasonCodes: decisiveEntry?.reasonCodes ?? [],
    summary:
      decisiveEntry != null
        ? `The bout broke open at minute ${decisiveEntry.minute} (exchange ${decisiveEntry.exchangeIndex}).`
        : `${winnerName} won by ${outcome.by ?? 'decision'}.`,
  };

  const ranked = buildFactors(
    { edge, skillGap, fatigue, tale, decisiveExchangeSummary: decisiveExchange.summary },
    outcome,
    warriorA,
    warriorD
  );

  return {
    styleMatchup: { styleA: warriorA.style, styleD: warriorD.style, edge },
    decisiveExchange,
    fatigue,
    tale,
    factors: ranked,
  };
}
