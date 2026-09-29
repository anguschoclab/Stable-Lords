/**
 * Naming cultures — the mapping from owner personality, philosophy, and
 * warrior archetype to a flavor of generated names.
 *
 * Design Bible: "Names reflect cultural and class tendencies (e.g., defensive
 * stables use stoic Latin names, aggressive ones Norse or Celtic)."
 *
 * Culture seed lists serve double duty: they are drawn from directly (to
 * preserve curated flavor) and they train the per-culture Markov name model.
 */
import { NAMES_BRUTAL, NAMES_AGILE, NAMES_CUNNING, NAMES_MIXED } from './archetypeNames';
import { COMMON_CORPUS } from './commonCorpus';
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';

/** Naming culture — the language family a warrior name is drawn from. */
/** Naming culture identifiers — flavor buckets for generated warrior names. */
export type NamingCulture = 'norse' | 'latin' | 'shadow' | 'exotic' | 'common' | 'lowborn';

/** A weighted mix of cultures — e.g. a stable that blends traditions. */
export interface WeightedCulture {
  culture: NamingCulture;
  weight: number;
}

/** Either a single culture or a weighted mix. */
export type CultureSpec = NamingCulture | readonly WeightedCulture[];

/** Names curated for each culture — drawn directly and used as Markov training data. */
export const CULTURE_SEEDS: Record<NamingCulture, readonly string[]> = {
  norse: [
    // Archetype brutal corpus — already norse-flavored
    ...NAMES_BRUTAL,
    // Nordic sagas
    'BJORN',
    'ULF',
    'RAGNAR',
    'SIGURD',
    'EIRIK',
    'TORBJORN',
    'HAKON',
    'IVAR',
    'GORM',
    'HARALD',
    'KNUT',
    'LEIF',
    'MAGNI',
    'STEN',
    'THORGEST',
    'TRYGGVE',
    'VIGGO',
    'ASGER',
    'SVEN',
    'ORVAR',
    'STYRBJORN',
    'EINAR',
    'ARNE',
    'GUNNAR',
    'HALFDAN',
    'SKARDE',
    'TOKE',
    'FRODE',
    'GRIMKELL',
    'ERLEND',
    'KOLBEIN',
    'RUNOLF',
    'SIGVALD',
    'THORFINN',
    'VARG',
    'YRSA',
    'BRUNHILD',
    'SIGRUN',
    'THORA',
    'ASTA',
  ],
  latin: [
    // Stoic legionary names
    'MAXIMUS',
    'CASSIUS',
    'LUCIUS',
    'TITUS',
    'SEVERUS',
    'MARCELLUS',
    'AUGUSTUS',
    'DRUSUS',
    'FLAVIUS',
    'QUINTUS',
    'REMUS',
    'SENECA',
    'VARRO',
    'CORVINUS',
    'AEMILIUS',
    'CLAUDIUS',
    'FABIUS',
    'GALBA',
    'HORTENSIUS',
    'JULIAN',
    'LIVIUS',
    'NERVA',
    'OCTAVIUS',
    'PAULUS',
    'REGULUS',
    'SCIPIO',
    'TIBERIUS',
    'VALENS',
    'VITUS',
    'CORNELIUS',
    // Stoic nouns / martial orders (incl. tank-archetype corpus)
    ...NAMES_MIXED.filter((n) => n.length <= 12),
    'PRAETOR',
    'LEGATUS',
    'CENTURION',
    'TRIARIUS',
    'HASTATUS',
    'IMMUNIS',
    'TESTUDO',
    'AEGIS',
    'PHALANX',
    'MONOLITH',
  ],
  shadow: [
    // Cunning + dark agile corpus
    ...NAMES_CUNNING,
    'NYX',
    'SHADE',
    'WISP',
    'GHOST',
    'ECHO',
    'NOCTURNE',
    'UMBRA',
    'VELUM',
    'OBSIDIAN',
    'MOSS',
    'WRAITHBORNE',
    'DUSK',
    'CINDER',
    'HOLLOW',
    'GRIMSHAW',
    'MORROW',
    'NIGHTJAR',
    'SOLACE',
  ],
  exotic: [
    // Agile corpus is already exotic-flavored
    ...NAMES_AGILE,
    'ZAFIR',
    'KASIM',
    'NADIR',
    'SELIM',
    'AZHAR',
    'JAFFAR',
    'RAHIM',
    'AMARA',
    'ZARA',
    'ISHAK',
    'FARIS',
    'TAHIR',
    'ZUBAIR',
    'NAILA',
    'SABIRA',
    'KALILA',
    'DARIOSH',
    'CYPRIAN',
    'THALIA',
    'XANTHE',
    'ISOLDE',
    'SERAPH',
    'AZIZ',
    'KAMAL',
  ],
  // The full legacy corpus + the recruitment narrative pool — the
  // unflavored baseline every other culture diverges from.
  common: [
    ...COMMON_CORPUS,
    ...(narrativeContent as NarrativeContent).recruitment.names,
  ],
  lowborn: [
    // Pit rats, gutter fighters, purchased labor
    'DOB',
    'RATCATCHER',
    'MUD',
    'PIKE',
    'SPAR',
    'COBB',
    'GUTTER',
    'ASH',
    'CINDER',
    'FOGG',
    'BONES',
    'KNUCKLE',
    'GRIT',
    'SLAG',
    'TALLOW',
    'BRICK',
    'CLAY',
    'SOD',
    'ROOT',
    'THISTLE',
    'MOLE',
    'NEWT',
    'DREG',
    'SCAB',
    'WREN',
    'MAGPIE',
    'ITCHY',
    'SNIPE',
    'DUNN',
    'PELT',
    'HOB',
    'NIP',
    'SCUTTLE',
    'WART',
    'FENN',
  ],
};

/** Personality → culture. The owner's temperament sets the stable's naming tradition. */
const PERSONALITY_CULTURE: Record<string, NamingCulture> = {
  Aggressive: 'norse',
  Methodical: 'latin',
  Showman: 'exotic',
  Tactician: 'shadow',
  Pragmatic: 'common',
};

/** Philosophy → culture, used when personality is absent or overridden by training ethos. */
const PHILOSOPHY_CULTURE: Record<string, NamingCulture> = {
  'Brute Force': 'norse',
  'Speed Kills': 'exotic',
  'Iron Defense': 'latin',
  Balanced: 'common',
  Spectacle: 'exotic',
  Cunning: 'shadow',
  Endurance: 'latin',
  Specialist: 'shadow',
};

/**
 * Resolves the naming culture for a stable from owner personality and
 * philosophy. Personality wins; philosophy is the fallback; `common` is the
 * neutral default.
 */
export function cultureForOwner(
  personality?: string | null,
  philosophy?: string | null
): NamingCulture {
  if (personality && PERSONALITY_CULTURE[personality]) {
    return PERSONALITY_CULTURE[personality];
  }
  if (philosophy && PHILOSOPHY_CULTURE[philosophy]) {
    return PHILOSOPHY_CULTURE[philosophy];
  }
  return 'common';
}

/** Warrior archetype → culture (used when no stable context is available). */
const ARCHETYPE_CULTURE: Record<string, NamingCulture> = {
  brutal: 'norse',
  tank: 'latin',
  agile: 'exotic',
  cunning: 'shadow',
};

/** Maps a warrior archetype (brutal/agile/cunning/tank) to its default culture. */
/** Maps a warrior archetype to a naming culture; falls back to 'common'. */
export function cultureForArchetype(archetype: string): NamingCulture {
  return ARCHETYPE_CULTURE[archetype] ?? 'common';
}
