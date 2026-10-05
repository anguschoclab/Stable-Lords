/**
 * Procedural warrior name generator.
 *
 * Names are produced two ways, blended per draw (~40% / 60%):
 *  - a seed draw from the culture's curated corpus (preserves authored flavor,
 *    including legacy WARRIOR_NAMES and stable-template `warriorNames` pools)
 *  - a syllable composer over the culture's onset/nucleus/coda + affix
 *    inventory, producing novel-but-pronounceable names
 *
 * Determinism: callers on engine/pipeline paths MUST pass an `IRNGService`.
 * Callers that want entropy (UI randomizers) may omit `rng`, which falls back
 * to `entropyRng()` — see docs/RNG_POLICY.md.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { entropyRng, SeededRNG } from '@/utils/random';
import {
  CULTURE_SEEDS,
  SYLLABLE_TABLES,
  cultureForArchetype,
  type CultureSpec,
  type NamingCulture,
} from './cultures';

/** Options for warrior-name generation. */
export interface WarriorNameOptions {
  /** Naming culture, or a weighted mix of cultures. Falls back to `archetype` → culture → 'common'. */
  culture?: CultureSpec;
  /** Warrior archetype (brutal/agile/cunning/tank) — derives a culture when `culture` is absent. */
  archetype?: string;
  /** Extra curated vocabulary to draw seeds from (e.g. stable-template warriorNames). */
  seedPool?: readonly string[];
  /** Names already in use — the generator will never return one. */
  usedNames?: ReadonlySet<string>;
  /** RNG service. Omit for entropy (UI paths only — engine paths must pass one). */
  rng?: IRNGService;
}

const MAX_NAME_LEN = 20; // WarriorBuilder input caps at maxLength=20
const MIN_NAME_LEN = 2;
const SEED_DRAW_P = 0.4;
const MAX_ATTEMPTS = 60;

function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z '-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Syllable composer ────────────────────────────────────────────────────

/**
 * Composes a novel name from the culture's syllable inventory:
 * 1–3 syllables of onset+nucleus+(coda), sometimes closed by a culture
 * affix instead of a coda — the part that carries the flavor.
 */
function composeSyllableName(culture: NamingCulture, rng: IRNGService): string {
  const table = SYLLABLE_TABLES[culture];
  const roll = rng.next();
  const syllables = roll < 0.15 ? 1 : roll < 0.8 ? 2 : 3;

  // Open syllables (onset+nucleus) only — internal codas would stack
  // consonant clusters into unpronounceable names.
  let name = `${rng.pick(table.onsets as string[])}${rng.pick(table.nuclei as string[])}`;
  for (let i = 1; i < syllables; i++) {
    name += rng.pick(table.onsets as string[]);
    name += rng.pick(table.nuclei as string[]);
  }

  // Close with a culture affix when it fits (the flavor carrier), else a coda.
  if (rng.next() < 0.35) {
    const affix = rng.pick(table.affixes as string[]);
    name += name.length + affix.length <= 16 ? affix : rng.pick(table.codas as string[]);
  } else {
    name += rng.pick(table.codas as string[]);
  }
  return name;
}

// ─── Culture resolution ───────────────────────────────────────────────────

function resolveCulture(opts: WarriorNameOptions, rng: IRNGService): NamingCulture {
  const spec = opts.culture;
  if (typeof spec === 'string') return spec;
  if (spec) {
    const total = spec.reduce((sum, c) => sum + c.weight, 0);
    if (total <= 0) return 'common';
    let roll = rng.next() * total;
    for (const c of spec) {
      roll -= c.weight;
      if (roll <= 0) return c.culture;
    }
    return spec[spec.length - 1]?.culture ?? 'common';
  }
  if (opts.archetype) return cultureForArchetype(opts.archetype);
  return 'common';
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Generates a unique warrior name for the given culture/context.
 * Respects `usedNames`; guarantees a non-colliding return.
 */
export function generateWarriorName(opts: WarriorNameOptions = {}): string {
  const rng = opts.rng ?? entropyRng();
  const culture = resolveCulture(opts, rng);
  const seedPool = opts.seedPool ?? [];
  const pool = [...new Set([...seedPool, ...CULTURE_SEEDS[culture]])].map(sanitize);

  let lastCandidate = '';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const useSeed = pool.length > 0 && rng.next() < SEED_DRAW_P;
    const candidate = useSeed ? rng.pick(pool) : composeSyllableName(culture, rng);
    lastCandidate = candidate;
    if (candidate.length < MIN_NAME_LEN || candidate.length > MAX_NAME_LEN) continue;
    if (!opts.usedNames?.has(candidate)) return candidate;
  }

  // Candidate space exhausted — discriminate with a numeral suffix.
  const base = (lastCandidate || 'WARRIOR').slice(0, MAX_NAME_LEN - 4).trim();
  for (const numeral of ROMAN_NUMERALS) {
    const candidate = `${base} ${numeral}`;
    if (candidate.length <= MAX_NAME_LEN && !opts.usedNames?.has(candidate)) return candidate;
  }
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    const candidate = `${base} ${'X'.repeat(Math.min(n, 4))}${n > 4 ? n : ''}`;
    if (candidate.length <= MAX_NAME_LEN && !opts.usedNames?.has(candidate)) return candidate;
  }
  return `${base.slice(0, MAX_NAME_LEN - 3)} ZZ`;
}

