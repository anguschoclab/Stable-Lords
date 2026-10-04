import type {
  GameState,
  ProgressionState,
  NewsletterItem,
  GazetteStory,
} from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import type { NewsId } from '@/types/shared.types';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import { championsHeldByStable, owningStableOf } from '@/engine/championship/arenaChampionship';

interface StableEntry {
  id: string;
  fame: number;
  titles: number;
}

interface ObjectiveMetArgs {
  id: string;
  state: GameState;
  nextWeek: number;
  stableStanding: number;
  playerWarriorIds: Set<string>;
  playerWarriorNames: Set<string>;
}

/** Per-objective completion predicate. */
function objectiveMet(args: ObjectiveMetArgs): boolean {
  const { id, state, nextWeek, stableStanding, playerWarriorIds } = args;
  const { playerWarriorNames } = args;
  switch (id) {
    case 'TOP_10_STABLE':
      return stableStanding <= 10;
    case 'TOP_3_STABLE':
      return stableStanding <= 3;
    case 'FIRST_TOURNAMENT_WIN':
      return (state.tournaments || []).some(
        (t) => t.completed && t.champion && playerWarriorNames.has(t.champion)
      );
    case 'HALL_OF_FAMER':
      return (state.awards || []).some(
        (a) =>
          (a.type === 'WARRIOR_OF_YEAR' || a.type === 'KILLER_OF_YEAR') &&
          a.warriorId &&
          playerWarriorIds.has(a.warriorId)
      );
    case 'REALM_CHAMPION':
      return stableStanding === 1 && nextWeek === 1;
    case 'ARENA_TITLE':
      return championsHeldByStable(state, state.player.id).length > 0;
    case 'CIRCUIT_LORD': {
      // Three titles across three DIFFERENT warriors — one crown per
      // warrior means three crowned warriors, not three reigns.
      const crownedIds = new Set(
        Object.values(state.arenaChampions ?? {}).flatMap((t) => {
          const wid = t.champion?.warriorId;
          return wid != null && owningStableOf(state, wid)?.stableId === state.player.id
            ? [wid]
            : [];
        })
      );
      return crownedIds.size >= 3;
    }
    case 'GRAND_CHAMPION':
      return (state.grandChampions ?? []).some(
        (e) => owningStableOf(state, e.warriorId)?.isPlayer === true
      );
  }
  return false;
}

interface EvaluateObjectivesArgs {
  current: ProgressionState;
  state: GameState;
  nextWeek: number;
  stableStanding: number;
  newsletterItems: NewsletterItem[];
  gazettes: GazetteStory[];
}

/**
 * Evaluate all uncompleted objectives; marks completions on `current` and
 * appends newsletter/gazette items. Returns true if REALM_CHAMPION completed.
 */
function evaluateObjectives(args: EvaluateObjectivesArgs): boolean {
  const { current, state, nextWeek, stableStanding, newsletterItems } = args;
  const { gazettes } = args;
  const playerWarriorIds = new Set(state.roster.map((w) => w.id));
  const playerWarriorNames = new Set(state.roster.map((w) => w.name));
  let realmChampionCompleted = false;

  for (const obj of current.objectives) {
    if (obj.completed) continue;

    if (
      !objectiveMet({ id: obj.id, state: state, nextWeek: nextWeek, stableStanding: stableStanding, playerWarriorIds: playerWarriorIds, playerWarriorNames: playerWarriorNames })
    )
      continue;

    obj.completed = true;
    obj.completedWeek = state.week;
    obj.completedYear = state.year;

    newsletterItems.push({
      id: `progression-${obj.id}-${state.year}-${state.week}`,
      week: state.week,
      title: 'Objective Completed',
      items: [`${obj.label}: ${obj.description}`],
      category: 'news',
    });

    if (obj.id === 'REALM_CHAMPION') {
      realmChampionCompleted = true;
      gazettes.push({
        id: `gazette-realm-champion-${state.year}` as NewsId,
        headline: 'Realm Champion Crowned!',
        body: `${state.player.stableName} has finished Year ${state.year} as the #1 stable in the realm. A new champion is etched into the annals of history.`,
        mood: 'Festive',
        tags: ['progression', 'champion', 'milestone'],
        week: state.week,
      });
    }
  }
  return realmChampionCompleted;
}

/**
 *
 */
export function runProgressionPass(
  state: GameState,
  nextWeek: number,
  _nextYear: number
): StateImpact {
  const current: ProgressionState = state.progression
    ? structuredClone(state.progression)
    : structuredClone(DEFAULT_PROGRESSION);

  // Backfill objectives added after a save was created (e.g. arena title
  // objectives on legacy saves) — completed flags carry over by id.
  for (const def of DEFAULT_PROGRESSION.objectives) {
    if (!current.objectives.some((o) => o.id === def.id)) {
      current.objectives.push({ ...def });
    }
  }

  const stables: StableEntry[] = [
    { id: state.player.id, fame: state.fame ?? 0, titles: state.player.titles ?? 0 },
    ...(state.rivals || []).map((r) => ({
      id: r.id,
      fame: r.fame ?? 0,
      titles: r.owner?.titles ?? 0,
    })),
  ];

  stables.sort((a, b) => {
    if (b.fame !== a.fame) return b.fame - a.fame;
    if (b.titles !== a.titles) return b.titles - a.titles;
    return a.id.localeCompare(b.id);
  });

  const playerRank = stables.findIndex((s) => s.id === state.player.id);
  const stableStanding = playerRank + 1;
  const totalStables = stables.length;

  current.stableStanding = stableStanding;
  current.totalStables = totalStables;

  const newsletterItems: NewsletterItem[] = [];
  const gazettes: GazetteStory[] = [];

  const realmChampionCompleted = evaluateObjectives(
    { current: current, state: state, nextWeek: nextWeek, stableStanding: stableStanding, newsletterItems: newsletterItems, gazettes: gazettes }
  );

  if (realmChampionCompleted && current.status !== 'continued') {
    current.status = 'won';
    current.wonYear = state.year;
    current.wonWeek = state.week;
  }

  const impact: StateImpact = { progression: current };

  if (newsletterItems.length > 0) {
    impact.newsletterItems = newsletterItems;
  }
  if (gazettes.length > 0) {
    impact.gazettes = gazettes;
  }

  return impact;
}
