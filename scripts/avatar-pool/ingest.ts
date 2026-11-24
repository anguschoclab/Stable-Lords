/**
 * V32 portrait-pool ingest.
 *
 * Transcodes raw generated PNGs (out/raw/<id>.png) into 256x256 WebP under
 * public/avatars/portraits/, merges each spec's tags into the public
 * manifest's `categories.portraits`, and prints a coverage report so
 * underfilled tag cells can be re-rolled.
 *
 *   bunx tsx scripts/avatar-pool/ingest.ts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import type { PortraitSpec } from './planMatrix';
import type { AvatarCatalog } from '@/types/avatar.types';
import { logger } from '@/utils/logger';

const DIR = import.meta.dirname;
const RAW_DIR = path.join(DIR, 'out', 'raw');
const LEDGER_PATH = path.join(DIR, 'spec-ledger.json');
const PUBLIC_DIR = path.resolve(DIR, '../../public/avatars');
const PORTRAITS_DIR = path.join(PUBLIC_DIR, 'portraits');
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'index.json');
const SIZE = 256;
const QUALITY = 82;

const GENDERS = ['masc', 'fem', 'neutral'];
const AGES = ['young', 'adult', 'middle', 'elder'];
const ROLES = ['warrior', 'trainer', 'owner', 'promoter'];

async function main(): Promise<void> {
  if (!existsSync(LEDGER_PATH)) {
    throw new Error('spec-ledger.json missing — run generate.ts (DRY_RUN ok) first');
  }
  const specs = JSON.parse(readFileSync(LEDGER_PATH, 'utf-8')) as PortraitSpec[];

  mkdirSync(PORTRAITS_DIR, { recursive: true });
  const raw = existsSync(RAW_DIR)
    ? readdirSync(RAW_DIR).filter((f) => f.endsWith('.png'))
    : [];

  let converted = 0;
  for (const file of raw) {
    const id = file.replace('.png', '');
    const out = path.join(PORTRAITS_DIR, `${id}.webp`);
    if (!existsSync(out)) {
      await sharp(path.join(RAW_DIR, file))
        .resize(SIZE, SIZE, { fit: 'cover' })
        .webp({ quality: QUALITY })
        .toFile(out);
      converted++;
    }
  }
  logger.log(`Transcoded ${converted} new portraits (${raw.length} raw on disk).`);

  const manifest = existsSync(MANIFEST_PATH)
    ? (JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as AvatarCatalog)
    : { categories: {} };

  const present = new Set(
    existsSync(PORTRAITS_DIR)
      ? readdirSync(PORTRAITS_DIR)
          .filter((f) => f.endsWith('.webp'))
          .map((f) => f.replace('.webp', ''))
      : []
  );
  const entries = specs
    .filter((s) => present.has(s.id))
    .map((s) => ({
      src: `/avatars/portraits/${s.id}.webp`,
      category: 'portraits' as const,
      tags: s.tags,
    }));
  manifest.categories.portraits = entries;
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  // Coverage report — cells under 3 entries are flagged for a re-run.
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = [
      GENDERS.find((g) => e.tags.includes(g)) ?? '?',
      AGES.find((a) => e.tags.includes(a)) ?? '?',
      ROLES.find((r) => e.tags.includes(r)) ?? '?',
    ].join('/');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const thin = [...counts.entries()].filter(([, n]) => n < 3);
  logger.log(`Manifest: ${entries.length} portrait entries across ${counts.size} cells.`);
  if (thin.length > 0) {
    logger.warn(`Thin cells (<3): ${thin.map(([k, n]) => `${k}=${n}`).join(', ')}`);
  }
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
