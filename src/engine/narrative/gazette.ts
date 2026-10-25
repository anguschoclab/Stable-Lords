/**
 * Weekly gazette: personal ads + arena taunts.
 *
 * Player-written ads (`state.playerAds`) are flushed into the newsletter on
 * week advance, and the top-fame rival stable posts a seeded taunt — the
 * guide's "personal ads and spotlights" social layer.
 */
import { SeededRNG } from '@/utils/random';
import { makeNewsletterItem } from './newsletterHelpers';
import type { GameState } from '@/types/state.types';

/** Seed multiplier so the gazette stream is deterministic but draws from its
 *  own RNG — consuming the pipeline's shared RNG would reorder every later draw. */
const GAZETTE_SEED_FACTOR = 977;

const TAUNT_TEMPLATES = [
  "{{name}} of {{stable}} crows about the stable's record and dares any pretender to call them out.",
  '{{name}} of {{stable}} sneers at the competition — the sands fear that stable, and rightly so.',
  '{{name}} of {{stable}} boasts that no manager alive can match their stable book for book.',
];

/**
 * Flush queued personal ads into this week's newsletter and emit one rival
 * taunt. Mutates `state.newsletter` and clears `state.playerAds`.
 */
export function flushGazette(state: GameState): void {
  const week = state.week ?? 0;
  const rng = new SeededRNG(week * GAZETTE_SEED_FACTOR);

  const ads = state.playerAds ?? [];
  if (ads.length > 0) {
    state.newsletter = [
      ...(state.newsletter ?? []),
      {
        id: rng.uuid('gazette-ad'),
        week,
        title: 'Personal Ads',
        items: [...ads],
        category: 'newsletter' as const,
      },
    ];
    state.playerAds = [];
  }

  // AI taunt: the top-fame rival warrior crows in the gazette.
  const top = (state.rivals ?? [])
    .flatMap((r) =>
      (r.roster ?? []).map((w) => ({ w, stable: r.owner?.stableName ?? 'a rival stable' }))
    )
    .sort((a, b) => (b.w.fame ?? 0) - (a.w.fame ?? 0))[0];
  if (top) {
    state.newsletter = [
      ...(state.newsletter ?? []),
      makeNewsletterItem({
        rng,
        week,
        title: 'Arena Taunts',
        templates: TAUNT_TEMPLATES,
        data: { name: top.w.name, stable: top.stable },
        category: 'newsletter',
      }),
    ];
  }
}
