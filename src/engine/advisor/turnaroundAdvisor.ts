/**
 * Turnaround Advisor — the "How To Make a Loser Win" doctrine.
 *
 * Canon (Duel2 Arena 93): a losing warrior should not try to beat every
 * opponent — find the ONE reliable win condition and optimize everything
 * around it. This module reads real state (effective skills, the learn
 * ledger, drill investments, chart evidence, plan memory, matchups) and
 * produces a single route plus a ranked action list. Every number in the
 * copy traces to warrior state — nothing is decorative.
 *
 * Returns null for warriors who aren't losing: turnaround advice is for
 * turnarounds.
 */
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type BaseSkills } from '@/types/shared.types';
import { STYLE_LEARN_WEIGHTS, STYLE_LEARN_PRIORITY } from '@/data/learnPriorities';
import { LEARN_SKILL_NAMES, LEARN_SUSPECT_MIN } from '@/constants/combat/combat/learn';
import {
  CHART_MIN_SWINGS,
  CHART_SIGNAL_CRIT_RATE,
  suspectedFavoriteWeapon,
} from '@/engine/favorites/favorites';
import { suspectedFavoriteLearn } from '@/engine/learning';
import { getMatchupBonus } from '@/constants/combat/combat';
import { getItemById } from '@/data/equipment';
import { SKILL_DRILL_CAP } from '@/engine/training/trainingGains';

/** WT below this reads as "slow learner" — the canon advice is to train it. */
const SLOW_LEARNER_WT = 13;
/** Plan cells need this many visits before their record means anything. */
const CELL_MIN_VISITS = 3;
/** Hard cap on the action list — one page of advice, not a manifesto. */
const MAX_ACTIONS = 5;

export interface TurnaroundAction {
  kind: 'plan' | 'weapon' | 'challenge' | 'avoid' | 'train' | 'drill' | 'learn';
  headline: string;
  detail: string;
  /** The style this action targets (challenge/avoid only). */
  target?: FightingStyle;
}

export interface TurnaroundReport {
  /** The ONE reliable win condition — canon doctrine is to build around it. */
  winCondition: {
    skill: keyof BaseSkills;
    headline: string;
    detail: string;
  };
  actions: TurnaroundAction[];
}

const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

const skillName = (k: keyof BaseSkills): string => LEARN_SKILL_NAMES[k] ?? k;

/** Effective skill total: derived base + drills + arena lessons. */
function effectiveSkill(w: Warrior, k: keyof BaseSkills): number {
  return (w.baseSkills?.[k] ?? 0) + (w.skillDrills?.[k] ?? 0) + (w.learnedSkills?.[k] ?? 0);
}

/** The win-condition pick: argmax effective skill, ties broken by the
 *  style's own learn priority (what the build naturally reinforces —
 *  earlier in STYLE_LEARN_PRIORITY = higher priority). */
function pickWinCondition(w: Warrior): { skill: keyof BaseSkills; total: number } {
  const priority = STYLE_LEARN_PRIORITY[w.style] ?? [];
  const rankOf = (k: keyof BaseSkills) => {
    const i = priority.indexOf(k);
    return i === -1 ? SKILL_KEYS.length : i;
  };
  let best: keyof BaseSkills = 'ATT';
  let bestTotal = -Infinity;
  for (const k of SKILL_KEYS) {
    const total = effectiveSkill(w, k);
    if (total > bestTotal || (total === bestTotal && rankOf(k) < rankOf(best))) {
      best = k;
      bestTotal = total;
    }
  }
  return { skill: best, total: bestTotal };
}

const BANDS = ['VL', 'L', 'M', 'H', 'VH'] as const;
const BAND_MID: Record<string, number> = { VL: 2, L: 4, M: 6, H: 8, VH: 10 };
const bandLabel = (v: number): string =>
  BANDS[Math.min(4, Math.max(0, Math.floor((v - 1) / 2)))] ?? 'VL';
const bandMid = (b: string): number => BAND_MID[b] ?? 5;

