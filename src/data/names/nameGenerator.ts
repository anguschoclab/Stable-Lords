/**
 * Procedural warrior name generator.
 *
 * Names are produced two ways, blended per draw:
 *  - a seed draw from the culture's curated corpus (preserves authored flavor,
 *    including legacy WARRIOR_NAMES and stable-template `warriorNames` pools)
 *  - a Markov chain (order-2 over characters) trained on the culture's seeds,
 *    producing novel-but-on-theme names
 *
 * Determinism: callers on engine/pipeline paths MUST pass an `IRNGService`.
 * Callers that want entropy (UI randomizers) may omit `rng`, which falls back
 * to `entropyRng()` — see docs/RNG_POLICY.md.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { entropyRng } from '@/utils/random';
import {
  CULTURE_SEEDS,
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
  usedNames?: Set<string>;
  /** RNG service. Omit for entropy (UI paths only — engine paths must pass one). */
  rng?: IRNGService;
}

const MAX_NAME_LEN = 20; // WarriorBuilder input caps at maxLength=20
const MIN_NAME_LEN = 2;
const SEED_DRAW_P = 0.45;
const MAX_ATTEMPTS = 60;

const END = '';
const START = '^^';

// ─── Markov model ─────────────────────────────────────────────────────────

type NameModel = ReadonlyMap<string, readonly string[]>;

const modelCache = new Map<NamingCulture, NameModel>();

function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z '-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function trainModel(seeds: readonly string[]): NameModel {
  const chains = new Map<string, string[]>();
  for (const raw of seeds) {
    const name = sanitize(raw);
    if (name.length < MIN_NAME_LEN) continue;
    const s = `${START}${name}${END}`;
    for (let i = 2; i < s.length; i++) {
      const key = s.slice(i - 2, i);
      let next = chains.get(key);
      if (!next) chains.set(key, (next = []));
      const ch = s[i];
      if (ch !== undefined) next.push(ch);
    }
  }
  return chains;
}

function modelFor(culture: NamingCulture): NameModel {
  let model = modelCache.get(culture);
  if (!model) {
    model = trainModel(CULTURE_SEEDS[culture]);
    modelCache.set(culture, model);
  }
  return model;
}

function generateFromModel(model: NameModel, rng: IRNGService): string {
  let out = '';
  for (let i = 0; i < MAX_NAME_LEN + 4; i++) {
    const tail =
      out.length >= 2 ? out.slice(-2) : START.slice(0, 2 - out.length) + out;
    const options = model.get(tail);
    if (!options || options.length === 0) break;
    const c = rng.pick(options as string[]);
    if (c === END) break;
    out += c;
    if (out.length >= 16) break;
  }
  return sanitize(out);
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
    const candidate = useSeed ? rng.pick(pool) : generateFromModel(modelFor(culture), rng);
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
