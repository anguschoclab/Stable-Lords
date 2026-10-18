import type {
  AvatarCatalog,
  AvatarCatalogEntry,
  AvatarLayerCategory,
} from '@/types/avatar.types';

let cachedCatalog: AvatarCatalog | null = null;

const REQUIRED_CATEGORIES: AvatarLayerCategory[] = [
  'base',
  'skinTone',
  'eyes',
  'mouth',
  'hair',
  'clothing',
  'shoulders',
];

function validateAvatarCatalog(catalog: AvatarCatalog): AvatarLayerCategory[] {
  return REQUIRED_CATEGORIES.filter((category) => (catalog.categories[category]?.length ?? 0) === 0);
}

/**
 * Load the avatar asset catalog from the public manifest.
 * Safe to call repeatedly; caches the parsed result.
 */
export async function loadAvatarCatalog(): Promise<AvatarCatalog> {
  if (cachedCatalog) return cachedCatalog;
  const response = await fetch('/avatars/index.json');
  if (!response.ok) {
    throw new Error(`Failed to load avatar catalog: ${response.statusText}`);
  }
  const data = (await response.json()) as AvatarCatalog;
  const missing = validateAvatarCatalog(data);
  if (missing.length > 0) {
    throw new Error(`Avatar catalog missing required categories: ${missing.join(', ')}`);
  }
  cachedCatalog = data;
  return data;
}

/** Return the currently cached catalog, if any. */
export function getAvatarCatalog(): AvatarCatalog | null {
  return cachedCatalog;
}

/**
 * Filter catalog entries by category and optional tags.
 * All requested tags must be present on the entry.
 */
export function getCatalogEntries(
  catalog: AvatarCatalog,
  category: AvatarLayerCategory,
  tags?: string[]
): AvatarCatalogEntry[] {
  const entries = catalog.categories[category] ?? [];
  if (!tags || tags.length === 0) return entries;
  return entries.filter((entry) => tags.every((tag) => entry.tags.includes(tag)));
}
