/**
 * Names_brutal.
 */
export const NAMES_BRUTAL = [
  'KRAGOS',
  'GORLAK',
  'BRUTAG',
  'THUNDRAK',
  'GARVOK',
  'IRONJAW',
  'BOLVERK',
  'SKARN',
  'GROTHAK',
  'WULFGAR',
  'DRAXUS',
  'MORGUL',
  'KORGAN',
  'BREKKA',
  'GRIMMAW',
  'STONEFIST',
  'BLOODAXE',
  'IRONCLAW',
  'KRAKEN',
  'OX',
  'HAMMER',
  'ANVIL',
  'BULL',
  'BOAR',
  'MAMMOTH',
  'TITAN',
  'COLOSSUS',
  'JUGGERNAUT',
  'RAZOR',
  'GOLIATH',
  'BEHEMOTH',
  'IRONBULL',
  'WARHAMMER',
  'CRUSHER',
  'BREAKER',
  'STOMPER',
  'GRIM',
  'BASTION',
];/**
   * Names_agile.
   */


/**
 * Names_agile.
 */
export const NAMES_AGILE = [
  'SILVANE',
  'VEXIA',
  'THORNE',
  'VYREN',
  'KAELIS',
  'NYX',
  'TALYN',
  'ZEPHYRA',
  'LYSARA',
  'MIRAEL',
  'SYRAH',
  'ASHARA',
  'DUSKBANE',
  'SHADOWSTEP',
  'QUICKBLADE',
  'SWIFTWIND',
  'NIGHTWHISPER',
  'RAZORLEAF',
  'WISP',
  'GHOST',
  'MIST',
  'DART',
  'BOLT',
  'STRIKE',
  'FLASH',
  'COBRA',
  'KESTREL',
  'HAWK',
  'FALCON',
  'VIPER',
  'SCORPION',
  'SILVER',
  'QUICKSILVER',
  'SHADE',
  'WHISPER',
  'ZEPHYR',
  'ECHO',
  'GOSSAMER',
];/**
   * Names_cunning.
   */


/**
 * Names_cunning.
 */
export const NAMES_CUNNING = [
  'FERRIK',
  'MORKA',
  'OBERON',
  'MALAKAI',
  'SEREN',
  'VHAEL',
  'RAZIEL',
  'CASSIAN',
  'EREBUS',
  'ORPHEUS',
  'REVENANT',
  'NOCTIS',
  'GHAEL',
  'VELKOR',
  'AURELIAN',
  'PRIMUS',
  'DECIMUS',
  'SEVERAK',
  'FOX',
  'JACKAL',
  'RAVEN',
  'CROW',
  'OWL',
  'SNAKE',
  'SPIDER',
  'WEB',
  'TRICKSTER',
  'JESTER',
  'PHANTOM',
  'ENIGMA',
  'MYSTIC',
  'SAGE',
  'ORACLE',
  'PROPHET',
  'SCRIBE',
  'SCHOLAR',
  'CIPHER',
  'VEIL',
];/**
   * Names_mixed.
   */


/**
 * Names_mixed.
 */
export const NAMES_MIXED = [
  'VICTUS',
  'MAXIMAR',
  'GLADIUS',
  'SPARTOK',
  'CENTURAX',
  'VALORIAN',
  'FANGMAW',
  'STORMFANG',
  'SCORPIUS',
  'RAVENMOOR',
  'HAWKSTEEL',
  'DIREWOLF',
  'ASHCLAW',
  'VIPERTOOTH',
  'LYNXBLADE',
  'BEARJAW',
  'TYRANNUS',
  'WRAITH',
  'WOLF',
  'HOUND',
  'BEAR',
  'LION',
  'TIGER',
  'LEOPARD',
  'PANTHER',
  'CHIMERA',
  'HYDRA',
  'DRAKE',
  'DRAGON',
  'PHOENIX',
  'GRIFFIN',
  'MANTICORE',
  'SPHINX',
  'BASILISK',
  'WYVERN',
  'LEGION',
  'VANGUARD',
];/**
   * Archetype type.
   */


/**
 * Archetype type.
 */
export type Archetype = 'brutal' | 'agile' | 'cunning' | 'tank';/**
                                                                 * Archetype_names.
                                                                 */


/**
 * Archetype_names.
 */
export const ARCHETYPE_NAMES: Record<Archetype, string[]> = {
  brutal: NAMES_BRUTAL,
  agile: NAMES_AGILE,
  cunning: NAMES_CUNNING,
  tank: NAMES_MIXED,
};
