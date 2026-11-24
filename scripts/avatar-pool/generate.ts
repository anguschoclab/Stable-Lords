/**
 * V32 portrait-pool generator.
 *
 * Emits the committed spec ledger (planMatrix → spec-ledger.json), then calls
 * the Gemini image API once per spec and writes raw PNGs to out/raw/. The run
 * is resumable — completed ids are skipped — and DRY_RUN emits the ledger
 * without any API calls.
 *
 *   bunx tsx scripts/avatar-pool/generate.ts            # full run
 *   DRY_RUN=true bunx tsx scripts/avatar-pool/generate.ts
 *
 * Env: GEMINI_API_KEY (required unless DRY_RUN), AVATAR_IMAGE_MODEL
 * (default gemini-2.5-flash-image), AVATAR_POOL_COUNT (default 600),
 * AVATAR_POOL_SEED (default 20261124).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { planPortraitSpecs, type PortraitSpec } from './planMatrix';
import { logger } from '@/utils/logger';

const DIR = import.meta.dirname;
const LEDGER_PATH = path.join(DIR, 'spec-ledger.json');
const RAW_DIR = path.join(DIR, 'out', 'raw');
const DRY_RUN = process.env.DRY_RUN === 'true';
const COUNT = Number(process.env.AVATAR_POOL_COUNT ?? 600);
const SEED = Number(process.env.AVATAR_POOL_SEED ?? 20261124);
const MODEL = process.env.AVATAR_IMAGE_MODEL ?? 'gemini-2.5-flash-image';
const LIMIT = Number(process.env.AVATAR_POOL_LIMIT ?? 0); // 0 = no cap (pilot runs)
const MAX_RETRIES = 4;

/** Minimal .env loader — one key, no dependency. */
function loadDotEnv(): void {
  const envPath = path.resolve(DIR, '../../.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2];
  }
}

function loadLedger(): PortraitSpec[] {
  if (existsSync(LEDGER_PATH)) {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf-8')) as PortraitSpec[];
  }
  const specs = planPortraitSpecs({ count: COUNT, seed: SEED });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(specs, null, 2)}\n`);
  logger.log(`Wrote spec ledger: ${specs.length} specs → ${LEDGER_PATH}`);
  return specs;
}

interface ImageResponse {
  candidates?: {
    content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
  }[];
}

async function generateOne(key: string, spec: PortraitSpec): Promise<Buffer> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}` +
    `:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: spec.prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 || res.status >= 500) {
      const backoff = 1000 * 2 ** attempt;
      logger.warn(`${spec.id}: HTTP ${res.status} — retry in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }
    if (!res.ok) throw new Error(`${spec.id}: HTTP ${res.status} ${await res.text()}`);
    const json = (await res.json()) as ImageResponse;
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error(`${spec.id}: no image in response`);
    return Buffer.from(part.inlineData.data, 'base64');
  }
  throw new Error(`${spec.id}: exhausted ${MAX_RETRIES} retries`);
}

async function main(): Promise<void> {
  loadDotEnv();
  mkdirSync(RAW_DIR, { recursive: true });
  const specs = loadLedger();

  if (DRY_RUN) {
    logger.log(`DRY_RUN: ${specs.length} specs in ledger; no API calls made.`);
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY required (set env or .env)');

  const pending = specs
    .filter((s) => !existsSync(path.join(RAW_DIR, `${s.id}.png`)))
    .slice(0, LIMIT > 0 ? LIMIT : undefined);
  logger.log(`${pending.length}/${specs.length} portraits to generate (${MODEL}).`);

  let done = 0;
  for (const spec of pending) {
    const png = await generateOne(key, spec);
    writeFileSync(path.join(RAW_DIR, `${spec.id}.png`), png);
    if (++done % 25 === 0) logger.log(`  ${done}/${pending.length}`);
  }
  logger.log(`Portrait generation complete: ${done} new images in ${RAW_DIR}`);
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
