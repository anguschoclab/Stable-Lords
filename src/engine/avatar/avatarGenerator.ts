import type {
  AvatarAgeGroup,
  AvatarConfig,
  AvatarData,
  AvatarGender,
  AvatarLayer,
  AvatarLayerCategory,
  AvatarCatalog,
  AvatarCatalogEntry,
} from '@/types/avatar.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG, hashStr } from '@/utils/random';
import { getAvatarCatalog, getCatalogEntries } from './avatarCatalog';

const DEFAULT_PRIMARY = '#6b7280';

/** Derive a deterministic avatar seed from an entity's type and id. */
export function seedForEntity(entityType: string, entityId: string): number {
  return hashStr(`${entityType}:${entityId}`);
}

/** Map a numeric age to its avatar age bracket; unknown ages default to adult. */
export function ageGroupForAge(age?: number): AvatarAgeGroup {
  if (age === undefined || age === null) return 'adult';
  if (age <= 19) return 'young';
  if (age <= 34) return 'adult';
  if (age <= 49) return 'middle';
  return 'elder';
}

/** Score how weathered an avatar should look from age, kills, injuries, and fame. */
export function wearScore(config: AvatarConfig): number {
  let score = 0;
  const age = config.age ?? 25;
  if (age > 35) score += (age - 35) * 0.5;
  if (age > 50) score += (age - 50) * 0.8;

  const kills = config.kills ?? 0;
  score += kills * 2;

  const injuries = config.injuries?.length ?? 0;
  score += injuries * 3;

  const fame = config.fame ?? 0;
  if (fame > 500) score += 3;
  if (fame > 2000) score += 5;

  return score;
}

/** Return a flavor title for notable avatars, or undefined for unremarkable ones. */
export function avatarDescription(config: AvatarConfig): string | undefined {
  const wear = wearScore(config);
  const age = ageGroupForAge(config.age);
  if (wear > 25) return 'Scarred Veteran of the Arena';
  if (wear > 12) return 'Seasoned Campaigner';
  if (age === 'young') return 'Young Blood';
  if (age === 'elder') return 'Veteran Stablemaster';
  return undefined;
}

function pickGender(config: AvatarConfig, rng: SeededRNG): AvatarGender {
  if (config.forcedGender) return config.forcedGender;
  // Deterministic from seed but evenly distributed.
  const roll = rng.next();
  if (roll < 0.45) return 'masc';
  if (roll < 0.9) return 'fem';
  return 'neutral';
}

function pickAgeGroup(config: AvatarConfig, rng: SeededRNG): AvatarAgeGroup {
  if (config.forcedAgeGroup) return config.forcedAgeGroup;
  const base = ageGroupForAge(config.age);
  // Slight chance to shift one bracket for visual variety.
  if (rng.chance(0.1)) {
    const order: AvatarAgeGroup[] = ['young', 'adult', 'middle', 'elder'];
    const idx = order.indexOf(base);
    if (idx >= 0) {
      const nextIdx = rng.chance(0.5) ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < order.length) return order[nextIdx] ?? base;
    }
  }
  return base;
}

/** Map a fighting style to a clothing weight tag for catalog filtering. */
export function clothingCategoryForStyle(style?: FightingStyle): string | undefined {
  if (!style) return undefined;
  switch (style) {
    case FightingStyle.BashingAttack:
    case FightingStyle.SlashingAttack:
      return 'heavy';
    case FightingStyle.TotalParry:
    case FightingStyle.WallOfSteel:
      return 'defensive';
    case FightingStyle.AimedBlow:
    case FightingStyle.LungingAttack:
      return 'light';
    default:
      return undefined;
  }
}

function pickEntry(rng: SeededRNG, entries: AvatarCatalogEntry[]): AvatarCatalogEntry {
  if (entries.length === 0) {
    throw new Error('Cannot pick from empty catalog entries');
  }
  return rng.pick(entries);
}

/**
 * Pick a catalog entry for a category, preferring entries matching every tag.
 * Falls back to the unfiltered category when no entry has all the tags —
 * catalogs may legitimately lack some ageGroup x gender or style combos.
 */
function pickEntryWithFallback(
  rng: SeededRNG,
  catalog: AvatarCatalog,
  category: AvatarLayerCategory,
  tags?: string[]
): AvatarCatalogEntry {
  const tagged = tags?.length ? getCatalogEntries(catalog, category, tags) : [];
  const pool = tagged.length > 0 ? tagged : getCatalogEntries(catalog, category);
  return pickEntry(rng, pool);
}

function makeLayer(entry: AvatarCatalogEntry, z: number): AvatarLayer {
  return {
    category: entry.category,
    src: entry.src,
    z,
    tint: undefined,
    offset: { x: 0, y: 0 },
  };
}

/**
 * Generate a deterministic AvatarData from a config and the global catalog.
 */
