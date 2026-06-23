import type { GameState, ProgressionState, NewsletterItem, GazetteStory } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import { DEFAULT_PROGRESSION } from '@/constants/progression';

interface StableEntry {
  id: string;
  fame: number;
  titles: number;
}

export function runProgressionPass(
  state: GameState,
  nextWeek: number,
  _nextYear: number
): StateImpact {
  const current: ProgressionState = state.progression
    ? structuredClone(state.progression)
    : structuredClone(DEFAULT_PROGRESSION);

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

  const playerWarriorIds = new Set(state.roster.map((w) => w.id));
  const playerWarriorNames = new Set(state.roster.map((w) => w.name));

  const newsletterItems: NewsletterItem[] = [];
  const gazettes: GazetteStory[] = [];
  let realmChampionCompleted = false;

  for (const obj of current.objectives) {
    if (obj.completed) continue;

    let completed = false;

    switch (obj.id) {
      case 'TOP_10_STABLE':
        completed = stableStanding <= 10;
        break;
      case 'TOP_3_STABLE':
        completed = stableStanding <= 3;
        break;
      case 'FIRST_TOURNAMENT_WIN':
        completed = (state.tournaments || []).some(
          (t) => t.completed && t.champion && playerWarriorNames.has(t.champion)
        );
        break;
      case 'HALL_OF_FAMER':
        completed = (state.awards || []).some(
          (a) =>
            (a.type === 'WARRIOR_OF_YEAR' || a.type === 'KILLER_OF_YEAR') &&
            a.warriorId &&
            playerWarriorIds.has(a.warriorId)
        );
        break;
      case 'REALM_CHAMPION':
        completed = stableStanding === 1 && nextWeek === 1;
        break;
    }

    if (completed) {
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
          id: `gazette-realm-champion-${state.year}` as any,
          headline: 'Realm Champion Crowned!',
          body: `${state.player.stableName} has finished Year ${state.year} as the #1 stable in the realm. A new champion is etched into the annals of history.`,
          mood: 'Festive',
          tags: ['progression', 'champion', 'milestone'],
          week: state.week,
        });
      }
    }
  }

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