function planAdvice(w: Warrior): TurnaroundAction | undefined {
  const cells = w.strategyMemory?.cells ?? {};
  const entries = Object.entries(cells);
  if (entries.length === 0) {
    return {
      kind: 'plan',
      headline: 'Start the tinkering log',
      detail:
        'No plan cells on record. Run a deliberate OE/AL rhythm next bout and start building evidence — one variable at a time.',
    };
  }
  const score = (c: { w: number; l: number }) => (c.w + 1) / (c.w + c.l + 2);
  const visits = (c: { w: number; l: number }) => c.w + c.l;
  const best = entries
    .slice()
    .sort((a, b) => score(b[1]) - score(a[1]) || visits(b[1]) - visits(a[1]))[0];
  if (!best) return undefined;
  const totalVisits = entries.reduce((s, [, c]) => s + visits(c), 0);
  const currentCell =
    w.plan && w.plan.OE != null && w.plan.AL != null
      ? `${bandLabel(w.plan.OE)}/${bandLabel(w.plan.AL)}`
      : undefined;

  if (best[1].w >= 2 && score(best[1]) >= 0.55) {
    const [oe = 'M', al = 'M'] = best[0].split('/');
    if (currentCell && currentCell === best[0]) {
      return {
        kind: 'plan',
        headline: 'Stay on the winning rhythm',
        detail: `The ${best[0]} cell is ${best[1].w}-${best[1].l} — the current plan is already on it. Stop tinkering here.`,
      };
    }
    return {
      kind: 'plan',
      headline: `Move the plan toward OE ${bandMid(oe)} / AL ${bandMid(al)}`,
      detail: `The ${best[0]} rhythm cell is ${best[1].w}-${best[1].l} — the only corner of the plan space that's winning${
        currentCell ? `; the current plan sits in ${currentCell}` : ''
      }.`,
    };
  }
  if (totalVisits >= CELL_MIN_VISITS && entries.every(([, c]) => c.w <= c.l)) {
    return {
      kind: 'plan',
      headline: 'Every tried rhythm is losing — probe an untested band',
      detail: `${totalVisits} bouts logged and no cell is above water. Change OE or AL by a full band next bout — small steps won't show you a different fight.`,
    };
  }
  return {
    kind: 'plan',
    headline: 'Keep tinkering — the record is thin',
    detail: `${totalVisits} bouts logged across ${entries.length} cell${entries.length > 1 ? 's' : ''}. Not enough evidence to steer yet; pick the most promising band and repeat it.`,
  };
}

function weaponAdvice(w: Warrior): TurnaroundAction | undefined {
  const chart = w.favorites?.chart ?? {};
  const equipped = w.equipment?.weapon;
  const rows = Object.entries(chart).filter(([, r]) => r.swings >= CHART_MIN_SWINGS);
  if (rows.length === 0) return undefined;

  const suspect = suspectedFavoriteWeapon(w.favorites);
  const equippedName = equipped ? (getItemById(equipped)?.name ?? equipped) : undefined;

  if (suspect && suspect !== equipped) {
    const row = chart[suspect];
    const name = getItemById(suspect)?.name ?? suspect;
    return {
      kind: 'weapon',
      headline: `Equip the ${name}`,
      detail: `The chart says ${name}: ${row?.crits ?? 0} crits and ${
        row?.critDamages ?? 0
      } extra-value hits over ${row?.swings ?? 0} swings${
        equippedName ? `, while the ${equippedName} isn't producing` : ''
      }.`,
    };
  }

  if (equipped) {
    const row = chart[equipped];
    if (
      row &&
      row.swings >= CHART_MIN_SWINGS &&
      row.crits / row.swings < CHART_SIGNAL_CRIT_RATE &&
      (row.critDamages ?? 0) === 0
    ) {
      return {
        kind: 'weapon',
        headline: `The ${equippedName} isn't producing — change weapons`,
        detail: `The ${equippedName}: ${row.swings} swings, ${row.crits} crits, no extra-value hits. Either the weapon class or the warrior's hand is wrong — try a different weapon for two bouts.`,
      };
    }
  }
  return undefined;
}

function learnAdvice(w: Warrior): TurnaroundAction | undefined {
  const suspected = suspectedFavoriteLearn(w);
  if (w.favorites?.discovered.learn === true && suspected) {
    return {
      kind: 'learn',
      headline: `${skillName(suspected)} is the warrior's favorite learn`,
      detail: `It's confirmed — lessons in ${skillName(suspected)} stick. Seek opponents whose style teaches it (their priority pool ranks it high).`,
    };
  }
  if (suspected) {
    const n = w.learnedSkills?.[suspected] ?? 0;
    return {
      kind: 'learn',
      headline: `Lessons in ${skillName(suspected)} keep sticking`,
      detail: `${n} arena lessons in ${skillName(suspected)} and counting — the pattern suggests a favorite learn. Keep fighting teachers of it to confirm.`,
    };
  }
  const total = Object.values(w.learnedSkills ?? {}).reduce((s, v) => s + (v ?? 0), 0);
  if (total >= LEARN_SUSPECT_MIN && !suspected) {
    return {
      kind: 'learn',
      headline: 'Watch the learn ledger',
      detail: `${total} lessons banked but no clear affinity yet — the favorite learn shows itself once one skill pulls ahead (${LEARN_SUSPECT_MIN}+ in a single skill).`,
    };
  }
  return undefined;
}