export function generateAvatar(config: AvatarConfig): AvatarData {
  const catalog = getAvatarCatalog();
  if (!catalog) {
    throw new Error('Avatar catalog has not been loaded. Call loadAvatarCatalog() first.');
  }
  const seed = config.seed ?? seedForEntity(config.entityType, config.entityId);
  return generateAvatarFromCatalog({ ...config, seed }, catalog);
}

interface FacialHairContext {
  layers: AvatarLayer[];
  catalog: AvatarCatalog;
  rng: SeededRNG;
  gender: AvatarGender;
  ageGroup: AvatarAgeGroup;
  z: number;
}

function addFacialHairLayer(ctx: FacialHairContext): number {
  if (ctx.gender === 'fem' || ctx.ageGroup === 'young') return ctx.z;
  const facialEntries = getCatalogEntries(ctx.catalog, 'facialHair');
  if (facialEntries.length > 0 && ctx.rng.chance(0.6)) {
    ctx.layers.push(makeLayer(pickEntry(ctx.rng, facialEntries), ctx.z++));
  }
  return ctx.z;
}

interface MarkingContext {
  layers: AvatarLayer[];
  catalog: AvatarCatalog;
  rng: SeededRNG;
  config: AvatarConfig;
  ageGroup: AvatarAgeGroup;
  wear: number;
  z: number;
}

function addMarkingLayers(ctx: MarkingContext): number {
  const markingEntries = getCatalogEntries(ctx.catalog, 'markings');
  if (markingEntries.length === 0) return ctx.z;

  if (ctx.ageGroup === 'elder' || ctx.ageGroup === 'middle') {
    const wrinkleEntries = markingEntries.filter((e) => e.tags.includes('wrinkles'));
    if (wrinkleEntries.length > 0 && ctx.rng.chance(0.7)) {
      ctx.layers.push(makeLayer(pickEntry(ctx.rng, wrinkleEntries), ctx.z++));
    }
  }
  if (ctx.wear > 15) {
    const scarEntries = markingEntries.filter(
      (e) => e.tags.includes('scar') || e.tags.includes('eyepatch')
    );
    if (scarEntries.length > 0 && ctx.rng.chance(Math.min(0.85, ctx.wear / 40))) {
      ctx.layers.push(makeLayer(pickEntry(ctx.rng, scarEntries), ctx.z++));
    }
  }
  if ((ctx.config.fame ?? 0) > 300 || (ctx.config.kills ?? 0) > 1) {
    const paintEntries = markingEntries.filter((e) => e.tags.includes('warpaint'));
    if (paintEntries.length > 0 && ctx.rng.chance(0.4)) {
      ctx.layers.push(makeLayer(pickEntry(ctx.rng, paintEntries), ctx.z++));
    }
  }
  return ctx.z;
}

function generateAvatarFromCatalog(
  config: AvatarConfig & { seed: number },
  catalog: AvatarCatalog
): AvatarData {
  const rng = new SeededRNG(config.seed);
  const gender = pickGender(config, rng);
  const ageGroup = pickAgeGroup(config, rng);
  const wear = wearScore(config);

  const layers: AvatarLayer[] = [];
  let z = 0;

  const styleTag = clothingCategoryForStyle(config.style);
  const styleTags = styleTag ? [styleTag] : undefined;

  const shoulderEntry = pickEntryWithFallback(rng, catalog, 'shoulders', styleTags);
  layers.push({ ...makeLayer(shoulderEntry, z++), tint: config.secondaryColor });

  const clothingEntry = pickEntryWithFallback(rng, catalog, 'clothing', styleTags);
  layers.push({ ...makeLayer(clothingEntry, z++), tint: config.primaryColor });

  const baseEntry = pickEntryWithFallback(rng, catalog, 'base', [ageGroup, gender]);
  layers.push(makeLayer(baseEntry, z++));

  layers.push(makeLayer(pickEntry(rng, getCatalogEntries(catalog, 'skinTone')), z++));
  layers.push(makeLayer(pickEntry(rng, getCatalogEntries(catalog, 'eyes')), z++));
  layers.push(makeLayer(pickEntry(rng, getCatalogEntries(catalog, 'mouth')), z++));

  z = addFacialHairLayer({ layers, catalog, rng, gender, ageGroup, z });

  const hairTag = ageGroup === 'elder' ? 'gray' : undefined;
  const hairEntry = pickEntryWithFallback(rng, catalog, 'hair', hairTag ? [hairTag] : undefined);
  layers.push(makeLayer(hairEntry, z++));

  z = addMarkingLayers({ layers, catalog, rng, config, ageGroup, wear, z });

  const accessoryEntries = getCatalogEntries(catalog, 'accessories');
  if (accessoryEntries.length > 0 && rng.chance(0.25)) {
    layers.push(makeLayer(pickEntry(rng, accessoryEntries), z));
  }

  return {
    seed: config.seed,
    entityType: config.entityType,
    gender,
    ageGroup,
    primaryColor: config.primaryColor ?? DEFAULT_PRIMARY,
    secondaryColor: config.secondaryColor,
    layers,
    description: avatarDescription(config),
  };
}
