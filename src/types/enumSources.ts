/**
 * Single-source-of-truth const arrays for enums shared between TypeScript types and Zod schemas.
 * Import these to derive both `type X = typeof ARR[number]` and `z.enum(ARR)`.
 */

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

export const CROWD_MOODS = ['Calm', 'Bloodthirsty', 'Theatrical', 'Solemn', 'Festive'] as const;

export const WEATHER_TYPES = [
  'Clear',
  'Rainy',
  'Sweltering',
  'Breezy',
  'Overcast',
  'Blazing Sun',
  'Gale',
  'Blood Moon',
  'Eclipse',
  'Sandstorm',
  'Tornado',
  'Blizzard',
  'Dense Fog',
  'Mist',
  'Thunderstorm',
  'Ashfall',
  'Eldritch Eclipse',
  'Prismatic Rain',
  'Moonlight Duel',
  'Acid Rain',
  'Mana Surge',
  'Rainbow',
  'Astral Dust',
  'Scorching Wind',
  'Wild Magic',
  'Spooky Night',
  'Meteor Shower',
  'Solar Flare',
  'Abyssal Gloom',
  'Cursed Miasma',
  'Hailstorm',
  'Arcane Storm',
  'Blood Rain',
  'Aurora Borealis',
  'Chaotic Winds',
  'Aether Storm',
  'Locust Swarm',
  'Gravity Anomaly',
  'Mirage',
  'Ember Rain',
  'Zephyr',
  'Wildfire Smoke',
  'Blood Fog',
  'Shimmering Heat',
  'Crystal Rain',
  'Rain of Frogs',
  'Chaos Storm',
  'Chaos Squall',
  'Crimson Snow',
  'Whispering Winds',
  'Glittering Frost',
] as const;

export const TRAINER_TIERS = ['Novice', 'Seasoned', 'Master'] as const;

export const TRAINER_FOCI = ['Aggression', 'Defense', 'Endurance', 'Mind', 'Healing'] as const;

export const TRAINER_SPECIALTIES = [
  'KillerInstinct',
  'IronConditioning',
  'CounterFighter',
  'Footwork',
  'IronGuard',
  'Finisher',
  'RopeADope',
] as const;

export const SCOUT_QUALITIES = ['Basic', 'Detailed', 'Expert'] as const;

export const ATTACK_TARGETS = [
  'Head',
  'Chest',
  'Abdomen',
  'Right Arm',
  'Left Arm',
  'Right Leg',
  'Left Leg',
  'Any',
] as const;

export const PROTECT_TARGETS = ['Head', 'Body', 'Arms', 'Legs', 'Any'] as const;

export const OFFENSIVE_TACTICS = ['Lunge', 'Slash', 'Bash', 'Decisiveness', 'none'] as const;

export const DEFENSIVE_TACTICS = ['Dodge', 'Parry', 'Riposte', 'Responsiveness', 'none'] as const;

export const CONDITION_TRIGGERS = [
  'HP_BELOW',
  'HP_ABOVE',
  'MOMENTUM_LEAD',
  'MOMENTUM_DEFICIT',
  'PHASE_IS',
  'ENDURANCE_BELOW',
] as const;

export const PSYCH_STATES = [
  'Neutral',
  'InTheZone',
  'Rattled',
  'Desperate',
  'Cruising',
  'FatiguePanic',
] as const;

export const DISTANCE_RANGES = ['Grapple', 'Tight', 'Striking', 'Extended'] as const;

export const ARENA_ZONES = ['Center', 'Edge', 'Corner', 'Obstacle'] as const;

export const COMMIT_LEVELS = ['Cautious', 'Standard', 'Full'] as const;

export const ARENA_TAGS = [
  'outdoor',
  'indoor',
  'elevated',
  'water',
  'cramped',
  'open',
  'premium',
  'uneven',
  'ruins',
  'magical',
  'cursed',
  'living',
] as const;

export const SHIELD_SHAPES = ['heater', 'french', 'swiss', 'spanish', 'lozenge'] as const;

export const FIELD_TYPES = [
  'solid',
  'fess',
  'pale',
  'bend',
  'chevron',
  'cross',
  'saltire',
  'per-pale',
  'per-fess',
  'gyronny',
  'bend-sinister',
  'pale-environ',
  'chevron-inverted',
  'quarterly',
] as const;

export const METAL_COLORS = ['gold', 'silver'] as const;

export const CHARGE_TYPES = [
  'beast',
  'weapon',
  'symbol',
  'nature',
  'celestial',
  'mythical',
] as const;

export const BEAST_POSTURES = [
  'rampant',
  'passant',
  'sejant',
  'couchant',
  'statant',
  'forcene',
] as const;

export const ARMOR_WEIGHTS = ['None', 'Light', 'Medium', 'Heavy', 'Ultra-Heavy'] as const;

export const WEAPON_TYPES = ['slashing', 'bashing', 'piercing', 'fist'] as const;

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'shield', 'helm'] as const;

export const BOUT_OFFER_STATUSES = [
  'Proposed',
  'Signed',
  'Rejected',
  'Canceled',
  'Expired',
] as const;

export const BOUT_OFFER_RESPONSES = ['Pending', 'Accepted', 'Declined'] as const;

export const FIGHT_OUTCOME_BY = ['Kill', 'KO', 'Exhaustion', 'Stoppage', 'Draw', 'null'] as const;

export const DEATH_CAUSE_BUCKETS = [
  'FATAL_DAMAGE',
  'EXECUTION',
  'CRITICAL_CHAIN',
  'FATIGUE_COLLAPSE',
  'ARMOR_FAILURE',
  'RIVALRY_FINISH',
] as const;

export const AI_INTENTS = [
  'EXPANSION',
  'CONSOLIDATION',
  'VENDETTA',
  'RECOVERY',
  'SURVIVAL',
  'WEALTH_ACCUMULATION',
  'AGGRESSIVE_EXPANSION',
  'ROSTER_DIVERSITY',
] as const;

export const ANNUAL_AWARD_TYPES = [
  'WARRIOR_OF_YEAR',
  'KILLER_OF_YEAR',
  'STABLE_OF_YEAR',
  'CLASS_MVP',
  'TOURNAMENT_RANK',
] as const;

export const WARRIOR_STATUSES = ['Active', 'Dead', 'Retired'] as const;

export const INJURY_SEVERITIES = ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent'] as const;

export const INJURY_LOCATIONS = [
  'Head',
  'Chest',
  'Abdomen',
  'Right Arm',
  'Left Arm',
  'Right Leg',
  'Left Leg',
  'General',
] as const;

export const PROMOTER_PERSONALITIES = [
  'Greedy',
  'Honorable',
  'Sadistic',
  'Flashy',
  'Corporate',
] as const;

export const PROMOTER_TIERS = ['Local', 'Regional', 'National', 'Legendary'] as const;

export const OWNER_PERSONALITIES = [
  'Aggressive',
  'Methodical',
  'Showman',
  'Pragmatic',
  'Tactician',
] as const;

export const META_ADAPTATIONS = [
  'MetaChaser',
  'Traditionalist',
  'Opportunist',
  'Innovator',
] as const;
