/**
 * Naming cultures — the mapping from owner personality, philosophy, and
 * warrior archetype to a flavor of generated names.
 *
 * Design Bible: "Names reflect cultural and class tendencies (e.g., defensive
 * stables use stoic Latin names, aggressive ones Norse or Celtic)."
 *
 * Culture seed lists serve double duty: they are drawn from directly (to
 * preserve curated flavor) alongside the syllable-composition path below.
 */
import { NAMES_BRUTAL, NAMES_AGILE, NAMES_CUNNING, NAMES_MIXED } from './archetypeNames';
import { COMMON_CORPUS } from './commonCorpus';
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';

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

/** Maps a warrior archetype to a naming culture; falls back to 'common'. */
export function cultureForArchetype(archetype: string): NamingCulture {
  return ARCHETYPE_CULTURE[archetype] ?? 'common';
}

/**
 * Phoneme inventory for the syllable composer. `onsets` open syllables,
 * `nuclei` are vowel cores, `codas` close them, and `affixes` are the
 * culture's characteristic endings — the part that makes a composed name
 * read as Norse vs Latin vs gutter-stock.
 */
export interface SyllableTable {
  onsets: readonly string[];
  nuclei: readonly string[];
  codas: readonly string[];
  affixes: readonly string[];
}

/**
 * Per-culture syllable frames used when the generator composes a novel name
 * (as opposed to drawing a curated seed).
 */
export const SYLLABLE_TABLES: Record<NamingCulture, SyllableTable> = {
  norse: {
    onsets: [
      'B', 'BR', 'BJ', 'D', 'DR', 'F', 'G', 'GR', 'H', 'K', 'KR', 'M', 'R', 'S', 'SK', 'ST',
      'TH', 'V', 'W', 'Y',
    ],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'Y', 'AL', 'AR', 'OR', 'UR'],
    codas: [
      'R', 'N', 'K', 'G', 'RN', 'RK', 'LD', 'TH', 'NN', 'TT', 'SON', 'GAR', 'ULF', 'RIK',
    ],
    affixes: ['SON', 'GAR', 'ULF', 'RIK', 'HEIM', 'BJORN', 'STEIN', 'VALD', 'BORN', 'HALL'],
  },
  latin: {
    onsets: [
      'C', 'L', 'M', 'N', 'P', 'QU', 'S', 'T', 'V', 'AU', 'FL', 'PR', 'COR', 'MAX', 'SEN',
    ],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'AE', 'IA', 'IO'],
    codas: ['S', 'X', 'L', 'R', 'N', 'M', 'US', 'IS', 'AX', 'IX', 'NUS', 'RIUS', 'CIL'],
    affixes: ['IUS', 'US', 'OR', 'IX', 'AX', 'ANUS', 'ICUS', 'ULUS', 'ORIUS'],
  },
  shadow: {
    onsets: ['SH', 'Z', 'X', 'V', 'TH', 'N', 'M', 'D', 'K', 'S', 'GH', 'VR', 'NY'],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'Y', 'AE'],
    codas: ['TH', 'SH', 'X', 'K', 'N', 'R', 'SS', 'Z', 'NX', 'RK', 'PH'],
    affixes: ['SHADE', 'DUSK', 'WRAITH', 'MOURNE', 'VEIL', 'NIGHT', 'FANG', 'GRIM'],
  },
  exotic: {
    onsets: ['Z', 'X', 'K', 'J', 'V', 'S', 'T', 'N', 'M', 'R', 'Q', 'DJ', 'KH', 'ZH'],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'AI', 'EI', 'OA', 'UA', 'II'],
    codas: ['S', 'N', 'L', 'R', 'X', 'Z', 'SH', 'TH'],
    affixes: ['ARA', 'AZA', 'IRIS', 'ORIS', 'ATH', 'ANI', 'URA', 'ELLE'],
  },
  common: {
    onsets: [
      'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W',
      'BR', 'CR', 'ST', 'TR',
    ],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'EA', 'OA'],
    codas: ['R', 'N', 'K', 'D', 'L', 'S', 'T', 'RD', 'RT', 'CK', 'SH'],
    affixes: ['ER', 'SON', 'WOOD', 'STONE', 'HARD', 'BOLD'],
  },
  lowborn: {
    onsets: ['B', 'D', 'G', 'GR', 'H', 'K', 'M', 'P', 'R', 'S', 'SN', 'W', 'FL', 'DR'],
    nuclei: ['A', 'E', 'I', 'O', 'U', 'OO'],
    codas: ['G', 'N', 'K', 'D', 'R', 'T', 'CH', 'TCH', 'SH', 'BB', 'GG'],
    affixes: ['DIRT', 'MUD', 'RAG', 'ASH', 'GUT', 'RAT', 'DOB', 'FENN'],
  },
};
