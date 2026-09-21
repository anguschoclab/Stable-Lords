import type { GameState, GazetteStory } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import { generateSeasonSummary } from '@/engine/gazette/gazetteNarrative';
import { computeNextSeason } from './WorldPass';
import { WEEKS_PER_SEASON } from '@/constants/core/core';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { NewsletterFeed, type FightCard } from '@/engine/newsletter/feed';

/**
 * Stable Lords — Narrative Pipeline Pass
 * Bundles Gazette generation, Grudges, and Rivalry updates into a single impact.
 */
export function runNarrativePass(
  state: GameState,
  _currentWeek: number,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const rng = resolveRng(rootRng, state.absoluteWeek * 9973 + 456);

  // 1. Gazette generation
  const weekFights = getFightsForWeek(state.arenaHistory, state.absoluteWeek);
  const story = generateWeeklyGazette(
    weekFights,
    state.crowdMood,
    state.absoluteWeek,
    state.graveyard,
    state.arenaHistory,
    rng
  );
  const gazettes = [...(state.gazettes || []), { ...story, week: state.absoluteWeek }];

  // Season retrospective — when nextWeek opens a new season, recap the
  // completed season's fights via generateSeasonSummary (previously orphaned).
  if (computeNextSeason(nextWeek) !== state.season) {
    const seasonStart = nextWeek - WEEKS_PER_SEASON;
    const seasonFights = state.arenaHistory.filter(
      (f) => (f.absoluteWeek ?? f.week) >= seasonStart && (f.absoluteWeek ?? f.week) < nextWeek
    );
    const review = generateSeasonSummary(seasonFights, state.crowdMood, state.season);
    gazettes.push({ ...review, id: review.id as GazetteStory['id'], week: state.absoluteWeek });
  }

  const cappedGazettes = gazettes.slice(-50);

  // 2. Owner grudges and rivalries are world state — they were relocated to
  // WorldPass (G5) so they keep updating in headless/player-stopped runs.

  const impact: StateImpact = {
    gazettes: cappedGazettes,
  };

  // 3. Weekly newsletter issue — structured highlights (fight of the week,
  // top movers, style rollups) computed over the same fights via
  // NewsletterFeed.generateIssue (previously orphaned).
  if (weekFights.length > 0) {
    const cards: FightCard[] = weekFights.map((f) => ({
      summary: f,
      transcript: f.transcript ?? [],
    }));
    const issue = NewsletterFeed.generateIssue(state.absoluteWeek, cards);
    const items: string[] = [];

    const fotw = issue.fights.find((c) => c.summary.id === issue.highlights.fightOfTheWeekId);
    if (fotw) items.push(`⚔️ FIGHT OF THE WEEK: ${fotw.summary.title}`);

    for (const m of (issue.highlights.topMovers ?? []).slice(0, 3)) {
      items.push(`📈 ${m.name} (+${m.fameDelta} fame, +${m.popDelta} popularity)`);
    }

    const topStyle = Object.entries(issue.styleRollups).sort((a, b) => b[1].pct - a[1].pct)[0];
    if (topStyle) {
      const [style, r] = topStyle;
      items.push(`🏛️ ${style} tops the style table at ${r.pct}% (${r.w}W-${r.l}L-${r.k}K)`);
    }

    if (items.length > 0) {
      impact.newsletterItems = [
        ...(impact.newsletterItems ?? []),
        {
          id: rng.uuid('newsletter'),
          week: nextWeek,
          title: 'Week in Review',
          items,
        },
      ];
    }
  }

  return impact;
}
