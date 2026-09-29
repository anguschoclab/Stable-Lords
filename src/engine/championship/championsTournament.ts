/**
 * Stable Lords — Grand Championship (week 52)
 *
 * The year's last tournament: a champions-only bracket built from live arena
 * reigns, resolved like any other tournament (lethal, disclosed), and awarded
 * here — the generic tournament prize path skips the 'Champions' tier so this
 * module is the single award home.
 *
 * Field selection and award recording accumulate into a ChampionshipDelta
 * (consumed by ArenaChampionshipPass); bracket emission returns a StateImpact
 * (consumed by RivalStrategyPass at week 52).
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, TournamentId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { mergeImpacts, type StateImpact } from '@/engine/impacts';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { SeededRNGService } from '@/utils/random';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { isFightReady } from '@/engine/warrior/warriorStatus';
import { owningStableOf, awardEpithet, type ChampionshipDelta } from './arenaChampionship';

/**
 * The week-52 field: every reigning arena champion, fight-ready. Dormant and
 * re-engaging titles still hold their crown, so their champions enter.
 * Deterministic arenaId order pre-shuffle, capped at FIELD_CAP.
 */
export function selectGrandChampionshipField(state: GameState): Warrior[] {
  return Object.keys(state.arenaChampions ?? {})
    .sort()
    .map((arenaId) => state.arenaChampions?.[arenaId]?.champion?.warriorId)
    .filter((id): id is WarriorId => id != null)
    .map((id) => findWarriorById(state, id))
    .filter((w): w is Warrior => w != null && isFightReady(w, true))
    .slice(0, CHAMPIONS_TOURNEY.FIELD_CAP);
}

/**
 * Week 52 — the Grand Championship. Champions-only field built from live
 * arena reigns; cancelled (with a newsletter) when too few crowns are held.
 * Bouts are lethal, same as any tournament bracket — awards are recorded by
 * ArenaChampionshipPass once the bracket completes.
 */
export function buildChampionsTournament(
  state: GameState,
  week: number,
  rng: IRNGService,
  headless?: boolean
): StateImpact {
  const field = selectGrandChampionshipField(state);
  if (field.length < CHAMPIONS_TOURNEY.MIN_FIELD) {
    return mergeImpacts([
      {
        newsletterItems: headless
          ? []
          : [
              {
                id: rng.uuid(),
                week,
                title: '🎖️ TOURNAMENT ANNOUNCEMENT',
                items: [
                  `${CHAMPIONS_TOURNEY.NAME} is cancelled — only ${field.length} arena crown${field.length === 1 ? '' : 's'} are held this year.`,
                ],
              },
            ],
      },
    ]);
  }

  const tournament = TournamentSelectionService.buildTournament(
    CHAMPIONS_TOURNEY.TIER_ID,
    CHAMPIONS_TOURNEY.NAME,
    field,
    week,
    state.season,
    new SeededRNGService(((state.absoluteWeek ?? week - 1) + 1) * 733),
    state.year ?? 1
  );

  return mergeImpacts([
    { tournaments: [...(state.tournaments || []), tournament] },
    {
      isTournamentWeek: true,
      activeTournamentId: tournament.id,
      day: 0,
      newsletterItems: headless
        ? []
        : [
            {
              id: rng.uuid(),
              week,
              title: '🎖️ TOURNAMENT ANNOUNCEMENT',
              items: [
                `🏆 ${CHAMPIONS_TOURNEY.NAME} — every reigning arena champion answers the call. Bouts are to the death; the last warrior standing is crowned ${CHAMPIONS_TOURNEY.TITLE}.`,
              ],
            },
          ],
    },
  ]);
}

/**
 * Detect completed 'Champions' tournaments not yet in `grandChampions` and
 * record the winner + awards. The generic tournament prize path skips this
 * tier (see resolution.ts) — this is the single award home.
 */
export function recordGrandChampions(state: GameState, delta: ChampionshipDelta): void {
  const recorded = new Set([
    ...(state.grandChampions ?? []).map((g) => g.tournamentId),
    ...delta.grandChampions.map((g) => g.tournamentId),
  ]);

  for (const t of state.tournaments ?? []) {
    if (t.tierId !== CHAMPIONS_TOURNEY.TIER_ID || !t.completed || recorded.has(t.id)) continue;
    const finals = [...t.bracket]
      .filter((b) => !b.isBronzeMatch)
      .sort((a, b) => b.round - a.round || a.matchIndex - b.matchIndex)[0];
    if (!finals?.winner) continue;
    const winnerId = (finals.winner === 'A' ? finals.warriorIdA : finals.warriorIdD) as WarriorId;
    const w = findWarriorById(state, winnerId);
    if (!w) continue;

    const owner = owningStableOf(state, winnerId);
    delta.grandChampions.push({
      tournamentId: t.id as TournamentId,
      year: state.year ?? 1,
      warriorId: w.id,
      warriorName: w.name,
      warriorEpithet: w.epithet,
      stableName: owner?.stableName,
    });

    const titles = [...(w.titles ?? []), CHAMPIONS_TOURNEY.TITLE];
    if (owner?.isPlayer) {
      delta.treasuryDelta += CHAMPIONS_TOURNEY.PURSE;
      const existing = delta.rosterUpdates.get(w.id) ?? {};
      delta.rosterUpdates.set(w.id, {
        ...existing,
        fame: (existing.fame ?? w.fame ?? 0) + CHAMPIONS_TOURNEY.WINNER_FAME,
        popularity: (existing.popularity ?? w.popularity ?? 0) + CHAMPIONS_TOURNEY.WINNER_POP,
        titles,
        champion: true,
      });
    } else {
      const rival = (state.rivals ?? []).find((r) =>
        (r.roster ?? []).some((x) => x.id === w.id)
      );
      if (rival) {
        const pending = delta.rivalsUpdates.get(rival.id);
        const baseRoster = pending?.roster ?? rival.roster;
        delta.rivalsUpdates.set(rival.id, {
          ...(pending ?? {}),
          treasury: (rival.treasury ?? 0) + CHAMPIONS_TOURNEY.PURSE,
          roster: baseRoster.map((x) =>
            x.id === w.id
              ? {
                  ...x,
                  fame: (x.fame ?? 0) + CHAMPIONS_TOURNEY.WINNER_FAME,
                  popularity: (x.popularity ?? 0) + CHAMPIONS_TOURNEY.WINNER_POP,
                  titles,
                  champion: true,
                }
              : x
          ),
        });
      }
    }

    awardEpithet(state, delta, winnerId, 'grand_champion');

    delta.newsletterItems.push({
      id: `champ-gc-${t.id}`,
      week: state.week,
      title: `Grand Champion Crowned`,
      items: [
        `${w.name} of ${owner?.stableName ?? 'an unknown stable'} is the ${CHAMPIONS_TOURNEY.TITLE} — last warrior standing at ${CHAMPIONS_TOURNEY.NAME}.`,
        `Purse: ${CHAMPIONS_TOURNEY.PURSE}g. The arena crowns them immortal.`,
      ],
    });
  }
}
