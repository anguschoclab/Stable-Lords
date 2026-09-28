

/**
 * Weather type type.
 */
export type WeatherType =
  | 'Clear'
  | 'Moonlight Duel'
  | 'Crimson Snow'
  | 'Rainy'
  | 'Sweltering'
  | 'Breezy'
  | 'Overcast'
  | 'Blazing Sun'
  | 'Gale'
  | 'Blood Moon'
  | 'Weeping Skies'
  | 'Eclipse of Chaos'
  | 'Eclipse'
  | 'Sandstorm'
  | 'Zephyr'
  | 'Tornado'
  | 'Blizzard'
  | 'Dense Fog'
  | 'Mist'
  | 'Glittering Frost'
  | 'Thunderstorm'
  | 'Gravity Anomaly'
  | 'Ashfall'
  | 'Eldritch Eclipse'
  | 'Prismatic Rain'
  | 'Acid Rain'
  | 'Mana Surge'
  | 'Rainbow'
  | 'Astral Dust'
  | 'Scorching Wind'
  | 'Spooky Night'
  | 'Meteor Shower'
  | 'Solar Flare'
  | 'Wild Magic'
  | 'Abyssal Gloom'
  | 'Cursed Miasma'
  | 'Hailstorm'
  | 'Arcane Storm'
  | 'Blood Rain'
  | 'Locust Swarm'
  | 'Aurora Borealis'
  | 'Chaotic Winds'
  | 'Aether Storm'
  | 'Mirage'
  | 'Ember Rain'
  | 'Wildfire Smoke'
  | 'Blood Fog'
  | 'Shimmering Heat'
  | 'Crystal Rain'
  | 'Rain of Frogs'
  | 'Winds of Chaos'
  | 'Chaos Storm'
  | 'Chaos Squall'
  | 'Prismatic Gale'
  | 'Whispering Winds'
  | 'Diamond Rain'
  | 'Cosmic Anomaly'
  | 'Abyssal Tempest'
  | 'Temporal Rift'
  | 'Stardust Gale'
  | 'Mana Storm'
  | 'Dreamweavers Mist'
  | 'Shattered Skies';



/**
 * Defines the shape of death event.
 */
export interface DeathEvent {
  boutId: string;
  killerId: string;
  deathSummary: string;
  memorialTags: string[];
}
