import type { GameState, TournamentCycle, Warrior } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { StateImpact } from '@/engine/impacts';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';
import {
  CLASS_INVITE_COUNT,
  TOURNAMENT_CLASSES,
  classForFE,
  type TournamentClassId,
} from './classes';

/** Every warrior rostered anywhere — player stable plus rival stables. */
function allRosteredWarriors(state: GameState): Warrior[] {
  const out: Warrior[] = [...(state.roster ?? [])];
  for (const r of state.rivals ?? []) out.push(...r.roster);
  return out;
}

/**
 * Rank the frozen pool inside one class: compositeScore descending,
 * warrior id ascending as the deterministic tie-break. Unranked warriors
 * sort last — the committee only ever invites from the ranked field.
 */
function byClassRank(state: GameState, a: WarriorId, b: WarriorId): number {
  const sa = state.realmRankings?.[a]?.compositeScore ?? Number.NEGATIVE_INFINITY;
  const sb = state.realmRankings?.[b]?.compositeScore ?? Number.NEGATIVE_INFINITY;
  return sb - sa || String(a).localeCompare(String(b));
}

/**
 * Tournament freeze — Duel2 canon at T−2 (weeks 8/18/28/40).
 *
 * Snapshots every rostered warrior's fight-equivalents and locks class
 * membership for the coming seasonal: post-freeze bouts still accrue FE
 * (the article's breakpoint exploit) but cannot move a warrior up a class
 * this cycle. The committee's auto-invites are the top-CLASS_INVITE_COUNT
 * ranked warriors in each frozen class; declarations and scratches live on
 * the cycle for the two-week entry window until bracket emission.
 *
 * Draw-free: the freeze is pure bookkeeping — `rng` only stamps the
 * newsletter id so the stream never shifts on a scheduling boundary.
 */
export function handleTournamentFreeze(
  state: GameState,
  nextWeek: number,
  rng: IRNGService,
  headless?: boolean
): StateImpact {
  const forWeek = nextWeek + 2; // TOURNAMENT_FREEZE_OFFSET — freeze lands T−2

  const feByWarrior = {} as Record<WarriorId, number>;
  const poolByClass = new Map<TournamentClassId, WarriorId[]>();
  for (const w of allRosteredWarriors(state)) {
    const fe = fightEquivalentsOf(w);
    feByWarrior[w.id] = fe;
    const cls = classForFE(fe);
    const list = poolByClass.get(cls);
    if (list) list.push(w.id);
    else poolByClass.set(cls, [w.id]);
  }

  const invited = {} as Record<TournamentClassId, WarriorId[]>;
  for (const spec of TOURNAMENT_CLASSES) {
    const pool = poolByClass.get(spec.id) ?? [];
    pool.sort((a, b) => byClassRank(state, a, b));
    invited[spec.id] = pool.slice(0, CLASS_INVITE_COUNT);
  }

  // TV elevation: last cycle's class champions jump the Champions queue —
  // they promoted by winning, not by FE. Dedupe against the ranked pool.
  const elevated = (state.tournamentCycle?.elevated ?? []).filter(
    (id) => id in feByWarrior
  );
  if (elevated.length > 0) {
    invited.champions = [
      ...new Set([...elevated, ...invited.champions]),
    ].slice(0, CLASS_INVITE_COUNT);
  }

  const tournamentCycle: TournamentCycle = {
    forWeek,
    season: state.season,
    frozenAtAbsWeek: nextWeek,
    feByWarrior,
    invited,
    declared: {} as Record<StableId, WarriorId[]>,
    scratched: [],
    elevated: [],
  };

  const fieldSizes = TOURNAMENT_CLASSES.map((spec) => invited[spec.id].length);
  return {
    tournamentCycle,
    newsletterItems: headless
      ? []
      : [
          {
            id: rng.uuid(),
            week: nextWeek,
            title: '🎖️ TOURNAMENT CLASSES SET',
            items: [
              `Fight-equivalency classes frozen for the Week ${forWeek} seasonals — ` +
                `${fieldSizes.join('/')} invited across the five classes. ` +
                `Declarations and scratches close when brackets are drawn.`,
            ],
          },
        ],
  };
}
