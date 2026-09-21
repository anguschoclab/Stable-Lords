/**
 * Content packs (Design Bible #36 "Content Updater" + #25 "Mods Loader").
 *
 * Player-supplied JSON packs overlay narrative content onto the canonical
 * data layer: extra arena lore entries and per-doctrine recruit quotes.
 * Packs persist on `GameState.contentPacks` so they survive save/export.
 */
import { z } from 'zod';
import type { ArenaLoreEntry } from '@/data/arenas';
import type { MetaAdaptation } from '@/types/state.types';
import { META_RECRUIT_QUOTES } from '@/data/ownerData';

/** Zod schema for a content pack file. */
export const ContentPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  arenaLore: z
    .array(
      z.object({
        id: z.string().min(1),
        arenaId: z.string().min(1),
        type: z.enum(['historical_battle', 'famous_death', 'architectural_quirk', 'hazard']),
        title: z.string().min(1),
        narrative: z.string().min(1),
      })
    )
    .optional(),
  recruitQuotes: z.record(z.string(), z.string()).optional(),
});

/** A validated content pack. */
export type ContentPack = z.infer<typeof ContentPackSchema>;

/** Parse + validate a pack from raw JSON text. Throws on invalid input. */
export function parseContentPack(text: string): ContentPack {
  return ContentPackSchema.parse(JSON.parse(text));
}

/** Pack-supplied lore entries for one arena (canonical lore is untouched). */
export function getPackArenaLore(
  packs: ContentPack[] | undefined,
  arenaId: string
): ArenaLoreEntry[] {
  return (packs ?? []).flatMap((p) =>
    (p.arenaLore ?? []).filter((e) => e.arenaId === arenaId)
  );
}

/**
 * Resolve the recruit quote for an owner's adaptation doctrine.
 * Pack quotes take precedence over the canonical table so mods can flavor
 * doctrine voice without forking data.
 */
export function getRecruitQuote(
  tag: MetaAdaptation,
  packs: ContentPack[] | undefined
): string | undefined {
  for (const p of packs ?? []) {
    const q = p.recruitQuotes?.[tag];
    if (q) return q;
  }
  return META_RECRUIT_QUOTES[tag];
}
