/**
 * V32 portrait-pool spec planner.
 *
 * Pure + deterministic: given a count and seed, emits a stable list of
 * fully-tagged portrait specs. Coverage is enforced for every
 * gender x ageGroup x role cell; the remaining budget is filled by seeded
 * sampling of the tag space. The emitted spec list is committed as the pool
 * ledger so generation runs are resumable and diffable.
 */
import { SeededRNG } from '@/utils/random';

export interface PortraitSpec {
  id: string;
  tags: string[];
  prompt: string;
}

export interface PlanPortraitOptions {
  count: number;
  seed: number;
}

const GENDERS = ['masc', 'fem', 'neutral'] as const;
const AGES = ['young', 'adult', 'middle', 'elder'] as const;
const ROLES = ['warrior', 'trainer', 'owner', 'promoter'] as const;
const SKIN_TONES = ['light', 'medium', 'olive', 'dark', 'deep'] as const;
const HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'gray'] as const;
const HAIR_STYLES = ['short', 'long', 'braids', 'dreads', 'shaved', 'topknot'] as const;
const FACIAL_HAIR = ['stubble', 'beard', 'mustache', 'goatee'] as const;
const MARKINGS = ['scar', 'eyepatch', 'warpaint', 'tattoo'] as const;
const HEADGEAR = ['helm', 'headband', 'circlet', 'hood'] as const;
const BUILDS = ['light', 'defensive', 'heavy'] as const;

const GENDER_PHRASE: Record<string, string> = {
  masc: 'male',
  fem: 'female',
  neutral: 'androgynous',
};
const AGE_PHRASE: Record<string, string> = {
  young: 'teenaged',
  adult: 'adult',
  middle: 'middle-aged',
  elder: 'elderly',
};
const SKIN_PHRASE: Record<string, string> = {
  light: 'pale',
  medium: 'tan',
  olive: 'olive',
  dark: 'brown',
  deep: 'dark brown',
};
const ROLE_PHRASE: Record<string, string> = {
  warrior: 'arena pit fighter',
  trainer: 'veteran arena trainer',
  owner: 'gladiatorial stable master',
  promoter: 'flamboyant arena promoter',
};
const BUILD_PHRASE: Record<string, string> = {
  light: 'a sleeveless fighting tunic',
  defensive: 'a padded defensive gambeson',
  heavy: 'scarred plate armor with pauldrons',
};
const MARKING_PHRASE: Record<string, string> = {
  scar: 'a pale scar cutting across the face',
  eyepatch: 'a leather eyepatch over one eye',
  warpaint: 'black warpaint streaked across the cheeks',
  tattoo: 'a faded ink facial tattoo',
};
const HEADGEAR_PHRASE: Record<string, string> = {
  helm: 'a battered bronze gladiator helm pushed back',
  headband: 'a cloth headband',
  circlet: 'a thin gold circlet',
  hood: 'a worn leather hood',
};

function buildPrompt(tags: string[]): string {
  const t = new Set(tags);
  const gender = GENDERS.find((g) => t.has(g)) ?? 'neutral';
  const age = AGES.find((a) => t.has(a)) ?? 'adult';
  const skin = SKIN_TONES.find((s) => t.has(s)) ?? 'medium';
  const role = ROLES.find((r) => t.has(r)) ?? 'warrior';
  const build = BUILDS.find((b) => t.has(b)) ?? 'light';
  const hair = t.has('bald')
    ? 'a shaved head'
    : `${HAIR_COLORS.find((c) => t.has(c)) ?? 'brown'} ${HAIR_STYLES.find((s) => t.has(s)) ?? 'short'} hair`;
  const facial = FACIAL_HAIR.find((f) => t.has(f));
  const markings = MARKINGS.filter((m) => t.has(m)).map((m) => MARKING_PHRASE[m]);
  if (t.has('wrinkles')) markings.push('deep wrinkles');
  const headgear = HEADGEAR.find((h) => t.has(h));

  const traits = [hair, facial ? `a ${facial.replace('_', ' ')}` : null, ...markings, headgear ? HEADGEAR_PHRASE[headgear] : null]
    .filter(Boolean)
    .join(', ');

  return (
    `Painterly bust portrait of a ${AGE_PHRASE[age]} ${GENDER_PHRASE[gender]} ` +
    `${ROLE_PHRASE[role]}, ${SKIN_PHRASE[skin]} skin, ${traits}, ` +
    `wearing ${BUILD_PHRASE[build]}, stern weathered expression, ` +
    `head-and-shoulders framing, centered composition, muted smoky-grey ` +
    `backdrop, gritty classical oil-painting style, dramatic side lighting`
  );
}

interface Combo {
  gender: string;
  age: string;
  role: string;
}

/** One spec's full tag list for a combo, drawn from seeded picks. */
function drawTags(rng: SeededRNG, combo: Combo): string[] {
  const tags: string[] = [combo.gender, combo.age, rng.pick([...BUILDS]), combo.role];
  tags.push(rng.pick([...SKIN_TONES]));

  const elder = combo.age === 'elder';
  const hairRoll = rng.next();
  if (hairRoll < (elder ? 0.3 : 0.06)) {
    tags.push('bald');
  } else {
    tags.push(elder && rng.chance(0.7) ? 'gray' : rng.pick([...HAIR_COLORS]));
    tags.push(elder && rng.chance(0.5) ? 'balding' : rng.pick([...HAIR_STYLES]));
  }

  if (combo.gender === 'masc' && combo.age !== 'young' && rng.chance(0.55)) {
    tags.push(rng.pick([...FACIAL_HAIR]));
  }
  if (combo.age === 'middle' || combo.age === 'elder') {
    if (rng.chance(0.6)) tags.push('wrinkles');
  }
  if (rng.chance(0.25)) tags.push(rng.pick([...MARKINGS]));
  if (rng.chance(0.3)) tags.push(rng.pick([...HEADGEAR]));
  return tags;
}

/**
 * Emit `count` deterministic portrait specs. Every gender x ageGroup x role
 * cell appears at least once before seeded fill begins.
 */
export function planPortraitSpecs(opts: PlanPortraitOptions): PortraitSpec[] {
  const rng = new SeededRNG(opts.seed);
  const combos: Combo[] = [];
  for (const role of ROLES) {
    for (const age of AGES) {
      for (const gender of GENDERS) {
        combos.push({ gender, age, role });
      }
    }
  }
  while (combos.length < opts.count) {
    combos.push({
      gender: rng.pick([...GENDERS]),
      age: rng.pick([...AGES]),
      role: rng.pick([...ROLES]),
    });
  }

  const seen = new Set<string>();
  const specs: PortraitSpec[] = [];
  for (const combo of combos) {
    let tags = drawTags(rng, combo);
    let signature = [...tags].sort().join('|');
    while (seen.has(signature)) {
      tags = drawTags(rng, combo);
      signature = [...tags].sort().join('|');
    }
    seen.add(signature);
    specs.push({
      id: `p-${String(specs.length).padStart(4, '0')}`,
      tags,
      prompt: buildPrompt(tags),
    });
    if (specs.length >= opts.count) break;
  }
  return specs;
}