function trainAdvice(w: Warrior): TurnaroundAction | undefined {
  if ((w.attributes?.WT ?? 10) < SLOW_LEARNER_WT) {
    return {
      kind: 'train',
      headline: 'Train WT — wit is the bottleneck',
      detail: `WT ${w.attributes?.WT ?? 0} gates arena learning: every point raises the per-fight learn rate. A slow learner stays slow until the wit catches up.`,
    };
  }
  return undefined;
}

function drillAdvice(w: Warrior, winSkill: keyof BaseSkills): TurnaroundAction | undefined {
  const current = w.skillDrills?.[winSkill] ?? 0;
  if (current >= SKILL_DRILL_CAP) return undefined;
  return {
    kind: 'drill',
    headline: `Drill ${skillName(winSkill)} — feed the win condition`,
    detail: `${current}/${SKILL_DRILL_CAP} drill slots filled in ${skillName(
      winSkill
    )}. A turnaround means doubling down on what works, not patching every weakness.`,
  };
}

function matchupAdvice(w: Warrior): TurnaroundAction[] {
  const out: TurnaroundAction[] = [];
  let bestFoe: FightingStyle | undefined;
  let bestEdge = 0;
  let worstFoe: FightingStyle | undefined;
  let worstEdge = 0;
  for (const foe of Object.values(FightingStyle)) {
    if (foe === w.style) continue;
    const edge = getMatchupBonus(w.style, foe);
    if (edge > bestEdge) {
      bestEdge = edge;
      bestFoe = foe;
    }
    if (edge < worstEdge) {
      worstEdge = edge;
      worstFoe = foe;
    }
  }
  if (bestFoe) {
    out.push({
      kind: 'challenge',
      target: bestFoe,
      headline: `Challenge ${bestFoe} fighters`,
      detail: `The style matrix gives +${bestEdge} against ${bestFoe} — deliberate challenges toward winnable fights are how a losing record turns.`,
    });
  }
  if (worstFoe) {
    out.push({
      kind: 'avoid',
      target: worstFoe,
      headline: `Avoid ${worstFoe}`,
      detail: `The matrix takes ${worstEdge} against ${worstFoe}. Put them on the avoid list until the win condition is proven.`,
    });
  }
  return out;
}

/**
 * Diagnose a losing warrior and prescribe ONE win condition plus a ranked
 * action list. Returns null when the warrior isn't losing — a .500 record
 * isn't a turnaround case.
 */
export function diagnoseTurnaround(w: Warrior): TurnaroundReport | null {
  const wins = w.career?.wins ?? 0;
  const losses = w.career?.losses ?? 0;
  if (wins >= losses || losses === 0) return null;

  const pick = pickWinCondition(w);
  const base = w.baseSkills?.[pick.skill] ?? 0;
  const learned = w.learnedSkills?.[pick.skill] ?? 0;
  const drilled = w.skillDrills?.[pick.skill] ?? 0;
  const stylePriority = STYLE_LEARN_WEIGHTS[w.style]?.[pick.skill] ?? 0;

  const parts: string[] = [`${base} base`];
  if (learned > 0) parts.push(`${learned} learned`);
  if (drilled > 0) parts.push(`${drilled} drilled`);

  const winCondition = {
    skill: pick.skill,
    headline: `Win through ${skillName(pick.skill)}`,
    detail: `${skillName(pick.skill)} is the route — ${pick.total} effective (${parts.join(
      ' + '
    )})${stylePriority >= 5 ? `, and ${w.style} teaches it first` : ''}.`,
  };

  const actions: TurnaroundAction[] = [];
  const candidates = [
    planAdvice(w),
    weaponAdvice(w),
    learnAdvice(w),
    drillAdvice(w, pick.skill),
    trainAdvice(w),
    ...matchupAdvice(w),
  ];
  for (const a of candidates) {
    if (a) actions.push(a);
  }
  return { winCondition, actions: actions.slice(0, MAX_ACTIONS) };
}