const ROMAN_NUMERALS = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

/** Strips existing dynastic suffixes to recover a lineage root. */
function lineageRoot(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X|JR|JUNIOR)$/u, '')
    .replace(/\s+THE\s+.+$/u, '')
    .replace(/SON$/u, '')
    .trim();
}

/**
 * Generates a dynastic successor name that references the parent —
 * e.g. KRAGOS → "KRAGOS II", "KRAGSON", "KRAGOS THE YOUNGER".
 * Respects `usedNames` and the 20-char cap.
 */
export function generateDynasticWarriorName(
  parentName: string,
  opts: WarriorNameOptions = {}
): string {
  const rng = opts.rng ?? entropyRng();
  const root = lineageRoot(parentName) || 'HEIR';
  const forms = new Set<string>([
    ...ROMAN_NUMERALS.slice(0, 5).map((n) => `${root} ${n}`),
    `${root}SON`,
    `${root.slice(0, Math.max(2, root.length - 2))}SON`,
    `${root} THE YOUNGER`,
    `${root} JUNIOR`,
    `YOUNG ${root}`,
  ]);
  const candidates = [...forms].filter(
    (f) => f.length >= MIN_NAME_LEN && f.length <= MAX_NAME_LEN && f !== parentName
  );
  for (let i = 0; i < MAX_ATTEMPTS && candidates.length > 0; i++) {
    const candidate = rng.pick(candidates);
    if (!opts.usedNames?.has(candidate)) return candidate;
  }
  // Every dynastic form taken — fall back to a fresh generated name.
  return generateWarriorName(opts);
}

// ─── Owner/promoter dynastic naming ───────────────────────────────────────

const OWNER_HONORIFICS = ['II', 'III', 'IV', 'Jr.', 'the Younger', 'the Heir', 'V'];
const OWNER_PREFIXES = ['Legacy of', 'Blood of', 'Protege of', 'Shadow of'];

/**
 * Generates a dynastic successor name for a promoter/owner — multi-word
 * civilian naming, distinct from warrior arena names: "Silas Blackwood II",
 * "Legacy of Silas", or a surname hand-off ("Lucius Blackwood").
 */
export function generateDynasticName(originalName: string, seed: number): string {
  const trimmed = originalName.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return 'Legacy of Unknown';
  }

  const rng = new SeededRNG(seed);
  const roll = rng.next();

  if (roll < 0.6) {
    // Suffix style: Silas Blackwood II
    const suffix = rng.pick(OWNER_HONORIFICS);
    return `${trimmed} ${suffix}`;
  } else if (roll < 0.9) {
    // Prefix style: Legacy of Silas Blackwood
    const first = trimmed.split(/\s+/)[0];
    const prefix = rng.pick(OWNER_PREFIXES);
    return `${prefix} ${first}`;
  } else {
    // Surname match: Lucius Blackwood
    const parts = trimmed.split(/\s+/);
    const last = parts.slice(1).join(' ');
    const newFirst = ['Marcus', 'Lucius', 'Julius', 'Titus', 'Gaius', 'Aurelius'];
    if (!last) {
      // Single-word names fall back to prefix style
      const prefix = rng.pick(OWNER_PREFIXES);
      return `${prefix} ${trimmed}`;
    }
    return `${rng.pick(newFirst)} ${last}`;
  }
}
