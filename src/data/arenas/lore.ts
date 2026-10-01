// Split from data/arenas.ts — arena lore entries + accessor

// ─── Arena Lore ───────────────────────────────────────────────────────────────

/**
 * Arena lore entry type.
 */
export type ArenaLoreType = 'historical_battle' | 'famous_death' | 'architectural_quirk' | 'hazard';

/**
 * Defines the shape of arena lore entry.
 */
export interface ArenaLoreEntry {
  id: string;
  arenaId: string;
  type: ArenaLoreType;
  title: string;
  narrative: string;
}

export const ARENA_LORE: ArenaLoreEntry[] = [
  {
    id: 'mudpit_arena_drowning_grasp',
    arenaId: 'mudpit_arena',
    type: 'famous_death',
    title: 'The Drowning Grasp',
    narrative:
      'A legendary heavily-armored champion slipped in the muck, and their lighter opponent simply held their face beneath the surface until the bubbles stopped.',
  },
  {
    id: 'clifftop_arena_the_long_fall',
    arenaId: 'clifftop_arena',
    type: 'famous_death',
    title: 'The Long Fall',
    narrative:
      'In a desperate final exchange, a cornered fighter grappled their opponent, throwing them both over the edge. The crowd still claims you can hear the screams.',
  },
  {
    id: 'stormtop_terrace_lightning_strike',
    arenaId: 'stormtop_terrace',
    type: 'architectural_quirk',
    title: 'The Static Charge',
    narrative:
      'Fighters in full plate often find their hair standing on end moments before a strike; some intentionally wear conductive metals to harness the sparks and blind opponents.',
  },
  {
    id: 'mist_shrouded_ruins_echoes',
    arenaId: 'mist_shrouded_ruins',
    type: 'architectural_quirk',
    title: 'Echoes of the Ancients',
    narrative:
      'Combatants swear the crumbling stones whisper ancient combat forms, aiding those who listen.',
  },
  {
    id: 'the_gallows_tree_roots',
    arenaId: 'the_gallows_tree',
    type: 'hazard',
    title: 'Grasping Roots',
    narrative:
      'The twisted roots of the old gallows tree seem to reach for anyone who stumbles near the edge.',
  },
  {
    id: 'sunken_vault_echo',
    arenaId: 'the_sunken_vault',
    type: 'architectural_quirk',
    title: 'Whispers of the Deep',
    narrative:
      'Fighters swear they hear the whispers of drowned kings echoing off the submerged walls.',
  },
  {
    id: 'iron_forge_heat',
    arenaId: 'iron_forge',
    type: 'architectural_quirk',
    title: 'The Bellows',
    narrative:
      'Massive subterranean bellows pump hot air through the grates, searing the lungs of the exhausted.',
  },
  {
    id: 'blood_pit_rat_king',
    arenaId: 'gutter_pit',
    type: 'architectural_quirk',
    title: "The Rat King's Nest",
    narrative:
      'A massive nest of tangled bones and iron wire sits high in the rafters, rumored to be built by the legendary Rat King.',
  },
  {
    id: 'sun_temple_solar_flare',
    arenaId: 'sunken_temple',
    type: 'historical_battle',
    title: 'The Solar Flare Bout',
    narrative:
      "A fight that ended when a blinding reflection from the temple's golden mirrors permanently blinded both combatants.",
  },
  {
    id: 'iron_ring_rust_rot',
    arenaId: 'brass_ring',
    type: 'famous_death',
    title: 'The Rust-Rot Execution',
    narrative:
      'A champion was impaled on a rusted spike and left to rot for three days as a warning to those who defy the arena masters.',
  },
  {
    id: 'underpit_feral_ghouls',
    arenaId: 'underpit_arena',
    type: 'historical_battle',
    title: 'Night of the Feral Ghouls',
    narrative:
      'A legendary bout where combatants had to fend off not only each other, but a swarm of feral mutants that breached the lower grates.',
  },
  {
    id: 'lantern_hall_shattered_glass',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: 'The Shattered Skylight',
    narrative:
      'During a massive storm, the grand skylight shattered, raining glass onto the fighters. The arena floor still glints with embedded shards.',
  },
  {
    id: 'sundered_coliseum_obsidian_pillars',
    arenaId: 'sundered_coliseum',
    type: 'architectural_quirk',
    title: 'The Obsidian Pillars',
    narrative:
      'Three massive pillars of black glass dominate the western side. They are said to resonate with a low hum when a fatal blow is struck.',
  },
  {
    id: 'charnel_pits_bone_avalanche',
    arenaId: 'charnel_pits',
    type: 'historical_battle',
    title: 'The Bone Avalanche',
    narrative:
      'A furious brawl caused the unstable eastern wall of the pit to collapse, burying a dozen combatants under tons of ancient, splintered bones.',
  },
  {
    id: 'flesh_gardens_smiling_death',
    arenaId: 'flesh_gardens',
    type: 'famous_death',
    title: 'The Smiling Corpse',
    narrative:
      'A famed poisoner met his end here when forced to swallow his own venom. His body was left for days, a frozen, grotesque smile plastered across his face.',
  },
  {
    id: 'charnel_pits_screaming_winds_2',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'The Bleeding Stones',
    narrative:
      'The stones in the eastern corner are so saturated with gore that they weep blood on particularly humid days.',
  },

  {
    id: 'bloodsands_massacre_thirty_2',
    arenaId: 'bloodsands_arena',
    type: 'historical_battle',
    title: 'The Silent Reign',
    narrative:
      'A legendary mute gladiator once held the center of the sands against twenty challengers without uttering a single sound.',
  },
  {
    id: 'flooded_vault_arena_death',
    arenaId: 'flooded_vault_arena',
    type: 'famous_death',
    title: 'The Drowned King',
    narrative:
      'A former king, sold into slavery, met his end here when a heavy net dragged him beneath the dark waters of the vault.',
  },

  {
    id: 'sundered_coliseum_shattered_throne',
    arenaId: 'sundered_coliseum',
    type: 'architectural_quirk',
    title: 'The Shattered Throne',
    narrative:
      "A jagged chunk of marble, said to be part of the emperor's original seat, juts from the sands. It forms a treacherous hazard where many fighters have been brutally pinned.",
  },
  {
    id: 'charnel_pits_breath_of_ashes',
    arenaId: 'charnel_pits',
    type: 'historical_battle',
    title: 'The Breath of Ashes',
    narrative:
      "During the Long Drought, the toxic fumes ignited, turning the pit into a roaring inferno. Two rival champions fought amidst the flames, their charred remains now part of the arena's grim foundation.",
  },
  {
    id: 'standard_arena_first_blood_reckoning',
    arenaId: 'standard_arena',
    type: 'famous_death',
    title: 'The First Blood',
    narrative:
      'In the earliest days of the arena, an unnamed orphan defied a fully armored champion, turning a discarded shield into a lethal weapon before succumbing to his wounds. The crowd never forgot.',
  },
  {
    id: 'charnel_pits_echoes',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'Echoes of the Damned',
    narrative:
      'The lower stonework of the pit was laid with such peculiar angles that the screams of dying fighters echo endlessly, terrifying even veteran gladiators.',
  },
  {
    id: 'standard_arena_orphan_revolt',
    arenaId: 'standard_arena',
    type: 'historical_battle',
    title: 'The Orphan Revolt',
    narrative:
      'A grim testament to the desperate. A group of child slaves seized weapons from the armory and fought off the guards for three hours. The stains on the eastern wall are said to be from their final stand.',
  },

  {
    id: 'charnel_pits_silent_slaughter',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Silent Slaughter',
    narrative:
      'A legendary mute gladiator was finally brought down here, surrounded by the corpses of seven opponents. He never uttered a sound, even as the final blow was struck.',
  },
  {
    id: 'blood_pit_famous_death_butcher',
    arenaId: 'gutter_pit',
    type: 'famous_death',
    title: 'The End of the Butcher',
    narrative:
      'In 992, the notorious enforcer known as the Gutter Butcher met a gruesome end when he slipped on a patch of slick entrails and impaled himself on his own rusted halberd.',
  },
  {
    id: 'standard_arena_architectural_quirk_echo',
    arenaId: 'standard_arena',
    type: 'architectural_quirk',
    title: 'The Silent Archway',
    narrative:
      'A design flaw in the northern archway creates an acoustic dead zone. Fighters cornered there often cannot hear the roar of the crowd, making their last moments eerily silent.',
  },
  {
    id: 'flesh_gardens_historical_battle_beast',
    arenaId: 'flesh_gardens',
    type: 'historical_battle',
    title: 'The Night of the Iron Maw',
    narrative:
      "A legendary bout in 985 saw an unarmed gladiator choke out a massive Iron Maw lizard. The beast's skull now adorns the promoter's private box.",
  },

  {
    id: 'standard_arena_orphan_riot',
    arenaId: 'standard_arena',
    type: 'historical_battle',
    title: 'The Orphan Riot',
    narrative:
      'In a desperate bid for freedom, a group of young inductees rushed the guards during a training exercise. The sand was stained for weeks, a grim reminder that raw desperation cannot overcome disciplined steel.',
  },
  {
    id: 'charnel_pits_widows_wail',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: "The Widow's Wail",
    narrative:
      'A specific arrangement of jagged stones near the eastern gate causes the wind to mimic a sorrowful weeping. Fighters often hesitate when passing it, unnerved by the ghostly chorus.',
  },
  {
    id: 'mudpit_arena_drowning',
    arenaId: 'mudpit_arena',
    type: 'famous_death',
    title: 'The Drowning of Valerius',
    narrative:
      'In 981, Champion Valerius was not killed by a blade, but rather drowned in a particularly deep pocket of mud while pinned by a lesser gladiator.',
  },
  {
    id: 'blood_pit_the_iron_rebellion',
    arenaId: 'gutter_pit',
    type: 'historical_battle',
    title: 'The Iron Rebellion',
    narrative:
      'In 948, a mass breakout attempt by chained gladiators was brutally suppressed here. The gouge marks from their rusted shackles can still be seen on the southern pillars.',
  },
  {
    id: 'shattered_coliseum_falling_statue',
    arenaId: 'sundered_coliseum',
    type: 'famous_death',
    title: 'The Fall of Oros',
    narrative:
      'The legendary champion Oros the Unbroken met his end not by a blade, but when a crumbling stone gargoyle dislodged during a thunderous crowd cheer and crushed him instantly.',
  },

  {
    id: 'charnel_pits_plague_surge',
    arenaId: 'charnel_pits',
    type: 'historical_battle',
    title: 'The Plague Surge',
    narrative:
      'In 992, during a bout between two rival houses, a subterranean pipe burst and flooded the arena with toxic waste. The fighters ignored the danger, continuing the battle until both succumbed to the fumes.',
  },
  {
    id: 'lantern_hall_the_blind_champ',
    arenaId: 'lantern_hall_arena',
    type: 'famous_death',
    title: 'The Blind Champion',
    narrative:
      'A famous warrior known for fighting blindfolded was finally bested here when their opponent shattered a glass lantern, using the cacophony to mask their fatal strike.',
  },
  {
    id: 'walled_court_hidden_grates',
    arenaId: 'walled_court_arena',
    type: 'architectural_quirk',
    title: 'The Whispering Grates',
    narrative:
      'Beneath the polished stone of the Walled Court lie ancient drainage grates. Fighters with sharp ears claim they can hear the murmurs of past champions warning them of unseen attacks from below.',
  },
  {
    id: 'charnel_pits_the_last_stand_of_korr',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Last Stand of Korr',
    narrative:
      'Korr the Unbroken met his end in the Charnel Pits, not by the blade of a foe, but when the unstable ground gave way beneath him, swallowing him into the toxic depths. His final defiant roar is said to still echo in the pits.',
  },
  {
    id: 'flesh_gardens_thorny_path',
    arenaId: 'flesh_gardens',
    type: 'architectural_quirk',
    title: 'The Thorny Path',
    narrative:
      'Due to the overgrowth of mutated flora in the Flesh Gardens, the outer edges of the pit are laced with razor-sharp vines. Fighters pushed to the perimeter often suffer lacerations before a weapon ever strikes them.',
  },
  {
    id: 'walled_court_kings_fall',
    arenaId: 'walled_court_arena',
    type: 'historical_battle',
    title: 'The Fall of the Mad King',
    narrative:
      "In 981, a disgraced noble challenged the reigning champion in the Walled Court. The battle lasted less than a minute, ending with the noble's severed head rolling into the royal viewing box, a stark reminder of the arena's brutal equality.",
  },
  {
    id: 'charnel_pits_silent_night',
    arenaId: 'charnel_pits',
    type: 'historical_battle',
    title: 'The Silent Night of Skulls',
    narrative:
      'In 948, a brutal gang war spilled into the pits. For three days, gladiators fought alongside their owners against an invading mercenary band. The fighting was so fierce that even the crowd took up arms.',
  },
  {
    id: 'lantern_hall_glass_rain',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: 'The Glass Rain',
    narrative:
      'When the great chandelier of the Lantern Hall fell in 962 during an explosive magical duel, the arena floor was seeded with thousands of lethal glass shards that are still occasionally unearthed by a careless footstep.',
  },
  {
    id: 'walled_court_shattered_shield',
    arenaId: 'walled_court_arena',
    type: 'historical_battle',
    title: 'The Shattered Shield',
    narrative:
      'In a desperate final stand, a lone defender used the tightly packed stone walls to brace their shield against three attackers simultaneously. The shield eventually burst into splinters, but the distraction lasted just long enough for the match timer to run out, cementing a legendary draw.',
  },
  {
    id: 'flooded_drowning_chorus',
    arenaId: 'flooded_vault_arena',
    type: 'architectural_quirk',
    title: 'The Drowning Chorus',
    narrative:
      'When the tide rolls in, the water passing through the iron grates produces a low, mournful hum. Fighters claim it sounds exactly like the last breaths of the drowned prisoners the vault was built over.',
  },
  {
    id: 'flooded_vault_rusting_tide',
    arenaId: 'flooded_vault_arena',
    type: 'architectural_quirk',
    title: 'The Rusting Tide',
    narrative:
      'The iron grates that line the vault floor have corroded for centuries, leaving jagged edges that catch the unwary. Fighters who fall near the grates often rise with rust-red streaks across their armor, as though the arena itself has drawn blood.',
  },
  {
    id: 'highplain_howling_gale',
    arenaId: 'highplain_arena',
    type: 'architectural_quirk',
    title: 'The Howling Gale',
    narrative:
      'The exposed plateau offers no shelter from the relentless winds. During the Great Storm of 971, three bouts were cancelled when fighters could not remain standing. The howling is said to carry the voices of warriors lost to the wind.',
  },
  {
    id: 'standard_arena_first_blood',
    arenaId: 'standard_arena',
    type: 'historical_battle',
    title: 'The First Blood',
    narrative:
      'Though it is now the most common proving ground, the Standard Arena was once a grand amphitheater. Legend has it the very first match ended in a mutual strike that blinded both fighters, a testament to the brutal equality of the sands.',
  },
  {
    id: 'walled_court_kings_gambit',
    arenaId: 'walled_court_arena',
    type: 'famous_death',
    title: "The King's Gambit",
    narrative:
      'A flamboyant duelist attempted a spinning strike off the tightly packed stone walls, only to slip on a patch of moss. The misstep allowed a hulking brute to pin them against the wall and deliver a slow, excruciating execution that lasted until the sun set.',
  },
  {
    id: 'sunken_temple_drowned_prayers',
    arenaId: 'sunken_temple',
    type: 'architectural_quirk',
    title: 'The Drowned Prayers',
    narrative:
      'The acoustics of the partially submerged temple are eerie. The splashing of water often sounds like the frantic, mumbled prayers of the priests who drowned when the temple first sank centuries ago.',
  },
  {
    id: 'bloodsands_massacre_thirty',
    arenaId: 'bloodsands_arena',
    type: 'historical_battle',
    title: 'The Massacre of the Thirty',
    narrative:
      'Three hundred warriors died in a single day when a riot broke out during a mass execution bout. The sand was so saturated with blood that arena workers had to replace it three times.',
  },

  {
    id: 'flooded_drowning_seat',
    arenaId: 'flooded_vault_arena',
    type: 'famous_death',
    title: 'The Drowning Seat',
    narrative:
      "A submerged stone chair where condemned prisoners were once chained to await the rising tide. Now it serves as the referee's station during bouts.",
  },
  {
    id: 'mudpit_bone_harvest',
    arenaId: 'mudpit_arena',
    type: 'historical_battle',
    title: 'The Bone Harvest',
    narrative:
      'After an abnormally long monsoon season, a fifty-man battle royale turned into a slog through waist-deep mud. The final survivor collapsed and drowned in a puddle just moments after the final bell.',
  },
  {
    id: 'charnel_pits_screaming_winds',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'The Screaming Winds',
    narrative:
      'Gaps in the ancient stonework catch the wind perfectly, causing a sound identical to a chorus of shrieking men. Many new fighters find their morale breaking before a blow is even struck.',
  },
  {
    id: 'sundered_coliseum_fallen_pillar',
    arenaId: 'sundered_coliseum',
    type: 'famous_death',
    title: 'The Fallen Pillar',
    narrative:
      'A legendary champion met his end not from a weapon, but when a stray hammer throw struck a weakened marble pillar, collapsing it directly onto him and three of his challengers.',
  },
  {
    id: 'lantern_hall_architects_folly',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: "The Architect's Folly",
    narrative:
      'The original blueprints called for a vaulted ceiling entirely made of glass. During its maiden bout, the thunderous cheers shattered it, showering the fighters in lethal shards. The roof was rebuilt with heavy timber, but fighters still occasionally find glints of glass embedded in the packed sand.',
  },
  {
    id: 'crystal_cavern_shattered_echo',
    arenaId: 'crystal_cavern',
    type: 'historical_battle',
    title: 'The Shattered Echo',
    narrative:
      'In a furious exchange of maces, two colossal basher archetypes struck the central crystal spire simultaneously. The resulting harmonic blast deafened everyone in attendance and ruptured the eardrums of both fighters. The match was declared a draw when neither could find their footing again.',
  },
  {
    id: 'whispering_grove_blood_roots',
    arenaId: 'whispering_grove',
    type: 'famous_death',
    title: 'The Grasp of the Blood Roots',
    narrative:
      'An overconfident agility fighter ignored the subtle shifting of the forest floor, only to have their foot caught in a sudden snare of roots. Their opponent leisurely approached and delivered the killing blow while the forest itself seemed to hold the victim in place.',
  },
  {
    id: 'flesh_gardens_crimson_bloom',
    arenaId: 'flesh_gardens',
    type: 'historical_battle',
    title: 'The Crimson Bloom',
    narrative:
      'During a particularly savage mid-summer festival, so much blood was spilled that the dormant blood-vines erupted into violent bloom, entangling and consuming half the remaining fighters.',
  },
  {
    id: 'lantern_hall_shadow_strike',
    arenaId: 'lantern_hall_arena',
    type: 'famous_death',
    title: 'The Shadow Strike',
    narrative:
      "A cunning rogue bypassed a champion's legendary guard by timing their fatal thrust perfectly with a flickering torch, momentarily blinding their opponent in a sudden play of light and shadow.",
  },
  {
    id: 'sundered_coliseum_blood_pact',
    arenaId: 'sundered_coliseum',
    type: 'historical_battle',
    title: 'The Blood Pact of the Unbroken',
    narrative:
      "Two rival champions, exhausted and bleeding, refused to strike the final blow against each other. They stood back-to-back, defying the crowd's demands for blood until the arena guards were sent in to execute them both.",
  },
  {
    id: 'lantern_hall_burning_shadow',
    arenaId: 'lantern_hall_arena',
    type: 'famous_death',
    title: 'The Burning Shadow',
    narrative:
      'A notorious assassin attempted to use the flickering torchlight to obscure their movements, but misjudged the shadows. Their opponent, predicting the maneuver, impaled them on a wall sconce, leaving them to burn as a macabre spectacle.',
  },
  {
    id: 'crystal_cavern_singing_shards',
    arenaId: 'crystal_cavern',
    type: 'architectural_quirk',
    title: 'The Singing Shards',
    narrative:
      'Certain crystal formations in the cavern vibrate at a specific frequency when struck by steel. Skilled fighters use this to their advantage, creating a disorienting, high-pitched resonance that throws opponents off balance.',
  },
  {
    id: 'standard_arena_kings_folly',
    arenaId: 'standard_arena',
    type: 'famous_death',
    title: "The King's Folly",
    narrative:
      'A minor lord disguised himself to fight for glory but stumbled on his own oversized scabbard. His unknown opponent granted him no quarter, decapitating him before the crowd even realized royal blood had been spilled.',
  },
  {
    id: 'charnel_pits_breath_of_decay',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'The Breath of Decay',
    narrative:
      'Deep vents occasionally release plumes of noxious, rusted gas from the pits below. Fights are often decided by who can hold their breath the longest while executing a flurry of strikes in the blinding fog.',
  },
  {
    id: 'lantern_hall_blind_monk',
    arenaId: 'lantern_hall_arena',
    type: 'historical_battle',
    title: "The Blind Monk's Stand",
    narrative:
      'When all the lanterns were mysteriously extinguished midway through a championship bout, a blind ascetic monk defeated three armed gladiators in total darkness, guided only by the sound of their footfalls on the wooden floorboards.',
  },
  {
    id: 'lantern_hall_forgotten_chains',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: 'The Forgotten Chains',
    narrative:
      "Hidden beneath the shifting sands are the rusted iron chains of the old slave pens. Unlucky fighters occasionally find their feet snagged by these grim reminders of the arena's past, leading to sudden and brutal shifts in momentum.",
  },
  {
    id: 'charnel_pits_blind_executioner',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Blind Executioner',
    narrative:
      'A massive brute whose helm had fused to his face in a terrible accident fought his final battle here. Blinded, he relied entirely on the shrieking winds of the pits to locate his prey, culminating in a horrific double-decapitation of two agility fighters who failed to walk silently.',
  },

  {
    id: 'flesh_gardens_thorny_path_2',
    arenaId: 'flesh_gardens',
    type: 'architectural_quirk',
    title: 'The Bleeding Vines',
    narrative:
      'Due to the mutated flora in the Flesh Gardens, the outer edges are laced with razor-sharp vines. It is said they actively crawl toward spilled blood during a long match.',
  },
  {
    id: 'narrow_bridge_the_falling_king',
    arenaId: 'narrow_bridge',
    type: 'famous_death',
    title: 'The Falling King',
    narrative:
      'A self-proclaimed king of the undercity was thrown from the bridge during his first bout, screaming the entire way down into the darkness. His crown was never found.',
  },
  {
    id: 'misty_valley_hidden_blades',
    arenaId: 'misty_valley',
    type: 'architectural_quirk',
    title: 'The Hidden Blades',
    narrative:
      'The thick mist not only obscures vision but dampens the sound of footfalls. Savvy fighters coat their weapons in charcoal to make them entirely invisible in the gray fog until it is too late.',
  },
  {
    id: 'the_abyssal_pit_the_dark_descent',
    arenaId: 'the_abyssal_pit',
    type: 'historical_battle',
    title: 'The Dark Descent',
    narrative:
      'In 988, a massive brawl broke out involving twenty fighters. The sheer weight of the combatants collapsed the central platform, sending everyone plummeting into the abyss. There were no survivors.',
  },
  {
    id: 'sun_baked_plateau_madness',
    arenaId: 'sun_baked_plateau',
    type: 'historical_battle',
    title: 'The Midday Madness',
    narrative:
      'A grueling two-hour bout where both fighters eventually succumbed to heat exhaustion and the cursed whispers of the plateau, ending in a mutual draw as they lay motionless in the sand.',
  },
  {
    id: 'ancient_aqueduct_drowning',
    arenaId: 'ancient_aqueduct',
    type: 'famous_death',
    title: 'The Deep Channel',
    narrative:
      'A famed riposter wearing heavy plate was shoved into a deep channel and drowned before the match could officially conclude.',
  },
  {
    id: 'underpit_arena_crushing_dark',
    arenaId: 'underpit_arena',
    type: 'architectural_quirk',
    title: 'The Crushing Dark',
    narrative:
      'Because the Underpit relies on braziers for illumination, one fighter famously kicked dirt into every fire during a match, forcing their opponent into an utter, suffocating darkness before delivering the final blow.',
  },
  {
    id: 'brass_ring_molten_tomb',
    arenaId: 'brass_ring',
    type: 'famous_death',
    title: 'The Molten Tomb',
    narrative:
      'A legendary heavily armored knight was slowly melted alive after being grappled and pinned against the outer heating coils for five agonizing minutes.',
  },
  {
    id: 'highplain_arena_red_wind',
    arenaId: 'highplain_arena',
    type: 'historical_battle',
    title: 'The Day of the Red Wind',
    narrative:
      'A freak tornado swept through the high plains during a mid-summer tournament, carrying the blood of twenty fallen fighters into the sky and raining it down on the screaming spectators.',
  },
  {
    id: 'underpit_feral_uprising',
    arenaId: 'underpit_arena',
    type: 'historical_battle',
    title: 'The Feral Uprising',
    narrative:
      'A band of unsanctioned child fighters managed to collapse the main portcullis, holding off the guards for three hours. The stains on the eastern wall are said to be from their final stand.',
  },
  {
    id: 'gutter_pit_the_blind_orphan',
    arenaId: 'gutter_pit',
    type: 'famous_death',
    title: 'The Blind Orphan',
    narrative:
      'A legendary rogue who fought entirely by sound met their end here when the crowd unexpectedly went completely silent in awe, leaving them entirely deaf to a fatal stab.',
  },
  {
    id: 'sundered_coliseum_orphans_echo',
    arenaId: 'sundered_coliseum',
    type: 'architectural_quirk',
    title: "The Orphan's Echo",
    narrative:
      'A crack in the western wall perfectly catches the wind, emitting a sound remarkably like a child weeping. Opponents of high empathy often find their morale broken here.',
  },
  {
    id: 'forgotten_crypt_whispers',
    arenaId: 'forgotten_crypt',
    type: 'famous_death',
    title: 'The Silent Execution',
    narrative:
      'Legend states a grand champion was dragged screaming into the shadows here, leaving only his shattered blade.',
  },
  {
    id: 'rusted_gorge_slag',
    arenaId: 'rusted_gorge',
    type: 'historical_battle',
    title: 'The Slag Pit Rebellion',
    narrative:
      'A century ago, enslaved workers wielded the very metal they forged to shatter the guards of the Gorge.',
  },
  {
    id: 'sundered_coliseum_the_weeping_statue',
    arenaId: 'sundered_coliseum',
    type: 'architectural_quirk',
    title: 'The Weeping Statue',
    narrative:
      'A massive iron statue of the first champion that reportedly bleeds rust whenever a match ends in a fatal decapitation.',
  },
  {
    id: 'narrow_bridge_the_blind_shove',
    arenaId: 'narrow_bridge',
    type: 'famous_death',
    title: 'The Blind Shove',
    narrative:
      'A blinded fighter, relying entirely on the vibrations of the bridge, anticipated a charge and sidestepped perfectly, sending a massive warlord plummeting into the abyss.',
  },
  {
    id: 'bloodsands_arena_the_crimson_tide',
    arenaId: 'bloodsands_arena',
    type: 'historical_battle',
    title: 'The Crimson Tide',
    narrative:
      'A grueling three-day tournament where so much blood was spilled that the sands refused to absorb it, leaving fighters to battle ankle-deep in crimson muck.',
  },
  {
    id: 'sundered_coliseum_first_collapse',
    arenaId: 'sundered_coliseum',
    type: 'historical_battle',
    title: 'The First Collapse',
    narrative:
      'During the grand opening matches, a stray spell shattered the western pillar, causing a collapse that killed three fighters and birthed the uneven terrain used today.',
  },
  {
    id: 'sunken_temple_drowned_priest',
    arenaId: 'sunken_temple',
    type: 'famous_death',
    title: 'The Drowned Priest',
    narrative:
      'A zealous warrior, too heavily armored, tripped in the holy waters and was held under by a rival, cursing the temple with his dying breath.',
  },
  {
    id: 'sunken_vault_the_breathless_duel',
    arenaId: 'the_sunken_vault',
    type: 'historical_battle',
    title: 'The Breathless Duel',
    narrative:
      'A legendary bout where both fighters were dragged underwater, but one simply refused to drown before delivering the killing blow.',
  },
  {
    id: 'thunder_peak_the_shattered_helm',
    arenaId: 'thunder_peak',
    type: 'famous_death',
    title: 'The Shattered Helm',
    narrative:
      "A champion's heavy iron helm acted as a lightning rod, ending the match in a blinding flash that scarred the spectators' eyes.",
  },
  {
    id: 'standard_arena_blood_stain',
    arenaId: 'standard_arena',
    type: 'architectural_quirk',
    title: 'The Unwashable Stain',
    narrative:
      'Near the center of the arena lies a dark red stain that scrubbing has never managed to remove. It is said to mark the spot where the first champion fell.',
  },
  {
    id: 'mist_shrouded_ruins_phantom_cheers',
    arenaId: 'mist_shrouded_ruins',
    type: 'historical_battle',
    title: 'Phantom Cheers',
    narrative:
      'When the fog rolls in thickest, some fighters swear they hear the roars of a spectral crowd from an empire long crumbled into dust.',
  },
  {
    id: 'the_gallows_tree_hangman_dance',
    arenaId: 'the_gallows_tree',
    type: 'famous_death',
    title: "The Hangman's Dance",
    narrative:
      'A renowned duelist met his end here, not by a blade, but when a stray strike severed a heavy branch that crushed him instantly.',
  },
  {
    id: 'cursed_swamp_the_drowning_grasp',
    arenaId: 'the_cursed_swamp',
    type: 'architectural_quirk',
    title: 'The Drowning Grasp',
    narrative:
      'The thick mud of the swamp often acts like quicksand; fighters who stay still too long find themselves slowly pulled beneath the surface.',
  },
  {
    id: 'iron_cage_the_blood_bars',
    arenaId: 'the_iron_cage',
    type: 'historical_battle',
    title: 'The Blood-Painted Bars',
    narrative:
      'A legendary riot erupted when a fighter was thrown against the iron bars so violently that the crowd was splattered with blood, sparking a frenzy.',
  },
  {
    id: 'rusted_gorge_madmans_end',
    arenaId: 'rusted_gorge',
    type: 'famous_death',
    title: "The Madman's End",
    narrative:
      'A fighter went entirely feral, ignoring all blows until they succumbed to exhaustion, dying with a terrifying smile on their face.',
  },
  {
    id: 'cursed_swamp_the_sunken_champion',
    arenaId: 'the_cursed_swamp',
    type: 'historical_battle',
    title: 'The Sunken Champion',
    narrative:
      'A heavy-armored champion arrogant in his might slowly sank into the mire, screaming as his lighter opponent casually watched from a dry root.',
  },
  {
    id: 'the_iron_cage_the_bloody_bars',
    arenaId: 'the_iron_cage',
    type: 'architectural_quirk',
    title: 'The Bloody Bars',
    narrative:
      'The spiked bars are so thoroughly stained that no amount of scrubbing removes the rust-colored taint of a thousand desperate clashes.',
  },
  {
    id: 'l_std_blood_sands',
    arenaId: 'STANDARD_ARENA',
    type: 'historical_battle',
    title: 'The Crimson Eclipse',
    narrative:
      'A legendary bout where both fighters bled out simultaneously, turning the center sands permanently red as an eclipse shadowed the arena.',
  },
  {
    id: 'l_std_stone_echoes',
    arenaId: 'STANDARD_ARENA',
    type: 'architectural_quirk',
    title: 'The Whispering Stones',
    narrative:
      'Due to a flaw in the masonry, the dying breaths of fallen gladiators echo eerily around the inner wall during absolute silence.',
  },
];

const loreIndex = new Map<string, ArenaLoreEntry[]>();

/**
 * Retrieve arena lore entries for a given arena ID, with caching.
 * @param arenaId - The arena ID to look up lore entries for.
 * @returns An array of ArenaLoreEntry objects for the given arena.
 */
export function getArenaLore(arenaId: string): ArenaLoreEntry[] {
  let results = loreIndex.get(arenaId);
  if (!results) {
    results = ARENA_LORE.filter((e) => e.arenaId === arenaId);
    loreIndex.set(arenaId, results);
  }
  return [...results];
}
