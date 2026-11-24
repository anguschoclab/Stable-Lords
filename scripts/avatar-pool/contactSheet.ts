/**
 * V32 portrait-pool QC contact sheet.
 *
 * Composites up to `AVATAR_SHEET_COUNT` (default 24) webp portraits from
 * public/avatars/portraits/ into a labeled grid at out/contact-sheet.png for
 * visual review of framing/style drift.
 *
 *   bunx tsx scripts/avatar-pool/contactSheet.ts
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { logger } from '@/utils/logger';

const DIR = import.meta.dirname;
const PORTRAITS_DIR = path.resolve(DIR, '../../public/avatars/portraits');
const OUT_DIR = path.join(DIR, 'out');
const CELL = 256;
const LABEL = 20;
const COLS = 6;

async function main(): Promise<void> {
  const count = Number(process.env.AVATAR_SHEET_COUNT ?? 24);
  const files = existsSync(PORTRAITS_DIR)
    ? readdirSync(PORTRAITS_DIR)
        .filter((f) => f.endsWith('.webp'))
        .slice(0, count)
    : [];
  if (files.length === 0) throw new Error('No portraits found — run ingest.ts first.');

  const rows = Math.ceil(files.length / COLS);
  mkdirSync(OUT_DIR, { recursive: true });

  const composites = await Promise.all(
    files.map(async (file, i) => {
      const img = await sharp(path.join(PORTRAITS_DIR, file)).resize(CELL, CELL).png().toBuffer();
      const labelSvg = Buffer.from(
        `<svg width="${CELL}" height="${LABEL}">
          <rect width="100%" height="100%" fill="#18181c"/>
          <text x="6" y="14" font-family="monospace" font-size="11" fill="#d4d4d8">${file.replace('.webp', '')}</text>
        </svg>`
      );
      const tile = await sharp({
        create: { width: CELL, height: CELL + LABEL, channels: 4, background: '#18181c' },
      })
        .composite([
          { input: img, top: 0, left: 0 },
          { input: labelSvg, top: CELL, left: 0 },
        ])
        .png()
        .toBuffer();
      return { input: tile, top: Math.floor(i / COLS) * (CELL + LABEL), left: (i % COLS) * CELL };
    })
  );

  const out = path.join(OUT_DIR, 'contact-sheet.png');
  await sharp({
    create: {
      width: COLS * CELL,
      height: rows * (CELL + LABEL),
      channels: 4,
      background: '#101014',
    },
  })
    .composite(composites)
    .png()
    .toFile(out);
  logger.log(`Contact sheet (${files.length} cells) → ${out}`);
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
