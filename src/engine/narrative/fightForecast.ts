/**
 * Pure pre-fight forecast: predicts the decisive factors of a bout BEFORE it is
 * fought, using only information available pre-fight (styles, stats, readiness).
 * Mirrors buildFightAnalysis but without an exchangeLog. Reuses AnalysisFactor.
 */
import type { AnalysisFactor } from '@/engine/narrative/fightAnalysis';
import { getMatchupBonus } from '@/constants/combat/combat';
import type { FightingStyle, Attributes, BaseSkills } from '@/types/shared.types';

export interface FightForecast {
  opponentKnown: boolean;
  styleMatchup: { styleA: string; styleD: string | null; edge: number };
  factors: AnalysisFactor[];
}

/** Minimal structural view of a warrior the forecast needs. */
export interface ForecastWarrior {
  id: string;
  name: string;
  style: string;
  attributes: Attributes;
  baseSkills?: BaseSkills;
  injuries?: { severity?: string; weeksRemaining?: number }[];
}

const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];
const ZERO_SKILLS: BaseSkills = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 };

function biggestSkillGap(a: ForecastWarrior, d: ForecastWarrior) {
  const sa = a.baseSkills ?? ZERO_SKILLS;
  const sd = d.baseSkills ?? ZERO_SKILLS;
  let best = { skill: 'ATT' as string, gap: 0, favored: 'A' as 'A' | 'D' };
  for (const k of SKILL_KEYS) {
    const gap = (sa[k] ?? 0) - (sd[k] ?? 0);
    if (Math.abs(gap) > Math.abs(best.gap)) {
      best = { skill: k, gap: Math.abs(gap), favored: gap >= 0 ? 'A' : 'D' };
    }
  }
  return best;
}

function readinessRisk(w: ForecastWarrior): AnalysisFactor | null {
  const active = (w.injuries ?? []).filter((i) => (i.weeksRemaining ?? 0) > 0);
  if (active.length === 0) return null;
  const worst = active.some((i) => i.severity === 'Major' || i.severity === 'Severe');
  return {
    label: 'Readiness',
    detail: `${w.name} carries ${active.length} active injur${active.length === 1 ? 'y' : 'ies'}${worst ? ' (serious)' : ''} into this bout.`,
    favored: 'D',
    weight: worst ? 0.7 : 0.4,
  };
}

export function buildFightForecast(
  player: ForecastWarrior,
  opponent: ForecastWarrior | null
): FightForecast {
  const factors: AnalysisFactor[] = [];

  const edge = opponent
    ? getMatchupBonus(player.style as FightingStyle, opponent.style as FightingStyle)
    : 0;

  if (opponent && edge !== 0) {
    factors.push({
      label: 'Style matchup',
      detail: `${player.style} vs ${opponent.style} favors ${edge > 0 ? player.name : opponent.name} (${edge > 0 ? '+' : ''}${edge}).`,
      favored: edge > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(edge) / 4),
    });
  }

  if (opponent) {
    const gap = biggestSkillGap(player, opponent);
    if (gap.gap >= 3) {
      const who = gap.favored === 'A' ? player.name : opponent.name;
      factors.push({
        label: `${gap.skill} edge`,
        detail: `${who} projects a ${gap.gap}-point ${gap.skill} advantage.`,
        favored: gap.favored,
        weight: Math.min(1, gap.gap / 8),
      });
    }
  }

  const risk = readinessRisk(player);
  if (risk) factors.push(risk);

  if (factors.length === 0) {
    factors.push({
      label: opponent ? 'Even fight' : 'Unknown opponent',
      detail: opponent
        ? `No decisive pre-fight edge — expect a close bout against ${opponent.name}.`
        : `Opponent details are unknown. Scout them to forecast the matchup; ${player.name} appears fit to fight.`,
      favored: null,
      weight: 0.1,
    });
  }

  factors.sort((x, y) => y.weight - x.weight);

  return {
    opponentKnown: opponent != null,
    styleMatchup: { styleA: player.style, styleD: opponent?.style ?? null, edge },
    factors: factors.slice(0, 5),
  };
}
