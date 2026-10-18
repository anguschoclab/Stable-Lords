import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
type AvatarLayerCategory =
  | 'base'
  | 'skinTone'
  | 'eyes'
  | 'mouth'
  | 'hair'
  | 'facialHair'
  | 'markings'
  | 'accessories'
  | 'clothing'
  | 'shoulders';
interface AvatarCatalogEntry {
  src: string;
  category: AvatarLayerCategory;
  tags: string[];
}
interface AvatarCatalog {
  categories: Record<AvatarLayerCategory, AvatarCatalogEntry[]>;
}

const layersDir = path.resolve(import.meta.dirname, '../public/avatars/layers');
const manifestPath = path.resolve(import.meta.dirname, '../public/avatars/index.json');
const requiredCategories: AvatarLayerCategory[] = [
  'base',
  'skinTone',
  'eyes',
  'mouth',
  'hair',
  'facialHair',
  'markings',
  'accessories',
  'clothing',
  'shoulders',
];
const minimumCounts: Record<AvatarLayerCategory, number> = {
  base: 12,
  skinTone: 5,
  eyes: 4,
  mouth: 3,
  hair: 20,
  facialHair: 4,
  markings: 6,
  accessories: 4,
  clothing: 8,
  shoulders: 4,
};

function pngDimensions(filePath: string): { width: number; height: number } {
  const data = readFileSync(filePath);
  if (data.length < 24 || data.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${filePath} is not a PNG file`);
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function buildManifest(): AvatarCatalog {
  const categories = Object.fromEntries(
    requiredCategories.map((category) => [category, [] as AvatarCatalogEntry[]])
  ) as unknown as Record<AvatarLayerCategory, AvatarCatalogEntry[]>;
  for (const category of requiredCategories) {
    const directory = path.join(layersDir, category);
    if (!existsSync(directory)) throw new Error(`Missing avatar category directory: ${category}`);
    for (const file of readdirSync(directory).sort()) {
      if (!file.endsWith('.png')) continue;
      const dimensions = pngDimensions(path.join(directory, file));
      if (dimensions.width !== 256 || dimensions.height !== 256) {
        throw new Error(`${category}/${file} must be 256x256, got ${dimensions.width}x${dimensions.height}`);
      }
      const tags = file.replace(/\.png$/, '').split('_').slice(0, -1);
      categories[category].push({
        src: `/avatars/layers/${category}/${file}`,
        category,
        tags,
      });
    }
    if (categories[category].length < minimumCounts[category]) {
      throw new Error(
        `Avatar category ${category} has ${categories[category].length} assets; expected at least ${minimumCounts[category]}`
      );
    }
  }
  return { categories };
}

const manifest = buildManifest();
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const count = Object.values(manifest.categories).reduce((total, entries) => total + entries.length, 0);
console.log(`Validated ${count} avatar assets and wrote ${manifestPath}`);
