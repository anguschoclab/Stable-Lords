/**
 * Pure builder that distills a resolved FightOutcome into the handful of
 * factors that actually decided the bout. Consumed by FightAnalysisPanel and
 * persisted onto FightSummary so historical fights can explain themselves.
 */
import type { FightOutcome, ExchangeLogEntry } from '@/types/combat.types';
import { getMatchupBonus } from '@/constants/combat/combat';
import {
  DEBRIEF_ENCUMBRANCE_DRAG_RATIO,
  DEBRIEF_OUT_JUMP_INI_EDGE,
  DEBRIEF_OUT_JUMP_MIN_EXCHANGES,
  DEBRIEF_OUT_JUMP_LOSS_RATE,
  DEBRIEF_WEAPON_MIN_SWINGS,
  DEBRIEF_WEAPON_HIT_RATE_FLOOR,
  DEBRIEF_LEARN_XP_GAP,
} from '@/constants/combat/combat/meta';
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
  /** Committed plan axes — the AL the manager asked for. */
  plan?: { al?: number };
  /** Loadout drag (derivedStats.encumbrance). */
  encumbrance?: number;
  /** Endurance pool (derivedStats.endurance). */
  endurance?: number;
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

/**
 * Manager's Notebook factors — the guide's post-fight review checklist:
 * encumbrance drag, weapon work, out-jumped, learning, corner plan-shifts.
 * Each producer is silent unless its diagnostic threshold is met.
 */
function buildDebriefFactors(
  log: ExchangeLogEntry[],
  outcome: FightOutcome,
  fatigue: ReturnType<typeof findFatigueCrossover>,
  warriorA: AnalysisWarrior,
  warriorD: AnalysisWarrior
): AnalysisFactor[] {
  const factors: AnalysisFactor[] = [];
  const sides = [
    { w: warriorA, side: 'A' as const, opp: 'D' as const },
    { w: warriorD, side: 'D' as const, opp: 'A' as const },
  ];

  // Encumbrance drag — the fatigued fighter was carrying too much.
  for (const s of sides) {
    if (fatigue.fatiguedSide !== s.side) continue;
    const enc = s.w.encumbrance ?? 0;
    const end = s.w.endurance ?? 0;
    if (end > 0 && enc >= end * DEBRIEF_ENCUMBRANCE_DRAG_RATIO) {
      factors.push({
        label: 'Encumbrance',
        detail: `${s.w.name} was dragged down by their loadout — heavy gear bled endurance faster than the plan expected.`,
        favored: s.opp,
        weight: 0.4,
      });
    }
  }

  // Weapon work — "did they hit when they swung, and crit?" Swing attempts
  // from attResult (attributed to iniWinner like summarizeTale), crits from
  // the weapon charting ledger.
  const critsFor = (side: 'A' | 'D') => {
    const chart = side === 'A' ? outcome.post?.weaponChartA : outcome.post?.weaponChartD;
    return Object.values(chart ?? {}).reduce((n, e) => n + (e.crits ?? 0), 0);
  };
  for (const s of sides) {
    let attempts = 0;
    let hits = 0;
    for (const e of log) {
      if ((e.iniWinner ?? 'A') !== s.side) continue;
      if (e.attResult === 'hit' || e.attResult === 'crit') {
        attempts++;
        hits++;
      } else if (e.attResult === 'miss' || e.attResult === 'fumble') {
        attempts++;
      }
    }
    if (attempts < DEBRIEF_WEAPON_MIN_SWINGS) continue;
    if (hits / attempts < DEBRIEF_WEAPON_HIT_RATE_FLOOR && critsFor(s.side) === 0) {
      factors.push({
        label: 'Weapon work',
        detail: `${s.w.name} landed ${hits} of ${attempts} swings with no critical hits — consider a weapon change.`,
        favored: s.opp,
        weight: 0.45,
      });
    }
  }

  // Out-jumped — the faster fighter kept losing the initiative roll.
  const iniExchanges = log.filter((e) => e.iniWinner !== undefined);
  if (iniExchanges.length >= DEBRIEF_OUT_JUMP_MIN_EXCHANGES) {
    for (const s of sides) {
      const oppSkills = (s.side === 'A' ? warriorD : warriorA).skills;
      const edge = (s.w.skills.INI ?? 0) - (oppSkills.INI ?? 0);
      if (edge < DEBRIEF_OUT_JUMP_INI_EDGE) continue;
      const lost = iniExchanges.reduce((n, e) => n + (e.iniWinner !== s.side ? 1 : 0), 0);
      if (lost / iniExchanges.length > DEBRIEF_OUT_JUMP_LOSS_RATE) {
        factors.push({
          label: 'Initiative',
          detail: `${s.w.name} held a ${edge}-point INI edge but was out-jumped ${lost} of ${iniExchanges.length} exchanges — check weapon speed or opening OE.`,
          favored: s.opp,
          weight: 0.35,
        });
      }
    }
  }

  // Learning — who took the bigger lesson.
  const xpA = outcome.post?.xpA ?? 0;
  const xpD = outcome.post?.xpD ?? 0;
  if (Math.abs(xpA - xpD) >= DEBRIEF_LEARN_XP_GAP) {
    const winner = xpA > xpD ? warriorA : warriorD;
    factors.push({
      label: 'Learning',
      detail: `${winner.name} took the bigger lesson from the bout (+${Math.max(xpA, xpD)} XP).`,
      favored: xpA > xpD ? 'A' : 'D',
      weight: 0.15,
    });
  }

  // Corner plan-shifts — which triggers actually fired mid-fight.
  const fired: Record<'A' | 'D', string[]> = { A: [], D: [] };
  for (const e of log) {
    if (e.conditionFire) fired[e.conditionFire.actor].push(e.conditionFire.trigger);
  }
  const parts = sides
    .filter((s) => fired[s.side].length > 0)
    .map((s) => `${s.w.name}'s corner shifted plan ${fired[s.side].length}× (${fired[s.side][0]})`);
  if (parts.length > 0) {
    factors.push({ label: 'Corner', detail: `${parts.join('; ')}.`, favored: null, weight: 0.2 });
  }

  return factors;
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

  factors.push(
    ...buildDebriefFactors(outcome.exchangeLog ?? [], outcome, ctx.fatigue, warriorA, warriorD)
  );

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
