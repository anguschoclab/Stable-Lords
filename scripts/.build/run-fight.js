// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// src/data/narrative/combatPbp.json
var require_combatPbp = __commonJS(function(exports, module) {
  module.exports = {
    pbp: {
      openers: [
        "{{attacker}} strides forward, weapon raised, demanding the crowd's attention before clashing with {{defender}}.",
        "The stench of spilled viscera from the last bout still lingers as {{attacker}} and {{defender}} step forward.",
        "With a sickening crack of knuckles and rolled shoulders, {{attacker}} eyes {{defender}} like a slab of meat.",
        "A cold stare passes between the two before {{attacker}} closes the distance, testing {{defender}}'s guard.",
        "The deafening roar of the crowd is mere background noise to the deadly intent in {{attacker}}'s eyes.",
        "The mob demands a sacrifice. {{attacker}} and {{defender}} oblige, weapons glinting in the harsh sun.",
        "{{attacker}} raises their {{weapon}} to the crowd, soaking in the cheers before the carnage begins.",
        "The tension snaps as {{attacker}} explodes off the mark, rushing {{defender}} with deadly intent.",
        "The ARENAMASTER points to the crimson-soaked sand, and the gladiators unsheathe their steel.",
        "A palpable bloodlust fills the coliseum as {{attacker}} and {{defender}} circle each other.",
        "Sand swirls in the hot arena wind as {{attacker}} and {{defender}} ready for the slaughter.",
        "The scent of terror and sweat fills the air as {{attacker}} and {{defender}} square off.",
        "Sand crunching underfoot, the fighters measure each other before the first blow falls.",
        "The arena gates screech open, and the warriors step forth into the unforgiving light.",
        "Coins change hands in the stands as {{attacker}} levels a {{weapon}} at {{defender}}.",
        "Blood-soaked sands welcome the challengers as {{attacker}} glares at {{defender}}.",
        "The raucous crowd demands a slaughter as {{attacker}} brandishes their {{weapon}}.",
        "Sunlight glints off naked steel as the two gladiators step onto the killing floor.",
        "Anticipation hangs heavy as the fighters lock eyes across the blood-stained arena.",
        "The midday sun bakes the arena as {{attacker}} and {{defender}} stalk each other.",
        "A grim silence descends upon the coliseum before the clash of steel shatters it.",
        "The ARENAMASTER raises his gauntlet, and the crowd holds its collective breath.",
        "Blood-stained sand awaits fresh tribute as the ARENAMASTER signals the start.",
        "The crowd's chanting swells to a roar as weapons are unsheathed and readied.",
        "{{attacker}} points their {{weapon}} at {{defender}}, promising a swift end.",
        "The heavy iron gates slam shut, and only one will leave these sands alive.",
        "Both warriors circle like starved hounds, waiting for the first mistake.",
        "A hush falls. Then the ARENAMASTER drops his hand, and steel is drawn.",
        "The ARENAMASTER signals the start, and the crowd goes utterly berserk!",
        "With weapons drawn and teeth bared, {{attacker}} prepares to engage.",
        "A deafening roar from the stands signals the start of the bloodshed.",
        "The stench of old blood rises as the fighters step onto the sand.",
        "Steel is drawn, and the roar of the coliseum becomes deafening!",
        "Sand kicks up as {{attacker}} charges forward, wasting no time!",
        "The crowd's anticipation reaches fever pitch as the gates drop.",
        "The crowd bays for blood as the fighters lock eyes.",
        "The ARENAMASTER bellows the start, and steel sings!",
        "Tension hangs thick in the sweltering arena air."
      ],
      attacks: {
        piercing: [
          "{{attacker}} brutally buries the point of {{possessive}} {{weapon}} into {{defender}}, leaning all {{possessive}} weight into it.",
          "{{attacker}} snaps {{possessive}} wrist, turning the point of {{possessive}} {{weapon}} into {{defender}}'s guard!",
          "{{attacker}} coldly calculating the opening, thrusts {{possessive}} {{weapon}} with mathematical precision.",
          "With clinical precision, {{attacker}} thrusts {{possessive}} {{weapon}} toward {{defender}}'s vital spots.",
          "{{attacker}} snaps a lightning-fast thrust right at {{defender}}'s throat with {{possessive}} {{weapon}}.",
          "{{attacker}} stabs brutally upward, throwing all {{possessive}} weight behind {{possessive}} {{weapon}}!",
          "{{attacker}} twists, turning a simple stab into a vicious gutting motion with {{possessive}} {{weapon}}!",
          "{{attacker}} drops {{possessive}} center and drives a blinding lunge with {{possessive}} {{weapon}}!",
          "{{attacker}} violently jabs {{possessive}} {{weapon}} forward, puncturing {{defender}}'s defenses.",
          "{{attacker}} lunges forward, driving the point of {{possessive}} {{weapon}} straight at the heart!",
          "{{attacker}} darts in, slipping {{possessive}} {{weapon}} through a gap in the armor!",
          "{{attacker}} lunges forward, {{possessive}} {{weapon}} seeking {{defender}}'s vitals!",
          "{{attacker}} extends fully, aiming a vicious puncture with {{possessive}} {{weapon}}.",
          "{{attacker}} sinks {{possessive}} {{weapon}} forward in a clinical, measured strike!",
          "{{attacker}} extends into a perfect lunge, {{possessive}} {{weapon}} seeking blood!",
          "{{attacker}} twists their grip, driving {{possessive}} {{weapon}} in a deep thrust.",
          "{{attacker}} stabs with {{possessive}} {{weapon}}, all his reach behind the blow!",
          "{{attacker}} dances forward, snapping a venomous thrust at {{defender}}'s throat.",
          "{{attacker}} delivers a rapid series of thrusts with {{possessive}} {{weapon}}!",
          "A lightning-fast stab from {{attacker}} slips past {{defender}}'s guard.",
          "A cruel, twisting lunge from {{attacker}} aims to puncture vital organs.",
          "{{attacker}} stabs relentlessly, forcing {{defender}} on the back foot.",
          "With viper-like speed, {{attacker}} lunges to impale {{defender}}.",
          "Seeking vital organs, {{attacker}} launches a deadly lunge.",
          "{{attacker}} lunges wielding {{possessive}} {{weapon}}!",
          "A swift, stinging jab from {{attacker}} aims for {{defender}}'s vitals.",
          "{{attacker}} darts forward with a needle-point thrust.",
          "{{attacker}} drives the point of their weapon forward like a viper's strike.",
          "{{attacker}} launches a calculated, stinging jab.",
          "{{attacker}} spears forward in a quick, lethal lunge.",
          "{{attacker}} bores into {{defender}} with a rapid, penetrating stab.",
          "{{attacker}} snaps a blinding jab aimed directly at {{defender}}'s throat.",
          "{{attacker}} lunges with needle-like precision.",
          "{{attacker}} lunges with terrifying speed, aiming a lethal thrust at {{defender}}'s vitals.",
          "{{attacker}} darts forward, seeking a gap in the armor with a pinpoint stab.",
          "{{attacker}} executes a precise lunge, seeking to puncture {{defender}}'s armor.",
          "{{attacker}} steps lightly, flicking their point in a rapid series of piercing strikes.",
          "{{attacker}} thrusts violently forward, their weapon a deadly needle aimed at {{defender}}'s heart.",
          "{{attacker}} twists their body, delivering a powerful thrust straight at {{defender}}'s midsection.",
          "{{attacker}} steps in quickly, launching a deadly thrust at {{defender}}.",
          "With surgical precision, {{attacker}} attempts to skewer {{defender}}.",
          "A lightning-fast stab is directed at {{defender}} by {{attacker}}.",
          "{{attacker}} feints, then drives a piercing strike straight toward {{defender}}.",
          "{{attacker}} thrusts with devastating accuracy at {{defender}}.",
          "Seeking a gap in the armor, {{attacker}} jabs viciously at {{defender}}.",
          "{{attacker}} executes a calculated, deep lunge against {{defender}}.",
          "{{attacker}} steps in and lunges, thrusting their {{weapon}} at {{defender}}'s {{bodyPart}}.",
          "A sudden darting strike as {{attacker}} drives their {{weapon}} toward {{defender}}'s {{bodyPart}}."
        ],
        slashing: [
          "{{attacker}} executes a brutal downward chop with {{possessive}} {{weapon}}, shearing through {{defender}}'s defense.",
          "{{attacker}} drops {{possessive}} shoulder and rips {{possessive}} {{weapon}} through in a vicious diagonal slash!",
          "{{attacker}} sweeps {{possessive}} {{weapon}} in a wide, punishing arc, biting deeply into {{defender}}'s flesh.",
          "{{attacker}} whips {{possessive}} {{weapon}} blade back and forth as if to slash {{defender}} to ribbons!",
          "{{attacker}} dances forward, delivering a razor-sharp slash that leaves a bloody trail on {{defender}}.",
          "A flashing horizontal cut from {{attacker}} catches {{defender}} off guard, drawing a spray of crimson.",
          "{{attacker}} executes a spinning slash, turning {{possessive}} {{weapon}} into a blur of steel!",
          "With terrifying speed, {{attacker}} sweeps {{possessive}} {{weapon}} in a lethal, blinding arc.",
          "With a savage snarl, {{attacker}} whips {{possessive}} {{weapon}} across {{defender}}'s flank.",
          "{{attacker}} steps in, dragging {{possessive}} {{weapon}} across the target in a rising arc!",
          "{{attacker}} snaps a vicious horizontal cut at {{defender}} using {{possessive}} {{weapon}}.",
          "{{attacker}} executes a chillingly precise horizontal sweep with {{possessive}} {{weapon}}.",
          "{{attacker}} makes a cruel and cunning underhanded attack with {{possessive}} {{weapon}}!",
          "{{attacker}} hacks wildly with {{possessive}} {{weapon}}, a flurry of relentless slashes!",
          "{{attacker}} carves the air with a brutal downward slash from {{possessive}} {{weapon}}!",
          "{{attacker}} catapults forward, {{possessive}} {{weapon}} flashing in a deadly assault!",
          "{{attacker}} shifts {{possessive}} weight and cuts low with {{possessive}} {{weapon}}!",
          "{{attacker}} unleashes a wild, theatrical spin-slash, to the crowd's immense delight!",
          "{{attacker}} chops viciously at {{defender}}'s hamstrings, a desperate bid to end it.",
          "{{attacker}} carves a brutal crescent through the air with {{possessive}} {{weapon}}.",
          "{{attacker}} lashes out, trailing blood from the edge of {{possessive}} {{weapon}}!",
          "{{attacker}} brings {{possessive}} {{weapon}} around in a sudden, whistling strike!",
          "{{attacker}} unleashes {{possessive}} {{weapon}} in a piercingly accurate thrust!",
          "{{attacker}} delivers a wide, decapitating swing with {{possessive}} {{weapon}}!",
          "Whirling {{possessive}} {{weapon}}, {{attacker}} initiates a flurry of slashes!",
          "With a sharp exhalation, {{attacker}} drives a deep cut toward {{defender}}.",
          "{{attacker}} drops low and slashes aggressively at {{defender}}'s guard.",
          "{{attacker}} slashes in a figure-eight pattern, seeking an opening.",
          "{{attacker}} performs a wide, sweeping slash aimed at {{defender}}.",
          "A wicked backhand slash from {{attacker}} threatens {{defender}}.",
          "{{attacker}} arcs their weapon in a brutal horizontal sweep.",
          "{{attacker}} executes a masterful, sweeping cut.",
          "{{attacker}} whips their blade in a cruel, jagged arc.",
          "{{attacker}} delivers a wide, shearing strike.",
          "{{attacker}} brings their edge around in a deadly, whistling crescent.",
          "{{attacker}} sweeps their {{weapon}} low, seeking to hamstring the foe.",
          "{{attacker}} unleashes a horizontal cleave that threatens to cut {{defender}} in half.",
          "{{attacker}} chains together a flurry of sweeping slashes, forcing {{defender}} back.",
          "{{attacker}} brings their blade down in a brutal, arcing slash aimed at {{defender}}'s neck.",
          "{{attacker}} executes a spinning slash, turning their momentum into a deadly, sweeping cut.",
          "{{attacker}} rips their weapon in a wide horizontal slash, forcing {{defender}} to evade.",
          "{{attacker}} steps forward, driving their blade in a swift diagonal slash meant to eviscerate.",
          "With brutal momentum, {{attacker}} swings a cleaving strike toward {{defender}}.",
          "{{attacker}} attempts to slice through {{defender}}'s guard with a rapid slash.",
          "A vicious crescent arc is carved through the air by {{attacker}}, targeting {{defender}}.",
          "{{attacker}} steps into a devastating lateral cut against {{defender}}.",
          "Seeking an opening, {{attacker}} unleashes a flurry of fast slashes against {{defender}}.",
          "{{attacker}} lashes out with a sudden, vicious swipe at {{defender}}.",
          "{{attacker}} arcs their {{weapon}} in a vicious, sweeping motion toward {{defender}}'s {{bodyPart}}.",
          "A silvery flash as {{attacker}}'s {{weapon}} cuts through the air, seeking {{defender}}'s {{bodyPart}}."
        ],
        bashing: [
          "{{attacker}} unleashes a crushing swing, the sheer weight of {{possessive}} {{weapon}} bruising {{defender}} severely.",
          "{{attacker}} wildly flails with {{possessive}} {{weapon}}, leaving wide defensive gaps but forcing {{defender}} back.",
          "{{attacker}} steps into the blow, driving {{possessive}} {{weapon}} into {{defender}} with bone-rattling force.",
          "With a guttural roar, {{attacker}} hammers {{possessive}} {{weapon}} directly into {{defender}}'s midsection.",
          "{{attacker}} brings {{possessive}} {{weapon}} down in a thunderous overhead smash, staggering {{defender}}.",
          "Like a falling boulder, {{attacker}} brings {{possessive}} {{weapon}} crashing down with horrific force.",
          "{{attacker}} strikes forward with {{possessive}} {{weapon}}, all {{possessive}} weight behind the blow!",
          "{{attacker}} bludgeons downward, seeking to crush helm and skull alike with {{possessive}} {{weapon}}!",
          "{{attacker}} throws {{possessive}} full weight behind {{possessive}} {{weapon}} in an all-out assault!",
          "{{attacker}} rams the haft of {{possessive}} {{weapon}} forward in a brutal shove before swinging!",
          "A massive, sweeping strike from {{attacker}}'s {{weapon}} crashes heavily against {{defender}}.",
          "{{attacker}} cleverly tries to break {{defender}}'s defense with {{possessive}} {{weapon}}!",
          "Putting full body weight behind it, {{attacker}} smashes with {{possessive}} {{weapon}}.",
          "{{attacker}} steps in close, delivering a grim, measured smash to {{defender}}'s ribs.",
          "{{attacker}} hammers wildly with {{possessive}} {{weapon}}, shaking the very ground!",
          "{{attacker}} lashes out with {{possessive}} {{weapon}} in a lightning quick assault!",
          "{{attacker}} steps into a crushing horizontal blow with {{possessive}} {{weapon}}!",
          "{{attacker}} pivots, swinging {{possessive}} {{weapon}} with terrifying momentum!",
          "{{attacker}} steps forward, crashing {{possessive}} {{weapon}} in a sweeping arc.",
          "With bone-breaking intent, {{attacker}} swings {{possessive}} {{weapon}} wildly.",
          "{{attacker}} heaves {{possessive}} {{weapon}} overhead for a devastating smash!",
          "{{attacker}} lunges with a short, brutal chop from {{possessive}} {{weapon}}!",
          "{{attacker}} chops down heavily, trying to shatter {{defender}}'s defense.",
          "{{attacker}} winds up for a devastating bash against {{defender}}.",
          "{{attacker}} hammers at {{defender}} with methodical, heavy blows.",
          "{{attacker}} brings their weapon down with crushing force on {{defender}}.",
          "A blunt, brutal strike from {{attacker}} attempts to crush {{defender}}.",
          "{{attacker}} hammers forward, aiming to crush {{defender}}.",
          "{{attacker}} delivers a thunderous, weighty blow.",
          "{{attacker}} swings with the raw, blunt momentum of an avalanche.",
          "{{attacker}} crushes inward with a relentless, heavy strike.",
          "{{attacker}} swings their {{weapon}} wildly at the foe",
          "{{attacker}} steps in close and delivers a bludgeoning blow meant to shatter bone.",
          "{{attacker}} heaves their weapon in a crushing overhand blow, aiming to flatten {{defender}}.",
          "{{attacker}} swings like a madman, their heavy weapon threatening to shatter {{defender}}'s ribs.",
          "{{attacker}} delivers a punishing backhand bash, letting the weight of the weapon do the work.",
          "{{attacker}} drives the pommel of their weapon forcefully into {{defender}}'s chest.",
          "{{attacker}} steps forward, delivering a bone-rattling blow toward {{defender}}.",
          "With heavy force, {{attacker}} attempts to crush {{defender}}'s defenses.",
          "{{attacker}} swings with the blunt weight of their weapon at {{defender}}.",
          "A devastating smash is aimed directly at {{defender}} by {{attacker}}.",
          "{{attacker}} channels all their strength into a singular, brutal bash against {{defender}}.",
          "{{attacker}} hammers down relentlessly on {{defender}}.",
          "Attempting to break {{defender}}, {{attacker}} swings a massive bludgeoning strike.",
          "{{attacker}} seeks to shatter {{defender}}'s resolve with a heavy, arcing bash.",
          "{{attacker}} heaves their {{weapon}} with bone-crushing intent toward {{defender}}'s {{bodyPart}}.",
          "Putting their weight behind it, {{attacker}} swings their {{weapon}} at {{defender}}'s {{bodyPart}}."
        ],
        fist: [
          "{{attacker}} leaps forward with a flying strike, throwing their entire body weight behind the fist!",
          "{{attacker}} unleashes a flurry of desperate, frantic blows, catching {{defender}} off guard.",
          "With bare knuckles, {{attacker}} hammers a series of rapid strikes into {{defender}}'s ribs.",
          "{{attacker}} steps inside {{defender}}'s reach and sinks a brutal uppercut into their chin.",
          "{{attacker}} closes the distance, delivering a devastating cross to {{defender}}'s jaw.",
          "{{attacker}} unleashes a raw, haymaker swing that connects squarely with {{defender}}.",
          "A brutal flurry of bare-knuckle hooks rains down as {{attacker}} steps into range.",
          "{{attacker}} delivers a savage, grinding headbutt before throwing a vicious hook!",
          "{{attacker}} throws a wild, haymaker punch aimed squarely at {{defender}}'s jaw.",
          "{{attacker}} throws a theatrical spinning backfist, showing off for the crowd!",
          "{{attacker}} batters the defense with a relentless drumroll of heavy strikes!",
          "{{attacker}} dives forward, FISTS driving at {{defender}} with menacing fury!",
          "{{attacker}} crowds the space, throwing short, punishing elbows and fists!",
          "{{attacker}} attacks, FISTS punching with piston-like horse felling power!",
          "{{attacker}} drives a punishing straight right into {{defender}}'s guard.",
          "{{attacker}} loops a wide, swinging haymaker, seeking a sudden knockout!",
          "{{attacker}} steps into a devastating straight punch, perfectly aligned!",
          "A flurry of heavy hooks from {{attacker}} pummels {{defender}} backward.",
          "{{attacker}} steps inside and unleashes a flurry of vicious body blows!",
          "{{attacker}} swarms {{defender}}, throwing fists with reckless abandon.",
          "{{attacker}} hammers {{defender}} with a series of compact body blows.",
          "{{attacker}} throws a rock-fisted PUNCH of incredible felling power!",
          "{{attacker}}'s HANDS flash forward jabbing fiercely at {{defender}}!",
          "{{attacker}} snaps a crisp jab directly at the bridge of the nose!",
          "{{attacker}} attacks {{defender}} with a pinpoint-accurate ELBOW!",
          "{{attacker}} PUNCHES from the waist with unbelievable quickness!",
          "{{attacker}} lunges forward, swinging wildly with bare knuckles.",
          "{{attacker}} launches a blistering combination at {{defender}}!",
          "{{attacker}} drops their weight and launches a brutal uppercut.",
          "With a fierce grunt, {{attacker}} throws a rapid one-two combo.",
          "{{attacker}} focuses all of his power into a devastating KICK!",
          "{{attacker}} feints low and throws a crushing overhand right!",
          "{{attacker}} throws a piston-like SIDE KICK at {{defender}}!",
          "{{attacker}} delivers a crisp, stiff jab to gauge distance.",
          "{{attacker}} digs a cruel hook to the ribs of {{defender}}.",
          "{{attacker}} hammers down with a ferocious FOREARM smash!",
          "{{attacker}} throws a heavy, jaw-cracking right hook!",
          "{{attacker}} unleashes a flurry of rapid punches against {{defender}}.",
          "A heavy, looping hook from {{attacker}} is aimed at {{defender}}.",
          "{{attacker}} throws a punishing, bare-knuckle hook.",
          "{{attacker}} uncoils a lightning-fast jab.",
          "{{attacker}} unloads a heavy, brawling haymaker.",
          "{{attacker}} steps in and hammers a brutal blow with their fist.",
          "A blistering combination of strikes from {{attacker}} seeks to overwhelm {{defender}}.",
          "{{attacker}} steps inside, delivering a savage hook.",
          "{{attacker}} steps in close, unleashing a flurry of fast punches.",
          "{{attacker}} drops their shoulder and throws a devastating cross right at {{defender}}'s nose.",
          "{{attacker}} feints low and unloads a brutal uppercut, aiming to lift {{defender}} off their feet.",
          "{{attacker}} unleashes a rapid one-two combination, stepping into {{defender}}'s guard.",
          "{{attacker}} steps inside {{defender}}'s reach and throws a heavy, looping haymaker.",
          "{{attacker}} throws a heavy, bruising cross at {{defender}}.",
          "Stepping into the strike, {{attacker}} launches a devastating uppercut toward {{defender}}.",
          "{{attacker}} unleashes a rapid combination of bare-knuckle blows against {{defender}}.",
          "With raw brawling power, {{attacker}} aims a wild haymaker at {{defender}}.",
          "{{attacker}} steps inside {{defender}}'s reach, delivering a vicious close-quarters strike.",
          "A sudden, explosive jab is fired at {{defender}} by {{attacker}}.",
          "{{attacker}} attempts to pummel {{defender}} with a barrage of heavy fists.",
          "{{attacker}} winds up and unleashes a heavy punch toward {{defender}}'s {{bodyPart}}.",
          "A brutal, bare-knuckle hook from {{attacker}} aims for {{defender}}'s {{bodyPart}}."
        ]
      },
      hit_locations: {
        head: [
          "TEMPLE",
          "THROAT",
          "SKULL",
          "CHEEK",
          "CROWN",
          "HEAD",
          "FACE",
          "NECK",
          "BROW",
          "CHIN",
          "NOSE",
          "JAW",
          "EAR",
          "NAPE"
        ],
        chest: [
          "SHOULDER BLADE",
          "RIGHT RIBCAGE",
          "LEFT RIBCAGE",
          "SOLAR PLEXUS",
          "UPPER TORSO",
          "UPPER BODY",
          "COLLARBONE",
          "STERNUM",
          "BREAST",
          "THORAX",
          "CHEST",
          "RIBS"
        ],
        abdomen: [
          "SOLAR PLEXUS",
          "LOWER BODY",
          "MIDSECTION",
          "STOMACH",
          "ABDOMEN",
          "KIDNEYS",
          "PELVIS",
          "GROIN",
          "BELLY",
          "FLANK",
          "SIDE",
          "GUT"
        ],
        "right arm": [
          "RIGHT SHOULDER",
          "RIGHT KNUCKLES",
          "RIGHT FOREARM",
          "RIGHT BICEPS",
          "RIGHT ELBOW",
          "RIGHT WRIST",
          "PRIMARY ARM",
          "RIGHT HAND",
          "DOMINANT ARM",
          "RIGHT ARM PART 9",
          "RIGHT TRICEPS",
          "RIGHT BICEP"
        ],
        "left arm": [
          "LEFT SHOULDER",
          "LEFT KNUCKLES",
          "LEFT FOREARM",
          "OFF-HAND ARM",
          "LEFT BICEPS",
          "LEFT ELBOW",
          "LEFT WRIST",
          "LEFT HAND",
          "SHIELD ARM",
          "LEFT ARM PART 9",
          "LEFT TRICEPS",
          "LEFT BICEP"
        ],
        "right leg": [
          "RIGHT HAMSTRING",
          "RIGHT BUTTOCKS",
          "RIGHT THIGH",
          "RIGHT ANKLE",
          "RIGHT KNEE JOINT",
          "LOWER RIGHT CALF",
          "RIGHT SHINBONE",
          "UPPER RIGHT LEG",
          "RIGHT FOOT",
          "RIGHT TOES"
        ],
        "left leg": [
          "LEFT HAMSTRING",
          "LEFT QUADRICEP",
          "LEFT THIGH",
          "LEFT ANKLE",
          "LEFT KNEE",
          "LEFT SHIN",
          "LEFT CALF",
          "LEFT KNEE JOINT",
          "LOWER LEFT CALF",
          "UPPER LEFT LEG",
          "LEFT FOOT",
          "LEFT TOES"
        ]
      },
      damage_severity: {
        deadly: [
          "cleaving through defenses with deadly precision",
          "inflicting critical, life-threatening damage",
          "landing a potentially lethal blow",
          "delivering a devastating wound",
          "striking with murderous force",
          "causing catastrophic injury",
          "What a devastating attack!",
          "It was a deadly attack!",
          "What a massive blow!",
          "with fatal intent"
        ],
        terrific: [
          "landing a shockingly powerful strike",
          "landing a brutal, bone-jarring blow",
          "causing a terrifying spray of blood",
          "with immense and fearsome strength",
          "hitting with overwhelming power",
          "striking with tremendous force",
          "delivering a terrific smash",
          "It was an incredible blow!",
          "It is a terrific blow!",
          "with staggering impact"
        ],
        powerful: [
          "putting incredible weight behind the attack",
          "delivering a strong and punishing hit",
          "landing a deeply painful strike",
          "with significant martial power",
          "with a solid, muscular strike",
          "It is a tremendous blow!",
          "It was a powerful blow!",
          "with resounding impact",
          "landing a heavy blow",
          "striking forcefully"
        ],
        glancing: [
          "The attack is a glancing blow only.",
          "barely connecting with {{defender}}",
          "landing a weak, off-balance strike",
          "skimming off {{defender}}'s armor",
          "landing a shallow, glancing blow",
          "The stroke lands ineffectively.",
          "delivering a superficial scrape",
          "with a minor, deflected impact",
          "grazing {{defender}} slightly",
          "causing only a minor scratch"
        ],
        fatal: [
          "The arena echoes with the sickening sound of {{defender}}'s life being crushed out by {{attacker}}.",
          "With an explosive burst of violence, {{attacker}} extinguishes the light from {{defender}}'s eyes.",
          "{{attacker}} drives the {{weapon}} deep, drawing a final, gurgling breath from {{defender}}.",
          "With ruthless efficiency, {{attacker}} extinguishes {{defender}}'s light in a single stroke.",
          "The crowd falls dead silent as {{attacker}}'s strike abruptly ends {{defender}}'s life.",
          "{{defender}}'s eyes widen in shock as {{attacker}}'s {{weapon}} parts flesh and soul.",
          "There is no recovery from that\u2014{{attacker}} has sent {{defender}} to the ancestors.",
          "{{attacker}} stands victorious, {{defender}} dead before they even hit the ground.",
          "{{attacker}} executes a flawless, mortal strike, leaving no hope for {{defender}}.",
          "Blood sprays across the sands as {{attacker}} delivers the final, fatal judgment.",
          "A brutal, uncompromising blow by {{attacker}} shatters {{defender}} completely.",
          "{{attacker}} executes a merciless coup de gr\xE2ce, ending {{defender}}'s misery.",
          "{{attacker}} roars in triumph over the broken, lifeless form of {{defender}}.",
          "A catastrophic hit that instantly fells {{defender}} like a toppled statue.",
          "A devastating blow that shatters bone and splatters blood across the sand.",
          "The strike lands with a sickening crunch, ending the contest immediately.",
          "The sands drink deeply as {{attacker}}'s fatal strike finds its mark.",
          "A masterful, lethal strike that instantly separates life from body.",
          "{{attacker}}'s {{weapon}} claims another soul for the void today."
        ]
      },
      status_changes: {
        severe: [
          "The injury to {{name}} looks severe; {{pronoun}} is visibly in pain.",
          "{{name}}'s movements are hampered by the severe wound.",
          "Blood flows freely from {{name}}'s grievous injury.",
          "{{name}} is clearly in a severe state of distress.",
          "{{name}} is bleeding profusely and struggling.",
          "{{name}} is on the verge of shock!!",
          "{{name}} is dangerously stunned!",
          "{{name}} is gravely injured!",
          "{{name}} is bleeding badly!",
          "{{name}} is severely wounded, bleeding profusely onto the sand."
        ],
        desperate: [
          "{{name}} begins to panic and fights desperately!",
          "{{name}} fights with the cunning of desperation!",
          "{{name}} looks desperate, clinging to life.",
          "{{name}} reels with the fury of combat!",
          "Panic and pain mix in {{name}}'s eyes.",
          "{{name}} is on the verge of collapse.",
          "{{name}} mutters a desperate prayer!",
          "{{name}} is becoming frantic!!!",
          "{{name}} realizes the end is near and fights with reckless abandon.",
          "Breathing raggedly, {{name}} makes a final, desperate stand.",
          "{{name}}'s movements become frantic, driven purely by survival instinct.",
          "A wild, cornered look crosses {{name}}'s face.",
          "{{name}} abandons all strategy, swinging with desperate fury."
        ],
        serious: [
          "The strike leaves a serious mark on {{name}}'s combat effectiveness.",
          "The wound to {{name}} looks bad, requiring immediate caution.",
          "{{name}} grimaces, fighting through serious pain.",
          "{{name}} winces, obviously feeling great pain.",
          "{{name}} whitens with the pain of his wounds.",
          "A serious wound that will slow {{name}} down.",
          "{{name}} winces from the serious injury.",
          "{{name}} has sustained serious wounds!",
          "{{name}} fights on, despite the pain.",
          "{{name}} winces and smiles feebly."
        ],
        panic: [
          "{{name}} fights on pure instinct now, their mind fracturing under the pressure.",
          "{{name}} can't find the rhythm. Something has broken their composure.",
          "Fear takes hold of {{name}} as {{pronoun}} realizes the danger.",
          "{{name}} is in dire straits - fighting on pure instinct!",
          "{{name}} scrambles desperately, panic setting in.",
          "{{name}} begins to panic and fights desperately!",
          "{{name}} fights with the cunning of desperation!",
          "{{name}} reels backward, eyes wide with terror.",
          "Wild panic flashes across {{name}}'s face.",
          "{{name}} is becoming frantic!!!",
          "{{name}} appears DESPERATE!"
        ]
      },
      defenses: {
        counterstrike: {
          success: [
            "A masterful deflection! {{defender}} turns {{attacker}}'s momentum against them with a swift counter-attack.",
            "{{attacker}} over-commits, and {{defender}} makes them pay dearly with a vicious counterstrike.",
            "{{defender}} slips the strike by a hair, immediately surging forward with a blinding riposte!",
            "{{defender}} absorbs the momentum, spinning the attack into a brutal counter-offensive!",
            "{{attacker}} overextends! {{defender}} punishes the mistake with a savage riposte.",
            "{{defender}} deflects the blow and immediately retaliates with a vicious counter!",
            "{{defender}} masterfully avoids the blow and lands a devastating counter-blow!",
            "Turning defense into offense, {{defender}} lands a surprising counterstrike.",
            "A seamless block flows instantly into a punishing strike from {{defender}}.",
            "{{defender}} slips past the guard and strikes back with vicious intent!",
            "A feint, a slip, and a punishing retaliatory strike from {{defender}}!",
            "A brilliant reversal by {{defender}}! They turn defense into offense!",
            "{{defender}} deflects and instantly retaliates!",
            "{{defender}} absorbs the impact and lashes out with a brutal counterstrike.",
            "Instead of retreating, {{defender}} pivots and delivers a punishing reprisal.",
            "The attack is met not with a block, but a savage return blow from {{defender}}.",
            "In a flash of defiance, {{defender}} turns defense into offense with a counterstrike."
          ],
          desperate: [
            "{{defender}} blindly lashes back in a frantic, desperate bid for survival.",
            "Off-balance and desperate, {{defender}} throws a wild counterattack after the block.",
            "A frantic scramble! {{defender}} desperately jabs back, trying to buy space.",
            "Fueled by pure panic, {{defender}} throws a messy, flailing counter-strike.",
            "{{defender}} flails wildly with a messy but dangerous counter-blow.",
            "Operating on pure survival instinct, {{defender}} throws a ragged strike back.",
            "Eyes wide with panic, {{defender}} lashes out blindly.",
            "Stumbling backward, {{defender}} throws a desperate retaliatory swing.",
            "A chaotic scramble ends with {{defender}} desperately jabbing the air.",
            "{{defender}} throws a sloppy, panicked counter-strike out of sheer terror.",
            "Survival instinct kicks in as {{defender}} throws a wild, flailing counter.",
            "Barely staying upright, {{defender}} lashes out in a panic-stricken reprisal.",
            "A messy, frantic riposte from {{defender}} just barely connects.",
            "With eyes wide in terror, {{defender}} haphazardly strikes back.",
            "Stumbling backward, {{defender}} heaves a desperate, uncoordinated counter-blow.",
            "Gasping for air, {{defender}} wildly swings back in a sheer fight for survival.",
            "Clawing for survival, {{defender}} haphazardly strikes back.",
            "With a wild, panicked shriek, {{defender}} flails a vicious retaliatory blow.",
            "{{defender}} stumbles back, wildly throwing a counter-strike into the void.",
            "Desperation fuels {{defender}}'s messy, unsynchronized counter-attack.",
            "Barely keeping their feet, {{defender}} launches a chaotic, desperate riposte.",
            "A flinching, terrified counter-strike from {{defender}} somehow finds a gap.",
            "Panic sets in as {{defender}} throws a wild, unstructured retaliatory swing!",
            "{{defender}} stumbles backward, throwing a sloppy but desperate punch in return.",
            "Barely avoiding the strike, {{defender}} flails wildly with a desperate counter.",
            "With survival instincts kicking in, {{defender}} blindly returns the blow.",
            "{{defender}}'s panicked counterattack is messy but effective.",
            "Heart pounding, {{defender}} lashes out with a frantic, uncoordinated counterstrike.",
            "A desperate, breathless retaliatory strike from {{defender}} barely connects.",
            "Clawing for space, {{defender}} throws a wild, panicked counter-blow.",
            "{{defender}} lashes out wildly, trying to push {{attacker}} away in a sheer panic.",
            "Survival instinct takes over as {{defender}} flails a desperate counter-blow.",
            "Breathing hard, {{defender}} throws a clumsy but aggressive reprisal.",
            "A ragged, terrified swing from {{defender}} follows the hasty block.",
            "{{defender}} answers with a haphazard, fearful counter-strike that barely connects.",
            "Eyes wide with terror, {{defender}} thrusts back aimlessly to create distance.",
            "Flailing wildly, {{defender}} deflects the blow and strikes back without thinking!",
            "{{defender}} stumbles backward but blindly thrusts their weapon forward, connecting!",
            "A pure panic reaction sees {{defender}} parry and immediately lash out in return.",
            "{{defender}} squeaks in terror, somehow turning a clumsy block into a desperate counter.",
            "Tripping over their own feet, {{defender}} inadvertently throws a wild counterattack.",
            "{{defender}} closes their eyes and swings, miraculously catching {{attacker}} off guard.",
            "Flailing wildly, {{defender}} manages a desperate counterstrike that catches {{attacker}} off guard.",
            "In a blind panic, {{defender}} lashes out, somehow connecting a desperate counter against {{attacker}}.",
            "Stumbling backwards, {{defender}} throws a desperate retaliatory blow that finds its mark.",
            "{{defender}} practically falls into a wild, desperate counterstrike against {{attacker}}.",
            "Eyes squeezed shut, {{defender}} swings a desperate counter that miraculously connects.",
            "Driven by pure survival instinct, {{defender}} lands a frantic, desperate counter on {{attacker}}.",
            "In a wild panic, {{defender}} lashes out blindly and somehow connects with {{attacker}}!",
            "Stumbling backward, {{defender}} swings wildly, catching {{attacker}} completely off guard.",
            "Survival instinct takes over as {{defender}} throws a frantic counter that miraculously lands.",
            "Eyes squeezed shut in terror, {{defender}} thrusts their weapon out and tags {{attacker}}.",
            "{{defender}} flails desperately, their sloppy counterstrike clipping {{attacker}}.",
            "With a frantic shriek, {{defender}} intercepts {{attacker}}'s advance with a clumsy but effective hit.",
            "Driven by pure adrenaline, {{defender}} lands a sloppy, scrambling counter on {{attacker}}.",
            "{{defender}} throws a desperate 'Hail Mary' strike that rattles {{attacker}}'s teeth.",
            "Panicking, {{defender}} lashes out wildly, barely catching {{attacker}} off guard.",
            "In a blind flail of self-preservation, {{defender}} miraculously lands a counter.",
            "Stumbling backward, {{defender}} throws a frantic strike that somehow connects.",
            "With a panicked gasp, {{defender}} throws a desperate riposte to survive.",
            "A frantic, uncoordinated counterstrike catches {{attacker}} by pure luck.",
            "Wild-eyed, {{defender}} forces a clumsy but effective retaliation.",
            "Barely keeping their feet, {{defender}} throws a wild counter.",
            "In absolute panic, {{defender}} lashes a chaotic strike back.",
            "{{defender}} lashes out in a panicked frenzy, turning a block into a chaotic counter.",
            "Stumbling backward, {{defender}} flails wildly, managing a frantic but effective riposte.",
            "A wild, uncoordinated swing from {{defender}} somehow finds an opening after the block.",
            "Barely hanging on, {{defender}} throws a desperate, scrambling counterattack.",
            "{{defender}} thrusts back with raw survival instinct, form entirely abandoned.",
            "Eyes wide with panic, {{defender}} turns a clumsy parry into a wild, lunging counterstrike."
          ],
          confident: [
            "{{defender}} fluidly turns the parry into a punishing riposte with arrogant ease.",
            "A smug grin flashes as {{defender}} seamlessly transitions into a deadly counter.",
            "With casual superiority, {{defender}} effortlessly retaliates through an opening.",
            "{{defender}} laughs off the attack, immediately delivering a precise counter-blow.",
            "With effortless grace, {{defender}} seamlessly transitions into a deadly counter.",
            "Hardly breaking a sweat, {{defender}} punishes the opening.",
            "{{defender}} sneers and returns a perfectly timed counter-blow.",
            "A fluid, textbook counter-strike from {{defender}} catches the attacker off guard.",
            "{{defender}} effortlessly turns the momentum into a punishing riposte.",
            "Cool and composed, {{defender}} snaps back with a flawless strike.",
            "A mocking laugh precedes {{defender}}'s effortless, punishing counter-blow.",
            "With absolute disdain, {{defender}} bats aside the attack and strikes back.",
            "{{defender}} practically yawns before delivering a masterful, clinical counter.",
            "A textbook parry flows into a devastatingly casual riposte from {{defender}}.",
            "{{defender}}'s arrogant smirk holds steady as they effortlessly turn defense into offense.",
            "With swagger and precision, {{defender}} punishes the sloppy opening.",
            "A cocky smirk precedes {{defender}}'s effortlessly devastating riposte.",
            "{{defender}} easily brushes the attack aside, punishing {{attacker}} with absolute certainty.",
            "With supreme poise, {{defender}} turns the attack into a punishing counter.",
            "{{defender}} barely looks at {{attacker}} while delivering a crushing, confident counter-blow.",
            "An arrogant scoff escapes {{defender}} as they land a precise, punishing riposte.",
            "{{defender}} confidently intercepts the attack and responds with brutal, unbothered precision.",
            "A smirk crosses {{defender}}'s face as they fluidly transition into a punishing counterstrike.",
            "With absolute certainty, {{defender}} absorbs the blow and retaliates effortlessly.",
            "{{defender}} laughs coldly, returning the favor with a precise, arrogant strike.",
            "Hardly breaking a sweat, {{defender}} answers the attack with a superior counter.",
            "With practiced arrogance, {{defender}} turns the attack into a devastating riposte.",
            "{{defender}} catches the strike effortlessly and returns a mocking counter-blow.",
            "Unfazed and smiling, {{defender}} delivers a flawless, confident retaliation.",
            "A display of pure superiority as {{defender}} casually counters the attack.",
            "{{defender}} smirks, turning the deflection into an effortlessly precise counter.",
            "With a mocking chuckle, {{defender}} slips the blow and strikes back.",
            "{{defender}} dismisses the attack easily and launches a punishing reprisal.",
            "A casual, arrogant flick of the wrist turns into a deadly counter-blow from {{defender}}.",
            "{{defender}} makes it look easy, punishing the misstep with a flawless riposte.",
            "With absolute certainty, {{defender}} parries and immediately retaliates.",
            "{{defender}} smirks as they bat the strike aside, instantly punishing {{attacker}}'s mistake.",
            "With a scoff, {{defender}} effortlessly parries and delivers a lightning-fast counter.",
            "{{defender}} doesn't even break a sweat, casually turning {{attacker}}'s momentum against them.",
            "A flawless block flows seamlessly into a devastating riposte from a highly amused {{defender}}.",
            "{{defender}} invites the attack just to prove they can counter it effortlessly.",
            "Hardly shifting their stance, {{defender}} deflects the blow and strikes back with precision.",
            "With practiced ease, {{defender}} turns the attack into a confident, punishing counterstrike.",
            "{{defender}} smirks, effortlessly deflecting and delivering a confident counter against {{attacker}}.",
            "A swift pivot and {{defender}} lands a supremely confident counterstrike.",
            "Never losing eye contact, {{defender}} executes a flawless, confident counter on {{attacker}}.",
            "{{defender}} absorbs the momentum, smoothly delivering a confident, calculated counter.",
            "With a disdainful snort, {{defender}} unleashes a perfectly timed, confident counterstrike.",
            "{{defender}} smirks, easily slipping the attack and delivering a punishing counter to {{attacker}}.",
            "With practiced ease, {{defender}} exploits the opening in {{attacker}}'s stance.",
            "{{defender}} reads {{attacker}} like a book, sidestepping into a flawless counterstrike.",
            "A textbook pivot allows {{defender}} to brutally punish {{attacker}}'s overextension.",
            "{{defender}} casually swats aside the assault and drills {{attacker}} with a crisp counter.",
            "Without breaking a sweat, {{defender}} threads a beautiful counter through {{attacker}}'s guard.",
            "{{attacker}} walks right into {{defender}}'s perfectly timed counter-assault.",
            "{{defender}} calmly absorbs the pressure, firing back a surgical strike that rocks {{attacker}}.",
            "With a smug smirk, {{defender}} effortlessly parries and delivers a punishing riposte.",
            "{{defender}} sidesteps casually, driving a textbook counterstrike home.",
            "Almost bored, {{defender}} swats the attack aside and counters brilliantly.",
            "A masterclass in timing: {{defender}} intercepts and perfectly punishes.",
            "With flawless composure, {{defender}} redirects the blow and strikes back.",
            "Coolly dismissing the attack, {{defender}} lands a devastating counter.",
            "{{defender}} flashes a confident grin before punishing the mistake.",
            "With precise superiority, {{defender}} intercepts and retaliates.",
            "{{defender}} smirks, effortlessly deflecting the blow and punishing the overextension.",
            "With casual arrogance, {{defender}} turns aside the attack and snaps a perfect riposte.",
            "{{defender}} reads the attack perfectly, stepping inside the guard for a clinical counter.",
            "A flawless parry flows like water into a devastating, confident counterstrike from {{defender}}.",
            "{{defender}} brushes the attack aside with contemptuous ease, immediately striking back.",
            "With a mocking chuckle, {{defender}} effortlessly parries and counters in one fluid motion."
          ],
          theatrical: [
            "{{defender}} twirls past the attack and ripostes with theatrical flair, playing to the crowd!",
            "With a dramatic flourish, {{defender}} spins the defense into a beautiful counter-offensive.",
            "A spectacular, spinning riposte from {{defender}} draws cheers from the stands.",
            "{{defender}} orchestrates a magnificent, show-stopping counter-attack.",
            "With a dramatic flourish, {{defender}} pivots and delivers a flashy counter!",
            "Playing to the roaring crowd, {{defender}} spins into a spectacular retaliatory blow.",
            "{{defender}} laughs, weaving a beautiful, over-the-top counter-strike.",
            "A breathtaking display of agility! {{defender}} strikes back with unnecessary but gorgeous flair.",
            "Soaking in the cheers, {{defender}} orchestrates a stunning cinematic counter.",
            "{{defender}} turns a simple defense into a dramatic, sweeping counterattack.",
            "A spectacular spinning reversal from {{defender}} dazzles the cheering crowd!",
            "With a grand, sweeping flourish, {{defender}} turns the attack into a brutal counter.",
            "{{defender}} bows mockingly as they slip the blow and deliver a flashy counterstrike.",
            "A beautiful, flowing dance of steel ends with {{defender}}'s elegant reprisal.",
            "Playing to the roaring stands, {{defender}} executes a magnificent, show-off counter.",
            "A breathtaking feat of acrobatics positions {{defender}} for a stunning counter-attack.",
            "{{defender}} bows mockingly before springing a spectacular counterstrike.",
            "A dazzling acrobatic display from {{defender}} ends in a punishing riposte.",
            "{{defender}} winks at the crowd, instantly transitioning into a flashy counter-attack.",
            "With a grand, sweeping motion, {{defender}} turns defense into a stunning reprisal.",
            "{{defender}} orchestrates a masterclass in style, finishing with a beautiful counter-blow.",
            "A breathtaking, choreographic deflection from {{defender}} flows perfectly into a retaliatory strike.",
            "{{defender}} spins with a dramatic flourish, delivering a spectacular counter-attack!",
            "Playing to the roaring crowd, {{defender}} turns the deflection into a flashy riposte.",
            "A breathtaking, acrobatic counterstrike from {{defender}} leaves the audience gasping.",
            "With a theatrical bow, {{defender}} dances past the strike and retaliates beautifully.",
            "The counterstrike is a work of art, a spinning, magnificent retaliation by {{defender}}.",
            "{{defender}} turns defense into a stunning performance with a flamboyant counter.",
            "A magnificent, sweeping counter-blow by {{defender}} draws wild cheers from the stands.",
            "{{defender}} winks at the crowd before delivering a show-stopping riposte.",
            "{{defender}} plays to the crowd, turning a basic block into a spectacular spinning counter!",
            "With a dramatic flourish, {{defender}} sweeps the weapon away and launches a stunning riposte.",
            "{{defender}} dances out of harm's way, striking back with undeniable flair.",
            "The arena roars as {{defender}} executes a flashy, spinning counter-attack.",
            "{{defender}} bows slightly before delivering a punishing, stylized reprisal.",
            "A dazzling display of acrobatics ends with a punishing counter from {{defender}}.",
            "{{defender}} spins gracefully out of danger and delivers a counterstrike with a flourish.",
            "With a dramatic bow, {{defender}} parries the blow and strikes back for the crowd's delight.",
            "{{defender}} deflects the attack, striking a heroic pose before retaliating.",
            "A spectacular backflip turns {{attacker}}'s strike into a perfect opening for {{defender}}.",
            "{{defender}} plays to the audience, turning a simple block into an acrobatic counter.",
            "Winking at the spectators, {{defender}} dances past the weapon and strikes back.",
            "Spinning with a flourish, {{defender}} delivers a highly theatrical counterstrike to the roar of the crowd.",
            "{{defender}} strikes a pose before launching a dramatic, theatrical counter against {{attacker}}.",
            "Playing to the audience, {{defender}} executes a sweeping, theatrical counterstrike.",
            "With a dramatic shout, {{defender}} turns the exchange into a grand, theatrical counter.",
            "{{defender}} dances around the blow, delivering a wildly theatrical counterstrike.",
            "Bowing mockingly, {{defender}} lands a swift, theatrical counter on the baffled {{attacker}}.",
            "{{defender}} spins elegantly, turning a near-miss into a dazzling counterstrike on {{attacker}}!",
            "With a flourish that draws gasps from the crowd, {{defender}} ripostes {{attacker}} beautifully.",
            "{{defender}} dances around the blow and bows before delivering a stinging counter to {{attacker}}.",
            "A backflip avoids the danger, and {{defender}} lands a cinematic strike on the stunned {{attacker}}.",
            "{{defender}} winks at the audience right before intercepting {{attacker}} with a flashy counter.",
            "Using {{attacker}}'s own momentum, {{defender}} choreographs a breathtaking counter-assault.",
            "{{defender}} strikes a heroic pose mid-counter, sending {{attacker}} reeling backward.",
            "The crowd goes wild as {{defender}} styles on {{attacker}} with an acrobatic counterstrike.",
            "Spinning with absurd flair, {{defender}} turns the defense into a flashy counter.",
            "{{defender}} bows mockingly before snapping a sudden riposte into {{attacker}}.",
            "Playing to the cheap seats, {{defender}} flourishes before landing a counter.",
            "With a dramatic twirl, {{defender}} deflects the blow and strikes a pose.",
            "A spectacular pirouette turns a near-hit into a gorgeous counterstrike.",
            "{{defender}} winks at the crowd, deflecting and countering in one fluid dance.",
            "Adding unnecessary flair, {{defender}} counters with a showman's flourish.",
            "With a theatrical gasp, {{defender}} weaves under and snaps back.",
            "{{defender}} executes a magnificent spinning parry, flowing beautifully into a flashy counterstrike.",
            "Playing to the roaring crowd, {{defender}} catches the blade and dances into a soaring riposte.",
            "With a dramatic flourish of steel, {{defender}} deflects the blow and strikes a heroic counter-pose.",
            "{{defender}} orchestrates a breathtaking reversal, turning defense into a show-stopping attack.",
            "A dazzling display of swordsmanship! {{defender}} parries and launches a flamboyant, soaring counter.",
            "{{defender}} bows mockingly before executing a stunning, acrobatic counterstrike."
          ],
          grim: [
            "{{defender}} silently answers the opening with a grim, devastating counterstrike.",
            "A cold, calculated riposte from {{defender}} seeks to end the fight instantly.",
            "With joyless efficiency, {{defender}} drives a clinical counter-blow into the gap.",
            "Without a word, {{defender}} punishes the mistake with a chilling counter-attack.",
            "Silent and lethal, {{defender}} mechanically returns a brutal, jagged strike.",
            "Without changing expression, {{defender}} drives a nasty, efficient counter home.",
            "Cold and calculating, {{defender}} punishes the miss with ruthless intent.",
            "A violent, merciless counter-blow from {{defender}} seeks to draw blood.",
            "{{defender}} ignores the danger, smoothly executing a horrifyingly precise counter.",
            "With dead eyes, {{defender}} chops back in a chillingly methodical motion.",
            "A silent, murderous glare from {{defender}} precedes a bone-crushing counter.",
            "With cold, emotionless precision, {{defender}} violently retaliates.",
            "{{defender}} absorbs the shock and delivers a brutal, joyless counterstrike.",
            "A clinical, terrifyingly efficient riposte from {{defender}} seeks a quick end.",
            "Without a word, {{defender}} turns the parry into a grim, methodical punishment.",
            "A merciless, calculated counter-blow from {{defender}} echoes through the pit.",
            "{{defender}} absorbs the kinetic energy and returns it with bleak, terrifying malice.",
            "A dark, merciless counter-strike from {{defender}} seeks only to end the conflict.",
            "{{defender}} shifts like a ghost, delivering a fatalistic, joyless riposte.",
            "With a dead-eyed stare, {{defender}} drives a clinical, lethal counter-attack.",
            "There is no hesitation as {{defender}} responds with a grim, devastating retaliatory blow.",
            "{{defender}} silences the arena with a chillingly efficient, silent counterstrike.",
            "With cold, emotionless efficiency, {{defender}} answers the attack with a brutal counter.",
            "{{defender}} says nothing, turning the deflection into a chilling, calculated riposte.",
            "A joyless, mechanical counterstrike from {{defender}} strikes with terrifying precision.",
            "Eyes dead and fixed, {{defender}} delivers a heavy, uncompromising retaliatory blow.",
            "Without a hint of emotion, {{defender}} punishes the opening with a grim counter.",
            "A silent, brutal return strike from {{defender}} shatters the attacker's momentum.",
            "{{defender}} calmly steps into the opening, delivering a stoic, devastating counter.",
            "The counterstrike is a cold, calculated execution of martial necessity by {{defender}}.",
            "Silent and cold, {{defender}} turns the blocked strike into a lethal counter.",
            "{{defender}} absorbs the momentum without expression, delivering a brutal reprisal.",
            "A joyless, mechanical counter-strike from {{defender}} answers the attack.",
            "{{defender}} simply adjusts their stance and drives a chilling counter-blow forward.",
            "With clinical precision, {{defender}} punishes the overextension without hesitation.",
            "{{defender}} wastes no movement, answering the strike with a dark, devastating counter.",
            "{{defender}} coldly intercepts the weapon, immediately exploiting the opening with zero hesitation.",
            "Not a single wasted motion\u2014{{defender}} parries and strikes back with lethal intent.",
            "{{defender}}'s dead eyes betray nothing as they brutally punish the failed attack.",
            "A sickening crunch as {{defender}} blocks and delivers a completely ruthless counter.",
            "{{defender}} absorbs the impact and wordlessly buries their weapon in return.",
            "No emotion, just efficiency. {{defender}} counters the strike with terrifying precision.",
            "With dead-eyed precision, {{defender}} delivers a brutal, grim counterstrike.",
            "{{defender}} merely grunts, violently forcing a grim, bone-jarring counter against {{attacker}}.",
            "Without a word, {{defender}} steps inside the guard for a cold, grim counterstrike.",
            "{{defender}} ignores the danger, driving home a heavy, grim counter with brutal efficiency.",
            "A sharp exhale is the only warning before {{defender}}'s dark, grim counterstrike connects.",
            "{{defender}} coldly calculates the opening, delivering a merciless, grim counter.",
            "{{defender}} absorbs the blow with a stony glare and drives a brutal counter into {{attacker}}.",
            "Silence falls as {{defender}} systematically dismantles {{attacker}}'s assault with a ruthless counter.",
            "No wasted motion. {{defender}} steps inside the arc and coldly punishes {{attacker}}.",
            "{{defender}} trades flesh for an opening, stepping into the strike to gore {{attacker}}.",
            "A joyless, utilitarian counter from {{defender}} stops {{attacker}} dead in their tracks.",
            "{{defender}}'s eyes are dead as they ruthlessly exploit the gap in {{attacker}}'s defense.",
            "With chilling efficiency, {{defender}} turns {{attacker}}'s aggression into a fatal mistake.",
            "{{defender}} simply steps forward, driving their counterstrike through {{attacker}} with sickening intent.",
            "In dead silence, {{defender}} accepts a glancing blow to deliver a savage counter.",
            "With cold, mechanical efficiency, {{defender}} parries and strikes vitals.",
            "Eyes devoid of mercy, {{defender}} counters with brutal precision.",
            "A clinical, emotionless riposte from {{defender}} punishes the overextension.",
            "Without a word, {{defender}} dissects the attack and retaliates.",
            "Grimly ignoring the danger, {{defender}} steps into the guard to counter.",
            "A silent, fatalistic counterstrike lands with chilling accuracy.",
            "{{defender}}'s cold stare remains fixed as they deliver a merciless riposte.",
            "{{defender}} blocks the blow with bone-jarring force, instantly driving a merciless counter home.",
            "Eyes dead and cold, {{defender}} ruthlessly exploits the opening with a silent, fatalistic strike.",
            "A heavy, joyless parry from {{defender}} is immediately followed by a brutal, crushing counter.",
            "{{defender}} answers the attack with mechanical ruthlessness, delivering a chilling riposte.",
            "No emotion, no hesitation. {{defender}} parries and thrusts back with cold, murderous intent.",
            "{{defender}} coldly knocks the weapon aside and drives a brutal, silent reprisal toward their foe."
          ]
        },
        dodge: {
          tier1_low: [
            "Panic flashes in {{name}}'s eyes as they desperately throw themselves out of the weapon's path.",
            "{{name}} dances back, a confident smirk on {{possessive}} face as the attack finds only air.",
            "{{name}} simply leans out of the way, a cold, calculating glare never leaving the attacker.",
            "{{defender}} frantically throws themselves backward, escaping the blow by a hair's breadth.",
            "With a frantic, desperate scramble, {{name}} just barely avoids the whistling steel!",
            "{{name}} sways backward, letting the blow pass harmlessly by {{possessive}} nose.",
            "A theatrical backflip sees {{name}} clear of danger, much to the crowd's delight!",
            "{{name}} drops desperately, the lethal strike whistling hairs-breadth overhead!",
            "{{name}} leaps aside with an acrobatic flip, drawing gasps from the crowd!",
            "{{name}} laughs confidently, weaving out of the way with insulting ease.",
            "{{name}} side-steps with grim efficiency, wasting not a single motion.",
            "{{name}} pirouettes gracefully out of reach, turning defense into art.",
            "{{defender}} flinches backward desperately, barely avoiding the steel.",
            "With theatrical flair, {{defender}} twirls out of the path of danger.",
            "{{name}} backpedals frantically, boots slipping on the bloody sands!",
            "{{name}} flinches away awkwardly, surviving more by luck than skill.",
            "{{name}} grimly side-steps the blow, eyes dead and unblinking.",
            "{{name}} slips the strike smoothly, weaving like a phantom.",
            "{{defender}} clumsily stumbles back to avoid the blow.",
            "{{name}} leans backward, narrowly avoiding the strike.",
            "{{defender}} awkwardly sidesteps the incoming weapon.",
            "{{defender}} sidesteps with a lazy, arrogant smirk.",
            "{{defender}} nimbly eludes {{attacker}}'s attack.",
            "{{defender}} ducks out of the way of the attack.",
            "{{defender}} leans back from the incoming blow.",
            "{{defender}} barely leans away from the attack.",
            "{{defender}} steps aside at the last moment.",
            "{{defender}} sidesteps the blow with mocking ease.",
            "{{defender}} dances away from the strike, completely unfazed.",
            "{{defender}} evades the strike with a theatrical, spinning flourish."
          ],
          tier2_medium: [
            "With terrifying calm, {{defender}} simply sways an inch backward, letting {{attacker}}'s weapon pass harmlessly.",
            "Desperation takes over as {{defender}} throws themselves wildly out of the path of {{attacker}}'s strike.",
            "A theatrical backflip from {{defender}} carries them out of harm's way, playing to the roaring crowd.",
            "{{defender}} side-steps with practiced arrogance, scoffing at {{attacker}}'s clumsy attempt.",
            "{{defender}} spins gracefully out of reach, capping the dodge with a mocking flourish.",
            "{{defender}} barely scrambles backward, eyes wide with panic as the blow sails past.",
            "Eyes grim and hollow, {{defender}} coldly pivots aside, wasting no excess motion.",
            "{{defender}} drops to one knee, letting the strike whistle harmlessly overhead.",
            "{{defender}} dances out of reach, making {{attacker}} look slow and clumsy.",
            "{{defender}} pirouettes out of harm's way as the {{weapon}} whistles past.",
            "{{defender}} weaves backward gracefully, letting the attack whistle past.",
            "A masterful backstep by {{defender}} leaves {{attacker}} swinging at air.",
            "{{defender}} barely leaps away, breathing heavily in a desperate evasion.",
            "{{defender}} twists and narrowly pulls away from the path of the attack!",
            "{{defender}} ducks under the attack with a desperate, flailing scramble.",
            "{{defender}} curves snakelike away from the blow at the last instant.",
            "{{defender}} ducks under the strike with a stoic, joyless efficiency.",
            "A frantic scramble backward sees {{defender}} narrowly escape death.",
            "{{defender}} evades the strike with a theatrical, spinning flourish.",
            "{{defender}} sways out of range, flashing a confident, mocking grin.",
            "{{defender}} pirouettes away gracefully, mocking the clumsy attack.",
            "{{defender}} sidesteps smoothly, making the dodge look effortless.",
            "{{defender}} makes it look easy as he gracefully dodges the blow.",
            "With feline agility, {{defender}} sidesteps the incoming blow.",
            "{{defender}} shifts aside with grim, mechanical efficiency.",
            "{{defender}} avoids the blow."
          ],
          tier3_high: [
            "{{defender}} seemingly vanishes, reappearing a safe distance from {{attacker}}'s strike.",
            "{{defender}} steps into the void, showing absolute confidence as the strike whiffs past.",
            "{{defender}} bends backward like a reed in the wind, completely evading the {{weapon}}.",
            "{{defender}} pirouettes away from the strike, blowing a kiss to the jeering crowd.",
            "{{name}} simply ghosts out of the attack's path, their grim expression unchanged.",
            "With a desperate, frantic scramble, {{name}} barely evades the deadly strike!",
            "With theatrical flair, {{defender}} pirouettes away from the deadly strike.",
            "{{defender}} twists impossibly away from the blow, amazing the spectators!",
            "{{defender}}'s body is a blur of motion as he leaps away from the attack!",
            "{{defender}} shows off her superb training as she vaults over the attack!",
            "In a theatrical display of acrobatics, {{name}} vaults out of harm's way!",
            "{{defender}} twists and narrowly pulls away from the path of the attack!",
            "With an arrogant sway, {{name}} watches the strike sail past harmlessly.",
            "{{name}} confidently sidesteps the attack, a smug smirk on their face.",
            "{{defender}} curves snakelike away from the blow at the last instant!",
            "A desperate, undignified dive saves {{defender}} from a lethal blow.",
            "{{name}} drops low, narrowly dodging the blow with a panicked gasp!",
            "{{defender}} moves beyond {{attacker}}'s reach."
          ],
          tier4_supernatural: [
            "{{defender}} blinks out of reality for a fraction of a second, entirely avoiding the blow.",
            "{{defender}} dissolves into mist, letting {{attacker}}'s strike pass harmlessly through.",
            "Time seems to stutter as {{defender}} effortlessly glides away from the attack.",
            "{{defender}} contorts her body inhumanly as she unbelievably dodges the blow!",
            "{{defender}}'s form shifts like smoke, the blow passing through empty air!",
            "Dark tendrils pull {{defender}} to safety just before the weapon connects.",
            "{{defender}} moves with preternatural speed, leaving only an afterimage!",
            "A phantom afterimage takes the hit as {{defender}} magically relocates.",
            "{{defender}} moves with impossible, fluid grace to avoid the strike.",
            "{{defender}} defies physics, twisting in ways no mortal should!",
            "{{defender}} evades the blow as if reading {{attacker}}'s mind.",
            "{{defender}} simply is not where the blow lands - impossible!",
            "{{defender}} sidesteps with terrifying, preternatural speed.",
            "{{defender}} vanishes like a ghost, reappearing untouched.",
            "{{defender}} dodges with an eerie, perfect calmness."
          ],
          desperate: [
            "{{defender}} drops to their knees in sheer panic, letting the strike whistle harmlessly overhead.",
            "{{defender}} trips over their own feet, somehow contorting just enough to avoid the deadly arc.",
            "{{defender}} jerks backward wildly, feeling the wind of the weapon pass inches from their face.",
            "{{defender}} scrambles away on all fours, narrowly avoiding a fatal strike in pure desperation.",
            "Gasping for breath, {{defender}} throws their weight sideways in a desperate, graceless dodge.",
            "With a wild flail, {{defender}} hurls themselves out of the way, surviving on sheer instinct.",
            "Panic takes over! {{defender}} trips over their own feet but miraculously evades the attack.",
            "{{defender}} barely twists out of the way, throwing themselves to the side in sheer panic.",
            "In a frantic display of survival, {{defender}} flings themselves out of the weapon's path.",
            "A frantic, uncoordinated flinch is the only thing saving {{defender}} from certain death.",
            "The strike grazes their tunic as {{defender}} throws themselves backward in total panic.",
            "In a moment of pure terror, {{defender}} rolls frantically away from the incoming blow.",
            "{{defender}} stumbles, their clumsy retreat miraculously taking them just out of reach.",
            "Tripping over their own feet, {{defender}} somehow manages to evade the lethal attack.",
            "Eyes wide, {{defender}} backpedals furiously, the weapon missing them by mere inches.",
            "{{defender}} throws themselves to the dirt, the vicious strike clipping their shadow.",
            "{{defender}} practically throws themselves at the dirt, barely avoiding decapitation.",
            "With a panicked scramble, {{defender}} ducks under the devastating blow just in time.",
            "Gasping for air, {{defender}} barely manages a clumsy dive out of the weapon's path.",
            "Panic flashing in their eyes, {{defender}} dives into the dirt to avoid the strike.",
            "Stumbling frantically, {{defender}} narrowly contorts away from the incoming swipe.",
            "Eyes wide with panic, {{defender}} hurls themselves backwards to escape the strike.",
            "Stumbling backward, {{defender}} avoids the blow by a sheer fraction of an inch.",
            "Breath hitching, {{defender}} barely contorts enough to avoid the lethal impact.",
            "Eyes wide with terror, {{defender}} flings themselves aside in a graceless heap.",
            "{{defender}} scrambles backward like a cornered rat, barely avoiding the strike.",
            "It's not pretty, but {{defender}} manages a desperate, frantic leap to safety.",
            "{{defender}} scrambles backward, barely dodging the blow by a hair's breadth!",
            "{{defender}} barely flinches away, eyes wide as the {{weapon}} whistles past.",
            "With a frantic yelp, {{defender}} dives desperately out of the weapon's path.",
            "{{defender}} stumbles backward in sheer terror, narrowly evading the attack.",
            "In a blind panic, {{defender}} throws their body sideways to escape death.",
            "A frantic, uncoordinated lunge saves {{defender}} at the very last second.",
            "Panic flashes in {{defender}}'s eyes as they scramble wildly out of range.",
            "A wild, uncoordinated leap backward saves {{defender}} from certain ruin.",
            "{{defender}} scrambles away on hands and knees, barely escaping the blow.",
            "{{defender}} narrowly slips the attack, their eyes wide with desperation.",
            "In a blind panic, {{defender}} flings themselves aside to avoid the blow.",
            "Panting heavily, {{defender}} barely twitches out of the strike's path.",
            "{{defender}} throws themselves to the side, surviving by mere inches.",
            "{{defender}} ducks haphazardly, the attack whispering past their ear.",
            "A clumsy but effective sprawl saves {{defender}} from certain death.",
            "A split-second panic allows {{defender}} to dodge the incoming blow.",
            "{{defender}} trips backward, narrowly avoiding the lethal strike.",
            "{{defender}} scrambles wildly backward, stumbling but surviving.",
            "With a panicked flinch, {{defender}} avoids the incoming strike.",
            "{{defender}} barely scrambles out of the way, chest heaving.",
            "{{defender}} awkwardly ducks under the swing just in time.",
            "{{defender}} throws themselves sideways in a blind panic.",
            "Flailing wildly, {{defender}} somehow evades the attack.",
            "{{defender}} rolls clumsily out of the way just in time.",
            "A frantic backpedal saves {{defender}} from the blow.",
            {
              text: "{{defender}} narrowly evades {{attacker}}'s desperate lunge",
              min: 25
            },
            {
              text: "{{defender}} miraculously dodges {{attacker}}'s vicious strike",
              min: 35
            },
            {
              text: "{{defender}} throws themselves out of the way of {{attacker}}'s attack",
              min: 15
            },
            "{{defender}} practically throws themselves backward, abandoning all form to survive.",
            "A frantic, terrified step back is the only thing keeping {{defender}} alive.",
            "{{defender}} scrambles away wildly, eyes wide with pure survival instinct.",
            "{{defender}} throws themselves wildly to the side, barely avoiding the blow.",
            "With a frantic stumble, {{defender}} manages to dodge the strike at the last possible second.",
            "{{defender}} scrambles backward like a cornered animal, barely avoiding the blow.",
            "A frantic, uncoordinated lurch saves {{defender}}'s life by a fraction of an inch.",
            "{{defender}} scrambles wildly, barely avoiding the strike by a hair's breadth.",
            "With a panicked yelp, {{defender}} flings themselves out of the weapon's path.",
            "{{defender}} stumbles backward in absolute terror, the blow whistling past their nose.",
            "Survival instinct takes over as {{defender}} throws themselves ungracefully into the dirt.",
            "{{defender}} scrambles wildly backward, eyes wide with panic as they barely avoid the strike.",
            "Tripping over their own feet, {{defender}} haphazardly flings themselves out of the way of the blow.",
            "{{defender}} barely contorts out of the way, panic in their eyes.",
            "Falling backwards, {{defender}} miraculously avoids the strike.",
            "{{defender}} ducks frantically as the weapon sails overhead.",
            "A wild dodge leaves {{defender}} off-balance, but alive.",
            "{{defender}} scrambles away with a panicked yelp, barely escaping the incoming death.",
            "Throwing all dignity aside, {{defender}} hurls themselves out of the weapon's fatal arc.",
            "Sweat flying, {{defender}} trips over their own feet but miraculously avoids the strike.",
            "{{defender}} throws themselves face-first into the dirt to dodge the horrifying blow.",
            "Eyes wide with terror, {{defender}} barely manages a clumsy, uncoordinated evasion.",
            "A graceless, panicked stumble backward is the only thing saving {{defender}} right now.",
            "Heart pounding, {{defender}} scrambles away from the strike like a cornered animal.",
            "{{defender}} practically crawls away from the weapon's reach in sheer, unadulterated panic.",
            "Tripping over their own feet, {{defender}} executes a desperate dodge to avoid {{attacker}}.",
            "{{defender}} practically throws themselves into the dirt in a desperate dodge from {{attacker}}.",
            "With eyes squeezed shut in panic, {{defender}} manages a desperate dodge.",
            "Flailing wildly, {{defender}} executes a frantic, desperate dodge against {{attacker}}.",
            "{{defender}} barely scrambles out of the way, panic in their eyes as the weapon flashes past.",
            "A frantic, uncoordinated lurch backwards saves {{defender}} by a hair's breadth.",
            "{{defender}} flails wildly, somehow contorting their body away from the deadly strike.",
            "Tripping over their own feet, {{defender}} falls backward, narrowly avoiding death.",
            "{{defender}} throws themselves to the side in sheer terror, the attack missing by an inch.",
            "A breathless, wide-eyed dive keeps {{defender}} from being skewered.",
            "{{defender}} scrambles away like a cornered animal, desperate to survive.",
            "With a panicked yell, {{defender}} ducks, the weapon clipping their hair.",
            "{{defender}} flinches hard, stumbling backward out of the attack's path.",
            "Pure, adrenaline-fueled panic allows {{defender}} to jerk away just in time."
          ],
          confident: [
            "{{defender}} barely shifts their weight, a masterclass in minimal effort, dodging with absolute certainty.",
            "A casual sway backward is all {{defender}} needs to evade the blow, leaving the attacker looking foolish.",
            "With a slow, calculated step backward, {{defender}} renders the furious attack completely useless.",
            "Anticipating the move perfectly, {{defender}} smoothly weaves out of range with a confident grin.",
            "{{defender}} casually leans backward a single inch, letting the strike whistle harmlessly past.",
            "{{defender}} ducks the strike so smoothly it looks like they've practiced it a thousand times.",
            "Without breaking a sweat, {{defender}} shifts their weight and lets the blow pass harmlessly.",
            "{{defender}} reads the strike perfectly, slipping past the weapon with clinical precision.",
            "{{defender}} moves with absolute certainty, weaving out of the strike's path seamlessly.",
            "A practiced, elegant dodge from {{defender}} leaves {{attacker}} swinging at empty air.",
            "Without breaking eye contact, {{defender}} calmly steps out of the weapon's deadly arc.",
            "{{defender}} watches the strike come and casually sidesteps without breaking a sweat.",
            "A lazy pivot is all it takes for {{defender}} to completely avoid the incoming blow.",
            "Yawning visibly, {{defender}} steps exactly one pace to the left, dodging perfectly.",
            "{{defender}} ghosts past the attack with insulting ease, their confidence unshaken.",
            "{{defender}} sidesteps with languid ease, scoffing as {{attacker}} hits empty air.",
            "{{defender}} doesn't even flinch, simply swaying out of range with arrogant ease.",
            "{{defender}} reads the attack perfectly, stepping aside with absolute certainty.",
            "A cool pivot and {{defender}} is out of danger, making the attack look foolish.",
            "{{defender}} anticipates the move entirely, stepping aside with arrogant ease.",
            "Without breaking a sweat, {{defender}} gracefully pivots away from the strike.",
            "A confident smirk crosses {{defender}}'s face as they easily avoid the attack.",
            "A mere tilt of the head is all {{defender}} needs to evade the clumsy strike.",
            "{{defender}} casually leans backward, making the frantic attack look foolish.",
            "{{defender}} leans back lazily, letting the attack pass through empty space.",
            "{{defender}} dances just out of reach, a smug smirk settling on their face.",
            "With a cool shift of their shoulders, {{defender}} lets the blow slip past.",
            "{{defender}} sidesteps the blow with a smirk, barely expending any effort.",
            "With calm, measured footwork, {{defender}} evades the attack effortlessly.",
            "With practiced ease, {{defender}} weaves through the assault effortlessly.",
            "With a slight tilt of the head, {{defender}} effortlessly evades the blow.",
            "{{defender}} sways backward just enough, a confident gleam in their eyes.",
            "{{defender}} scoffs, casually dodging the attack with clinical precision.",
            "{{defender}} sidesteps with a smug grin, reading the attack perfectly.",
            "With fluid grace, {{defender}} weaves around the attack like water.",
            "{{defender}} smirks, sidestepping the attack with maddening ease.",
            "{{defender}} leans away lazily, entirely unfazed by the assault.",
            "With a bored sigh, {{defender}} leans out of the weapon's path.",
            "{{defender}} ducks the strike with practiced, effortless grace.",
            "{{defender}} dances out of reach with a calm, mocking smile.",
            "{{defender}} steps aside smoothly, hardly breaking a sweat.",
            "With casual elegance, {{defender}} sways just out of range.",
            "With a smirk, {{defender}} smoothly weaves out of danger.",
            "{{defender}} sways backward, casually avoiding the blow.",
            "{{defender}} sidesteps with complete nonchalance.",
            "{{defender}} doesn't even blink, swaying just enough to let the strike pass.",
            "With insulting ease, {{defender}} sidesteps the attack, a smug grin on their face.",
            "{{defender}} evades the blow effortlessly, already anticipating the next move.",
            "{{defender}} sidesteps the attack with effortless grace, offering a smirk.",
            "Barely shifting their weight, {{defender}} lets the strike pass harmlessly by.",
            "{{defender}} sidesteps the attack with supreme confidence, watching the blow sail past.",
            "With a knowing smirk, {{defender}} easily avoids the poorly timed strike.",
            "{{defender}} smirks, sidestepping the blow without breaking a sweat.",
            "With arrogant ease, {{defender}} leans back, watching the strike slice empty air.",
            "{{defender}} barely shifts their stance, letting the clumsy attack miss entirely.",
            "A cocky grin crosses {{defender}}'s face as they gracefully evade the strike.",
            "{{defender}} casually sways just out of reach, a faint smirk playing on their lips.",
            "With a measured step, {{defender}} glides perfectly out of the strike's path without breaking a sweat.",
            "{{defender}} sidesteps with a smirk, easily evading the blow.",
            "With casual grace, {{defender}} lets the strike pass harmlessly by.",
            "{{defender}} sways effortlessly out of danger, unbothered.",
            "Not even breaking a sweat, {{defender}} ducks under the swing.",
            "{{defender}} offers a lazy yawn as they step casually out of the weapon's lethal path.",
            "Without breaking a sweat, {{defender}} smoothly weaves out of range with absolute arrogance.",
            "{{defender}} sidesteps the blow with a mocking laugh, utterly unimpressed by the effort.",
            "A smug grin flashes as {{defender}} effortlessly avoids the clumsy, telegraphed attack.",
            "{{defender}} dodges the strike with insulting ease, shaking their head at the poor attempt.",
            "With an air of supreme superiority, {{defender}} dances away from the slow-moving threat.",
            "{{defender}} watches the weapon sail past, offering a slow, sarcastic clap for the effort.",
            "Hardly seeming to move, {{defender}} avoids the attack with an infuriatingly calm grace.",
            "{{defender}} smirks, executing a supremely confident dodge just inches from the blade.",
            "With arrogant ease, {{defender}} performs a confident dodge to evade {{attacker}}.",
            "Barely moving, {{defender}} pulls off a lazy, confident dodge.",
            "{{defender}} side-steps with practiced, confident grace, avoiding {{attacker}} completely.",
            "{{defender}} calmly sidesteps, a faint smirk on their face as the attack cuts empty air.",
            "With effortless grace, {{defender}} sways back, completely unbothered by the incoming blow.",
            "{{defender}} predicts the move perfectly, shifting their weight to avoid it without breaking a sweat.",
            "A slight, measured step is all {{defender}} needs to make {{attacker}} look foolish.",
            "{{defender}} simply tilts their head, letting the weapon pass with arrogant ease.",
            "Barely blinking, {{defender}} lets the attack sail past their chest.",
            "{{defender}} steps into the attack's blind spot with chilling confidence.",
            "A confident pivot leaves {{attacker}} swinging at shadows.",
            "{{defender}} casually ducks the blow, already plotting their counter-attack.",
            "With a mocking smile, {{defender}} perfectly times their evasion."
          ],
          theatrical: [
            "{{defender}} twirls like a dancer, letting the deadly strike pass through thin air where they stood a moment ago.",
            "{{defender}} evades the blow with a flamboyant, sweeping motion that wouldn't be out of place on a stage.",
            "With a flourish and a bow, {{defender}} elegantly steps aside, leaving the attacker swiping at shadows.",
            "{{defender}} executes a flawless backflip, landing in a dramatic pose as the strike misses completely!",
            "With a dramatic, spinning backflip, {{defender}} evades the blow to the roaring delight of the crowd.",
            "{{defender}} slides on their knees through the dirt, leaning back Matrix-style to avoid the blade.",
            "A dramatic dive roll followed by a triumphant bow! {{defender}} turns survival into a performance.",
            "{{defender}} executes a flawless backflip, landing perfectly as the crowd roars at the near-miss.",
            "{{defender}} drops into a flawless split, avoiding the horizontal slash with unbelievable flair.",
            "{{defender}} leaps high into the air with exaggerated flair, spinning over the incoming attack!",
            "With a dazzling leap, {{defender}} vaults out of the way, turning survival into a performance.",
            "{{defender}} executes a perfect cartwheel, dodging the blow and landing in a magnificent pose.",
            "{{defender}} performs a stunning acrobatic flip, dodging the blow to the roar of the crowd!",
            "{{defender}} pivots with a flamboyant sweep of their arms, effortlessly evading the attack.",
            "A breathtaking somersault carries {{defender}} out of harm's way, leaving a trail of dust.",
            "With a dramatic flourish, {{defender}} pirouettes away from {{attacker}}'s heavy swing.",
            "{{defender}} dodges with an exaggerated swooping motion, soaking in the arena's gasps.",
            "Like an acrobat, {{defender}} cartwheels backward, completely neutralizing the threat.",
            "A spectacular somersault takes {{defender}} out of harm's way, to the crowd's delight.",
            "{{defender}} springs into a spectacular handspring, landing with a dramatic flourish.",
            "{{defender}} spins elegantly on their heel, avoiding the strike with dramatic flair.",
            "Playing to the crowd, {{defender}} executes a magnificent back handspring to safety.",
            "{{defender}} executes a flawless backflip to avoid the strike, winking at the crowd.",
            "{{defender}} pirouettes on one foot, spinning cleanly away from the incoming attack.",
            "With a flourish, {{defender}} spins away from danger, playing to the roaring crowd.",
            "Bowing mockingly, {{defender}} weaves under the strike like a performer on stage.",
            "A breathtaking acrobatic leap carries {{defender}} high over the incoming attack.",
            "A sudden, graceful vault takes {{defender}} completely out of the weapon's reach.",
            "{{defender}} cartwheels gracefully away from the blow, winking at the audience.",
            "{{defender}} performs a dramatic backflip, turning the dodge into a spectacle.",
            "With a flourishing spin, {{defender}} evades the strike, playing to the crowd.",
            "{{defender}} performs an exaggerated bow as the attack sails harmlessly past.",
            "With a dramatic bow, {{defender}} evades the strike with breathtaking flair.",
            "With a dramatic flourish of their cape, {{defender}} twirls out of danger.",
            "With a wink to the crowd, {{defender}} pirouettes away from certain death.",
            "A spectacular pirouette carries {{defender}} safely away from the danger.",
            "{{defender}} sidesteps with a theatrical bow, mocking the missed attack.",
            "{{defender}} dances around the strike with an exaggerated, mocking bow.",
            "{{defender}} executes a dramatic backflip, laughing as the blow misses.",
            "{{defender}} dances back, blowing a kiss as the strike cuts empty air.",
            "With a flourish and a spin, {{defender}} completely avoids the strike.",
            "A dramatic twist of the hips carries {{defender}} out of harm's way.",
            "{{defender}} bows mockingly as they slip beneath the incoming blow.",
            "{{defender}} pirouettes away from the strike, cape or coat flaring.",
            "With a flourishing bow, {{defender}} ducks under the deadly attack.",
            "With a dramatic spin, {{defender}} elegantly sidesteps the attack.",
            "{{defender}} pirouettes away from the blow with a mocking bow.",
            "{{defender}} flips gracefully away from the strike.",
            "{{defender}} executes a dizzying spin, turning their evasion into a crowd-pleasing dance.",
            "With a dramatic sweep of their cloak, {{defender}} vanishes from the strike's path.",
            "{{defender}} leaps away with exaggerated flair, winking at the front row.",
            "{{defender}} executes a dramatic flip, evading the attack while playing to the cheering crowd.",
            "With a flamboyant twirl, {{defender}} dances out of harm's way.",
            "{{defender}} executes a flawless pirouette, turning defense into a beautiful performance.",
            "With a dramatic bow, {{defender}} lets the attack sail harmlessly overhead.",
            "{{defender}} cartwheels away from danger, blowing a kiss to the cheering crowd.",
            "A spectacular backflip carries {{defender}} out of reach, much to the arena's delight.",
            "{{defender}} executes a dramatic spin, the blow whistling harmlessly past their flourishing cape.",
            "Bowing mockingly, {{defender}} gracefully ducks under the strike, playing directly to the crowd's roar.",
            "{{defender}} performs an unnecessary backflip, dodging to the roar of the crowd.",
            "With a dramatic spin, {{defender}} twirls out of the weapon's path.",
            "{{defender}} bows mockingly as the strike whiffs past.",
            "A spectacular display of acrobatics sees {{defender}} dance away.",
            "{{defender}} leaps away, winking broadly at the most expensive seats in the house.",
            "With an elegant twirl that defies logic, {{defender}} easily avoids the clumsy strike.",
            "{{defender}} drops into a dramatic split as the weapon sails harmlessly overhead.",
            "Like a dancer on stage, {{defender}} glides out of danger with a wide smile.",
            "{{defender}} blows a kiss to the crowd before effortlessly vaulting the attack.",
            "A spectacular backward flip carries {{defender}} away from the lumbering blow.",
            "{{defender}} avoids the strike with an exaggerated, comedic gasp of mock terror.",
            "With an impossibly graceful spin, {{defender}} dodges, leaving the crowd screaming for more.",
            "With a dramatic backflip, {{defender}} executes a highly theatrical dodge.",
            "{{defender}} bows mockingly to the crowd while performing a theatrical dodge.",
            "A sweeping spin carries {{defender}} out of harm's way in a theatrical dodge.",
            "{{defender}} plays to the audience, turning a simple evasion into a grand theatrical dodge.",
            "{{defender}} performs a dazzling backflip, avoiding the attack to the roar of the crowd.",
            "With a dramatic flourish of their arms, {{defender}} spins out of danger.",
            "{{defender}} cartwheels away, winking at the audience as the strike misses.",
            "A breathtaking pirouette carries {{defender}} gracefully away from certain death.",
            "{{defender}} takes a mocking bow as the attack whistles over their head.",
            "With an exaggerated leap, {{defender}} turns a dodge into a breathtaking performance.",
            "{{defender}} dances around the strike, blowing a kiss to the screaming fans.",
            "A sudden, graceful vault leaves the crowd gasping and {{attacker}} swinging at air.",
            "{{defender}} executes a dizzying spin, cape flaring as they avoid the blow.",
            "With theatrical flair, {{defender}} gracefully ducks, posing for the spectators."
          ],
          grim: [
            "Without blinking, {{defender}} perfectly calculates the distance and stands perfectly still as the blow misses by a hair.",
            "A silent, calculating sidestep. {{defender}} evades the blow like a butcher avoiding a splashing carcass.",
            "{{defender}} shifts their weight imperceptibly, the attack missing by a hair as they prepare to counter.",
            "A cold, calculated step backward from {{defender}} leaves the furious attack hitting nothing but air.",
            "With grim efficiency, {{defender}} slips the attack, saving their energy for the inevitable kill.",
            "{{defender}} sways like a ghost, completely unbothered by the violence attempting to find them.",
            "A barely perceptible weave of the head saves {{defender}}'s life, though they show no reaction.",
            "{{defender}} steps into the attack's blind spot, their expression an unreadable mask of malice.",
            "Without a word, {{defender}} coldly shifts aside, their dead eyes never leaving the opponent.",
            "{{defender}} drifts out of range like a specter, leaving their opponent swinging at nothing.",
            "{{defender}} executes a joyless, mechanical dodge, showing no emotion as death brushes past.",
            "{{defender}} avoids the strike with a heavy, solemn movement, unbothered by the close call.",
            "{{defender}} moves only as much as necessary, their eyes locked intensely on {{attacker}}.",
            "A minimalist, chillingly precise shift from {{defender}} avoids the fatal strike entirely.",
            "{{defender}} coldly sways out of the weapon's path, their eyes never leaving {{attacker}}.",
            "With a stoic shuffle, {{defender}} narrowly avoids the blow, their expression unreadable.",
            "Without breaking eye contact, {{defender}} slides past the deadly arc of the {{weapon}}.",
            "{{defender}} simply ghosts away from the strike, their expression devoid of all emotion.",
            "{{defender}} shifts slightly, eyes cold and calculating as the strike misses by a hair.",
            "{{defender}} steps into the shadow of the blade, evading with cold, silent efficiency.",
            "Eyes completely empty, {{defender}} ducks the lethal strike with terrifying precision.",
            "Like a ghost, {{defender}} lets the attack phase through the space they just occupied.",
            "{{defender}} stoically shifts their weight, eyes cold and dead, as the blade misses.",
            "Wordlessly, {{defender}} ducks the strike, their focus cold and terrifyingly sharp.",
            "{{defender}} moves like a shadow, slipping the blow without a single wasted breath.",
            "{{defender}} makes a minimal, stark adjustment, evading the strike without emotion.",
            "A hollow, calculated step back ensures {{defender}} lives to fight another second.",
            "{{defender}} dodges with a lifeless, mechanical efficiency, showing zero emotion.",
            "A silent, grim slide carries {{defender}} just outside the weapon's fatal reach.",
            "{{defender}} barely flinches as they weave away from the strike, their gaze icy.",
            "{{defender}} shifts exactly one inch, letting the weapon pass in dead silence.",
            "{{defender}} barely shifts, letting the weapon ghost past with chilling calm.",
            "Silently, {{defender}} weaves under the blow, expression cold and unreadable.",
            "A calculated half-step is all the emotionless {{defender}} gives in evasion.",
            "{{defender}} drops low, eyes dead and focused, narrowly slipping the attack.",
            "{{defender}} shifts just enough to survive, their expression cold and dead.",
            "Without a word, {{defender}} steps back, eyes locked on the incoming death.",
            "Coldly, {{defender}} shifts their weight, letting the strike whistle past.",
            "With brutal efficiency, {{defender}} evades, eyes locked on the next kill.",
            "A stark, joyless sidestep keeps {{defender}} alive for another breath.",
            "{{defender}} evades, their face an unreadable mask of absolute focus.",
            "{{defender}} shifts out of the way with a hardened, dead-eyed stare.",
            "With joyless precision, {{defender}} side-steps the murderous swing.",
            "A joyless, calculated pivot keeps {{defender}} barely out of reach.",
            "{{defender}} evades with a dead-eyed stare, wasting zero movement.",
            "{{defender}} sidesteps the blow with cold, calculated efficiency.",
            "{{defender}} steps away silently, eyes locked dead on the foe.",
            "{{defender}} silently slips the attack, their expression cold.",
            "{{defender}} avoids the strike silently, a ghost of the arena.",
            "A silent, phantom-like retreat keeps {{defender}} untouched.",
            "{{defender}} steps aside in grim silence, their cold stare never leaving {{attacker}}.",
            "A joyless, mechanical evasion from {{defender}} nullifies the attack.",
            "{{defender}} avoids the blow with a chillingly calculated, emotionless shift.",
            "{{defender}} ducks under the blow with cold efficiency, eyes locked on the next target.",
            "A sharp, mechanical pivot saves {{defender}} from the deadly strike.",
            "A minimalist, chillingly precise shift from {{defender}} avoids the fatal strike.",
            "{{defender}} steps aside silently, their cold eyes never leaving {{attacker}}.",
            "{{defender}} ghosts past the attack with joyless, mechanical efficiency.",
            "With dead-eyed focus, {{defender}} weaves under the blow, wasting zero movement.",
            "{{defender}} shifts exactly an inch to the left, silent and unnerving, letting the blow pass.",
            "Without a word or a flinch, {{defender}} weaves through the attack with cold, machinelike efficiency.",
            "{{defender}} shifts a mere inch, stone-faced as the blade misses.",
            "Without blinking, {{defender}} leans out of the lethal arc.",
            "Coldly calculated, {{defender}} sidesteps the heavy blow.",
            "{{defender}} ignores the near miss entirely, eyes fixed on the attacker.",
            "{{defender}} barely moves, letting the lethal blow pass with a cold, dead stare.",
            "A stark, utilitarian shift of weight is all {{defender}} needs to evade death.",
            "{{defender}} sways aside with joyless precision, eyes fixed entirely on the kill.",
            "The attack misses by millimeters; {{defender}} does not even blink.",
            "With a chilling, mechanical efficiency, {{defender}} sidesteps the frantic assault.",
            "{{defender}} dodges with an empty expression, waiting patiently for the fatal opening.",
            "A ghost-like step backward leaves {{attacker}} swinging wildly at nothing.",
            "{{defender}} slips the strike silently, a cold specter of death in the hot sand.",
            "Without a word, {{defender}} steps coldly aside in a grim, efficient dodge.",
            "{{defender}} barely flinches, executing a tight, grim dodge to avoid the strike.",
            "A dead-eyed stare accompanies {{defender}}'s brutal, grim dodge.",
            "{{defender}} ignores the danger entirely, performing a stoic, grim dodge.",
            "{{defender}} sidesteps the blow with a dead-eyed stare, completely unbothered by the violence.",
            "A joyless, calculated shift of weight allows {{defender}} to evade without an ounce of wasted effort.",
            "{{defender}} steps out of the arc in chilling silence, already planning their fatal reply.",
            "With a grim finality, {{defender}} lets the attack pass harmlessly by, their face a mask of stone.",
            "There is no relief, only cold calculation as {{defender}} cleanly evades the strike.",
            "{{defender}}'s chillingly precise movement leaves the attacker swinging at empty air.",
            "A stoic, emotionless dodge from {{defender}} showcases their terrifying discipline.",
            "{{defender}} slips the strike like a ghost, an omen of the violence yet to come."
          ]
        },
        parry: {
          success: [
            "{{defender}} meets the blow with a thunderous clash of steel, staring down {{attacker}} with grim resolve.",
            "{{defender}} desperately throws up their guard, the clash ringing out as they barely hold the line.",
            "A desperate clash of steel! {{name}} throws their weapon up just in time to stop the killing blow.",
            "A grand, sweeping parry from {{defender}} deflects the blow while drawing cheers from the stands.",
            "A heavy, grim parry from {{name}} stops the attack dead, sending shockwaves through the arena.",
            "Without a word, {{defender}} structurally dismantles the attack with a grim, iron-clad block.",
            "{{defender}} uses the flat of their blade to smoothly bat aside {{attacker}}'s clumsy thrust.",
            "A deafening crash of metal! {{defender}} perfectly redirects the kinetic force of the strike.",
            "Gritting their teeth, {{defender}} forces a shaky parry against {{attacker}}'s crushing blow.",
            "{{name}} catches the blow with a flamboyant flourish, turning the defense into a performance.",
            "{{defender}} catches the strike on the edge of his {{weapon}}, turning it aside with ease.",
            "{{name}} catches the strike with a desperate, two-handed block, shivering under the force.",
            "Sparks shower the fighters as {{defender}} executes a textbook parry, leaving no opening.",
            "Sparks fly as {{defender}} perfectly deflects the heavy blow at the last possible second.",
            "{{defender}} angles their defense perfectly, letting the {{weapon}} slide off harmlessly.",
            "With a confident sneer, {{defender}} swats {{attacker}}'s weapon aside like a nuisance.",
            "{{defender}} raises their guard, catching the strike with a resounding clang of steel.",
            "With the desperation of a cornered beast, {{defender}} furiously bats the weapon away.",
            "{{name}} frantically raises {{possessive}} guard just in time, wide-eyed with panic!",
            "A grim smile crosses {{defender}}'s face as they violently bat the {{weapon}} aside.",
            "Barely surviving the exchange, {{name}}'s desperate block leaves their arms shaking.",
            "With an expert twist of the wrist, {{defender}} parries the strike harmlessly away.",
            "A masterful block! {{defender}} turns aside the deadly attack with practiced ease.",
            "{{defender}} coldly turns the blade aside, their expression completely unreadable.",
            "{{defender}} effortlessly catches the strike on their guard, yawning dismissively.",
            "With a defiant shout, {{defender}} halts the incoming weapon dead in its tracks.",
            "{{name}} meets the attack head-on with a spectacular, theatrical clash of steel!",
            "{{name}} meets the blow grimly, their face an unreadable mask of determination.",
            "{{name}} throws up a desperate block, steel ringing harshly against the attack!",
            "{{defender}} stylishly deflects the strike, winking at the crowd as sparks fly.",
            "{{name}} meets the blow with brutal force, refusing to give an inch of ground.",
            "{{name}} masterfully redirects the momentum, sending the attacker stumbling.",
            "A grim, heavy block from {{name}} absorbs the blow with a bone-jarring thud.",
            "{{name}} parries with a theatrical flourish, inviting the crowd's applause!",
            "{{defender}} brings their guard up just in time to deflect the {{weapon}}.",
            "Sparks fly as {{defender}} cleanly deflects {{attacker}}'s powerful swing.",
            "A desperate block! {{defender}}'s weapon shudders under the immense force.",
            "A desperate parry from {{name}} barely keeps the weapon from biting flesh.",
            "{{name}} calmly bats the strike aside, a picture of absolute confidence.",
            "{{defender}} holds their ground, knocking the incoming {{weapon}} aside.",
            "{{attacker}}'s strike is met with an iron-clad block from {{defender}}.",
            "{{name}} desperately deflects the blow, pushed back by the sheer force!",
            "{{name}} easily deflects the strike, laughing mockingly at the effort.",
            "{{name}} barely turns the blow, teeth gritted in a desperate struggle.",
            "{{name}} parries with a loud clang, sneering confidently at their foe.",
            "The crowd cheers as {{defender}} demonstrates perfect defensive form.",
            "{{name}} turns the blow aside with an arrogant sneer, barely moving.",
            "{{defender}} meets the {{weapon}} with a resounding clash of steel!",
            "An arrogant flick of the wrist from {{name}} sends the attack wide.",
            "With cool detachment, {{name}} turns aside the strike effortlessly.",
            "A resounding CLANG echoes as {{defender}} parries the heavy blow.",
            "{{name}} desperately throws up a block, shaking from the impact.",
            "{{name}} barely manages to deflect the blow in a frantic block.",
            "{{name}} executes a flawless textbook parry, cold and precise.",
            "{{name}} intercepts the strike with a cold, calculated parry.",
            "{{name}} catches the strike with a jarring clash of steel!",
            "{{name}} slaps the attack away with a theatrical flourish!",
            "{{name}} deflects the blow with a panicked, frantic swing.",
            "{{name}} meets the blow with grim, unyielding resistance.",
            "With casual confidence, {{name}} swats the attack aside.",
            "{{name}} blocks lazily, almost bored by the attempt.",
            "{{defender}} gracefully deflects the strike, barely shifting their stance.",
            "{{defender}} meets the blow with a ringing block."
          ],
          desperate: [
            "{{defender}} frantically raises their guard at the last possible second, metal screeching as the blow is barely deflected.",
            "Trembling from the impact, {{defender}} barely manages to turn the blade aside in a desperate scramble.",
            "With a choked cry, {{defender}} intercepts the blow, their desperate parry sending shocks up their arm.",
            "A panicked, two-handed block! {{defender}} is pushed to the breaking point as they desperately parry.",
            "{{defender}} throws up a clumsy defense, relying on pure luck to catch the attack on their weapon.",
            "In sheer desperation, {{defender}} catches the blow, their entire body trembling with the impact.",
            "{{defender}} haphazardly intercepts the attack, sparks flying as they struggle to hold the line.",
            "{{defender}} catches the blow on the haft of their weapon at the absolute last possible second.",
            "{{defender}} blocks with everything they have, driven back a full pace by the shocking impact.",
            "{{defender}} barely gets their weapon up in time, a ragged, ugly parry that saves their life.",
            "{{defender}} slams their weapon blindly into the attack's path, surviving purely on instinct.",
            "With a frantic shriek, {{defender}} blocks the strike, the force nearly breaking their grip.",
            "{{defender}} barely gets their weapon up in time, deflecting the blow with a panicked grunt.",
            "{{defender}} throws up their weapon in a blind panic, somehow managing to deflect the blow!",
            "A panicked, flailing block by {{defender}} somehow connects, though they look badly shaken.",
            "With a desperate heave, {{defender}} manages to block, but staggers wildly from the impact.",
            "With a panicked yell, {{defender}} manages to throw a clumsy parry that just barely works.",
            "{{defender}} braces for impact, intercepting the strike in a frantic, uncoordinated move.",
            "The force of the parry sends {{defender}} stumbling back, barely surviving the onslaught.",
            "With wide eyes, {{defender}} thrusts their weapon up, narrowly deflecting a fatal hit.",
            "A desperate clash of steel as {{defender}} frantically turns aside the killing strike.",
            "With a panicked yell, {{defender}} intercepts the strike at the last possible second.",
            "Clashing steel rings out as {{defender}} desperately swats the incoming attack away.",
            "A desperate, rattling parry is all that stands between {{defender}} and the grave.",
            "Groaning from the effort, {{defender}} desperately deflects the crushing attack.",
            "With a terrified shout, {{defender}} just manages to block the devastating blow.",
            "Sparks fly as {{defender}} violently swats the attack away in pure desperation.",
            "A wild, uncoordinated block from {{defender}} somehow stops the lethal strike.",
            "Nearly dropping their weapon, {{defender}} frantically turns the blow aside.",
            "{{defender}} intercepts the blow, stumbling backward from the sheer force.",
            "{{defender}} barely intercepts the strike, arms shaking from the force.",
            "{{defender}} hastily brings up their guard, barely catching the strike.",
            "{{defender}}'s block is clumsy and frantic, but it saves their life.",
            "{{defender}}'s sloppy but forceful block narrowly averts disaster.",
            "A panicked clatter as {{defender}} barely manages to intercept.",
            "{{defender}} throws their weapon up in a wild, jarring block.",
            "{{defender}} meets the blow with a desperate, clashing block.",
            "{{defender}} throws up a hasty, rattling block just in time.",
            "Teeth gritted, {{defender}} barely halts the incoming steel.",
            "{{defender}} frantically throws up their guard to survive.",
            "A frantic, jarring parry barely keeps {{defender}} alive.",
            "{{defender}} throws their weapon up in a blind panic, hoping for the best.",
            "A clumsy, desperate block from {{defender}} barely halts the incoming steel.",
            "{{defender}} squeezes their eyes shut and blocks, the impact sending shudders down their arms.",
            "{{defender}} barely manages to bring their weapon up in time, arms shaking from the impact.",
            "A frantic, last-second block saves {{defender}} from a lethal blow.",
            "{{defender}} throws their weapon up in a blind panic, managing to deflect the worst of it.",
            "A desperate, flailing block from {{defender}} barely turns the lethal strike aside.",
            "{{defender}} throws up a panicked, two-handed block, shivering under the force.",
            "A frantic clash of steel! {{defender}} barely manages to turn the killing blow aside.",
            "Trembling, {{defender}} desperately swats the incoming attack away to survive.",
            "A clumsy, panic-stricken parry barely deflects the fatal swing.",
            "{{defender}} barely gets their {{defenseWeapon}} up in time, deflecting the blow with a panicked shout.",
            "Stumbling backward, {{defender}} haphazardly slaps the incoming strike aside with their {{defenseWeapon}}.",
            "{{defender}} throws their guard up in a panic, barely deflecting the strike.",
            "Shaking under the force, {{defender}} frantically blocks the blow.",
            "{{defender}} barely manages to push the attack aside, stumbling.",
            "A weak, flailing parry somehow saves {{defender}}'s life.",
            "{{defender}} raises their weapon in blind terror, miraculously catching the devastating blow.",
            "With a panicked scream, {{defender}} throws their guard up just in time to avoid death.",
            "{{defender}} brings their weapon up with a shuddering, desperate gasp to intercept the strike.",
            "Eyes squeezed shut, {{defender}} clumsily manages to deflect the blow through sheer luck.",
            "A frantic, sloppy block by {{defender}} barely stops the weapon from cleaving them in two.",
            "{{defender}}'s hands shake as they manage a weak but life-saving block against the assault.",
            "Panting heavily, {{defender}} throws up a hasty defense, stopping the strike by a hair's breadth.",
            "A messy, panic-stricken deflection by {{defender}} somehow halts the incoming slaughter.",
            "With both hands trembling on the hilt, {{defender}} manages a desperate parry.",
            "{{defender}} throws up their weapon in a blind, desperate parry against {{attacker}}.",
            "Clenching their teeth in fear, {{defender}} pulls off a frantic, desperate parry.",
            "A wild, uncoordinated swing from {{defender}} somehow results in a desperate parry.",
            "{{defender}} brings up their weapon in a blind panic, somehow catching the blow.",
            "A frantic, jarring block saves {{defender}}, jarring their bones to the core.",
            "{{defender}} shrieks and raises their guard just in time to stop the massacre.",
            "Eyes squeezed shut in terror, {{defender}} blindly intercepts the attack.",
            "{{defender}} throws up a hasty, uncoordinated defense, barely deflecting the strike.",
            "A desperate clash of steel rings out as {{defender}} fights for their life.",
            "{{defender}} stumbles backward, frantically batting the incoming attack away.",
            "With a panicked gasp, {{defender}} manages to catch the blow on their guard.",
            "{{defender}} desperately throws their weapon in the way, halting the momentum.",
            "A frantic parry leaves {{defender}} trembling from the sheer force."
          ],
          confident: [
            "A clinical, textbook parry by {{defender}} completely neutralizes the offensive momentum.",
            "With calm authority, {{defender}} intercepts the blade, redirecting its force flawlessly.",
            "{{defender}} stops the attack dead in its tracks, a masterclass in defensive positioning.",
            "The blow is swatted away effortlessly by {{defender}}, who barely seems to break a sweat.",
            "{{defender}} predicts the angle perfectly, parrying with casual, devastating precision.",
            "{{defender}} effortlessly catches the blow, staring down {{attacker}} the entire time.",
            "{{defender}} catches the blow with practiced ease, an unbothered smirk on their face.",
            "With a flick of the wrist, {{defender}} effortlessly turns the heavy strike aside.",
            "{{defender}} bats the strike away lazily, completely in control of the engagement.",
            "{{defender}} meets the attack head-on, their guard absolute and unshakable.",
            "A solid, authoritative block from {{defender}} leaves {{attacker}} reeling.",
            "A crisp, effortless parry from {{defender}} totally neutralizes the threat.",
            "{{defender}} smiles coldly, batting the attack away with practiced ease.",
            "{{defender}} lazily swats the blade aside, looking almost bored.",
            "{{defender}} easily swats the attack aside like an annoying insect.",
            "{{defender}} meets the steel effortlessly, a condescending smirk on their face.",
            "{{defender}} meets the blow firmly, not giving an inch of ground.",
            "{{defender}} catches the strike perfectly, completely unfazed.",
            "With mechanical precision, {{defender}} dismisses the assault.",
            "{{defender}} swats the incoming attack aside effortlessly, never even breaking eye contact.",
            "A relaxed, perfectly timed block from {{defender}} completely nullifies the attack.",
            "{{defender}} turns the strike away with a condescending chuckle and a simple parry.",
            "{{defender}} meets the blow with contemptuous ease, barely shifting their stance.",
            "With almost insulting laziness, {{defender}} blocks the furious attack.",
            "{{defender}} yawns and lazily deflects the weapon, completely unthreatened.",
            "A crisp, perfect parry from {{defender}} stops the attack dead without a hint of struggle.",
            "{{defender}} simply holds their weapon out, letting the attacker exhaust themselves against an unbreakable guard.",
            "With a sneer, {{defender}} perfectly redirects {{attacker}}'s strike.",
            "{{defender}} catches the blow on their guard without giving an inch.",
            "A casual flick of the wrist from {{defender}} nullifies the attack entirely.",
            "{{defender}} meets the strike with a perfectly timed parry, their stance unshaken and eyes locked on their foe.",
            "A contemptuous flick of the wrist is all it takes for {{defender}} to deflect the incoming attack.",
            "{{defender}} catches the blow on the strong part of their blade, completely halting the attacker's momentum.",
            "With absolute certainty, {{defender}} slaps the attack aside, clearly unimpressed by the effort.",
            "{{defender}} parries with such effortless grace it looks as though they're merely practicing forms.",
            "{{defender}} casually deflects the blow like swatting a fly.",
            "{{defender}} swats the attack aside with almost casual contempt.",
            "The strike is swatted aside with almost insulting ease.",
            "A casual flick of the wrist deflects the blow, followed by a smug grin.",
            "They parry the attack effortlessly, barely breaking their gaze.",
            "{{defender}} swats the incoming strike aside with insulting ease.",
            "{{defender}} meets the blow with perfect technique and a confident sneer.",
            "Without flinching, {{defender}} turns the attack aside perfectly.",
            "{{defender}} meets the strike with a lazy, perfectly angled parry.",
            "A masterful flick of the wrist from {{defender}} casually swats the attack aside.",
            "{{defender}} intercepts the blow effortlessly, barely needing to brace themselves.",
            "{{defender}} swats the strike aside with absolute disdain.",
            "A casual, effortless parry from {{defender}} entirely nullifies the attack.",
            "{{defender}} meets the attack with a perfectly timed, immovable block.",
            "With calm precision, {{defender}} parries the blow as if swatting away a fly.",
            "{{defender}} effortlessly swats the blow aside, scoffing at the weak attempt.",
            "With a flick of the wrist, {{defender}} confidently deflects the incoming attack.",
            "{{defender}} meets the strike with a lazy parry, entirely unimpressed.",
            "A haughty smirk accompanies {{defender}}'s effortless block.",
            "With casual grace, {{defender}} casually swats the attack aside using their {{defenseWeapon}}.",
            "{{defender}} stops the blow dead with their {{defenseWeapon}}, looking almost bored by the attempt.",
            "{{defender}} effortlessly swats the strike away like a nuisance.",
            "With a sneer, {{defender}} executes a flawless, heavy block.",
            "{{defender}} casually bats the attacker's weapon aside.",
            "A perfectly timed, casual parry leaves {{defender}} entirely unphased.",
            "{{defender}} lazily intercepts the blow, a look of utter boredom etched on their face.",
            "With an arrogant smirk, {{defender}} stops the strike cold using only one hand.",
            "{{defender}} casually swats the heavy blow aside as if brushing off a bothersome insect.",
            "A flawless, effortless block from {{defender}}, accompanied by a short, mocking laugh.",
            "{{defender}} meets the steel with insulting ease, proving their absolute martial superiority.",
            "Without breaking eye contact, {{defender}} flawlessly parries the telegraphed assault.",
            "{{defender}} blocks the blow with a contemptuous sneer, unimpressed by the meager force.",
            "A smooth, practiced deflection from {{defender}} makes the attacker look like a clumsy amateur.",
            "Without breaking eye contact, {{defender}} delivers a crisp, confident parry.",
            "{{defender}} swats away the attack with a disdainful, confident parry.",
            "A flick of the wrist is all it takes for {{defender}}'s confident parry against {{attacker}}.",
            "{{defender}} executes a flawless, confident parry, completely unbothered by the assault.",
            "{{defender}} meets the strike with an arrogant smirk, deflecting it effortlessly.",
            "With a casual flick of the wrist, {{defender}} turns aside the heavy blow.",
            "{{defender}} blocks the attack without even looking, their confidence absolute.",
            "A solid, unflinching parry from {{defender}} stops the attack dead.",
            "{{defender}} catches the blow with perfect timing, utterly unbothered.",
            "With contemptuous ease, {{defender}} swats the attack away.",
            "{{defender}} deflects the strike lazily, clearly unimpressed by the effort.",
            "A smooth, confident block sends {{attacker}}'s weapon sliding harmlessly aside.",
            "{{defender}} stands their ground, casually turning the lethal strike away.",
            "With absolute certainty, {{defender}} catches the blow exactly where they planned."
          ],
          theatrical: [
            "{{defender}} catches the strike with a dramatic flourish, spinning their weapon in defiance!",
            "With a grand, sweeping motion, {{defender}} parries the blow and plays to the roaring crowd.",
            "The clash of weapons is loud and dramatic as {{defender}} executes a picture-perfect block.",
            "{{defender}} deflects the strike with a dazzling, windmill-like motion that wows the crowd.",
            "{{defender}} intercepts the attack with an operatic stance, fully embracing the spectacle.",
            "With an elegant twirl of steel, {{defender}} turns the blow aside in breathtaking fashion.",
            "With a grandiose sweep of their weapon, {{defender}} turns the parry into a performance.",
            "{{defender}} parries and strikes a heroic pose, soaking up the adoration of the stands.",
            "{{defender}} blocks with a flamboyant arc, creating a spectacular shower of sparks.",
            "A majestic, ringing parry by {{defender}} echoes through the arena like a bell.",
            "{{defender}} parries with a dramatic flourish, holding the pose for the crowd.",
            "{{defender}} catches the blade, bows mockingly, and pushes {{attacker}} away.",
            "A spinning, extravagant block from {{defender}} draws cheers from the stands.",
            "A stunning, theatrical parry from {{defender}} turns defense into high art.",
            "Sparks rain down in a spectacular display as {{defender}} stylishly blocks.",
            "{{defender}} deflects the strike and spins their weapon in a flashy display.",
            "With a theatrical spin, {{defender}} sweeps the attack aside to the crowd's delight.",
            "A ringing parry from {{defender}} sends sparks dancing through the air.",
            "{{defender}} catches the strike, turning the block into a beautiful sweeping motion.",
            "With dramatic flair, {{defender}} knocks the attack aside.",
            "With a magnificent flourishing spin, {{defender}} deflects the blow beautifully.",
            "A dramatic cross-body parry from {{defender}} sends sparks flying to the crowd's amazement.",
            "{{defender}} meets the blow with a grand, sweeping gesture that looks choreographed for the stage.",
            "With a spectacular backhand block, {{defender}} stops the attack dead in its tracks.",
            "{{defender}} tosses their weapon up, catching it just in time to execute a breathtaking parry.",
            "A flamboyant windmill block from {{defender}} turns aside the strike with incredible style.",
            "{{defender}} strikes a heroic pose as they dramatically turn away the lethal blow.",
            "With a sweeping bow, {{defender}} deflects the attack in one fluid, magnificent motion.",
            "Sparks shower the arena as {{defender}} executes a spinning, high-arcing parry for the crowd's amusement!",
            "{{defender}} parries the strike with an exaggerated sweep, striking a heroic pose immediately after.",
            "With a dramatic flourish of steel, {{defender}} easily turns aside the attack, winking at the front row.",
            "A blinding clash of weapons! {{defender}} makes a spectacle of the parry, drawing cheers from the stands.",
            "{{defender}} catches the blow and holds the lock for a second, milking the dramatic tension for all it's worth.",
            "With a flourish, {{defender}} catches the strike and strikes a pose.",
            "{{defender}} twirls their weapon, parrying with a flourish.",
            "{{defender}} catches the strike in a dazzling display of skill.",
            "{{defender}} catches the blow on their guard and spins, turning the parry into a show.",
            "{{defender}} deflects the blow with a flourishing spin of their blade.",
            "A dramatic, sparking parry from {{defender}} draws gasps from the crowd.",
            "{{defender}} catches the strike with a wide, theatrical block, posing for the stands.",
            "With a ringing clash, {{defender}} turns the attack into a performance.",
            "{{defender}} parries with a resounding flourish, holding the pose for the cheering crowd.",
            "With a spectacular, sweeping block, {{defender}} turns defense into art.",
            "{{defender}} catches the strike perfectly, letting the sparks fly high for maximum drama.",
            "{{defender}} catches the blade and offers a sweeping bow to the roaring crowd.",
            "With a sparkling clash, {{defender}} turns the parry into a dramatic pose.",
            "{{defender}} catches the strike with a sweeping, dramatic flourish of steel.",
            "With a spectacular spin, {{defender}} parries the blow to the crowd's roar.",
            "A theatrical clash of weapons as {{defender}} plays to the adoring masses.",
            "{{defender}} gracefully sweeps the attack aside, bowing to their opponent.",
            "{{defender}} spins their {{defenseWeapon}} in a flashy blur, knocking the strike away to the crowd's delight.",
            "With a dramatic flourish, {{defender}} intercepts the attack, holding the parry for the audience to see.",
            "{{defender}} blocks with a dramatic flourish, sparking steel for the crowd.",
            "Spinning their weapon, {{defender}} weaves a gorgeous, sweeping parry.",
            "{{defender}} deflects the blow into a grand, sweeping arc.",
            "With needless extravagance, {{defender}} stops the attack cold.",
            "{{defender}} catches the strike with a sweeping spin, sending a brilliant shower of sparks into the air.",
            "With a grand, sweeping motion, {{defender}} parries the blow and strikes a heroic pose for the roaring crowd.",
            "The clash of weapons is deafening as {{defender}} executes a picture-perfect, dramatic block.",
            "{{defender}} deflects the strike with a dazzling, windmill-like motion that wows the front rows.",
            "{{defender}} intercepts the attack with an operatic stance, fully embracing the bloody spectacle.",
            "With an elegant twirl of steel, {{defender}} turns the heavy blow aside in breathtaking fashion.",
            "With a grandiose sweep of their weapon, {{defender}} turns a desperate parry into a stunning performance.",
            "{{defender}} blocks with a flamboyant arc, drawing a loud cheer from the bloodthirsty spectators.",
            "Flourishing their weapon, {{defender}} catches the strike in a dazzling theatrical parry.",
            "{{defender}} turns the block into a dance, executing a spinning theatrical parry.",
            "With a loud shout for the crowd, {{defender}} performs a dramatic theatrical parry.",
            "{{defender}} strikes a heroic pose while managing a sweeping theatrical parry.",
            "{{defender}} catches the blow with a dramatic flourish, sparking steel to the crowd's delight.",
            "A spinning deflection from {{defender}} turns defense into a flashy spectacle.",
            "{{defender}} parries with an exaggerated sweep, bowing slightly to the cheering audience.",
            "With a cinematic clash, {{defender}} halts the attack, holding the pose for the fans.",
            "{{defender}} elegantly twirls their weapon, catching the strike in a dazzling display.",
            "A flamboyant block from {{defender}} draws gasps from the onlookers.",
            "{{defender}} deflects the blow with a theatrical spin, posing triumphantly.",
            "With a flourish, {{defender}} effortlessly turns aside the brutal strike.",
            "{{defender}} parries dramatically, making sure every eye in the arena sees it.",
            "A spectacular, ringing parry from {{defender}} sends sparks flying into the air."
          ],
          grim: [
            "{{defender}} blocks the blow with a bone-jarring thud, their expression locked in a death stare.",
            "{{defender}} parries the strike with a sickening crack, their cold eyes fixed on the kill.",
            "The parry is ugly but devastatingly effective, a grim reminder of {{defender}}'s resolve.",
            "A violent, merciless block by {{defender}}, intended to shatter the attacker's momentum.",
            "{{defender}} meets the steel with a stoic, unyielding block, completely devoid of mercy.",
            "{{defender}} catches the strike with brutal efficiency, no wasted movement, no emotion.",
            "With cold, lethal intent, {{defender}} intercepts the strike and readies their counter.",
            "With a chilling calmness, {{defender}} grinds their weapon against the incoming blow.",
            "{{defender}} violently swats the attack aside, their face a mask of quiet rage.",
            "A bone-jarring block stops the attack dead, as {{defender}} glares murderously.",
            "A heavy, joyless block from {{defender}}, a purely mechanical act of survival.",
            "The weapons clash with a dull clang; {{defender}} doesn't even blink.",
            "{{defender}} absorbs the impact with a stoic, unreadable expression.",
            "No flair, no panic\u2014just a heavy, joyless parry from {{defender}}.",
            "{{defender}} meets the strike with brutal, silent efficiency.",
            "{{defender}} blocks the blow with mechanical, bone-chilling efficiency.",
            "{{defender}} absorbs the impact wordlessly, eyes fixed on their prey.",
            "A joyless, utilitarian parry from {{defender}} does exactly what it must.",
            "{{defender}} meets the force brutally, their expression entirely blank.",
            "A brutal, shuddering clash as {{defender}} stonewalls the attack.",
            "A silent, brutal parry from {{defender}} grinds the incoming attack to a dead halt.",
            "{{defender}} blocks the blow with chilling precision, their face an absolute mask of stone.",
            "With zero wasted movement, {{defender}} ruthlessly turns the attack away.",
            "{{defender}} stops the weapon dead, the harsh clang echoing loudly in the tense silence.",
            "{{defender}}'s expression remains completely blank as they flawlessly intercept the brutal strike.",
            "A joyless, perfectly executed block from {{defender}} shatters the attacker's momentum.",
            "{{defender}} catches the blow with terrifying, emotionless strength.",
            "Without a single sound, {{defender}} brutally knocks the incoming attack aside.",
            "{{defender}} absorbs the blow against their weapon with a humorless grunt.",
            "A joyless, mechanical block stops {{attacker}}'s assault in its tracks.",
            "{{defender}} stops the attack with a heavy, unyielding defense, expression unchanging.",
            "{{defender}} rigidly deflects the attack with cold, mechanical efficiency, showing no emotion.",
            "A heavy, bone-jarring clash. {{defender}} stoically absorbs the impact with a joyless parry.",
            "{{defender}} blocks the strike with brutal efficiency, their expression as cold as the steel in their hand.",
            "Without a sound, {{defender}} meets force with immovable force, their parry an impenetrable wall of sorrow.",
            "{{defender}} turns the blade aside with a solemn, practiced motion, saving all emotion for the counter.",
            "The clash rings hollow as {{defender}} grimly intercepts the attack, staring through their opponent.",
            "{{defender}} savagely knocks the weapon away, eyes burning with malice.",
            "{{defender}} catches the blow with a heavy, grim interception.",
            "{{defender}} meets the blow head-on, stopping it dead with a bone-jarring parry.",
            "A brutal, immovable block from {{defender}} shuts down the assault completely.",
            "{{defender}} blocks the blow with brutal, bone-jarring pragmatism.",
            "With a joyless clash of iron, {{defender}} simply survives.",
            "{{defender}} parries the blow with a bone-jarring, humorless impact.",
            "A blunt, savage block from {{defender}} stops the attack dead without an ounce of flair.",
            "{{defender}} meets the strike with cold, immovable force, their expression totally blank.",
            "{{defender}} absorbs the heavy blow without a word, eyes locked on their foe.",
            "A joyless, mechanical block stops the attack cold.",
            "{{defender}} meets the blow with a heavy, stoic block, their expression unreadable.",
            "A joyless, perfectly angled parry from {{defender}} deadens the attack instantly.",
            "Silently, {{defender}} absorbs the impact, eyes locked coldly on their foe.",
            "With grim finality, {{defender}} halts the weapon's momentum entirely.",
            "{{defender}} meets the blow with their {{defenseWeapon}} in absolute, chilling silence.",
            "A heavy, humorless clash as {{defender}} solidly blocks the strike, their eyes dead and fixed on {{attacker}}.",
            "{{defender}} brings their guard up with mechanical, chilling precision.",
            "A violent, heavy block from {{defender}} rattles the attacker's bones.",
            "{{defender}} stops the strike completely, staring dead-eyed through the clash.",
            "Without a word, {{defender}} violently smashes the incoming attack aside.",
            "{{defender}} meets the steel with a stoic, unyielding block, completely devoid of mercy or hesitation.",
            "{{defender}} catches the strike with brutal efficiency, no wasted movement, no emotion showing.",
            "With cold, lethal intent, {{defender}} intercepts the strike and immediately readies their lethal counter.",
            "With a chilling calmness, {{defender}} grinds their weapon against the incoming blow, eyes dead.",
            "{{defender}} violently swats the attack aside, their face a terrifying mask of quiet rage.",
            "A bone-jarring block stops the attack dead, as {{defender}} glares murderously through the crossing blades.",
            "A heavy, joyless block from {{defender}}, a purely mechanical act of brutal survival.",
            "The weapons clash with a dull, heavy clang; {{defender}} doesn't even bother to blink.",
            "With bone-jarring force, {{defender}} delivers a heavy, grim parry against {{attacker}}.",
            "{{defender}} simply absorbs the impact with a silent, grim parry.",
            "A cold, mechanical motion defines {{defender}}'s perfectly executed grim parry.",
            "{{defender}} coldly halts the attack with a brutal, grim parry.",
            "{{defender}} blocks the strike with a heavy, emotionless clash of steel.",
            "A cold, calculated parry from {{defender}} halts the violence instantly.",
            "{{defender}} intercepts the blow with grim efficiency, their face a stony mask.",
            "Without a sound, {{defender}} perfectly stops the deadly attack.",
            "{{defender}} meets the force with a joyless, mechanical block.",
            "A brutal, silent parry from {{defender}} deadens the impact completely.",
            "{{defender}} rigidly deflects the strike, their dead eyes locked on the foe.",
            "With chilling calm, {{defender}} turns aside the murderous swing.",
            "{{defender}} blocks the attack with the grim resolve of an executioner.",
            "A stark, unfeeling parry from {{defender}} completely nullifies the threat."
          ]
        },
        shield: {
          success: [
            "With a powerful forward shove, {{defender}} uses their shield to violently rebuff the incoming attack.",
            "{{defender}} hides behind their bulwark, letting the fierce blow ring harmlessly off the heavy wood.",
            "{{defender}} raises their shield at the last second, taking the brunt of the heavy impact.",
            "The strike clangs loudly against {{defender}}'s shield, leaving a fresh dent but no blood.",
            "The shield takes a terrible gouge, but {{defender}} remains entirely unhurt behind it.",
            "Wood splinters and metal groans as {{defender}}'s shield absorbs the ferocious blow.",
            "{{defender}} braces themselves, using their shield to expertly deflect the attack.",
            "{{defender}} deflects the attack efficiently with {{possessive}} shield.",
            "{{defender}} raises their shield, catching the blow perfectly.",
            "The strike thuds uselessly into {{defender}}'s heavy shield.",
            "{{defender}} absorbs the impact with a sturdy shield block.",
            "{{defender}} interposes {{possessive}} shield flawlessly.",
            "{{defender}} interposes {{possessive}} shield at the final moment, absorbing the impact with a heavy thud.",
            "The strike meets only the sturdy face of {{defender}}'s shield.",
            "A deafening clang echoes as {{defender}}'s shield stops the assault cold.",
            "{{defender}} braces behind their shield, weathering the attack like a fortress.",
            "{{defender}} angles their shield perfectly, casting the vicious blow aside into the dirt.",
            "A sickening scrape of metal on wood sings out as {{defender}}'s shield eats the deadly strike.",
            "{{defender}} stands firm, letting the sturdy shield bear the terrible weight of the blow.",
            "With a guttural roar, {{defender}} shoves their shield forward, breaking the attack's momentum.",
            "Sparks fly as the attack grinds violently across the reinforced rim of {{defender}}'s shield."
          ]
        },
        parry_break: [
          "{{defender}} tries to block, but the strike is too heavy, breaking their posture.",
          "A devastating impact overrides {{defender}}'s parry, leaving them wide open.",
          "{{defender}}'s weapon is nearly knocked from their hands as the parry fails.",
          "{{attacker}} smashes straight through {{defender}}'s attempted parry.",
          "{{attacker}} forces {{possessive}} weapon through the weak block.",
          "{{attacker}} overwhelms {{defender}}'s parry with brute strength.",
          "The force of the blow shatters {{defender}}'s guard completely.",
          "{{attacker}} batters aside {{defender}}'s defensive guard.",
          "{{attacker}} smashes through the parry with {{weapon}}!",
          "{{attacker}} crushes {{defender}}'s guard completely.",
          "{{attacker}} twists {{weapon}} around the parry!",
          "{{defender}}'s guard crumbles under the assault!",
          "The parry shatters under the force of the blow!",
          "The parry breaks!",
          "{{defender}}'s parry is entirely overwhelmed, the force shattering their defensive stance."
        ],
        riposte: {
          success: [
            "{{name}} catches the weapon, holds it for a terrifying second, and strikes back without mercy!",
            "{{name}} spins the parry into a dazzling, theatrical counter that draws roars from the crowd!",
            "Fueled by raw terror, {{name}} throws a desperate riposte to buy a second of breathing room.",
            "A wild, desperate counterattack! {{name}} blindly strikes back the moment the blades clash.",
            "{{defender}} laughs maniacally as they bat the weapon aside and launch a vicious counter!",
            "{{name}} playfully bats the strike away before thrusting quickly, aiming to humiliate.",
            "{{name}} grimly absorbs the impact and coldly returns the favor with a brutal counter.",
            "With alarming calmness, {{defender}} redirects the attack and instantly strikes back.",
            "{{name}} grimly blocks the weapon and pushes forward, driving a brutal counter deep.",
            "{{name}} gracefully redirects the strike, flowing seamlessly into a lethal counter!",
            "A brutal, efficient riposte from {{name}} punishes the attacker with grim finality.",
            "{{defender}} brutally turns the deflection into a lethal, plunging counter-thrust.",
            "With casual disdain, {{name}} turns the attack into a flawless, confident riposte.",
            "{{name}} slips inside the guard during the dodge, delivering a punishing counter!",
            "{{name}} deflects the blow and answers with a desperate, wild swing of their own!",
            "{{name}} absorbs the blow on the armor and retaliates with a brutal shield bash!",
            "{{name}} binds the attacker's weapon, punishing the opening with a swift strike!",
            "A smooth, practiced counterstrike from {{name}} catches the opponent off guard.",
            "{{name}} confidently parries, spinning gracefully into a lethal counterattack.",
            "With a dramatic spin, {{name}} parries and strikes back, playing to the crowd!",
            "{{name}} parries sharply and immediately snaps back a vicious counter-thrust!",
            "Turning defense into offense, {{name}} strikes back with terrifying speed!",
            "A smug grin flashes on {{name}}'s face as they fluidly riposte the attack.",
            "The clang of the parry is followed by the hiss of {{defender}}'s counter.",
            "A desperate block turns into a wild, flailing counterattack by {{name}}!",
            "{{name}} catches the blade and counters with a swift, desperate lunge.",
            "{{name}} turns the opening into a theatrical, sweeping counterstrike.",
            "{{name}} scrambles to block, then lashes out blindly in retaliation!",
            "A perfectly timed parry opens {{attacker}} up for a wicked counter.",
            "{{name}} twirls past the attack and ripostes with theatrical flair!",
            "{{name}} parries heavily and delivers a grim, silent counterstrike.",
            "{{name}} confidently deflects and thrusts back in one fluid motion.",
            "{{name}} bats the attack away and instantly lunges for the throat!",
            "{{name}} ducks under the swing and answers with a rising uppercut!",
            "{{name}} brutally forces an opening and counters with grim intent.",
            "A dazzling counterattack follows {{defender}}'s effortless parry.",
            "{{name}} deflects and blindly lashes back in a desperate counter!",
            "{{name}} sidesteps and chops down hard on the overextended limb!",
            "Deflecting the blow, {{defender}} lunges immediately in return.",
            "{{name}} turns the deflected momentum into a spinning riposte!",
            "{{defender}} sneers and thrusts immediately after parrying.",
            "With desperate speed, {{defender}} snaps a counter-strike.",
            "{{defender}} turns the block into a vicious counter-slash!",
            "The block is just a setup for {{defender}}'s true attack.",
            "{{defender}} uses the momentum to strike back instantly.",
            "{{defender}} grimly strikes back through the opening.",
            "{{defender}} flawlessly deflects and launches a lightning-fast counter!",
            "{{defender}} sweeps the attack aside and seamlessly strikes back!"
          ],
          desperate: [
            "Stumbling backward, {{defender}} wildly flails their weapon to deflect the blow and barely manages a clumsy counter.",
            "{{defender}} barely knocks the weapon aside before recklessly throwing their entire body into a return blow.",
            "Off-balance and panicked, {{defender}} blindly thrusts forward after a clumsy parry, hoping for a lucky hit.",
            "{{defender}} wildly lashes out in a desperate counter-attack, nearly dropping their weapon in the process.",
            "A frantic scramble! {{defender}} desperately jabs back, trying to buy themselves a second to breathe.",
            "Gasping heavily, {{defender}} manages a sloppy but vicious return strike after deflecting the blow.",
            "Surviving by a hair, {{defender}} throws a frantic riposte, more out of fear than tactical acumen.",
            "{{defender}} barely survives the parry, immediately slashing back in sheer survival instinct.",
            "A sloppy deflection is followed instantly by a panicked, screaming counter from {{defender}}.",
            "Gasping for breath, {{defender}} blocks and immediately answers with a ragged, ugly riposte.",
            "{{defender}} deflects the blow by the skin of their teeth and launches a panicked riposte.",
            "Breathing heavily, {{defender}} parries and immediately strikes out with trembling hands.",
            "In a moment of blind terror, {{defender}} blocks and instantly retaliates without aiming.",
            "Off-balance and desperate, {{defender}} throws a frantic counterattack after the block.",
            "Wild with panic, {{defender}} bats the strike away and wildly flails a counter-attack!",
            "{{defender}} catches the attack awkwardly, throwing their body into a chaotic counter.",
            "With wide, panicked eyes, {{defender}} deflects and wildly hacks back at {{attacker}}.",
            "{{defender}} intercepts the blow and throws a frantic, uncoordinated slash in return.",
            "{{defender}} barely survives the block, then blindly jabs back in pure desperation.",
            "With a panicked shove, {{defender}} clears the weapon and stabs wildly in response.",
            "After a frantic parry, {{defender}} scrambles a sloppy but frantic counterstrike.",
            "A desperate clash of steel is followed by {{defender}} frantically swinging back.",
            "{{defender}} bats the strike away in panic and lunges blindly for a wild counter.",
            "{{defender}} violently shoves the weapon away and thrusts blindly in retaliation!",
            "{{defender}} staggers but desperately throws a counter-strike into the opening!",
            "A desperate, scrambling counterstrike is launched in mere survival instinct.",
            "Almost by accident, {{defender}}'s panicked block turns into a wild lunge.",
            "A sloppy block gives way to a desperate, wild riposte from {{defender}}.",
            "{{defender}} manages a block and lashes out wildly in survival instinct!",
            "{{defender}} swats the blade aside and thrusts back in a frenzied panic.",
            "{{defender}} flails wildly after the parry, managing a frantic riposte.",
            "{{defender}} lashes out blindly immediately following the deflection.",
            "A frantic, stumbling riposte is launched by a terrified {{defender}}.",
            "After a wild block, {{defender}} lunges back with a frantic counter.",
            "{{defender}} forces the attack away and hacks back desperately.",
            "Stumbling, {{defender}} throws a desperate retaliatory strike.",
            "With wide eyes, {{defender}} chops back in a panicked riposte.",
            "{{defender}} lashes out in sheer terror, hoping to land a hit.",
            "{{defender}} turns a frantic parry into a wild counterattack!",
            "Stumbling, they blindly lash out in a frantic counter-attack.",
            "Panic fuels a wild, flailing counterattack from {{defender}}.",
            "{{defender}} strikes back blindly, desperate to create space.",
            "A stumbling, frantic counterattack erupts from {{defender}}.",
            "Off-balance, {{defender}} hurls a wild counter-swing.",
            "{{defender}} blindly lashes out after blocking!",
            "Operating purely on adrenaline, {{defender}} blocks and thrashes blindly in return.",
            "{{defender}} barely deflects the blow before launching a frantic, uncoordinated counterattack.",
            "Panic fuels {{defender}}'s sloppy block and immediate wild swing back.",
            "Panic fuels {{defender}}'s wild counterattack after barely surviving the blow.",
            "With a desperate scream, {{defender}} lunges back immediately.",
            "Flailing wildly after a block, {{defender}} manages a sloppy, frantic counterattack.",
            "Panic driving their blade, {{defender}} deflects and throws out a desperate, uncoordinated riposte.",
            "Stumbling backward, {{defender}} lands a wild, desperate riposte on {{attacker}}.",
            "In sheer panic, {{defender}} lashes out with a frantic, desperate riposte.",
            "{{defender}} closes their eyes and swings, connecting with a desperate riposte.",
            "A total fluke allows {{defender}} to land a clumsy, desperate riposte.",
            "In a blind panic, {{defender}} deflects and blindly lashes out in return.",
            "{{defender}} frantically shoves the attack aside and throws a wild, desperate counter.",
            "Trembling, {{defender}} barely blocks and immediately strikes back in sheer terror.",
            "A panicked block leads to a frantic, uncoordinated thrust from {{defender}}.",
            "{{defender}} screams in fear, deflecting the blow and swinging wildly.",
            "Driven by pure adrenaline, {{defender}} turns a desperate block into a sudden attack.",
            "{{defender}} stumbles, desperately catching the blow and flailing in return.",
            "A terrified parry transitions into a sudden, panicked riposte from {{defender}}.",
            "{{defender}} frantically redirects the force and lunges forward, hoping for the best.",
            "With a frantic gasp, {{defender}} turns the attack and strikes back blindly."
          ],
          confident: [
            "With absolute control, {{defender}} parries the strike and slides their blade back in a lethal counter.",
            "With effortless timing, {{defender}} parries and delivers a punishing riposte in the blink of an eye.",
            "{{defender}} turns the attack with ease, stepping inside for a clinical, devastating riposte.",
            "{{defender}} anticipates the strike, blocking and countering in one beautiful, fluid motion.",
            "{{defender}} meets the attack calmly, redirecting it and striking back with total authority.",
            "A smooth, practiced block by {{defender}} opens the door for a perfect, confident riposte.",
            "{{defender}} casually bats the blow aside and delivers a lightning-fast, precise riposte.",
            "With arrogant perfection, {{defender}} intercepts the blow and thrusts back effortlessly.",
            "A textbook parry flows seamlessly into a masterful counter-attack from {{defender}}.",
            "{{defender}} deflects the strike lazily before snapping out a razor-sharp counter.",
            "A smirk touches {{defender}}'s lips as they casually counter the failed attack.",
            "With insulting ease, {{defender}} turns the parry into a punishing thrust.",
            "{{defender}} punishes the mistake with a confident, immediate riposte.",
            "{{defender}} easily deflects and snaps back a razor-sharp riposte.",
            "{{defender}} dismisses the attack and calmly slots a counter through the guard.",
            "{{defender}} parries smoothly and immediately punishes the opening.",
            "A flawless deflection turns into a lightning-fast counter from {{defender}}.",
            "{{defender}} redirects the force perfectly, striking back in the same motion.",
            "With contemptuous ease, {{defender}} parries and counters.",
            "A smooth parry from {{defender}} transitions instantly into a practiced, punishing return stroke.",
            "{{defender}} effortlessly turns the block into a devastating, fluid counterattack.",
            "With absolute superiority, {{defender}} knocks the attack aside and delivers a masterclass riposte.",
            "{{defender}} snidely deflects the blow and immediately answers with a superior strike.",
            "A perfect parry opens the guard, and {{defender}} casually exploits it with a flawless counter.",
            "{{defender}} bats the weapon away with a smirk and immediately punishes the attacker's mistake.",
            "With contemptuous ease, {{defender}} blocks and slides a perfect counterstrike through the opening.",
            "{{defender}} casually deflects the assault and answers with a blindingly fast riposte.",
            "A lazy parry becomes a lethal counterattack before the attacker even realizes they missed.",
            "Having casually turned the attack aside, {{defender}} delivers a punishing, textbook riposte.",
            "With a knowing smirk, {{defender}} slips the attack and flawlessly executes a devastating counter-strike.",
            "{{defender}} turns the opponent's momentum against them, delivering a confident, lightning-fast riposte.",
            "A masterclass in fencing! {{defender}} parries smoothly and counters before the attacker even realizes their mistake.",
            "{{defender}} effortlessly parries and strikes back with calculated precision.",
            "{{defender}} smirks as they expertly redirect and retaliate.",
            "A perfect deflection! {{defender}} immediately steps in to punish the mistake.",
            "{{defender}} casually parries and snaps a lightning-fast counterstrike in return.",
            "{{defender}} retaliates immediately with a precise, clinical counterstrike.",
            "A smooth, practiced riposte flows effortlessly from {{defender}}.",
            "{{defender}} turns the defense into a perfect, confident counter.",
            "With arrogant ease, {{defender}} launches a devastating return blow.",
            "{{defender}} casually deflects the strike and instantly punishes {{attacker}} for trying.",
            "A flawless parry flows seamlessly into an arrogant, lightning-fast counter from {{defender}}.",
            "{{defender}} laughs off the attack, batting it away and striking back in one fluid motion.",
            "A smirk crosses {{defender}}'s face as they fluidly turn defense into a deadly counter.",
            "{{defender}} effortlessly deflects the blow and strikes back with lethal precision.",
            "{{defender}} casually bats the attack aside and instantly flows into a beautiful, practiced counterstrike.",
            "Smiling softly, {{defender}} answers the block with a swift, arrogant riposte that borders on mockery.",
            "A smirk accompanies {{defender}}'s lightning-fast, confident riposte against {{attacker}}.",
            "{{defender}} turns the deflection into a punishing, confident riposte.",
            "With effortless grace, {{defender}} lands a devastatingly confident riposte.",
            "{{defender}} casually exploits the opening with a perfectly timed, confident riposte.",
            "{{defender}} casually deflects the strike, smoothly turning it into a precise counter-attack.",
            "With an arrogant smirk, {{defender}} blocks and immediately exploits the opening.",
            "{{defender}} effortlessly turns the attack against {{attacker}} with a masterful riposte.",
            "A perfectly timed block allows {{defender}} to casually slip in a counter-strike.",
            "{{defender}} practically invites the blow, parrying it to set up a flawless riposte.",
            "With contemptuous ease, {{defender}} deflects and strikes in a single fluid motion.",
            "{{defender}} calmly bats the weapon away and confidently lunges forward.",
            "A smooth, practiced motion sees {{defender}} block and immediately strike back.",
            "{{defender}} arrogantly catches the blow, sending a lethal counter in return.",
            "With unwavering certainty, {{defender}} turns the defense into a deadly offense."
          ],
          theatrical: [
            "A dramatic cross-body block flows seamlessly into a magnificent, spinning counterstrike from {{defender}}.",
            "A showstopping maneuver! {{defender}} weaves under the blade and delivers a dazzling, theatrical riposte.",
            "{{defender}} catches the blow, twirls, and delivers a beautiful counterattack that sends the crowd wild.",
            "With a dramatic shout, {{defender}} deflects the attack and launches a flamboyant, high-flying counter!",
            "With a grand twirl of steel, {{defender}} blocks and spins into a magnificent, crowd-pleasing counter!",
            "A theatrical clash of weapons as {{defender}} deflects the blow and strikes a heroic pose mid-counter.",
            "With a bow and a blade, {{defender}} deflects the attack and executes a masterful, theatrical counter.",
            "{{defender}} catches the weapon, strikes a quick pose, and unleashes a blindingly fast counter-attack!",
            "Sparks fly as {{defender}} executes a magnificent parry-riposte that leaves the audience breathless.",
            "With an operatic pivot, {{defender}} intercepts the attack and dances into a stunning counterstrike.",
            "A flourishing deflection is instantly followed by a magnificent, leaping counter from {{defender}}.",
            "{{defender}} deflects the blow and pirouettes directly into a devastating, crowd-pleasing counter.",
            "{{defender}} plays to the crowd, turning a spectacular block into a flamboyant, sweeping riposte.",
            "A breathtaking sequence of steel as {{defender}} parries with style and counters with pure flair.",
            "The crowd roars as {{defender}} turns defense into an operatic display of offensive acrobatics.",
            "{{defender}} executes a blindingly fast riposte from behind their back to thunderous applause.",
            "{{defender}} parries with a dramatic flourish before launching a dazzling, acrobatic riposte.",
            "With a laugh and a twirl, {{defender}} parries the strike and answers with incredible style.",
            "{{defender}} parries with a flourish, then spins into a spectacular, crowd-pleasing riposte!",
            "{{defender}} turns the parry into a dramatic dance, striking back with breathtaking flair.",
            "Catching the attack, {{defender}} twirls their weapon and delivers a dazzling counterblow.",
            "{{defender}} turns the block into a dazzling display, countering with breathtaking speed.",
            "{{defender}} parries, spins, and delivers a flamboyant riposte to the roar of the crowd.",
            "{{defender}} deflects with a flourish and bows before driving their counterattack home.",
            "{{defender}} bats the strike away with a smirk, spinning into a gorgeous counterattack.",
            "{{defender}} blocks the blow and immediately retaliates with a flashy, spinning slash.",
            "With a dazzling flourish, {{defender}} turns defense into a spectacular counterattack.",
            "{{defender}} knocks the weapon aside and strikes back with a cinematic, sweeping blow.",
            "With a flourishing spin, {{defender}} deflects the blow and strikes back gorgeously!",
            "A dramatic twirl allows {{defender}} to evade and punish {{attacker}} in one motion!",
            "{{defender}} bows mockingly as they slip the attack, delivering a stinging counter!",
            "{{defender}} parries with a dramatic twirl, instantly striking back for the crowd.",
            "With a spectacular spin off the block, {{defender}} unleashes a dazzling riposte.",
            "{{defender}} puts on a show, catching the attack and dramatically striking back.",
            "Playing to the crowd, {{defender}} parries with flair and instantly retaliates!",
            "{{defender}} deflects and replies with a strike straight out of a bard's tale!",
            "{{defender}} spins out of the parry into a gorgeous, dramatic counterattack.",
            "{{defender}} turns the defensive maneuver into a dramatic, soaring riposte.",
            "{{defender}} catches the blade, spins, and counters with magnificent style.",
            "With a shout to the stands, {{defender}} unleashes a theatrical counter.",
            "A dramatic, sweeping counterstrike from {{defender}} follows the block.",
            "A flashy, crowd-pleasing riposte is executed perfectly by {{defender}}.",
            "{{defender}} turns the block into a dance, slicing back gracefully.",
            "{{defender}} bows mockingly before executing a stylish riposte.",
            "With a boastful shout, {{defender}} parries and strikes back.",
            "{{defender}} strikes back with a flourishing, cinematic blow.",
            "{{defender}} blocks with a spin and counters with a magnificent flourish!",
            "Parrying dramatically, {{defender}} strikes back, playing to the roar of the arena.",
            "With cinematic timing, {{defender}} deflects the blow and launches a spectacular counter-offensive.",
            "A dazzling twirl flows perfectly into {{defender}}'s flashy counterstrike.",
            "Playing the hero, {{defender}} turns the parry into a breathtaking riposte.",
            "Playing to the stands, {{defender}} turns the parry into a sprawling, showy riposte that brings the crowd to its feet.",
            "{{defender}} catches the blow and counters with a magnificent, spinning riposte, relishing the cheers.",
            "Spinning like a top, {{defender}} delivers a flashy, theatrical riposte.",
            "{{defender}} winks at the crowd before landing a grand, theatrical riposte on {{attacker}}.",
            "With an exaggerated flourish, {{defender}} executes a sweeping theatrical riposte.",
            "A highly stylized, theatrical riposte from {{defender}} draws cheers from the arena.",
            "{{defender}} spins out of the parry, delivering a flashy, crowd-pleasing riposte.",
            "With a dramatic flourish, {{defender}} deflects the blow and strikes back spectacularly.",
            "{{defender}} turns the block into a dazzling, pirouetting counter-attack.",
            "A cinematic clash of steel is followed by an equally dramatic thrust from {{defender}}.",
            "{{defender}} plays to the crowd, turning a simple parry into a breathtaking riposte.",
            "With a theatrical sweep, {{defender}} halts the attack and counters elegantly.",
            "{{defender}} elegantly deflects and immediately lunges with flamboyant flair.",
            "A dazzling, spinning riposte from {{defender}} draws thunderous applause.",
            "{{defender}} dramatically turns the force of the blow into a stunning counter.",
            "With a wink to the crowd, {{defender}} parries and immediately strikes back."
          ],
          grim: [
            "{{defender}} blocks the blow violently, immediately driving a brutal, joyless counterstrike forward.",
            "{{defender}} meets the attack with dead eyes, deflecting and thrusting back with lethal intent.",
            "A bone-jarring block from {{defender}} instantly transitions into a violent, merciless counter.",
            "{{defender}} intercepts the strike and immediately drives their counter home with icy resolve.",
            "{{defender}} catches the blade and grinds their weapon forward in a dark, relentless riposte.",
            "With a stoic grimace, {{defender}} blocks the blow and pushes a brutal riposte into the fray.",
            "A sickening crunch of steel as {{defender}} parries, followed by a cold, murderous riposte.",
            "{{defender}} swats the attack away like an insect, delivering a cold, heavy counterstrike.",
            "No wasted movement\u2014{{defender}} parries and strikes back with chilling, silent precision.",
            "With ruthless efficiency, {{defender}} turns the strike aside and steps in for the kill.",
            "No hesitation, no emotion\u2014just a savage, mechanical riposte from {{defender}}.",
            "{{defender}} brutally shoves the blade aside and chops back in stony silence.",
            "A heavy, merciless riposte immediately follows {{defender}}'s rigid block.",
            "{{defender}} absorbs the impact and coldly thrusts back, aiming to maim.",
            "{{defender}}'s eyes are dead as they ruthlessly exploit the opening.",
            "{{defender}} turns the deflection into a silent, lethal counterattack.",
            "{{defender}} blocks and brutally punishes the opening without hesitation.",
            "{{defender}} traps the weapon and drives a cold, calculated counterstrike.",
            "A brutal parry leads instantly to a merciless riposte from {{defender}}.",
            "Silently, {{defender}} turns defense into a deadly, focused offense.",
            "{{defender}} coldly knocks the weapon aside and delivers a brutal, silent reprisal.",
            "With mechanical ruthlessness, {{defender}} parries and strikes back in one seamless, deadly motion.",
            "{{defender}} breaks the attack with chilling force and immediately counters without a sound.",
            "A merciless block is instantly followed by a grim, calculated thrust from {{defender}}.",
            "{{defender}} turns the blow away with absolute indifference, delivering a horrifyingly precise counter.",
            "{{defender}}'s eyes remain utterly dead as they block and execute a flawless, joyless riposte.",
            "A silent, brutal deflection opens the guard, and {{defender}} ruthlessly exploits it.",
            "{{defender}} parries the strike and immediately drives their weapon forward like a machine of death.",
            "Without breaking their stony expression, {{defender}} turns the attack and strikes back with terrifying efficiency.",
            "{{defender}} stoically absorbs the blow, then brutally drives a silent, joyless riposte into their foe.",
            "With cold, calculating efficiency, {{defender}} turns the attack aside and delivers a somber counter-strike.",
            "There is no celebration in {{defender}}'s eyes as they execute a heavy, fatalistic riposte.",
            "{{defender}} deflects the weapon with a dull thud, immediately countering with a grim, practiced butchery.",
            "A heartless exchange. {{defender}} counters the attack with a heavy, mournful violence.",
            "{{defender}} brutally forces the weapon aside and strikes back without a word.",
            "{{defender}} rigidly deflects the blow and answers immediately with a brutal counter.",
            "Stopping the attack cold, {{defender}} brutally steps in to finish the job.",
            "{{defender}} strikes back silently, a brutal and efficient killer.",
            "A dark, punishing counterblow is driven home by {{defender}}.",
            "{{defender}} retaliates with cold, merciless precision.",
            "A joyless, fatalistic riposte from {{defender}} seeks only blood.",
            "{{defender}} deflects the blow and immediately drives a brutal, silent counterstrike.",
            "A violent block is followed by a chillingly efficient, merciless thrust from {{defender}}.",
            "{{defender}} nullifies the attack and retaliates with cold, mechanical slaughter.",
            "Coldly, {{defender}} turns the deflected momentum into a ruthless counter.",
            "A silent, efficient redirection leads instantly to {{defender}}'s grim counterattack.",
            "{{defender}} coldly knocks the weapon aside and drives a brutal, silent riposte toward their foe.",
            "With mechanical efficiency, {{defender}} converts the block into a murderous counterattack, their expression blank.",
            "Dead eyes lock onto {{attacker}} as {{defender}} drives home a brutal, grim riposte.",
            "{{defender}} wastes no motion, delivering a cold, calculated grim riposte.",
            "With lethal efficiency, {{defender}} lands a heavy, grim riposte.",
            "Silence follows the wet thud of {{defender}}'s merciless, grim riposte.",
            "{{defender}} mechanically deflects the blow, their cold counter-attack swift and brutal.",
            "A silent parry leads into a joyless, lethal riposte from {{defender}}.",
            "{{defender}} intercepts the strike with grim efficiency and thrusts back without emotion.",
            "Without a word, {{defender}} turns the block into a cold, calculated counter.",
            "{{defender}} brutally redirects the attack, immediately delivering a stark riposte.",
            "A chillingly precise parry transitions into an equally cold counter from {{defender}}.",
            "{{defender}} meets the blow silently, their dead eyes fixed as they strike back.",
            "With grim resolve, {{defender}} blocks and immediately punishes the opening.",
            "A stark, emotionless deflection sets up a chilling riposte from {{defender}}.",
            "{{defender}} nullifies the threat and strikes back with terrifying, joyless precision."
          ]
        }
      },
      knockdown: {
        fall: [
          "The sheer momentum of the blow sends {{name}} crashing into the dirt, their body hitting the arena floor with a sickeningly slow, heavy impact.",
          "The sheer force of the blow lifts {{name}} off {{possessive}} feet, slamming them brutally into the bloody sand.",
          "{{name}} is swept off their feet in a sudden blur of motion, hitting the ground with a sickening thud.",
          "{{name}}'s legs give way instantly, collapsing into an undignified heap in the center of the arena.",
          "{{name}}'s legs buckle under the sheer force, sending {{name}} sprawling onto {{possessive}} back.",
          "{{name}}'s legs buckle under the sheer weight of the attack, collapsing into an undignified heap.",
          "The force of the blow sweeps {{name}} entirely off their feet in a dramatic, slow-motion arc.",
          "Unable to maintain their footing, {{name}} violently hits the ground, stunned and vulnerable.",
          "The devastating hit shatters {{name}}'s balance, dumping them unceremoniously to the floor.",
          "A thunderous impact! {{name}} is sent flying backward, slamming into the unforgiving sand.",
          "{{name}} is sent crashing into the dirt, their momentum completely shattered by the blow.",
          "A devastating impact drops {{name}} like a felled tree, kicking up a cloud of arena dust.",
          "The hit connects with brutal force, sending {{name}} sprawling helplessly onto the sands.",
          "Like a felled tree, {{name}} crashes backward into the dirt, dust billowing around them.",
          "{{name}}'s legs buckle under the sheer force of the assault, sending them crashing down.",
          "{{name}} is swept off {{possessive}} feet, crashing heavily to the blood-stained sands!",
          "{{name}} loses {{possessive}} balance completely, tumbling violently across the sands.",
          "The impact lifts {{name}} clean into the air before {{name}} slams down into the dirt!",
          "The strike sweeps {{name}} off their feet, dropping them heavily onto the arena floor.",
          "The ground shakes as {{name}} is thrown down, totally helpless for a crucial moment!",
          "The impact folds {{name}} like cheap parchment, sending them crashing into the dust.",
          "{{name}} stumbles backward wildly before collapsing into the dirt in a tangled heap.",
          "{{name}}'s legs give out completely, sending them crashing to the bloodstained sand.",
          "The impact scrambles {{name}}'s senses, sending them tumbling hard across the pit.",
          "{{name}} staggers back three heavy steps before their legs betray them completely.",
          "Thrown totally off-balance, {{name}} plummets face-first into the bloodied sand.",
          "{{name}} goes down hard, a spray of sand marking {{possessive}} violent impact.",
          "{{name}} scrambles backward but catches a heel, collapsing in a desperate heap.",
          "The concussive force drops {{name}} in slow motion, sand exploding as they hit.",
          "With a sickening thud, {{name}} hits the ground, dust billowing up around them.",
          "{{name}} is knocked cleanly off their feet, landing hard in the bloodied sand.",
          "{{name}} is lifted off their feet by the strike, slamming down into the dust.",
          "{{name}} goes sprawling into the sands, completely bowled over by the attack.",
          "The impact is staggering, and {{name}} crumples to the arena floor in a heap.",
          "The sheer force of the impact sends {{name}} plummeting heavily to the floor.",
          "{{name}} is folded in half by the force, crashing down in a tangle of limbs.",
          "The impact hits like a thunderbolt, instantly dropping {{name}} to the sand!",
          "{{name}} is driven down hard, hitting the dirt with a jarring, rapid crunch.",
          "A slow, agonizing collapse sees {{name}} hit the dirt, utterly overwhelmed.",
          "{{name}} crumples like a ragdoll, hitting the ground with a sickening thud.",
          "{{name}} trips over their own feet, sprawling messily onto the arena floor.",
          "Driven backward by the impact, {{name}} trips and falls hard on their back.",
          "The blow shatters {{name}}'s stance, dropping {{name}} like a felled tree.",
          "With a sickening thud, {{name}} is driven face-first into the arena floor!",
          "{{name}} drops like a stone, the brutal impact echoing through the arena.",
          "Losing all balance, {{name}} crashes heavily to the blood-stained earth.",
          "{{name}} crumples like a puppet with cut strings, hitting the dirt hard.",
          "Gravity claims its prize as {{name}} is sent sprawling across the sands.",
          "{{name}} crashes into the dirt, the wind completely knocked out of them.",
          "{{name}} goes down hard, the crowd roaring as dust billows around them.",
          "With a heavy groan, {{name}} is driven down into the blood-soaked dirt.",
          "{{name}} is launched backward by the sheer kinetic force of the strike.",
          "Gravity claims {{name}} violently as the strike shatters their balance.",
          "{{name}} stumbles backward, feet tangling before they crash down hard.",
          "{{name}} crumples like a ragdoll, thrown violently to the arena floor!",
          "{{name}}'s feet are swept out from under them, sending them sprawling.",
          "The impact takes {{name}} off their feet, throwing them to the ground.",
          "Thrown entirely off balance, {{name}} goes down in a clatter of gear.",
          "{{name}}'s legs turn to water, crumpling to the blood-stained sand.",
          "Legs failing, {{name}} crashes heavily into the unforgiving ground.",
          "{{name}}'s legs give out, collapsing in a heap as the crowd gasps.",
          "{{name}} collapses hard, the breath knocked entirely out of them.",
          "{{name}} is brutally upended, slamming hard onto the arena floor.",
          "{{name}}'s legs buckle, and they collapse heavily to the ground.",
          "A heavy impact sends {{name}} sprawling ungainly onto the dirt.",
          "{{name}} is violently thrown to the ground in a cloud of dust!",
          "{{name}} crashes down hard, eating a mouthful of arena dust.",
          "Thrown completely off balance, {{name}} hits the floor hard.",
          "{{name}} is sent flying backward, landing hard on the sand.",
          "{{name}} is violently upended, sprawling across the ground.",
          "{{name}} is driven to the sand by the force of the blow!",
          "{{name}} crashes heavily, dust billowing around them.",
          "{{name}} falls back, unable to take the punishment.",
          "{{name}} hits the ground heavily, coughing up dust.",
          "{{name}} loses {{possessive}} footing and falls!!!",
          "{{name}} is sent crashing to the bloody sand.",
          "Legs buckling, {{name}} hits the dirt hard.",
          "{{name}} crumples under the onslaught!!",
          "{{name}} stumbles to the ground!!!",
          "{{name}} drops to one knee!!",
          "{{defender}} is swept off their feet, crashing into the dirt.",
          "The impact takes {{defender}}'s legs out from under them.",
          "{{defender}} spirals down into the bloody sand.",
          "A staggering blow sends {{defender}} sprawling to the arena floor."
        ],
        recovery: [
          "{{name}} staggers to {{possessive}} feet, swaying dangerously but still gripping {{possessive}} weapon tight.",
          "Coughing up blood, {{name}} violently forces {{reflexive}} back upright, eyes burning with sheer spite.",
          "Slowly, agonizingly, {{name}} crawls to a knee before pushing off the ground, refusing to stay down.",
          "Coughing up dust, {{name}} struggles back to their feet, swaying slightly but refusing to stay down.",
          "{{name}} springs back to their feet with surprising agility, immediately adopting a defensive guard.",
          "With a groan of exertion, {{name}} forces themselves upright, gripping their weapon white-knuckled.",
          "{{name}} uses {{possessive}} weapon as a crutch to drag {{reflexive}} back into a fighting stance.",
          "Spitting blood, {{name}} slowly and deliberately pushes themselves back up, refusing to stay down.",
          "A slow, theatrical rise from {{name}} as they wipe the sand from their face, glaring at their foe.",
          "{{name}} springs back to {{possessive}} feet in an instant, moving with impossible, fluid speed.",
          "In a terrifying display of resilience, {{name}} immediately springs back upright without a word.",
          "{{name}} scrambles backward like a cornered rat, desperately returning to {{possessive}} feet.",
          "Spitting blood, {{name}} violently shoves themselves back onto their feet with renewed fury.",
          "{{name}} ducks under the blow and falls instantaneously into a roll to {{possessive}} feet!",
          "Gritting their teeth against the pain, {{name}} slowly clambers back to a fighting stance.",
          "Slowly, painfully, {{name}} rises from the dirt, seemingly fueled entirely by sheer spite.",
          "{{name}} pushes up from the dirt slowly, glaring with pure murder in {{possessive}} eyes.",
          "{{name}} scrambles back to their feet in a blind panic, desperately seeking their weapon.",
          "{{name}} scrambles frantically to their feet, grabbing a fistful of dirt in the process.",
          "Shaking off the cobwebs, {{name}} staggers upright, their balance visibly compromised.",
          "Clawing at the earth, {{name}} forces their battered body back to a standing position.",
          "Spitting blood and cursing violently, {{name}} drags themselves slowly to their feet.",
          "{{name}} kicks out to create space before scrambling back up to {{possessive}} feet.",
          "Pride clearly wounded, {{name}} snaps back to attention, stance wide and aggressive.",
          "In a flash of adrenaline, {{name}} springs right back to their feet, ready for more!",
          "A frantic scramble sees {{name}} back on their feet, kicking up dust in their panic.",
          "With a feral snarl, {{name}} scrambles up from the ground, eyes burning with hatred.",
          "With a dramatic kip-up, {{name}} is back in the fight, soaking in the arena's roar.",
          "With a desperate scramble, {{name}} gets {{possessive}} footing back just in time.",
          "{{name}} struggles to their knees, panting heavily as the crowd screams for blood.",
          "{{name}} rolls to safety and rises in a flash, eyes wide with frantic desperation.",
          "{{name}} drops to {{possessive}} knees, avoiding the attack, then leaps back up!",
          "Coughing heavily, {{name}} staggers back to a standing position, clearly shaken.",
          "With a burst of adrenaline, {{name}} kips up off the sand in a flash of motion!",
          "Ignoring the dirt and blood, {{name}} springs back up with surprising agility.",
          "{{name}} leaps up athletically, brushing the dirt off as if nothing happened.",
          "Refusing to be broken, {{name}} rolls to their feet, weapon raised and ready.",
          "Groaning in pain, {{name}} hauls {{reflexive}} upright, staggering slightly.",
          "Coughing up sand, {{name}} struggles onto one knee before finally standing.",
          "Slowly, painfully, {{name}} pushes up from the dirt, refusing to stay down.",
          "{{name}} pushes off the sand, eyes blazing with newfound fury as they rise.",
          "{{name}} leaps to their feet instantly, fueled by raw adrenaline and rage.",
          "Using their weapon as a crutch, {{name}} heavily rises back to their feet.",
          "{{name}} groggily pushes up off the bloodstained sand, swaying unsteadily.",
          "Groaning in agony, {{name}} slowly and painfully drags themselves upright.",
          "With a defiant roar, {{name}} springs back up, refusing to stay grounded.",
          "Shaking off the dirt, {{name}} stumbles upright with grim determination.",
          "{{name}} rolls with the momentum, springing back into a fighting stance.",
          "{{name}} shakes off the dizziness and rises, glaring at their opponent.",
          "With a defiant grunt, {{name}} quickly rolls back to a standing guard.",
          "Moving with desperate haste, {{name}} gets their feet back under them.",
          "{{name}} scrambles up frantically, desperate to regain their footing.",
          "{{name}} rises with agonizing slowness, limbs trembling but unbroken.",
          "{{name}} rolls backwards and springs to their feet with renewed fury.",
          "With a groan of effort, {{name}} pushes themselves up from the dirt.",
          "{{name}} forces themselves upright, eyes blazing with newfound fury.",
          "{{name}} staggers upward, shaking their head to clear the cobwebs.",
          "{{name}} struggles, clawing their way back to a standing position.",
          "{{name}} rolls out of the impact, finding their footing once more.",
          "Using their weapon for support, {{name}} drags themselves upright.",
          "{{name}} staggers upright, clutching their wounds in silent agony.",
          "{{name}} bounds back up almost immediately, fueled by adrenaline.",
          "{{name}} springs up instantly, refusing to let the momentum fade.",
          "{{name}} springs back to a standing position with alarming speed.",
          "Coughing up dust, {{name}} scrambles back to a standing position.",
          "Shaking off the brutal impact, {{name}} stands ready to continue.",
          "{{name}} slowly drags themselves upright, battered but unbroken.",
          "{{name}} violently shoves off the ground, refusing to stay down.",
          "A triumphant roar erupts as {{name}} surges back to their feet!",
          "Coughing up dust, {{name}} slowly rises, refusing to stay down.",
          "With a grimace of pain, {{name}} finds their footing once more.",
          "{{name}} rolls backward and pops up, weapons raised and ready.",
          "{{name}} rolls away frantically and staggers back up to fight.",
          "{{name}} groans, pushing themselves up from the bloodied sand.",
          "{{name}} rolls backward and springs up, refusing to stay down.",
          "With a grimace of pain, {{name}} rolls to one knee and rises.",
          "{{name}} rises slowly, coldly locking eyes with the opponent.",
          "With surprising agility, {{name}} springs back to their feet.",
          "Shaking their head to clear the daze, {{name}} rises shakily.",
          "Spitting blood into the sand, {{name}} clambers back upright.",
          "With grim determination, {{name}} drags themselves upright.",
          "{{name}} scrambles back to their feet, gasping for air.",
          "{{name}} kips up with athletic grace, ready for more.",
          "Gasping for breath, {{name}} finds their footing.",
          "{{name}} scrambles back to {{possessive}} feet.",
          "{{name}} staggers back up, eyes full of murder.",
          "{{name}} pushes {{reflexive}} up hurriedly.",
          "{{name}} rises unsteadily but determinedly.",
          "{{name}} rolls and stands back up quickly.",
          "{{name}} is standing once more!",
          "{{name}} struggles, finding their footing amidst the cheers.",
          "Pushing off the bloody sand, {{name}} regains their stance.",
          "{{name}} shakes the cobwebs loose and slowly stands.",
          "With a pained groan, {{name}} gets back on their feet."
        ],
        pacing: {
          slow: [
            "A heavy silence hangs in the air as {{name}} falls backward, seemingly in slow motion.",
            "{{name}} collapses with a sickening sluggishness, the ground rushing up to meet them.",
            "A heavy silence falls as {{name}} lies prone, every agonizing second ticking by.",
            "Time seems to drag as {{name}} struggles against the unyielding arena floor.",
            "The world pauses as {{name}} hits the dirt in a long, devastating sprawl.",
            "{{name}} goes down, their fall a slow, dramatic spectacle of defeat.",
            "The impact sends {{name}} tumbling, their descent agonizingly slow.",
            "It feels like an eternity as {{name}} crumples to the arena floor.",
            "{{name}} falls to the sand in a grueling, slow-motion collapse.",
            "Time seems to slow as {{name}} crashes heavily into the dust.",
            "{{name}}'s legs slowly give out, sending them crashing down.",
            "{{name}} hits the ground with a heavy, drawn-out thud.",
            "The dust settles slowly around {{name}}'s fallen form.",
            "{{name}} takes an agonizingly long moment to find the ground.",
            "{{name}} seems to hang in the air for a terrible moment before gravity reclaims them.",
            "The impact echoes, and {{name}} slowly, inexorably crumples to the arena floor.",
            "As if moving through water, {{name}} collapses in a slow, dramatic descent.",
            "The fight grinds to a halt as the fighters circle slowly, catching their breath.",
            "A heavy silence descends as both gladiators hesitate, eyeing each other warily.",
            "The pace crawls to a standstill; the exhaustion is palpable in the dry arena air.",
            "They stalk each other deliberately, every step calculated and painfully slow.",
            "A moment of slow, tense contemplation passes between the combatants.",
            "They crash to the sands, struggling to find the strength to rise as time seems to crawl.",
            "A heavy impact sends {{name}} sprawling, their sluggish movements hinting at deep exhaustion.",
            "Time seems to crawl as {{name}} tumbles endlessly toward the ground.",
            "{{name}} falls with agonizing slowness, every moment a struggle to stay upright.",
            "The arena holds its collective breath as {{name}} crumples endlessly to the sand.",
            "A heavy, suffocating silence descends as {{name}}'s legs finally give way.",
            "Time distorts, every agonizing second stretching as {{name}} collapses.",
            "The world seems to slow to a crawl as {{name}}'s knees buckle and they collapse to the dirt.",
            "Every painful heartbeat echoes as {{name}} heavily hits the arena floor.",
            "The arena holds its collective breath, the heavy thud of {{name}} hitting the dirt echoing endlessly.",
            "{{name}} collapses like a felled oak, a slow, tragic spectacle before the roaring mob.",
            "A cold, agonizing second stretches into eternity as {{name}} falls heavily to the sand.",
            "The world seems to stop as {{name}} crumples, an agonizingly slow surrender to gravity.",
            "{{name}} falls in what feels like slow motion, the inevitable impact arriving with a hollow thud.",
            "The gladiators stalk each other deliberately, every step calculated and painfully slow.",
            "{{name}} crash to the sands, struggling to find the strength to rise as time seems to crawl.",
            "{{name}} crumples like a felled tree, the impact heavy and drawn out in the silence of the arena.",
            "Time seems to drag as {{name}} collapses to the bloody sand, every heavy thud echoing across the pit.",
            "{{name}} struggles to stand, every movement agonizingly sluggish as the crowd holds its breath.",
            "Time seems to stand still as {{name}} painfully pushes themselves up from the blood-soaked sand.",
            "A heavy silence falls as {{name}} slowly, defiantly rises to their feet.",
            "Every second stretches into eternity as {{name}} gathers the willpower to stand once more.",
            "A grueling, methodical pace takes over as both fighters struggle to recover.",
            "The bout descends into a torturously slow slugfest, both sides exhausted.",
            "The fight grinds to an agonizing halt as {{name}} falls, every agonizing second stretching into eternity.",
            "Time slows to a crawl. {{name}} hits the dirt, a heavy silence blanketing the once-roaring arena.",
            "The dust settles with painful slowness around the fallen form of {{name}}.",
            "Every breath is labored and audible as the bout descends into a grueling, lethargic stalemate with {{name}} down.",
            "The sheer exhaustion is palpable; even gravity seems sluggish as it drags {{name}} to the earth.",
            "In a macabre, slow-motion ballet, {{name}} crumples to the blood-stained sands.",
            "The relentless tempo breaks, leaving only the sound of {{name}}'s heavy, echoing impact.",
            "A creeping dread settles over the pit as {{name}}'s body slowly surrenders to the earth.",
            "The crowd holds its breath as {{name}} slowly, agonizingly struggles to rise from the blood-soaked sand.",
            "Every second crawls as {{name}} forces their battered body up, groaning in defiance.",
            "Time seems to freeze as {{name}} slowly pushes themselves up from the dirt.",
            "With painful deliberation, {{name}} finds their footing, shaking off the heavy impact."
          ],
          fast: [
            "The fight erupts into a blur of motion, both fighters pushing the pace to a dangerous extreme!",
            "A frenetic exchange! The tempo accelerates as strikes are thrown with blinding speed.",
            "A rapid tumble, and {{name}} is instantly back on their feet, snapping into a guard.",
            "{{name}} hits the dirt but is already bouncing back up with furious kinetic energy.",
            "No time to think! The battle becomes a high-speed, chaotic scramble for survival.",
            "They clash violently, the pacing of the bout instantly shifting into high gear.",
            "{{name}} crashes to the floor in a fraction of a second, the crowd gasping.",
            "{{name}} is slammed into the dirt before they even realize what hit them.",
            "A sudden collapse! {{name}} is instantly reduced to a heap on the ground.",
            "Before anyone can blink, {{name}} is driven violently into the ground.",
            "The strike connects, and {{name}} is immediately spiked into the dirt.",
            "With brutal speed, {{name}} is swept off their feet and slammed down.",
            "A rapid-fire series of maneuvers drives the action to a fever pitch!",
            "No time to bleed! {{name}} is moving the instant they hit the dirt.",
            "Instantly, {{name}} hits the ground, a sudden and brutal collapse.",
            "In a blur of motion, {{name}} is violently hurled to the ground!",
            "A sudden, shocking impact leaves {{name}} sprawled in the dust.",
            "{{name}} drops like a stone, the suddenness shocking the crowd.",
            "Before the crowd can blink, {{name}} is smashed into the dirt.",
            "{{name}} is thrown down with terrifying, explosive velocity.",
            "Before the dust even rises, {{name}} is already scrambling.",
            "A blindingly fast takedown leaves {{name}} eating sand.",
            "{{name}} crashes down before the crowd can even gasp.",
            "A lightning-fast impact drops {{name}} like a stone.",
            "{{name}} hits the sand with whip-like suddenness.",
            "In a vicious blur, {{name}} is hurled violently to the ground!",
            "Before the blow even registers, {{name}} is slammed mercilessly into the dirt.",
            "The impact is immediate and total\u2014{{name}} hits the sand instantly.",
            "{{name}} is instantly flattened, hitting the dirt before the crowd can even gasp.",
            "A blur of motion and {{name}} is slammed mercilessly to the ground.",
            "{{name}} clash violently, the pacing of the bout instantly shifting into high gear.",
            "{{name}} is slammed into the dirt before {{name}} even realizes what hit them.",
            "No time to bleed! {{name}} is moving the instant {{name}} hit the dirt.",
            "{{name}} is instantly flattened, slamming into the dirt before the crowd can even gasp.",
            "A sudden crack and {{name}} is on their back, dropped faster than the blink of an eye.",
            "{{name}} bounces right back up, fueled by raw adrenaline and rage!",
            "No hesitation! {{name}} is back on their feet in a heartbeat, ready for more.",
            "A lightning-fast recovery! {{name}} springs up instantly, refusing to stay down.",
            "{{name}} ignores the impact, surging upward before the dust even settles.",
            "No quarter given! {{name}} rebounds with terrifying, immediate ferocity.",
            "{{name}} is back in the fight instantly, the pace remaining blisteringly fast.",
            "Before anyone can blink, {{name}} is violently introduced to the arena floor!",
            "The bout goes into overdrive as {{name}} is suddenly and brutally flattened!",
            "A blistering, chaotic sequence ends abruptly with {{name}} slammed into the dirt.",
            "Blink and you missed it\u2014{{name}} hits the deck in a spectacular display of velocity.",
            "The pacing is absolutely frenetic! {{name}} is dropped like a stone in the blink of an eye.",
            "No time to think! The sheer speed of the exchange leaves {{name}} eating sand.",
            "A whirlwind of violence concludes with a sickening, high-speed impact dropping {{name}}.",
            "The action is relentless! {{name}} is driven down before the crowd can even draw a breath.",
            "Before the dust even settles, {{name}} bounces back up, refusing to stay down!",
            "A flash of motion, and {{name}} is already rolling to their feet, weapon ready.",
            "{{name}} hits the ground and instantly springs back up, moving with frenetic energy.",
            "No time wasted! {{name}} is back on their feet in the blink of an eye."
          ],
          recovery_slow: [
            "{{name}} uses their weapon as a crutch, dragging themselves upright with agonizing slowness.",
            "{{name}} staggers upward, clearly battered, taking precious seconds to find their footing.",
            "A painful, drawn-out recovery as {{name}} fights off dizziness to get back in the fight.",
            "It takes a grueling effort, but {{name}} finally manages to stand, swaying dangerously.",
            "A slow, torturous climb back to their feet leaves {{name}} looking utterly exhausted.",
            "{{name}} leans heavily on the dirt, taking an agonizingly long time to finally stand.",
            "Every second feels like an hour as {{name}} weakly pulls themselves off the ground.",
            "With limbs trembling, {{name}} slowly claws their way back to a standing position.",
            "{{name}} struggles to their feet, gasping for air, every movement an agony.",
            "Slowly, painfully, {{name}} pushes themselves off the blood-stained sand.",
            "It takes agonizing seconds for {{name}} to find their footing again.",
            "Shaken to the core, {{name}} wobbles violently as they try to stand.",
            "The crowd jeers as {{name}} slowly, painfully regains their stance.",
            "{{name}} drags themselves upward, movements sluggish and pained.",
            "Gasping for air, {{name}} struggles onto hands and knees.",
            "{{name}} struggles to rise, every muscle protesting in visible agony.",
            "Taking a long, painful breath, {{name}} forces themselves onto one knee.",
            "The effort to stand takes a torturous toll on {{name}}'s battered frame.",
            "{{name}} drags themselves upward, muscles trembling with the immense effort.",
            "Slowly, agonizingly, {{name}} finds their footing once more.",
            "Every movement is torture as {{name}} drags themselves upward, shaking violently.",
            "{{name}} claws at the dirt, fighting an agonizing, slow battle just to stand.",
            "The crowd watches in grim fascination as {{name}} weakly forces themselves to their feet.",
            "Gasping for breath, {{name}} agonizingly drags themselves back up to a fighting stance.",
            "Clutching their wounds, {{name}} struggles to rise, leaning heavily on their weapon.",
            "Groaning in agony, {{name}} painfully drags themselves back to their feet.",
            "Every second is an eternity as {{name}} slowly, agonizingly stands back up.",
            "Staggering heavily, {{name}} struggles to find their footing once more.",
            "With a ragged breath, {{name}} slowly pushes off the blood-soaked sand.",
            "Shaken to the core, {{name}} wobbles violently as {{name}} tries to stand.",
            "Gasping for breath, {{name}} painfully drags themselves up from the dirt, eyes still glassy.",
            "It takes agonizing seconds for {{name}} to find their footing, swaying dangerously as {{name}} rise.",
            "{{name}} hits the dirt and stays there for an agonizing moment, gasping for breath.",
            "The arena falls silent as {{name}} struggles weakly to push themselves off the bloody sand.",
            "{{name}} drags themselves upward, every movement heavy with exhaustion and pain.",
            "It takes a brutal, grueling effort for {{name}} to merely find their knees again.",
            "{{name}} lies prone, coughing up dust, taking a long time to regain their bearings.",
            "The crowd counts the agonizing seconds as {{name}} slowly, painfully clambers upright.",
            "{{name}}'s limbs tremble as they heavily push themselves off the unforgiving arena floor.",
            "A slow, agonizing recovery from {{name}}, clearly feeling the full weight of the brutal hit.",
            "Gasping for air, {{name}} wobbles precariously, barely able to find their balance.",
            "{{name}} staggers upright, their eyes unfocused as they try to shake off the brutal impact.",
            "It takes everything {{name}} has just to stand, swaying dangerously as the fight resumes.",
            "A painful, staggering recovery leaves {{name}} completely exposed for a terrifying moment.",
            "An agonizingly slow process as {{name}} finally manages to stand, clearly battered.",
            "{{name}} gasps for breath, taking what feels like an eternity to get back up.",
            "{{name}} fights against their own failing body, a glacial, agonizing struggle to stand.",
            "Every muscle screaming in protest, {{name}} attempts to rise, taking an eternity to find their footing.",
            "The damage is severe. {{name}} pushes up, wobbling and swaying like a felled tree refusing to die.",
            "It's a pathetic, prolonged crawl from the dirt as {{name}} fights just to get to their knees.",
            "The crowd watches in grim silence as {{name}} slowly, painfully attempts to scrape themselves off the ground.",
            "{{name}}'s recovery is a slow, tortured affair, their limbs trembling with every agonizing inch.",
            "Time stretches painfully as {{name}} claws at the sand, desperately trying to force themselves upright.",
            "It takes everything {{name}} has left just to slowly lever themselves off the blood-soaked floor.",
            "{{name}} staggers, their legs trembling as they slowly find their balance again.",
            "Gasping for air, {{name}} painfully hauls themselves upright, looking unsteady.",
            "It takes a momentous effort, but {{name}} slowly claws their way back to a standing position.",
            "{{name}} wobbles precariously, taking agonizingly long moments to recover their stance."
          ],
          recovery_fast: [
            "{{name}} bounces off the ground with terrifying speed, immediately raising their guard.",
            "Before {{attacker}} can capitalize, {{name}} is already standing, glaring daggers.",
            "A sudden, explosive burst of energy and {{name}} is back on their feet in a flash.",
            "{{name}} rejects the knockdown, vaulting back to their feet with blistering speed.",
            "{{name}} rolls with the impact and pops up instantly, barely breaking rhythm.",
            "A lightning-fast kip-up puts {{name}} right back in the fight, eyes burning.",
            "A furious scramble sees {{name}} snap back to a standing position instantly.",
            "{{name}} hits the ground and immediately kips up, refusing to stay down.",
            "A fluid roll brings {{name}} back into a fighting stance in a heartbeat.",
            "With a furious roar, {{name}} leaps up before the dust can even settle.",
            "Almost impossibly fast, {{name}} springs off the sand, ready for more.",
            "{{name}} springs back to their feet instantly, refusing to stay down!",
            "{{name}} turns the fall into a tactical retreat, standing up quickly.",
            "Like a coiled spring, {{name}} snaps back to their feet instantly.",
            "{{name}} bounces right back up, rolling with the fall.",
            "A quick roll and {{name}} is standing again, ignoring the pain.",
            "Hardly missing a beat, {{name}} snaps back into a combat stance.",
            "{{name}} springs instantly back to their feet, defying the pain.",
            "With cat-like agility, {{name}} rolls and is upright in a split second.",
            "Like a coiled viper, {{name}} violently snaps back into a fighting stance!",
            "The sand barely touches them before {{name}} explodes back to their feet.",
            "{{name}} rejects the fall utterly, springing upward in a terrifying display of agility.",
            "{{name}} springs back to their feet immediately, fueled by pure adrenaline.",
            "Before the dust can settle, {{name}} kips up, ready for more.",
            "{{name}} bounces back to their feet immediately, shaking off the dirt with ferocious energy.",
            "Before the dust even settles, {{name}} has rolled and sprang back upright, weapon ready.",
            "{{name}} hits the ground and bounces back up in a single, fluid motion.",
            "A sudden blur of motion and {{name}} is already rolling back to their feet.",
            "{{name}} barely touches the sand before springing upright like a coiled snake.",
            "The impact is hard, but {{name}} flips instantly back into a fighting stance.",
            "{{name}} lands heavily but uses the momentum to launch right back up.",
            "Without skipping a beat, {{name}} rolls out of the fall and stands ready.",
            "{{name}} hits the dirt, but their recovery is so fast it looks choreographed.",
            "A rapid scramble sees {{name}} immediately regaining their footing and balance.",
            "{{name}} rolls with the impact and springs back into a flawless fighting stance.",
            "A seamless, acrobatic recovery puts {{name}} right back into the action.",
            "{{name}} snaps back to attention, eyes locked on the opponent with renewed fury.",
            "Like a coiled spring, {{name}} pops back up, utterly unfazed by the knockdown.",
            "{{name}} snaps back upright with supernatural quickness, unfazed.",
            "Like a coiled spring, {{name}} is instantly back on their feet and ready.",
            "Like a coiled spring, {{name}} bounces right back up, ignoring the impact entirely!",
            "Incredible resilience! {{name}} rolls and springs to their feet in one fluid, lightning-fast motion.",
            "{{name}} hits the dirt and instantly ricochets back to their feet, unphased and furious.",
            "Before the dust even settles, {{name}} is already standing, weapon ready for blood.",
            "A masterclass in recovery! {{name}} is back on their feet in a heartbeat.",
            "{{name}} turns the fall into a seamless tactical roll, popping up instantly.",
            "There is zero hesitation\u2014{{name}} refuses to stay down and snaps upright immediately.",
            "The impact barely registers before {{name}} is violently throwing themselves back into the fray.",
            "{{name}} snaps back to attention, recovering their stance with shocking speed.",
            "A quick shake of the head, and {{name}} is instantly back in a fighting crouch.",
            "{{name}} seamlessly rolls out of the fall, instantly recovering their guard.",
            "Moving like lightning, {{name}} recovers their footing and squares up once more."
          ]
        }
      },
      epithets: {
        origin: [
          "The {{origin}}",
          "the foreigner",
          "the wanderer",
          "the local champion",
          "the exile",
          "the stranger",
          "the nomad",
          "the outcast",
          "the mystic",
          "the outlander",
          "the far-traveler",
          "the native",
          "the displaced",
          "the immigrant",
          "the long-traveler",
          "the unknown",
          "the vagabond"
        ],
        race: [
          "Our lofty {{race}}",
          "The {{race}}",
          "the fierce one",
          "the relentless fighter",
          "the primal warrior",
          "the proud kin",
          "the ancient blood",
          "the savage",
          "the pureblood",
          "the stout",
          "the nimble",
          "the swift"
        ],
        style: [
          "This {{style}}",
          "the aggressive striker",
          "the defensive wall",
          "the agile dancer",
          "the brutal brawler",
          "the cunning master",
          "the wild berserker",
          "the precise duelist",
          "the brutal",
          "the vicious"
        ]
      },
      pacing: {
        stalemate: [
          "Both warriors pause, chests heaving, evaluating their next move in this deadly dance.",
          "The fighters circle each other warily, neither willing to commit to a fatal mistake.",
          "A tense standoff ensues, the hot sand baking as they study each other's footwork.",
          "A tense moment of inaction as both fighters catch their breath.",
          "The fighters slowly circle each other, looking for a weakness.",
          "Both warriors hold their ground, respecting the other's reach.",
          "The two circle each other cautiously, looking for an opening.",
          "They lock eyes, waiting for the other to make a mistake.",
          "Neither gladiator commits, testing the waters.",
          "A brief standoff ensues on the bloody sands."
        ],
        trading_blows: [
          "Both attack, weapons strike and rebound, strike and rebound.",
          "The two warriors fiercely trade attacks and parry.",
          "They clash violently, giving as good as they get.",
          "A brutal exchange leaves both fighters tested.",
          "A relentless back-and-forth exchange begins.",
          "Blows are traded evenly in a chaotic melee.",
          "Neither backs down, trading vicious blows.",
          "They batter each other in a savage flurry.",
          "Swords ring out as they trade heavy hits.",
          "They exchange a rapid flurry of strikes."
        ],
        tempo: {
          ahead: [
            "Pressing {{possessive}} advantage, {{name}} keeps the pressure high.",
            "Driving the tempo, {{name}} forces {{possessive}} opponent to react.",
            "{{name}} is proving the mettle that made {{gender}} a Protector!",
            "{{name}} is absolutely dominant - driving every exchange!",
            "{{name}}, so far, is ahead of his formidable opponent!",
            "{{name}} is clearly dictating the pace of the fight.",
            "{{name}} seems to be a step ahead in this exchange.",
            "{{name}} controls the tempo of this bout!",
            "{{name}} is beating his opponent!",
            "{{name}} dominates the exchange!"
          ],
          equal: [
            "Neither can establish a clear rhythm over the other.",
            "The warriors appear equal in overall abilities.",
            "A perfectly balanced rhythm to the combat.",
            "Neither warrior can gain the upper hand.",
            "There is no decisive victor here yet.",
            "They match each other step for step.",
            "The battle is too close to tell.",
            "The tempo is perfectly matched.",
            "The combatants match each other blow for blow, neither gaining ground.",
            "A balanced exchange of strikes leaves both fighters where they started."
          ],
          movement: [
            "{{name}} sidesteps, trying to throw {{possessive}} opponent off balance.",
            "{{attacker}} slides into a new stance, shifting the flow of battle.",
            "{{name}} is moving in circles around {{possessive}} opponent!",
            "They circle the arena, changing the angle of attack.",
            "Footwork becomes key as they maneuver for position.",
            "{{name}} is moving constantly without pause!",
            "{{name}} shifts continually back and forth!",
            "{{name}} leaps to {{possessive}} right!",
            "{{name}} looks for a better position.",
            "{{attacker}} constantly shifts angles, denying {{defender}} a solid target.",
            "The combatants circle each other warily, looking for an opening.",
            "Footwork dictates the exchange as {{attacker}} slides out of range.",
            "{{defender}} is forced to constantly reposition as {{attacker}} presses the advantage.",
            "A sudden burst of lateral movement from {{attacker}} changes the geometry of the fight.",
            "{{attacker}} dances on the edge of weapon reach, baiting {{defender}}."
          ]
        },
        pressing: [
          "{{attacker}} surges forward, driving {{defender}} backward with a relentless flurry of attacks.",
          "The momentum shifts entirely as {{attacker}} goes on the offensive, overwhelming the defense.",
          "Smelling blood, {{attacker}} presses the advantage, giving {{defender}} no room to breathe.",
          "Driving {{possessive}} opponent toward the wall, {{name}} advances.",
          "Advancing with grim determination, {{name}} forces the issue.",
          "{{name}} moves in aggressively, giving no room to breathe.",
          "{{name}} closes the distance, pressing the attack hard.",
          "{{name}} swarms the foe, pressing every advantage.",
          "{{name}} presses forward relentlessly.",
          "{{attacker}} pushes the advantage, driving {{defender}} toward the edge."
        ]
      },
      reactions: {
        positive: [
          "{{name}} wipes blood from {{possessive}} weapon, looking confident.",
          "A sharp exhalation of focused energy comes from {{name}}.",
          "{{name}} spins {{possessive}} weapon with lethal flair.",
          "{{name}} flexes, energized by the bloodletting.",
          "{{name}} nods grimly, satisfied with the hit.",
          "A fierce grin spreads across {{name}}'s face.",
          "{{name}} shouts a battle cry, morale surging.",
          "{{name}} gives a cold, confident stare down.",
          "A triumphant roar echoes from {{name}}.",
          "The crowd ROARS in approval!"
        ],
        negative: [
          "{{name}} shakes {{possessive}} head, trying to clear the pain.",
          "{{name}} glances nervously at {{possessive}} wounds.",
          "A look of dread passes over {{name}}'s features.",
          "{{name}} spits blood and scowls in frustration.",
          "{{name}}'s grip falters for a brief second.",
          "{{name}} looks desperately toward the exit.",
          "Boos and jeers echo from the arena walls.",
          "{{name}} backs away, looking overwhelmed.",
          "{{name}} stumbles, visibly shaken.",
          "A curse escapes {{name}}'s lips."
        ],
        encourage: [
          "The crowd roars an encouraging chant, whipping the warriors into a frenzy.",
          "The stands rhythmically stomp their feet, demanding a finishing blow!",
          "{{name}} bangs {{possessive}} weapon against {{possessive}} shield.",
          "{{name}} spreads {{possessive}} arms wide, inviting the next blow.",
          "{{name}} taunts {{possessive}} opponent to come closer.",
          "{{name}} beckons with two fingers, a clear challenge.",
          "'Finish it!' chants the crowd in terrifying unison.",
          "{{name}} gestures defiantly, urging the attack.",
          "{{name}} laughs a dark, barking laugh.",
          "The crowd urges the warriors on."
        ],
        gasp: [
          "Silence falls for a split second, followed by a horrified gasp from the nobles in the front row.",
          "A collective gasp ripples through the coliseum as the brutal reality of the strike sets in.",
          "A horrified gasp sweeps the stands as the sheer violence is laid bare.",
          "The crowd inhales sharply, shocked by the sheer savagery of the blow.",
          "Even the most hardened veterans in the stands wince at the impact.",
          "The nobles in the front row cover their mouths in absolute shock.",
          "The crowd collectively gasps as the {{weapon}} whistles past!",
          "A horrific sound of tearing flesh echoes; the crowd recoils!",
          "Some spectators cover their eyes from the gruesome display!",
          "The stands fall deathly silent for a fraction of a second.",
          "Gasps of horror and awe ripple through the onlookers.",
          "A sharp intake of breath echoes through the coliseum.",
          "Spectators wince in unison at the brutal display.",
          "A collective shudder runs through the audience.",
          "A collective intake of breath from the stands!",
          "The audience recoils from the sheer violence!",
          "The spectators clutch their pearls in horror!",
          "The crowd gasps at the shocking display!",
          "The crowd falls into a stunned silence.",
          "A sudden hush falls over the arena."
        ],
        cheer: [
          "Spectators scream their approval, throwing coins and flowers onto the bloody sand.",
          "The spectators stomp their feet, shaking the very foundations of the arena!",
          "The crowd goes wild, tossing coins and roses onto the blood-soaked sands.",
          "A deafening cheer erupts as the crowd witnesses the masterful display.",
          "The arena explodes in deafening cheers, chanting {{attacker}}'s name!",
          "The coliseum quakes as thousands scream their bloodthirsty approval!",
          "Cheers erupt from every tier as the crowd goes absolutely wild.",
          "The crowd works itself into a frenzied roar of pure bloodlust!",
          "The spectators roar, their bloodlust stoked to a fever pitch!",
          "Chants of 'BLOOD! BLOOD! BLOOD!' rain down from the audience!",
          "Thunderous applause greets the masterful display of violence.",
          "The arena trembles as the crowd stomps their feet in unison.",
          "A roar of approval shakes the foundations of the coliseum.",
          "A deafening roar of excitement tears through the audience.",
          "The coliseum shakes with the deafening roar of the crowd.",
          "The spectators are on their feet, demanding more blood!",
          "The fans scream in ecstatic frenzy, hungering for more.",
          "The stands erupt into chaotic, bloodthirsty cheering!",
          "Cheers of bloodlust ring out from the upper tiers.",
          "The spectators erupt into thunderous applause!",
          "A roar of bloodlust rises from the stands!",
          "The crowd erupts into deafening cheers!",
          "The audience screams their approval!",
          "Chants echo through the coliseum!"
        ],
        boo: [
          "A wave of discontent washes over the stands as the spectators demand better.",
          "Boos echo loudly from the cheap seats, unhappy with the display.",
          "The crowd jeers loudly, unimpressed by the lack of bloodshed.",
          "Derisive whistles and insults rain down from the cheap seats.",
          "A chorus of deep, resonant boos echoes through the coliseum!",
          "A chorus of displeased jeers rains down upon the fighters.",
          "The audience turns hostile, screaming for actual violence.",
          "The crowd spits in disgust, demanding more brutal action!",
          "The crowd hurls insults, displeased with the display.",
          "Fruit is thrown from the stands in disgust.",
          "A chorus of groans sweeps the arena.",
          "The audience demands a better show!"
        ]
      },
      taunts: {
        winner: [
          "{{attacker}} says, 'And that is how a real warrior fights. Pay attention next time.'",
          "{{attacker}} plants a foot on {{defender}} and raises {{possessive}} weapon!",
          "{{attacker}} raises {{possessive}} arms in triumph, drinking in the cheers!",
          "{{attacker}} gestures to the stands, asking 'Is this the best they have?'",
          "{{attacker}} spits at their opponent's feet, a clear sign of disrespect.",
          "{{attacker}} flexes for the roaring crowd, basking in their dominance.",
          "{{attacker}} wipes {{possessive}} blade clean with a satisfied grin!",
          "{{attacker}} screams 'BLOOD FOR THE SANDS!' to the roaring crowd!",
          "{{attacker}} laughs and points at the fallen {{defender}}!",
          "{{attacker}} stands over {{defender}} in silent dominance.",
          "{{attacker}} bows to the crowd like a conquering hero!",
          "{{attacker}} sneers down at {{defender}} - 'Pathetic.'",
          "{{attacker}} roars, 'Who else wants to die today?!'"
        ],
        loser: [
          "Bleeding but unbowed, {{attacker}} beckons their opponent to try again.",
          "{{attacker}} flashes a bloody smile, seemingly enjoying the punishment.",
          "{{attacker}} struggles to {{possessive}} feet, refusing to stay down!",
          "Despite the odds, {{attacker}} beats their chest, refusing to yield.",
          "{{attacker}} refuses to show weakness, meeting {{defender}}'s eyes!",
          "{{attacker}} presses a hand to {{possessive}} wound and sneers.",
          "{{attacker}} spits, 'Strike for you... but I'm not gone yet.'",
          "{{attacker}} mutters curses under {{possessive}} breath.",
          "{{attacker}} spits 'May maggots partake of your corpse!'",
          "{{attacker}} glares defiance even as {{pronoun}} falls!",
          "{{attacker}} spits blood and refuses to look away.",
          "{{attacker}} wheezes, 'Not... done... yet...'",
          "{{attacker}} snarls, 'This isn't over!'"
        ],
        rivalry_winner: [
          "{{attacker}} says, 'That was a well fought, and honorable fight.'",
          "{{attacker}} stands triumphant over {{possessive}} hated rival!",
          "{{attacker}} destroys {{defender}}'s legacy with this victory!",
          "{{attacker}} makes sure it hurts, twisting the blade slowly.",
          "{{attacker}} howls in triumph over the broken {{defender}}!",
          "{{attacker}} spits on the fallen corpse of {{defender}}.",
          "{{attacker}} spits, 'Tell them in hell who sent you!'",
          "{{attacker}} screams 'The feud ends HERE!'",
          "{{attacker}} roars with pure vengeance!",
          "{{attacker}} spits on the ground near {{defender}}'s feet. 'Always second best.'",
          "'Is this all you have after all this time?' {{attacker}} sneers at {{defender}}.",
          "{{attacker}} points a bloody weapon at {{defender}}. 'I told you this would happen.'",
          "'I expected a challenge, not a repeat performance,' {{attacker}} mocks {{defender}}.",
          "{{attacker}} laughs coldly. 'Some things never change, do they, {{defender}}?'",
          "'You should have stayed retired,' {{attacker}} barks down at {{defender}}."
        ],
        rivalry_loser: [
          "{{attacker}} dies with {{defender}}'s name on {{possessive}} lips!",
          "{{attacker}} falls, but {{possessive}} eyes promise retribution!",
          "{{attacker}} curses {{defender}} even as {{pronoun}} falls!",
          "{{attacker}} snarls 'I'll see you again, {{defender}}!'",
          "{{attacker}} chokes out 'I'll... haunt... you...'",
          "{{attacker}} glares pure hatred at {{defender}}!",
          "{{attacker}} spits, 'You were lucky today...'",
          "{{attacker}} spits blood and swears revenge!",
          "{{attacker}} screams 'This isn't the END!'",
          "{{defender}} sneers at {{attacker}}, promising their feud is far from over."
        ]
      },
      initiative: [
        "Exploding into action before {{defender}} can react, {{attacker}} strikes.",
        "Taking the lead with a sudden, aggressive advance, {{attacker}} engages.",
        "{{attacker}} strikes preemptively, catching {{defender}} off guard.",
        "Winning the opening exchange of footwork, {{attacker}} strikes.",
        "With a sudden burst of speed, {{attacker}} seizes the opening!",
        "{{attacker}} forces the fight on {{possessive}} own terms.",
        "Seizing the initiative, {{attacker}} launches an assault.",
        "{{attacker}} moves first, seizing the initiative.",
        "{{attacker}} dictating the pace of the exchange.",
        "{{attacker}} seizes the moment, launching a ferocious offensive.",
        "Refusing to wait, {{attacker}} charges forward to dictate the terms.",
        "{{attacker}} breaks the standoff with a sudden, violent surge.",
        "Taking control of the center, {{attacker}} forces {{defender}} onto the back foot.",
        "{{attacker}} explodes into action, overwhelming {{defender}}'s defenses.",
        "With clinical precision, {{attacker}} takes the offensive."
      ],
      feints: [
        "{{attacker}} twitches {{possessive}} weapon, causing {{defender}} to flinch before striking.",
        "{{attacker}} feints a high line, drawing {{defender}} out of position.",
        "{{attacker}} pretends to stumble, baiting an attack from {{defender}}.",
        "A lightning-fast feint by {{attacker}} creates the perfect opening.",
        "A clever fake by {{attacker}} draws {{defender}} out of position.",
        "A deceptive step by {{attacker}} opens up {{defender}}'s guard.",
        "A subtle shoulder dip by {{attacker}} tricks {{defender}}.",
        "{{attacker}} feints a thrust, turning it into a slash.",
        "{{attacker}} sells a false strike beautifully.",
        "{{attacker}} feints high and strikes low."
      ],
      insights: {
        ST: [
          "{{attacker}}'s strength forces {{defender}} back on {{possessive}} heels!",
          "{{defender}}'s parry shatters under {{attacker}}'s monstrous strength!",
          "{{attacker}}'s crushing blows overwhelm {{defender}}'s defenses!",
          "{{defender}} cannot match {{attacker}}'s raw physical power!",
          "{{attacker}}'s strength dictates the pace of this exchange!",
          "{{attacker}}'s power leaves {{defender}} no room for error!",
          "{{defender}} winces at the weight of {{attacker}}'s blows!",
          "{{attacker}}'s strikes land with bone-crushing force!",
          "{{name}} flexes their muscles, showcasing immense raw strength.",
          "The sheer physical power of {{name}} is undeniable in that strike."
        ],
        SP: [
          "{{defender}} moves with blinding speed, leaving {{attacker}} swinging at shadows.",
          "{{attacker}}'s attacks find only empty air \u2014 {{defender}} is too fast!",
          "{{attacker}}'s weapon whistles past as {{defender}} dances away!",
          "{{defender}} is a blur, striking before {{attacker}} can react!",
          "{{attacker}}'s attacks are too slow to catch {{defender}}!",
          "{{defender}}'s speed leaves {{attacker}} one step behind!",
          "{{attacker}} cannot track {{defender}}'s rapid movements!",
          "{{defender}} darts in and out, controlling the tempo!",
          "{{defender}}'s quickness is simply overwhelming!",
          "{{name}} moves with blistering speed, a blur in the arena."
        ],
        DF: [
          "{{defender}} clumsily overextends, leaving {{reflexive}} wide open.",
          "{{defender}} blocks too late \u2014 {{pronoun}}'s out of position!",
          "{{defender}} leaves {{reflexive}} exposed with every strike!",
          "{{defender}}'s footwork is sloppy and predictable!",
          "{{defender}}'s defenses prove surprisingly porous!",
          "{{defender}} telegraphs every move \u2014 easy to read!",
          "{{defender}}'s shield drops at crucial moments!",
          "Gaps in {{defender}}'s guard are plain to see!",
          "{{defender}} parries wildly, wasting energy!",
          "{{defender}}'s defense is full of holes!"
        ],
        WL: [
          "Despite the punishment, {{defender}}'s iron will keeps {{reflexive}} standing.",
          "Mental toughness carries {{defender}} past {{possessive}} injuries!",
          "{{defender}}'s spirit burns brighter than {{possessive}} wounds!",
          "{{defender}} refuses to fall, powered by pure determination!",
          "{{defender}}'s grit keeps {{reflexive}} in this fight!",
          "{{defender}} fights on through sheer force of will!",
          "No amount of damage breaks {{defender}}'s resolve!",
          "{{defender}}'s endurance is truly remarkable!",
          "{{defender}}'s will to win defies the pain!",
          "{{defender}} simply will not stay down!"
        ],
        CN: [
          "{{defender}} absorbs punishment that would fell lesser warriors!",
          "{{defender}} shrugs off blows that would incapacitate most!",
          "{{defender}}'s body takes damage that would break others!",
          "{{defender}}'s physical resilience is remarkable!",
          "{{defender}} takes hits and keeps moving forward!",
          "{{defender}}'s constitution is truly impressive!",
          "{{name}} is showing signs of deep physical wear.",
          "{{defender}}'s durability extends this bout!",
          "{{defender}}'s toughness is legendary!",
          "{{name}}'s endurance is being tested."
        ],
        CT: [
          "{{defender}}'s cunning turns {{attacker}}'s aggression against {{reflexive}}!",
          "{{defender}} reads {{attacker}}'s intentions before the strike!",
          "{{defender}} exploits every mistake {{attacker}} makes!",
          "{{defender}} sees openings {{attacker}} never noticed!",
          "{{defender}}'s cunning mind controls this fight!",
          "{{name}}'s control over the fight is slipping.",
          "{{name}} struggles to maintain combat control.",
          "{{defender}}'s battle awareness is uncanny!",
          "{{defender}} thinks three moves ahead!",
          "{{name}} keeps their cool, a steady mind amidst the chaos."
        ]
      },
      fatal_damage: [
        "With a terrifying roar, {{attacker}} drives their {{weapon}} straight through {{defender}}'s sternum, ending it instantly.",
        "{{attacker}} feints low, catching {{defender}} off guard before severing their sword-arm at the elbow. The crowd erupts!",
        "The sheer trauma of {{attacker}}'s assault overwhelms {{defender}}'s body, causing instant and catastrophic failure.",
        "{{defender}} stumbles, and {{attacker}} capitalizes with a brutal decapitating swing. Blood sprays across the sand!",
        "A spray of vital fluids arcs across the arena as {{attacker}} critically destroys {{defender}}'s internal organs.",
        "{{attacker}} executes the final strike with clinical precision. {{defender}} is dead before they hit the ground.",
        "A blow that shakes the very soul! {{attacker}} inflicts horrific, unsurvivable damage to {{defender}}.",
        "{{defender}}'s form is mangled beyond recognition as {{attacker}} lands a strike of apocalyptic power.",
        "A spray of arterial crimson paints the arena; {{defender}} falls, their final breath rattling away.",
        "A sickening crunch echoes as {{attacker}}'s {{weapon}} caves in {{defender}}'s skull. It is over.",
        "{{defender}} collapses like a ruined tower, their lifeblood pooling into the thirsty arena sand.",
        "With a sickening crunch, the fatal blow lands. {{defender}}'s fighting days are eternally over.",
        "{{attacker}} sweeps {{defender}}'s legs out and delivers a final, merciless downward thrust.",
        "The blow is absolute. {{defender}}'s eyes glaze over as they crumple to the sands, lifeless.",
        "The crowd falls dead silent as the devastating hit ends {{defender}}'s life in an instant.",
        "A fatal strike that leaves {{defender}} no chance for survival.",
        "{{defender}} drops like a stone, life extinguished.",
        "A killing blow that ends it instantly.",
        "{{attacker}} delivers the final, lethal blow, ending {{defender}}'s agony.",
        "The light fades from {{defender}}'s eyes as {{attacker}} strikes true."
      ],
      hits: {
        generic: [
          "{{attacker}} finds an opening, carving into {{defender}}'s {{bodyPart}} with their {{weapon}}.",
          "Blood sprays onto the sand as {{attacker}} lands a solid blow on {{defender}}'s {{bodyPart}}.",
          "{{attacker}} slips inside {{defender}}'s reach and punishes the {{bodyPart}} without mercy.",
          "{{defender}} cannot stop the blow; {{attacker}}'s strike hammers the {{bodyPart}} hard.",
          "A sickening thud echoes as the {{weapon}} connects with {{defender}}'s {{bodyPart}}.",
          "The {{weapon}} lands with authority on {{defender}}'s {{bodyPart}} \u2014 a telling hit.",
          "{{attacker}} follows through with ruthless precision, scoring the {{bodyPart}}.",
          "A shower of crimson erupts as {{attacker}}'s {{weapon}} sinks into {{defender}}'s {{bodyPart}}.",
          "{{defender}} stumbles slightly as the {{weapon}} bites deep into their {{bodyPart}}.",
          "The crowd roars as {{attacker}}'s strike finds its mark, hammering the {{bodyPart}}.",
          "{{attacker}}'s assault proves overwhelming, punishing {{defender}}'s {{bodyPart}}.",
          "{{defender}} fails to check the assault; {{attacker}}'s {{weapon}} tears into the {{bodyPart}}.",
          "A brutal connection\u2014{{attacker}}'s {{weapon}} forces {{defender}} back with a hit to the {{bodyPart}}.",
          "The {{weapon}} lands with a sickening crunch, meeting its mark.",
          "A devastating strike connects, the impact echoing through the arena.",
          "The blow lands true, biting deep into flesh and bone.",
          "A brutal impact forces a ragged gasp from the wounded combatant.",
          "The strike finds a gap in the defense, delivering punishing force.",
          "The {{weapon}} lands on {{defender}} with a sickening crunch, meeting its mark.",
          "A devastating strike connects from {{attacker}}, the impact echoing through the arena.",
          "The blow lands true, biting deep into {{defender}}'s flesh and bone.",
          "A brutal impact forces a ragged gasp from {{defender}}.",
          "The strike from {{attacker}} finds a gap in the defense, delivering punishing force."
        ]
      },
      executions: [
        "With a terrifying war-cry, {{attacker}} tackles {{defender}} to the sand, repeatedly battering them with the pommel of their {{weapon}} until the crowd goes silent.",
        "The final blow is almost gentle \u2014 {{attacker}} lowers {{defender}} to the sand before driving the {{weapon}} through their heart with quiet efficiency.",
        "{{attacker}} hooks their {{weapon}} around {{defender}}'s ankle, ripping them to the dirt before driving a killing blow straight through their visor.",
        "{{defender}} stumbles, and {{attacker}} capitalizes instantly, sweeping their legs out and bringing the {{weapon}} down on their exposed throat.",
        "{{attacker}} drops their stance, letting {{defender}} lunge into empty air, before delivering a brutal execution strike to the back of the neck.",
        "A blinding fast combination from {{attacker}} leaves {{defender}} disoriented, culminating in a devastating thrust straight through the chest.",
        "With terrifying precision, {{attacker}} drives their {{weapon}} through {{defender}}'s eye, ending the bout before they even hit the ground.",
        "With a sickening wet thud, {{attacker}} buries their {{weapon}} into {{defender}}'s collarbone, wrenching it free in a fountain of crimson.",
        "The arena holds its breath as {{attacker}} knocks {{defender}}'s weapon aside, driving their own {{weapon}} straight through their heart.",
        "{{defender}} crawls for the edge of the pit, but {{attacker}} drags them back by the ankle, ending their struggle with a merciless stomp.",
        "{{attacker}} hooks their {{weapon}} around {{defender}}'s guard, violently dislocating their shoulder before delivering a fatal strike.",
        "{{defender}} stumbles, a fatal mistake! {{attacker}} capitalizes instantly, their {{weapon}} claiming another soul for the blood sands.",
        "{{attacker}} catches {{defender}} mid-stride, slamming them face-first into the arena floor before crushing their skull beneath a boot.",
        "A fountain of crimson! {{attacker}} runs {{defender}} through from behind, the blade emerging from their chest in a spray of hot blood.",
        "{{attacker}} kicks {{defender}} to their knees before elegantly separating their head from their shoulders. The crowd loses its mind!",
        "The crowd roars in bloodlust as {{attacker}} pins {{defender}} and systematically ends their life with surgical, gruesome precision.",
        "{{attacker}} pins {{defender}} against the arena wall, driving their {{weapon}} deep into their gut and lifting them off the ground.",
        "With cold detachment, {{attacker}} drives their weapon into the fallen {{defender}}, twisting it slowly until the twitching stops.",
        "A masterful feint by {{attacker}} leaves {{defender}} swinging at air, right before a brutal strike separates head from shoulders.",
        "{{attacker}} plants a boot on {{defender}}'s chest, ripping the {{weapon}} free as the fallen gladiator exhales their last breath.",
        "{{attacker}} steps into {{defender}}'s guard, driving a brutal blow upward that shatters their jaw in a spray of teeth and blood.",
        "A spray of crimson! {{attacker}} brings the {{weapon}} around in a horrifying arc that leaves {{defender}} in pieces on the sand.",
        "{{defender}} drops their guard for a fraction of a second, and {{attacker}} capitalizes, eviscerating them in one fluid motion.",
        "A whirlwind of steel! {{attacker}} delivers a flurry of blows that leaves {{defender}} unrecognizable on the blood-soaked sand.",
        "No mercy! {{attacker}} stands over a broken {{defender}} and delivers a gruesome, theatrical execution for the screaming fans.",
        "{{attacker}} seizes {{defender}}'s weapon arm, twisting it behind their back before driving a killing strike through the ribs.",
        "With a thunderous overhead strike, {{attacker}} splits {{defender}}'s guard \u2014 and their skull \u2014 in a single, devastating blow.",
        "{{attacker}} wrenches {{defender}}'s head back by the hair, drawing a blade across their throat in a grim, theatrical finale.",
        "With a savage roar, {{attacker}} hacks into {{defender}}'s collarbone, burying the {{weapon}} deep before wrenching it free.",
        "{{attacker}} parries {{defender}}'s desperate final lunge, redirecting the blade into its owner's heart with cruel irony.",
        "{{attacker}} drives the pommel of their {{weapon}} into {{defender}}'s face, following up with a brutal disembowelment.",
        "The crowd falls silent as {{attacker}} methodically dismembers {{defender}}, each strike more deliberate than the last.",
        "A brutal curb-stomp of an ending! {{attacker}} ensures {{defender}} will never rise again with a sickening final blow.",
        "{{attacker}} steps onto {{defender}}'s fallen weapon, sneering before bringing down a bone-shattering execution blow.",
        "{{defender}}'s weapon shatters! {{attacker}} seizes the moment, cleanly bisecting them in a spray of hot crimson.",
        "A spray of red paints the sands! {{attacker}} dismembers {{defender}} with terrifying ease, silencing the arena.",
        "Blood pools rapidly in the sand as {{attacker}} ruthlessly dispatches {{defender}}, leaving no chance for mercy.",
        "{{attacker}} stands over the broken body of {{defender}}, ending the bout with a swift, brutal final strike.",
        "A sickening crunch echoes through the silent arena as {{attacker}} ends {{defender}}'s struggle for good.",
        "The light abruptly leaves {{defender}}'s eyes as {{attacker}} delivers a cold, merciless finishing blow.",
        "With grim finality, {{attacker}} executes {{defender}}, their expression devoid of any triumph or joy.",
        "{{defender}} begs for mercy, but {{attacker}} only laughs, cleanly separating head from shoulders."
      ],
      meta: {
        popularity: {
          great: [
            "Great fame!",
            "The crowd absolutely worships {{name}}.",
            "{{name}} is the undeniable favorite here.",
            "The audience hangs on {{name}}'s every move.",
            "Deafening cheers greet {{name}}'s every success.",
            "{{name}} bathes in the adoration of the arena.",
            "The crowd chants {{name}}'s name in unison.",
            "{{name}} is a true superstar of the sands.",
            "The fans are going wild for their hero, {{name}}.",
            "{{name}} commands the arena's love completely."
          ],
          normal: [
            "Fame gained.",
            "The crowd offers polite applause for {{name}}.",
            "{{name}} has a solid, average following.",
            "The audience reacts normally to {{name}}'s actions.",
            "A smattering of cheers can be heard for {{name}}.",
            "{{name}} is respected, if not idolized.",
            "The crowd watches {{name}} with standard interest.",
            "{{name}} draws a typical arena reaction.",
            "The fans appreciate {{name}}'s steady work.",
            "{{name}} is a familiar face in the eyes of the mob."
          ]
        },
        skill_learns: [
          "Skill learned!",
          "{{name}} seems to have grasped a new technique mid-fight!",
          "A flash of insight leads to a new skill for {{name}}.",
          "{{name}} suddenly executes a move {{pronoun}} has never shown before.",
          "The crowd watches {{name}} learning from the exchange.",
          "A breakthrough moment! {{name}} has mastered something new.",
          "{{name}} adapts brilliantly, discovering a new martial trick.",
          "The heat of battle forges a new skill in {{name}}.",
          "{{name}} pulls off a completely new technique.",
          "An epiphany on the sands leads to a sudden improvement for {{name}}."
        ]
      },
      context: {
        rivalry: [
          "The long-standing grudge is settled in a spray of crimson!",
          "Years of bad blood culminate in a single, hateful strike!",
          "Decades of bad blood end in seconds of sheer butchery!",
          "The arena could barely contain the hatred on display!",
          "The bad blood between them was on full display today!",
          "This was more than a bout - it was a reckoning!",
          "The hatred is palpable between these two!",
          "Sparks flew as old scores were settled!",
          "A grudge match for the ages!",
          "The bitter feud ends here!"
        ],
        fame_great: [
          "{{name}} shows the skill that brought {{reflexive}} to glory!",
          "{{name}} demonstrates why {{pronoun}}'s the crowd's favorite!",
          "{{name}} proves why {{pronoun}}'s a legend of the arena!",
          "A performance worthy of {{name}}'s legendary status!",
          "{{name}} lives up to {{possessive}} reputation!",
          "The arena holds its breath watching {{name}}!",
          "The crowd chants {{name}}'s name in unison!",
          "A masterful display from the famed warrior!",
          "{{name}}'s fame precedes them in the arena.",
          "The legendary warrior, {{name}}, steps up.",
          "{{name}}, a true icon of the games."
        ],
        fame_unknown: [
          "{{name}} announces {{reflexive}} to the arena with this display!",
          "A relative unknown, {{name}}, tries to make their mark.",
          "{{name}} proves {{pronoun}} belongs in this arena!",
          "{{name}}, an obscure fighter looking for a break.",
          "Who is this {{name}}? The crowd demands to know!",
          "{{name}} is a fresh face in the brutal sands.",
          "{{name}} arrives on the scene with a bang!",
          "The unknown {{name}} shocks the crowd!",
          "An impressive debut from {{name}}!",
          "Nobody knows {{name}}'s name yet."
        ],
        style_matchups: {
          aimed_blow_vs_bashing: [
            "The precision fighter weaves through the wide, bashing swings.",
            "They look for the vital spots while avoiding the heavy clubs.",
            "The aimed striker tries to avoid the brutal bashing sweeps.",
            "Calculated strikes against overwhelming, blunt momentum.",
            "A duel of careful targeting against unrefined smashing.",
            "They attempt to dissect the brawler's heavy attacks.",
            "A battle between surgical strikes and blunt force.",
            "Precision meets power in this fascinating clash!",
            "The technician against the brawler!",
            "{{attacker}} tries to find a weak point, while {{defender}} just tries to smash through it.",
            "Precision meets brute force as {{attacker}} looks for an opening against {{defender}}'s wild swings.",
            "{{attacker}}'s calculated thrusts struggle against the overwhelming momentum of {{defender}}'s strikes.",
            "{{defender}}'s heavy impacts rattle {{attacker}}, disrupting their careful aim.",
            "A classic clash: {{attacker}}'s surgical strikes against {{defender}}'s crushing blows.",
            "{{attacker}} waits for the perfect moment as {{defender}} unleashes a barrage of heavy attacks."
          ],
          aimed_blow_vs_parry: [
            "The precision fighter tries to slip past the solid parries.",
            "A careful game of finding the perfect angle past the blade.",
            "The striker attempts to bypass the tight parrying defense.",
            "They aim for the joints, testing the parry's speed.",
            "Aimed strikes test the defender's reliable guard.",
            "A game of inches, trying to score past the parry.",
            "Careful thrusts against disciplined deflections.",
            "A battle of patience and counter-striking!",
            "They look for gaps in the defensive wall.",
            "Who will find the first opening?"
          ],
          bashing_vs_lunging: [
            "Wide arcs of blunt force against straight, lunging lines.",
            "They aim to break the lunger before they can connect.",
            "They try to swat the lunging fighter out of the air.",
            "Raw sweeping power against sudden, piercing darts.",
            "Heavy swings try to catch the lunging attacker.",
            "The brawler attempts to smash the agile lunger.",
            "The basher waits to crush the lunging advance.",
            "A heavy counter-swing meets the swift lunge.",
            "Power against reach - an explosive matchup!",
            "The hammer against the spear!"
          ],
          parry_vs_slashing: [
            "The defender raises their guard against the flurry of slashes.",
            "The defensive wall tries to hold against the slashing tide.",
            "They try to bind the slashing weapon with tight parries.",
            "A test of the parry against relentless cutting attacks.",
            "The defender holds firm, deflecting the sweeping cuts.",
            "Sparks fly as the parry meets the slashing edge.",
            "They attempt to deflect the wide slashing arcs.",
            "Solid parries meet a storm of cutting blades.",
            "Can the shield hold against the storm?",
            "Defense against relentless offense!"
          ]
        }
      }
    },
    crowd_reactions: {
      Bloodthirsty: [
        "The crowd howls for a brutal execution, their bloodlust practically vibrating the arena stones!",
        "A frenzied roar of 'FINISH THEM!' echoes from the highest tiers of the coliseum.",
        "The stands tremble as thousands stamp their feet, chanting for an execution!",
        "The stands are a sea of frothing madness as the crowd demands a brutal end!",
        "Spectators hurl insults and demand a slow, agonizing demise for the loser.",
        "A collective scream of primal fury rips from the crowd, demanding blood!",
        "A deafening chant of 'BLOOD! BLOOD! BLOOD!' rolls down from the stands.",
        "Chants of 'Spill their blood!' ring out across the coliseum.",
        "Feral cheers erupt as the crowd senses an impending kill.",
        "The mob is frenzied, screaming for blood and torn limbs!",
        "'SKULLS FOR THE SANDS!' echoes from the cheap seats."
      ],
      Theatrical: [
        "Gasps of horrific delight ripple through the stands as the true theatricality of the bloodshed is revealed.",
        "A wave of stunned silence is broken by scattered, rapturous applause for the macabre dance.",
        "The audience gasps in collective awe at the sheer spectacle of the violence unfolding.",
        "The crowd appreciates the sheer artistry of the carnage, murmuring in dark approval.",
        "The high lords in the private boxes nod in grim appreciation of the artistry.",
        "Even the most jaded nobles lean forward, captivated by the gruesome display.",
        "A lone spectator throws a single black rose into the blood-soaked arena.",
        "A smattering of polite, chilled applause greets the macabre display.",
        "Spectators shower the arena with roses, demanding more drama!",
        "The crowd murmurs in awe at the grotesque ballet of combat.",
        "The crowd gasps, utterly enthralled by the spectacle.",
        "A wave of dramatic applause washes over the fighters."
      ]
    }
  };
});

// src/data/narrative/combatStrikes.json
var require_combatStrikes = __commonJS(function(exports, module) {
  module.exports = {
    strikes: {
      generic: [
        "{{defender}} grunts as {{attacker}}'s strike connects solidly with the {{bodyPart}}.",
        "impacts with the sickening sound of snapping bone on {{defender}}'s {{bodyPart}}",
        "wrenches a pained gasp from {{defender}} with a strike to the {{bodyPart}}",
        "A brutal impact! {{attacker}} smashes into {{defender}}'s {{bodyPart}}.",
        "{{attacker}} lands a punishing blow on {{defender}}'s {{bodyPart}}.",
        "leaves a sickening, pulsing wound on {{defender}}'s {{bodyPart}}",
        "punishes {{defender}} with a brutal hit to the {{bodyPart}}",
        "carves a spray of crimson from {{defender}}'s {{bodyPart}}",
        "delivers a devastating blow to {{defender}}'s {{bodyPart}}",
        "lands a bone-jarring strike on {{defender}}'s {{bodyPart}}",
        "tears a ghastly gouge across {{defender}}'s {{bodyPart}}",
        "strikes cleanly against {{defender}}'s {{bodyPart}}",
        "{{attacker}} connects with a bruising strike.",
        "The attack finds its mark, drawing a wince.",
        "Impact! The strike connects solidly.",
        "A painful hit lands on {{defender}}.",
        "A solid blow lands squarely.",
        "{{attacker}} unleashes a punishing flurry against {{defender}}'s {{bodyPart}}.",
        "A brutal blow from {{attacker}} finds the {{bodyPart}} of {{defender}}.",
        "{{defender}}'s {{bodyPart}} absorbs a heavy impact from {{attacker}}.",
        "{{attacker}} connects fiercely with {{defender}}'s {{bodyPart}}.",
        "The sickening sound of impact echoes as {{attacker}} strikes {{defender}}'s {{bodyPart}}."
      ],
      slashing: {
        glancing: [
          "A hasty slash from {{attacker}} catches nothing but the wind and a loose thread on {{defender}}.",
          "{{attacker}}'s blade whistles through the air, catching only the edge of {{defender}}'s armor.",
          "A sweeping arc from {{attacker}} is mostly avoided, leaving a shallow scrape on {{defender}}.",
          "{{attacker}} slashes with {{possessive}} {{weapon}}, but the strike is a glancing blow only.",
          "{{attacker}}'s {{weapon}} barely grazes the {{bodyPart}}, leaving only a superficial scrape.",
          "{{attacker}} misjudges the distance, their {{weapon}} whistling past with only a minor nick.",
          "{{attacker}} executes a wide, sweeping slice that catches the edge of {{defender}}'s guard.",
          "A hasty swing by {{attacker}}; {{possessive}} {{weapon}} slides off {{defender}}'s guard.",
          "{{attacker}} slashes forward, but merely scores the surface of {{defender}}'s defenses.",
          "{{attacker}} throws a wild slash that only clips {{defender}}'s armor, failing to bite.",
          "With a sharp hiss of steel, {{attacker}} leaves a shallow cut across {{defender}}.",
          "A sweeping slash from {{attacker}} meets resistance, glancing off {{defender}}.",
          "{{attacker}}'s blade grazes {{defender}}'s armor, leaving a shallow scratch.",
          "{{attacker}}'s {{weapon}} skips harmlessly off {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s slash fails to bite deeply, merely scratching {{defender}}.",
          "The edge of {{attacker}}'s weapon glides harmlessly past {{defender}}.",
          "A swift slash from {{attacker}} connects, leaving a thin crimson line.",
          "A swift slash by {{attacker}} only catches {{defender}}'s clothing.",
          "The blade grazes {{defender}}, offering little more than a scratch.",
          "{{weapon}} skates harmlessly off the edge of {{defender}}'s armor.",
          "{{weapon}} leaves a shallow, bleeding scrape on {{defender}}.",
          "The slash catches a stray fold of fabric, doing minimal harm.",
          "It's a glancing slash that leaves only a superficial nick.",
          "A hasty swing from {{attacker}} barely nicks {{defender}}.",
          "{{attacker}} attempts a shallow cut, missing the vitals.",
          "A grazing slash barely scores {{defender}}'s defense.",
          "{{attacker}} drags the blade in a quick, shallow arc.",
          "{{attacker}}'s blade merely kisses {{defender}}'s {{bodyPart}}, drawing a thin red line.",
          "A swift slash from {{attacker}} catches the edge of {{defender}}'s {{bodyPart}}.",
          "{{attacker}} barely manages a superficial nick across {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s blade grazes the air, narrowly missing a vital point on {{defender}}.",
          "A shallow cut from {{attacker}} barely scratches {{defender}}'s armor.",
          "{{attacker}}'s slash catches a snag on {{defender}}'s gear, ruining the momentum.",
          "The edge of {{attacker}}'s blade merely scrapes against {{defender}}.",
          "A hasty slash from {{attacker}} glances harmlessly off {{defender}}.",
          "{{attacker}}'s blade grazes {{defender}}'s {{bodyPart}}, leaving a superficial scratch.",
          "A swift slash from {{attacker}} merely snags the fabric of {{defender}}'s armor.",
          "The sweeping edge of {{attacker}}'s weapon deflects harmlessly off {{defender}}.",
          "{{attacker}}'s attack connects, but lacks the force to deeply wound {{defender}}'s {{bodyPart}}.",
          "A shallow cut opens on {{defender}}'s {{bodyPart}} as {{attacker}}'s slash fails to bite."
        ],
        solid: [
          "{{attacker}} unleashes a blinding flurry of cuts with {{possessive}} {{weapon}}, biting into the {{bodyPart}}!",
          "{{attacker}} lunges with sudden ferocity, leaving a bloody trail across {{defender}}'s {{bodyPart}}!",
          "{{attacker}}'s {{weapon}} lunges with awesome cutting power, rending the {{bodyPart}}!",
          "A crimson line appears on {{defender}}'s {{bodyPart}} as {{attacker}} slashes cleanly.",
          "{{attacker}} draws blood with a vicious slice across {{defender}}'s {{bodyPart}}.",
          "{{attacker}} follows through beautifully, the {{weapon}} carving a crimson line.",
          "A wide arc from {{attacker}}'s {{weapon}} draws blood, a textbook slash.",
          "{{weapon}} cleaves into {{defender}}, drawing a sudden spray of red.",
          "{{attacker}}'s blade bites deep into {{defender}}'s {{bodyPart}}.",
          "A calculated slash finds purchase in {{defender}}'s flesh.",
          "The blade sinks in, leaving a deep and painful gash.",
          "{{attacker}} connects with a firm, punishing slash.",
          "A strong cut finds its mark on {{defender}}.",
          "A clean, ringing slice that bites through armor and draws a thin line of crimson.",
          "An arcing slash that whistles through the air before finding its mark.",
          "{{attacker}} carves a clean line into {{defender}}.",
          "With a vicious arc, {{attacker}} bites deep into {{defender}}'s flesh.",
          "{{attacker}} whirls, {{weapon}} seeking blood in a silver arc.",
          "{{attacker}} lunges with a devastating horizontal slice.",
          "With a grimace, {{attacker}} executes a rapid cross-slash.",
          "{{attacker}} steps into a punishing diagonal cleave.",
          "A flash of steel as {{attacker}} aims a wide, shearing cut.",
          "{{attacker}} drops low, sweeping the blade in a vicious rising slash.",
          "With a vicious backhand, {{attacker}} drives {{possessive}} {{weapon}} deeply into {{defender}}'s {{bodyPart}}.",
          "Blood sprays as {{attacker}}'s {{weapon}} finds purchase across {{defender}}'s {{bodyPart}}.",
          "{{attacker}} arcs their weapon in a vicious slash, tearing through {{defender}}'s guard.",
          "A silvery arc of death! {{attacker}} delivers a wide, sweeping slash that catches {{defender}} off balance.",
          "{{attacker}} lunges with a horizontal slash, aiming to cleave {{defender}} in two.",
          "The blade hums through the air as {{attacker}} unleashes a rapid series of slashing attacks.",
          "With murderous intent, {{attacker}} brings their weapon down in a punishing diagonal slash.",
          "{{attacker}} unleashes a wide, sweeping slash, aiming for {{defender}}'s flank.",
          "With a vicious backhand, {{attacker}}'s blade traces a deadly arc toward {{defender}}.",
          "{{attacker}} steps in close, delivering a brutal downward cleave.",
          "A flurry of flashing steel as {{attacker}} attempts to dismember {{defender}}.",
          "{{attacker}} slashes out with murderous intent, testing {{defender}}'s reflexes.",
          "{{attacker}} carves a brutal, bloody gash into {{defender}}'s {{bodyPart}}.",
          "A sweeping arc from {{attacker}} bites deep and true into {{defender}}'s {{bodyPart}}.",
          "{{defender}} hisses as {{attacker}}'s edge finds purchase in their {{bodyPart}}.",
          "A savage slash opens a wide gash across {{defender}}'s {{bodyPart}}.",
          "The blade bites deep, severing muscle in {{defender}}'s {{bodyPart}}.",
          "A solid, tearing slash from {{attacker}} catches {{defender}}'s {{bodyPart}}.",
          "{{attacker}} drags their blade forcefully across {{defender}}'s {{bodyPart}}.",
          "{{attacker}} draws a clean, sharp cut across {{defender}}'s {{bodyPart}}.",
          "A swift slice from {{attacker}} catches {{defender}}'s {{bodyPart}}.",
          "{{attacker}} swings in an arc, biting into {{defender}}'s {{bodyPart}}.",
          "Steel flashes as {{attacker}} slashes {{defender}}'s {{bodyPart}}.",
          "A cruel horizontal cut from {{attacker}} rips through {{defender}}'s {{bodyPart}}.",
          "{{defender}} winces as {{attacker}}'s blade grazes their {{bodyPart}}.",
          "{{attacker}} finds the mark, slashing deeply across {{defender}}'s {{bodyPart}}.",
          "A vicious, sweeping cut from {{attacker}} bites deep into {{defender}}'s flesh.",
          "{{attacker}} drives a clean, powerful slash right through {{defender}}'s guard.",
          "{{attacker}} executes a wide slashing arc that cuts deeply into {{defender}}.",
          "With a cruel swipe, {{attacker}} leaves a trailing arc of blood from {{defender}}.",
          "{{attacker}} finds the angle, delivering a vicious slicing blow against {{defender}}.",
          "{{attacker}} draws the blade across {{defender}}, leaving a nasty gash.",
          "A swift, sweeping slash from {{attacker}} catches {{defender}} off guard.",
          "{{attacker}} brings the edge down hard, biting into {{defender}}.",
          "{{attacker}} steps in and delivers a punishing slashing attack to {{defender}}.",
          "With practiced ease, {{attacker}} slices through {{defender}}'s defenses.",
          "{{attacker}}'s blade hums as it carves a path toward {{defender}}.",
          "A horizontal cleave from {{attacker}} tears into {{defender}}.",
          "{{attacker}} slices through {{defender}}'s defense, carving a deep furrow into their {{bodyPart}}.",
          "A wicked, hissing slash from {{attacker}} finds the soft meat of {{defender}}'s {{bodyPart}}.",
          "{{attacker}} rips a gaping gash across {{defender}}'s {{bodyPart}}, drawing a spray of crimson.",
          "Steel sings as {{attacker}} cleaves into {{defender}}'s {{bodyPart}} with terrifying momentum.",
          "{{attacker}} whips their blade in a deadly arc, sinking the edge into {{defender}}'s {{bodyPart}}.",
          "With a savage horizontal sweep, {{attacker}} opens a bloody smile on {{defender}}'s {{bodyPart}}.",
          "{{defender}}'s {{bodyPart}} is laid bare as {{attacker}}'s razor edge bites deep.",
          "A blindingly fast draw-cut from {{attacker}} ravages {{defender}}'s {{bodyPart}}.",
          "{{attacker}} carves a brutal line across {{defender}}'s {{bodyPart}}.",
          "A vicious slash bites deeply into {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s blade finds flesh, leaving a jagged wound on {{defender}}'s {{bodyPart}}.",
          "A clean, sweeping cut from {{attacker}} slices into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands a heavy, tearing slash across {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s blade bites viciously into {{defender}}'s {{bodyPart}}.",
          "A deep, crimson line is carved across {{defender}}'s {{bodyPart}} by {{attacker}}.",
          "{{attacker}} delivers a punishing slash, shearing into {{defender}}'s {{bodyPart}}.",
          "The razor edge of {{attacker}}'s weapon lays open {{defender}}'s {{bodyPart}}.",
          "{{defender}} reels as {{attacker}}'s slash connects with sickening force on their {{bodyPart}}."
        ],
        mastery: [
          "{{attacker}}'s {{weapon}} moves like an extension of {{attacker}}'s own soul, carving a perfect line across the {{bodyPart}}.",
          "In a blur of practiced rhythm, {{attacker}}'s {{weapon}} flows through {{defender}}'s guard to find the {{bodyPart}}.",
          "{{attacker}} turns the blade with frightening precision, finding a gap in the armor.",
          "A maestro's stroke\u2014{{attacker}} leaves a perfect, bleeding line across {{defender}}.",
          "A textbook slashing technique from {{attacker}}, carving a clean, devastating arc.",
          "The crowd marvels as {{attacker}}'s blade sings through flesh with terrible grace.",
          "A masterful cut perfectly exploits the smallest opening in {{defender}}'s stance.",
          "{{attacker}}'s sublime technique turns a simple slash into an act of deadly art.",
          "{{attacker}} weaves through {{defender}}'s guard to deliver a masterful cut.",
          "{{attacker}}'s sublime edge control results in a devastatingly clean slash.",
          "With flawless technique, the slash dissects {{defender}}'s guard entirely.",
          "A virtuoso display of swordsmanship leaves {{defender}} deeply wounded.",
          "The blade sings a deadly note as it expertly carves into {{defender}}.",
          "With expert precision, {{attacker}} executes a flawless rending arc.",
          "The slash is a work of grim art, precise and terrible.",
          "{{attacker}} executes a flawless, debilitating slice across {{defender}}'s torso.",
          "A masterclass in bloodshed: {{attacker}} leaves {{defender}} reeling with a perfect slash.",
          "With flawless edge alignment, {{attacker}} executes a breathtakingly smooth slice against {{defender}}.",
          "A masterclass in swordsmanship! {{attacker}} threads a beautiful, devastating arc through {{defender}}'s defense."
        ],
        critical_human: [
          "A horrifying display of speed as {{attacker}} carves a deep path through {{defender}}'s {{bodyPart}} with {{possessive}} {{weapon}}!",
          "With savage intent, {{attacker}} drives {{possessive}} {{weapon}} deep into the {{bodyPart}}, a geyser of crimson erupting.",
          "{{attacker}}'s {{weapon}} flashes as he takes a sudden vicious slash, nearly severing the {{bodyPart}}!",
          "With terrifying precision, {{attacker}}'s slash leaves {{defender}} staggered and bleeding!",
          "A masterful, vicious slash from {{attacker}} rips right through {{defender}}'s defenses!",
          "{{attacker}}'s blade dances, delivering a devastating, surgical cut to {{defender}}!",
          "A brutal, hacking cut bites deep into bone, dropping {{defender}} to their knees!",
          "{{attacker}} lands a terrifying slash that leaves {{defender}} visibly mangled!",
          "A devastating gash opens across {{defender}} as {{attacker}}'s slash hits true!",
          "{{attacker}} finds a critical opening, carving a deep wound into {{defender}}!",
          "The slash severs muscle and tendon, crippling {{defender}} with immense pain!",
          "A brutal, perfectly timed slash by {{attacker}} that bites sickeningly deep.",
          "A devastating gash is opened across {{defender}}, a life-threatening wound!",
          "{{attacker}} executes a flawless, flesh-rending slash against {{defender}}!",
          "The sheer force of the cut nearly dismembers {{defender}}!",
          "Blood sprays wildly as the slash hits a major artery!",
          "{{attacker}}'s blade shears through muscle and bone with devastating ease, severely maiming {{defender}}.",
          "A grotesque gash opens up on {{defender}}'s body as {{attacker}} lands a truly horrific cut."
        ],
        critical_supernatural: [
          "The air shudders as {{attacker}}'s {{weapon}} hums with a spectral light, cleaving through {{defender}}'s {{bodyPart}} and the very air itself.",
          "Aetheric pressure precedes the blow; {{attacker}}'s {{weapon}} strikes with the weight of stars, obliterating the {{bodyPart}}.",
          "The air screams as {{attacker}}'s {{weapon}} shears through reality itself into the {{bodyPart}}.",
          "With unearthly speed, {{attacker}} executes a slash that seems to sever spirit as much as flesh.",
          "Ethereal energy flares as {{weapon}} slices through {{defender}}'s defense like air.",
          "Ethereal energy flares as the unnatural slash tears the very soul of {{defender}}!",
          "The slash cuts through space itself, rending {{defender}} with otherworldly power!",
          "Dark magic pulses from the wound as the slashing attack strikes unnaturally deep!",
          "A blinding flash accompanies the strike, leaving a void where flesh should be!",
          "Otherworldly frost blooms from the brutal cut on {{defender}}'s {{bodyPart}}.",
          "The cursed blade carves a glowing, necrotic trench into {{defender}}'s body!",
          "Dark magic sears the wound as {{weapon}} bites deeply into {{defender}}.",
          "The very air distorts as {{attacker}} lands a magically enhanced slash.",
          "A spectral howl echoes as the preternatural cut defies physical armor!",
          "A phantom howl follows the glowing blade as it rends {{defender}}.",
          "The blade ignores mortal physics entirely, passing through {{defender}}'s guard to inflict a supernatural wound.",
          "Dark magic hums as {{attacker}}'s cut rends not just flesh, but {{defender}}'s very soul."
        ],
        fatal: [
          "{{attacker}} hooks {{defender}}'s guard away, then delivers a spinning strike to the {{bodyPart}} that silences the arena for a split second before the roar.",
          "{{attacker}} sidesteps a desperate lunge, bringing {{possessive}} {{weapon}} down in a monstrous arc that takes {{defender}}'s {{bodyPart}} clean off.",
          "{{attacker}} spins with terrible grace, their {{weapon}} severing {{defender}}'s {{bodyPart}}. The crowd screams as {{defender}} falls lifeless.",
          "{{attacker}} feints high, then sweeps {{possessive}} {{weapon}} low, completely butchering {{defender}}'s {{bodyPart}} in a fatal arc.",
          "A masterful stroke! {{attacker}} brings {{possessive}} {{weapon}} down with executioner's finality upon {{defender}}'s {{bodyPart}}!",
          "A horizontal sweep so powerful it almost bisects {{defender}}, as {{attacker}}'s {{weapon}} easily slices through the {{bodyPart}}.",
          "{{attacker}} finds the gap in the armor, dragging the edge of their {{weapon}} across {{defender}}'s {{bodyPart}} in a fatal slice.",
          "{{defender}} screams in agony as {{attacker}} butchers their {{bodyPart}}, leaving a gruesome testament to {{attacker}}'s prowess.",
          "With a sickening crunch, {{attacker}}'s {{weapon}} cleaves through {{defender}}'s {{bodyPart}}, ending their life in an instant.",
          "Blood rains upon the sand as {{attacker}} executes a brutal, ascending slash that completely ruins {{defender}}'s {{bodyPart}}.",
          "{{attacker}} pivots with blinding speed, their {{weapon}} carving a perfect, deadly arc through {{defender}}'s {{bodyPart}}.",
          "{{attacker}} chops downward with terrifying force, burying {{possessive}} {{weapon}} deep into {{defender}}'s {{bodyPart}}.",
          "A horrific spray of crimson follows as {{attacker}}'s blade effortlessly cleaves through {{defender}}'s {{bodyPart}}.",
          "{{attacker}} feints low, then pivots with blinding speed to sever {{defender}}'s {{bodyPart}}. The crowd erupts!",
          "With a terrifying horizontal sweep, {{attacker}} unzips {{defender}}'s {{bodyPart}}. The sands drink deep today.",
          "{{attacker}} feints low, catching {{defender}} off guard before severing their {{bodyPart}} at the joint.",
          "The blade sings a wicked tune as {{attacker}} cleaves {{defender}}'s {{bodyPart}} in a devastating arc.",
          "{{attacker}} slips past {{defender}}'s guard, drawing a deep, red ruin across their {{bodyPart}}.",
          "{{defender}} screams as {{attacker}}'s brutal slash turns their {{bodyPart}} into a mangled ruin.",
          "A spray of hot blood paints the sand as {{attacker}} shears through {{defender}}'s {{bodyPart}}.",
          "A fountain of gore erupts as {{attacker}}'s final strike decapitates {{defender}}!",
          "{{attacker}}'s blade flashes in a wide, devastating arc, opening a deep gash across {{defender}}'s {{bodyPart}}.",
          "With a ferocious twist, {{attacker}} sweeps their weapon horizontally, rending armor and flesh on {{defender}}'s {{bodyPart}}.",
          "{{attacker}} feints low, then brings their edge up sharply to carve a brutal line into {{defender}}'s {{bodyPart}}.",
          "A swift, elegant slice from {{attacker}} catches {{defender}} completely off guard, painting the sands crimson.",
          "{{attacker}} whips their blade around in a deadly figure-eight, catching {{defender}} viciously on the {{bodyPart}}.",
          "A perfectly timed lateral cut from {{attacker}} slices through {{defender}}'s defenses and into their {{bodyPart}}.",
          "{{attacker}} leaps forward, bringing their weapon down in a terrifying diagonal arc that strikes {{defender}}'s {{bodyPart}}.",
          "With a sudden burst of speed, {{attacker}} slashes {{defender}}'s {{bodyPart}} before they can even react.",
          "{{attacker}} reverses their grip mid-swing, opening a horrific wound on {{defender}}'s {{bodyPart}}."
        ],
        critical: [
          "{{attacker}} delivers a masterful, singing cut that bites deep into {{defender}}'s {{bodyPart}} with a shower of gore!",
          "With clinical efficiency, {{attacker}}'s blade finds a critical gap, laying open {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s {{weapon}} becomes a blur of silver, opening a horrific gash on {{defender}}'s {{bodyPart}}!",
          "{{attacker}} channels raw fury into a devastating horizontal sweep, nearly cleaving {{defender}} in twain!",
          "A blindingly fast slash from {{attacker}} leaves a horrific, gaping wound on {{defender}}'s {{bodyPart}}.",
          "{{attacker}} delivers a surgically precise slice with {{possessive}} {{weapon}}, finding a vital gap.",
          "With unnatural speed, {{attacker}}'s blade carves through {{defender}}'s defenses and flesh alike!",
          "Blood flows like a river as {{attacker}}'s slash finds its mark on {{defender}}'s {{bodyPart}}!",
          "{{attacker}} executes a terrifyingly precise slice, carving through armor and flesh alike!",
          "{{attacker}}'s slash bites deep, a horrific wound opening on {{defender}}'s {{bodyPart}}.",
          "A masterful flick of {{attacker}}'s wrists sends the {{weapon}} biting deeply into flesh.",
          "Blood arcs through the air as {{attacker}}'s {{weapon}} lands a deep, rending cut.",
          "{{attacker}} rips through {{defender}}'s guard with a devastating slash.",
          "{{attacker}} executes a perfect draw-cut, leaving a devastating wound!",
          "A masterful, sweeping cut from {{attacker}} bites deep into bone!",
          "{{attacker}} opens a ghastly, arterial wound in {{defender}}!",
          "Flesh parts like paper as {{attacker}}'s blade eviscerates {{defender}}!",
          "A devastating horizontal arc from {{attacker}} completely bypasses {{defender}}'s guard, cleaving into their {{bodyPart}}!",
          "{{attacker}} channels pure fury, {{possessive}} {{weapon}} tearing a gruesome gash through {{defender}}'s {{bodyPart}}.",
          "A devastating, deep laceration across {{defender}}'s {{bodyPart}} opens them up completely.",
          "{{attacker}} nearly severs {{defender}}'s {{bodyPart}} with a horrifyingly powerful slash.",
          "The blade sinks to the bone on {{defender}}'s {{bodyPart}}, drawing a scream.",
          "A lethal, masterful cut from {{attacker}} ravages {{defender}}'s {{bodyPart}}.",
          "{{defender}} reels as {{attacker}} carves a ruinous, gushing wound into their {{bodyPart}}.",
          "{{attacker}} lands a catastrophic, bone-deep slash on {{defender}}'s {{bodyPart}}!",
          "A devastating sweep from {{attacker}} nearly severs {{defender}}'s {{bodyPart}}!",
          "Blood sprays wildly as {{attacker}}'s critical slash ruins {{defender}}'s {{bodyPart}}.",
          "{{defender}} shrieks as {{attacker}}'s blade completely massacres their {{bodyPart}}.",
          "A sickening chunk of {{defender}}'s {{bodyPart}} is cleaved away by {{attacker}}'s savage blow!"
        ]
      },
      bashing: {
        glancing: [
          "{{attacker}}'s {{weapon}} delivers a glancing blow to the {{bodyPart}}, failing to transfer its full momentum.",
          "The heavy {{weapon}} clips {{defender}}, knocking them slightly off balance but little else.",
          "{{attacker}}'s {{weapon}} bounces off the {{bodyPart}} with a hollow clang.",
          "{{attacker}}'s heavy swing loses momentum, merely bruising {{defender}}.",
          "{{weapon}} thuds dully against {{defender}}'s guard, lacking power.",
          "The bash slides off {{defender}}'s armor with a hollow clang.",
          "{{weapon}} delivers a glancing knock to {{defender}}'s side.",
          "The blunt force slides off {{defender}}'s evasive pivot.",
          "{{defender}} absorbs the weak bash with barely a flinch.",
          "{{defender}} easily shrugs off the weak, glancing bash.",
          "The swing loses momentum and barely taps {{defender}}.",
          "A grazing bash causes no real damage to {{defender}}.",
          "It's a superficial hit that only bruises the ego.",
          "A rushed bash only clips {{defender}}'s shoulder.",
          "The heavy blow merely clips {{defender}}.",
          "{{attacker}} delivers a glancing blow that barely shakes {{defender}}.",
          "A clunky swing from {{attacker}} rattles off {{defender}}'s guard.",
          "{{attacker}} swings {{possessive}} {{weapon}} heavily, but it merely grazes {{defender}}'s shoulder.",
          "The crushing force of {{attacker}}'s {{weapon}} is largely deflected by {{defender}}'s hurried block.",
          "The heavy swing of {{attacker}}'s weapon merely grazes {{defender}}'s shoulder.",
          "{{attacker}}'s crushing blow glances off {{defender}}, causing little harm.",
          "{{attacker}} brings down their weapon, but {{defender}} steps into the blow, turning it into a light tap.",
          "A massive swing from {{attacker}} misses the center, glancing off {{defender}}.",
          "{{attacker}}'s brutal strike only clips {{defender}}'s guard.",
          "{{attacker}}'s weapon skitters off {{defender}}'s {{bodyPart}}, lacking full impact.",
          "A rushed swing from {{attacker}} delivers only a dull thud against {{defender}}'s {{bodyPart}}.",
          "{{defender}} easily shrugs off a weak, grazing blow to their {{bodyPart}}.",
          "{{attacker}}'s swing goes wide, merely bruising the air near {{defender}}.",
          "A clumsy strike from {{attacker}} deflects off {{defender}}'s shoulder.",
          "{{attacker}}'s heavy blow loses its momentum, barely nudging {{defender}}.",
          "The blunt weapon skids harmlessly off {{defender}}'s guard.",
          "A poorly aimed smash from {{attacker}} glances off {{defender}}'s armor.",
          "{{attacker}}'s heavy swing grazes {{defender}}, delivering only a jarring knock.",
          "A clumsy swing from {{attacker}} thuds weakly against {{defender}}'s {{bodyPart}}.",
          "{{defender}} absorbs the glancing blow, merely stumbling from {{attacker}}'s strike.",
          "The brunt of {{attacker}}'s smashing blow misses, leaving {{defender}} only slightly bruised.",
          "{{attacker}}'s weapon clips {{defender}}, doing little more than rattling their teeth."
        ],
        solid: [
          "{{attacker}} steps into the swing, bringing {{possessive}} {{weapon}} down hard on {{defender}}'s {{bodyPart}}.",
          "{{attacker}} roars, bringing {{possessive}} {{weapon}} down like an executioner's maul on the {{bodyPart}}!",
          "A thundering blow from {{attacker}} hammers into the {{bodyPart}}, rattling {{defender}} to the core!",
          "A thunderous blow from {{attacker}}'s {{weapon}} connects solidly with {{defender}}'s {{bodyPart}}.",
          "Using sheer momentum, {{attacker}} swings a devastating bash that threatens to crush {{defender}}.",
          "{{attacker}} swings with terrible momentum, {{possessive}} {{weapon}} smashing the {{bodyPart}}!",
          "{{attacker}} steps into a crushing overhead bash that reverberates through {{defender}}'s bones.",
          "{{possessive}} {{weapon}} connects with a sickening crunch against {{defender}}'s {{bodyPart}}!",
          "{{attacker}} brings {{possessive}} {{weapon}} down hard, a meaty thud echoing across the sands.",
          "The brutal weight of {{attacker}}'s bash shudders through {{defender}}'s guard, bruising bone.",
          "{{attacker}}'s {{weapon}} crashes into {{defender}}'s {{bodyPart}} with bone-jarring force!",
          "{{attacker}} delivers a thunderous bash, driving all the breath from {{defender}}'s lungs.",
          "{{attacker}} unleashes a colossal swing, aiming to crush {{defender}} where they stand.",
          "The sickening thud of the bash echoes as {{attacker}} brutally pummels {{defender}}.",
          "The sheer weight of {{attacker}}'s {{weapon}} crushes inward with a sickening thud.",
          "With terrible momentum, {{attacker}} drives the blunt head of their weapon forward.",
          "A devastating overhead smash from {{attacker}} threatens to pulverize {{defender}}.",
          "A heavy, blunt impact! {{attacker}} hammers {{defender}} with an unforgiving bash.",
          "{{attacker}}'s heavy blow connects with a sickening thud against {{defender}}.",
          "A punishing blow from {{attacker}}'s {{weapon}} rattles {{defender}}'s teeth.",
          "A guttural roar escapes {{attacker}} as they swing their heavy {{weapon}}.",
          "A heavy, sweeping swing from {{attacker}} catches {{defender}} forcefully.",
          "The blunt force of {{attacker}}'s weapon connects with a dull, heavy thud.",
          "{{attacker}} delivers a solid thump that rattles {{defender}}'s teeth.",
          "{{attacker}} steps forward and delivers a brutal, concussive strike.",
          "{{attacker}} leverages their weight into a crushing backhand swing.",
          "{{attacker}} swings their heavy weapon with bone-crushing momentum.",
          "A concussive strike that visibly rattles the teeth in their skull.",
          "{{attacker}} swings wide, landing a crushing blow on {{defender}}.",
          "The air hums as {{attacker}} throws a massive, sweeping bludgeon.",
          "With raw power, {{attacker}} hammers at {{defender}}'s defenses.",
          "A dull, sickening thud echoes as bone meets unyielding metal.",
          "{{attacker}} brings the bludgeon down in a bone-jarring arc.",
          "{{attacker}} winds up and unleashes a bone-rattling smash.",
          "{{attacker}} brings {{weapon}} down like a judge's gavel.",
          "Bones rattle as {{attacker}} smashes into {{defender}}.",
          "The heavy bash knocks the wind out of {{defender}}.",
          "A solid thud echoes as {{weapon}} connects cleanly.",
          "The impact sends a shockwave through {{defender}}.",
          "A firm bash leaves a nasty bruise on {{defender}}.",
          "{{attacker}} lands a heavy, bone-jarring blow.",
          "{{attacker}} delivers a sickening, bone-rattling crush to {{defender}}'s {{bodyPart}}.",
          "The heavy impact of {{attacker}}'s strike leaves {{defender}}'s {{bodyPart}} bruised and battered.",
          "A tremendous, sweeping blow from {{attacker}} slams punishingly into {{defender}}'s {{bodyPart}}.",
          "A brutal bash crushes the bone in {{defender}}'s {{bodyPart}}.",
          "The heavy impact shatters the resistance of {{defender}}'s {{bodyPart}}.",
          "With a sickening crunch, {{attacker}} hammers their weapon into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} delivers a heavy, blunt trauma to {{defender}}'s {{bodyPart}}.",
          "{{attacker}} swings heavily, bludgeoning {{defender}}'s {{bodyPart}}.",
          "A dull thud echoes as {{attacker}} slams into {{defender}}'s {{bodyPart}}.",
          "{{defender}} staggers as a heavy blow lands squarely on their {{bodyPart}}.",
          "{{attacker}} drives their weapon brutally into {{defender}}'s {{bodyPart}}.",
          "A sickening crunch signals a solid strike to {{defender}}'s {{bodyPart}}.",
          "{{attacker}} batters {{defender}}'s {{bodyPart}} with a punishing swing.",
          "With raw power, {{attacker}} smashes {{defender}}'s {{bodyPart}}.",
          "A heavy, concussive smash from {{attacker}} violently staggers {{defender}}.",
          "{{attacker}} steps into a crushing bludgeon that slams hard into {{defender}}.",
          "{{attacker}} swings with bone-shattering force, slamming into {{defender}}.",
          "A heavy, concussive blow from {{attacker}} rocks {{defender}} on their heels.",
          "{{attacker}} brings the weapon down in a brutal, crushing strike against {{defender}}.",
          "With brute strength, {{attacker}} bludgeons {{defender}} mercilessly.",
          "The sickening thud of {{attacker}}'s weapon connects solidly with {{defender}}.",
          "{{attacker}} delivers a crushing strike that leaves {{defender}} staggering.",
          "A relentless bashing attack from {{attacker}} pounds {{defender}}.",
          "{{attacker}} throws their weight behind a thunderous blow against {{defender}}.",
          "{{defender}} reels from the sheer concussive impact of {{attacker}}'s strike.",
          "{{attacker}} hammers away, landing a heavy bludgeoning blow on {{defender}}.",
          "{{attacker}} brings their weapon down like a thunderbolt, caving in {{defender}}'s {{bodyPart}}.",
          "The sickening crunch of bone echoes as {{attacker}} obliterates {{defender}}'s {{bodyPart}}.",
          "{{attacker}} hammers through the guard, reducing {{defender}}'s {{bodyPart}} to a bruised pulp.",
          "A brutal, sweeping smash from {{attacker}} splinters {{defender}}'s {{bodyPart}}.",
          "{{attacker}} unloads a devastating concussive blow straight into {{defender}}'s {{bodyPart}}.",
          "With bone-shattering force, {{attacker}} pulverizes {{defender}}'s {{bodyPart}}.",
          "{{defender}} reels as {{attacker}}'s crushing strike completely flattens their {{bodyPart}}.",
          "{{attacker}} drives all their weight into a brutal swing, snapping {{defender}}'s {{bodyPart}}.",
          "A bone-rattling slam from {{attacker}} connects with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} delivers a heavy, crushing blow to {{defender}}'s {{bodyPart}}.",
          "The dull thud of impact echoes as {{attacker}} smashes {{defender}}'s {{bodyPart}}.",
          "{{defender}}'s {{bodyPart}} caves slightly under a punishing bash from {{attacker}}.",
          "A solid, concussive strike from {{attacker}} rocks {{defender}}'s {{bodyPart}}.",
          "A bone-jarring impact echoes as {{attacker}} smashes {{defender}}'s {{bodyPart}}.",
          "{{attacker}} delivers a punishing, concussive blow to {{defender}}'s {{bodyPart}}.",
          "{{defender}} staggers backward from the brutal, heavy thud against their {{bodyPart}}.",
          "A sickening crunch accompanies {{attacker}}'s heavy strike to {{defender}}'s {{bodyPart}}.",
          "{{attacker}} crashes their weapon into {{defender}}'s {{bodyPart}} with staggering force."
        ],
        mastery: [
          "{{attacker}} catches {{defender}} in a perfect orbit of weight, hammering the {{bodyPart}} with crushing precision.",
          "{{attacker}} finds the perfect leverage, driving {{weapon}} into {{defender}} with devastating efficiency.",
          "{{attacker}} uses the weight of {{possessive}} {{weapon}} perfectly, delivering a bone-rattling strike.",
          "{{attacker}} shatters {{defender}}'s posture with a perfectly timed bludgeoning strike.",
          "With terrifying kinetic efficiency, {{attacker}} crushes into {{defender}}'s defenses.",
          "Fluid and terrible, {{attacker}}'s mace finds the absolute weakest point in the armor.",
          "{{attacker}} demonstrates masterful control over the heavy weapon's inertia.",
          "With perfect timing, the bash crumbles {{defender}}'s structural integrity.",
          "A masterclass in momentum! {{attacker}} turns a block into a crushing bash.",
          "Using flawless momentum, the heavy blow shatters {{defender}}'s balance.",
          "The bludgeon finds the perfect anatomical weak point to maximize trauma.",
          "A masterful swing transfers incredible kinetic energy into {{defender}}.",
          "With practiced savagery, {{attacker}} delivers a concussive masterwork.",
          "The strike is an undeniable lesson in applied physics and blunt force.",
          "The bash is delivered with terrifying, calculated leverage.",
          "{{attacker}} delivers a crushing strike that visibly buckles {{defender}}.",
          "Using perfect leverage, {{attacker}} lands an unbelievably precise and crushing blow on {{defender}}.",
          "{{attacker}} flows effortlessly into a ruinous, perfectly timed smash against {{defender}}."
        ],
        critical_human: [
          "The arena trembles as {{attacker}} unleashes a terrifying overhead smash, crushing the {{bodyPart}}!",
          "{{attacker}} unloads a devastating haymaker with {{possessive}} {{weapon}}, shattering resistance.",
          "With explosive force, {{attacker}} smashes into {{defender}}, denting armor and breaking bone!",
          "The sickening crunch of bone echoes as {{attacker}} batters {{defender}} with a critical blow!",
          "A merciless, heavy swing from {{attacker}} leaves {{defender}} completely winded and bruised!",
          "A bone-shattering blow from {{attacker}} sends shockwaves through {{defender}}'s frame!",
          "A sickening crunch of bone as {{attacker}}'s {{weapon}} caves in the {{bodyPart}}.",
          "{{defender}} staggers violently as {{attacker}} lands a terrifyingly heavy bash!",
          "{{attacker}} delivers a crushing strike that leaves {{defender}} reeling!",
          "The crushing impact caves in {{defender}}'s defenses, breaking ribs!",
          "A concussive, skull-rattling blow leaves {{defender}} seeing stars!",
          "The massive strike crumples {{defender}} in a heap of broken limbs!",
          "Internal organs are ruptured by the brutal, blunt force trauma!",
          "{{defender}} spits blood as the devastating bash shatters bone!",
          "A horrifying crunch echoes across the arena as the bash lands!",
          "Bones snap like twigs under the immense pressure of the bash!",
          "A sickening, audible crunch echoes as {{attacker}}'s brutal swing caves in {{defender}}'s defenses.",
          "{{defender}}'s bones splinter under the sheer concussive force of {{attacker}}'s mighty blow."
        ],
        critical_supernatural: [
          "Gravity itself seems to bow to {{attacker}}'s {{weapon}}, creating a localized shockwave on the {{bodyPart}}.",
          "With the force of a falling meteor, {{attacker}} obliterates the defense with a thunderous strike.",
          "The bash lands with the force of a meteor, shattering physical and magical wards alike!",
          "The impact of {{attacker}}'s {{weapon}} sends a shockwave through the arena floor.",
          "Demonic strength drives the crushing blow, fracturing reality around {{defender}}!",
          "An arcane shockwave erupts on impact, crushing {{defender}} with unseen gravity!",
          "A thunderous, unnatural boom deafens the arena as the supernatural bash strikes!",
          "The weapon roars with elemental fury, pulverizing {{defender}}'s very essence!",
          "Ghostly whispers accompany the deafening crack of {{weapon}} on {{defender}}.",
          "Eldritch sparks rain down as {{attacker}}'s bash shatters magical barriers.",
          "Ghostly shockwaves ripple outward from the devastating, enchanted impact!",
          "The blow hits with impossible weight, invoking ancient, crushing magics!",
          "A shockwave of raw power erupts as {{weapon}} hammers into {{defender}}.",
          "The ground itself shudders beneath the supernaturally heavy blow.",
          "Corrupted energy violently bursts from the brutal impact.",
          "With unnatural momentum, {{attacker}}'s strike hits with the force of a falling meteor, crushing {{defender}}.",
          "Eldritch shockwaves ripple from the impact as {{attacker}} brutally pummels {{defender}}."
        ],
        fatal: [
          "With terrifying momentum, {{attacker}} sweeps {{possessive}} {{weapon}} into {{defender}}'s {{bodyPart}}, delivering a crushing blow that ends the fight instantly.",
          "{{attacker}} heaves {{possessive}} {{weapon}} overhead and brings it down like a falling mountain, smashing {{defender}}'s {{bodyPart}} into pulp.",
          "{{attacker}} brings {{possessive}} {{weapon}} down like a judge's gavel, caving in {{defender}}'s {{bodyPart}} with a sickening crunch.",
          "{{attacker}} winds up and unleashes hell, {{possessive}} {{weapon}} obliterating {{defender}}'s {{bodyPart}} and their life with it.",
          "With earth-shattering force, {{attacker}} brings {{possessive}} {{weapon}} down, completely pulverizing {{defender}}'s {{bodyPart}}.",
          "The horrifying crunch of bone echoes through the arena as {{attacker}}'s {{weapon}} utterly demolishes {{defender}}'s {{bodyPart}}.",
          "{{defender}}'s {{bodyPart}} caves in with a wet crunch as {{attacker}} brings {{possessive}} {{weapon}} crashing down. It is over.",
          "{{attacker}} winds up and delivers a sickening, bone-shattering smash to {{defender}}'s {{bodyPart}}, ending their life instantly.",
          "{{defender}}'s {{bodyPart}} caves inward in a horrific display of brute strength as {{attacker}} lands the final, crushing blow.",
          "The concussive impact of {{attacker}}'s {{weapon}} on {{defender}}'s {{bodyPart}} echoes like thunder across the silent arena.",
          "There is no getting up from that. {{attacker}} shatters {{defender}}'s {{bodyPart}} completely with a horrific smash.",
          "There is nothing but ruin left of {{defender}}'s {{bodyPart}} after {{attacker}} connects with a sickening, wet thud.",
          "A brutal, sweeping blow from {{attacker}} shatters {{defender}}'s {{bodyPart}}, ending the fight in a lethal display.",
          "{{attacker}} knocks {{defender}} to their knees, then delivers a devastating execution strike to the {{bodyPart}}.",
          "The heavy thud of {{attacker}}'s {{weapon}} against {{defender}}'s {{bodyPart}} signals a brutal end to the bout.",
          "A sickening 'CRACK' echoes as {{attacker}} shatters {{defender}}'s {{bodyPart}} with a monstrous swing.",
          "{{attacker}} pulverizes {{defender}}'s {{bodyPart}} with a bone-jarring blow from their {{weapon}}.",
          "{{defender}} collapses as {{attacker}} delivers a crushing strike that caves in their {{bodyPart}}.",
          "The sheer concussive force of {{attacker}}'s {{weapon}} demolishes {{defender}}'s {{bodyPart}}.",
          "{{attacker}} delivers a horrifying, skull-crushing execution!",
          "With a sickening crunch, {{attacker}} hammers their weapon into {{defender}}'s {{bodyPart}}, rattling their bones.",
          "{{attacker}} brings the full weight of their weapon crashing down upon {{defender}}'s {{bodyPart}} like an anvil.",
          "A devastating bludgeoning blow from {{attacker}} knocks the wind out of {{defender}} and shatters their defense.",
          "{{attacker}} violently swings their weapon, pulverizing {{defender}}'s {{bodyPart}} with bone-breaking force.",
          "Putting their entire body behind the strike, {{attacker}} smashes {{defender}} squarely in the {{bodyPart}}.",
          "{{attacker}} steps into a crushing overhead swing that connects horribly with {{defender}}'s {{bodyPart}}.",
          "With relentless fury, {{attacker}} batters {{defender}}'s {{bodyPart}}, leaving a massive bruise.",
          "A brutal backhand swing from {{attacker}} sends {{defender}} reeling from a strike to the {{bodyPart}}.",
          "{{attacker}} drives the pommel of their weapon squarely into {{defender}}'s {{bodyPart}}.",
          "Using sheer brute force, {{attacker}} bludgeons {{defender}}'s {{bodyPart}} with a terrifying impact."
        ],
        critical: [
          "{{attacker}} brings their {{weapon}} down like a judge's gavel, smashing {{defender}}'s {{bodyPart}}.",
          "A sickening crunch fills the air as {{attacker}}'s heavy strike caves in {{defender}}'s defenses.",
          "{{attacker}} steps into a crushing swing, smashing {{possessive}} {{weapon}} with ruinous force.",
          "With bone-shattering force, {{attacker}} delivers a crushing blow that echoes across the arena!",
          "{{attacker}} puts their entire weight into a brutal, looping smash that connects perfectly.",
          "The sickening crunch of bone echoes as {{attacker}}'s {{weapon}} crashes into {{defender}}.",
          "The sheer blunt force of {{attacker}}'s swing shatters bone and splinters armor on impact!",
          "The impact is so severe it seems to momentarily distort {{defender}}'s silhouette.",
          "{{defender}} reels from a devastating bludgeoning blow delivered by {{attacker}}.",
          "{{attacker}} delivers a concussive blow that visibly rocks {{defender}}'s frame.",
          "{{attacker}} caves in a section of {{defender}}'s armor with horrifying force.",
          "{{attacker}}'s raw momentum translates into a brutal, rib-cracking strike.",
          "A colossal smash from {{attacker}} leaves {{defender}} reeling in agony.",
          "Bones practically disintegrate under {{attacker}}'s thunderous blow!",
          "A truly ruinous bash that sends shockwaves through the arena!",
          "A catastrophic impact! {{attacker}} pulverizes {{defender}} with bone-shattering force!",
          "{{attacker}} lands a meteoric blow, devastating {{defender}}!",
          "With bone-shattering force, {{attacker}} brings {{possessive}} {{weapon}} crashing down, crushing {{defender}}'s {{bodyPart}}!",
          "The arena echoes with a sickening crunch as {{attacker}}'s {{weapon}} completely mangles {{defender}}'s {{bodyPart}}.",
          "The sickening crunch of shattering bone follows {{attacker}}'s smash to {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands a devastating, crushing blow that mangles {{defender}}'s {{bodyPart}}.",
          "{{defender}} crumples as a ruinous slam utterly destroys their {{bodyPart}}.",
          "A skull-splitting bash from {{attacker}} leaves {{defender}}'s {{bodyPart}} completely ruined.",
          "The sheer concussive force of {{attacker}}'s strike shatters {{defender}}'s {{bodyPart}}.",
          "{{attacker}} crushes {{defender}}'s {{bodyPart}} with an absolutely devastating blow!",
          "The horrifying sound of splintering bone erupts as {{attacker}} obliterates {{defender}}'s {{bodyPart}}!",
          "{{defender}} collapses as a critical smash from {{attacker}} caves in their {{bodyPart}}.",
          "A catastrophic, thundering strike from {{attacker}} completely ruins {{defender}}'s {{bodyPart}}!",
          "{{attacker}} lands a skull-rattling, bone-powdering smash on {{defender}}'s {{bodyPart}}!"
        ]
      },
      piercing: {
        glancing: [
          "{{attacker}}'s thrust with {{possessive}} {{weapon}} goes wide, tearing merely the fabric of {{defender}}'s tunic.",
          "A quick thrust by {{attacker}} is easily sidestepped by {{defender}}, resulting in a minor scrape.",
          "{{attacker}}'s {{weapon}} darts forward, but only catches the edge of {{defender}}'s defenses.",
          "{{attacker}}'s {{weapon}} skips off the {{bodyPart}}, barely scratching the surface.",
          "{{attacker}} attempts to skewer, but the point slides harmlessly past {{defender}}.",
          "A sudden thrust by {{attacker}} is easily deflected, scratching {{defender}}.",
          "{{attacker}}'s thrust catches only air and a piece of {{defender}}'s sleeve.",
          "A quick jab by {{attacker}} is easily deflected, leaving a shallow scratch.",
          "The point of the {{weapon}} scrapes harmlessly along {{defender}}'s ribs.",
          "{{attacker}} lunges with intent, but the thrust only grazes {{defender}}.",
          "A rapid stab from {{attacker}} is mostly turned aside by {{defender}}.",
          "A quick jab from {{attacker}} deflects harmlessly off {{defender}}.",
          "{{defender}} sidesteps, letting the thrust pass with a mere graze.",
          "{{weapon}} pokes harmlessly off the armor of {{defender}}.",
          "The {{weapon}} fails to bite, merely snagging on leather.",
          "{{defender}} easily twists away from the shallow poke.",
          "The thrust merely scratches {{defender}}'s exterior.",
          "A hurried jab from {{attacker}} is easily deflected.",
          "The thrust goes wide, dealing only a glancing nick.",
          "It's a superficial stab that fails to penetrate.",
          "The tip of {{weapon}} catches only clothing.",
          "A weak lunge results in a minor scrape.",
          "{{attacker}} thrusts wildly, the tip only snagging {{defender}}'s {{bodyPart}}.",
          "A rapid lunge from {{attacker}} merely scratches the surface of {{defender}}'s {{bodyPart}}.",
          "{{attacker}} fails to find depth, leaving only a shallow poke on {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s thrust catches a seam, deflecting harmlessly away from {{defender}}.",
          "A quick lunge from {{attacker}} only snags {{defender}}'s clothing.",
          "{{attacker}}'s point scrapes lightly across {{defender}}'s defenses.",
          "A shallow stab from {{attacker}} merely scratches {{defender}}.",
          "{{attacker}}'s thrust is easily deflected, barely grazing {{defender}}.",
          "{{attacker}}'s thrust deflects off the edge of {{defender}}'s guard.",
          "A quick lunge from {{attacker}} results in a mere pinprick on {{defender}}'s {{bodyPart}}.",
          "The point of {{attacker}}'s weapon scrapes harmlessly across {{defender}}.",
          "{{defender}} barely leans away, turning a fatal thrust into a shallow scratch.",
          "{{attacker}}'s rapid jab only manages to tear the outer layer of {{defender}}'s protection."
        ],
        solid: [
          "With practiced precision, {{attacker}} slips {{possessive}} {{weapon}} past {{defender}}'s defenses, striking the {{bodyPart}}!",
          "{{attacker}} drops {{possessive}} center and drives a blinding lunge with {{possessive}} {{weapon}} into the {{bodyPart}}!",
          "{{attacker}} feints high, then drops {{possessive}} {{weapon}} in a vicious thrust toward the {{bodyPart}}!",
          "{{attacker}} extends {{possessive}} {{weapon}} in a lightning lunge that finds {{defender}}'s {{bodyPart}}!",
          "{{attacker}} catches {{defender}} flat-footed and sinks {{possessive}} {{weapon}} into the {{bodyPart}}.",
          "With deadly precision, {{attacker}} drives a piercing attack straight toward {{defender}}'s vitals.",
          "{{attacker}} finds their mark, driving the tip of {{possessive}} {{weapon}} into the {{bodyPart}}.",
          "A clean thrust from {{attacker}} sinks into {{defender}}'s {{bodyPart}} with punishing accuracy!",
          "{{attacker}}'s {{weapon}} punches through {{defender}}'s guard and bites into the {{bodyPart}}!",
          "A deadly thrust! {{attacker}}'s {{weapon}} punches cleanly into {{defender}}'s {{bodyPart}}!",
          "A rapid staccato of piercing jabs from {{attacker}} forces {{defender}} onto the back foot.",
          "A precise, clinical thrust from {{attacker}} punctures {{defender}}'s {{bodyPart}}.",
          "{{attacker}} twists their weapon, sinking a deep piercing blow into {{defender}}.",
          "{{attacker}} aims a surgical thrust right at the gap in {{defender}}'s defenses.",
          "{{attacker}} lunges with blinding speed, thrusting toward {{defender}}'s vitals.",
          "{{attacker}} executes a rapid lunge, point driving towards {{defender}}'s chest.",
          "Like a viper, {{attacker}} strikes out with a lightning-fast piercing lunge.",
          "Like a striking serpent, {{attacker}} lunges with the point of {{weapon}}.",
          "With deadly precision, {{attacker}} darts in with a penetrating strike.",
          "A surgical stab from {{attacker}} seeks a gap in {{defender}}'s armor.",
          "{{attacker}} thrusts forward viciously, aiming to skewer {{defender}}.",
          "{{attacker}} sinks their point into {{defender}} with a sharp thrust.",
          "{{attacker}} snaps their wrist, delivering a lightning-fast thrust.",
          "A focused, penetrating lunge from {{attacker}} threatens to skewer.",
          "A viper-quick lunge that punches a neat, bloody hole in defenses.",
          "{{attacker}} lunges with precision, driving the {{weapon}} deep.",
          "A driving thrust that buries itself deeply before twisting free.",
          "A sharp, cruel thrust from {{attacker}} draws a spurt of blood.",
          "A swift, darting thrust finds its mark in {{defender}}'s guard.",
          "With pinpoint accuracy, {{attacker}} darts forward to puncture.",
          "{{attacker}} steps into a measured, deeply penetrating thrust.",
          "{{attacker}} feints high, then drives a cruel stab forward.",
          "A direct lunge from {{attacker}} punctures {{defender}}.",
          "{{attacker}} drives their point forward, sinking steel into {{defender}}'s {{bodyPart}}.",
          "A sudden, violent thrust from {{attacker}} punches right into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} exploits a gap, drilling their weapon forcefully into {{defender}}'s {{bodyPart}}.",
          "The point drives cleanly through {{defender}}'s {{bodyPart}}.",
          "A precise thrust punctures {{defender}}'s {{bodyPart}}.",
          "{{attacker}} drives the point deep into {{defender}}'s {{bodyPart}}.",
          "A solid, puncturing thrust connects with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} steps forward and thrusts sharply into {{defender}}'s {{bodyPart}}.",
          "A quick stab from {{attacker}} punctuates {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lunges, driving the point deep into {{defender}}'s {{bodyPart}}.",
          "With a precise motion, {{attacker}} skewers {{defender}}'s {{bodyPart}}.",
          "{{attacker}} finds a gap, slipping their weapon into {{defender}}'s {{bodyPart}}.",
          "A rapid thrust catches {{defender}} right in the {{bodyPart}}.",
          "{{attacker}} jabs viciously, tearing into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lunges forward, driving a sharp, punishing thrust into {{defender}}.",
          "A sudden, vicious stab from {{attacker}} punctures {{defender}}'s defense.",
          "{{attacker}} lunges forward, driving the point into {{defender}}.",
          "With surgical precision, {{attacker}} thrusts their weapon into {{defender}}.",
          "A lightning-fast stab from {{attacker}} finds its mark on {{defender}}.",
          "{{attacker}} extends fully, sinking the point deep into {{defender}}.",
          "A vicious piercing strike from {{attacker}} punches through {{defender}}'s guard.",
          "{{attacker}} snaps a quick thrust that catches {{defender}} completely unaware.",
          "{{defender}} winces as {{attacker}}'s point bites deep.",
          "{{attacker}} delivers a punishing, direct thrust to {{defender}}.",
          "The weapon darts forward like a serpent as {{attacker}} skewers {{defender}}.",
          "{{attacker}} finds a gap, driving a lethal piercing attack toward {{defender}}.",
          "{{attacker}} lunges with terrifying speed, skewering {{defender}}'s {{bodyPart}}.",
          "The point of {{attacker}}'s weapon punches clean through {{defender}}'s {{bodyPart}}.",
          "With surgical precision, {{attacker}} drives a vicious thrust into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} steps inside the guard and buries their point deep in {{defender}}'s {{bodyPart}}.",
          "A blindingly fast jab from {{attacker}} punctures {{defender}}'s {{bodyPart}}.",
          "{{attacker}} twists the blade maliciously after impaling {{defender}}'s {{bodyPart}}.",
          "Blood jets as {{attacker}} withdraws their weapon from {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s thrust finds the fatal gap, sinking deeply into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} drives the point sharply into {{defender}}'s {{bodyPart}}.",
          "A precise thrust from {{attacker}} punctures {{defender}}'s {{bodyPart}}.",
          "{{attacker}}'s lunge connects, sinking the tip into {{defender}}'s {{bodyPart}}.",
          "A sharp, biting stab finds its mark in {{defender}}'s {{bodyPart}}.",
          "{{defender}} winces as {{attacker}} buries the point into their {{bodyPart}}.",
          "{{attacker}} drives the point of their weapon deep into {{defender}}'s {{bodyPart}}.",
          "A forceful thrust from {{attacker}} sinks sickeningly into {{defender}}'s {{bodyPart}}.",
          "{{defender}} gasps as {{attacker}}'s puncturing strike finds their {{bodyPart}}.",
          "{{attacker}} buries their weapon in {{defender}}'s {{bodyPart}} with a vicious twist.",
          "A precise, agonizing stab connects with {{defender}}'s {{bodyPart}}."
        ],
        mastery: [
          "{{attacker}}'s {{weapon}} finds the microscopic gap in {{defender}}'s defense, sliding effortlessly into the {{bodyPart}}.",
          "{{attacker}} threads the needle, sliding {{possessive}} {{weapon}} past the guard with surgical precision.",
          "With fencing elegance, {{attacker}} bypasses the shield and punctures the {{bodyPart}}.",
          "The thrust is so flawlessly angled it seems to ignore {{defender}}'s guard entirely.",
          "Without a wasted motion, {{attacker}} skewers {{defender}} with terrifying grace.",
          "The perfect thrust demonstrates absolute mastery over distance and timing.",
          "{{attacker}} feints high and pierces low in a display of utter perfection.",
          "It's a virtuoso display of point control, skewering {{defender}} cleanly.",
          "{{attacker}} threads the needle, sliding {{weapon}} past all defenses.",
          "With terrifying accuracy, the stab bypasses all guard and sinks deep.",
          "The thrust slips through a gap in the armor with surgical precision.",
          "The needle-like strike is a testament to perfect martial discipline.",
          "A masterful lunge finds the exact seam in {{defender}}'s defense.",
          "A surgical thrust hits {{defender}} exactly where the armor gaps.",
          "{{attacker}} guides the tip with uncanny, microscopic precision.",
          "{{attacker}} finds the perfect gap in {{defender}}'s armor, driving the point home.",
          "With surgical accuracy, {{attacker}} impales {{defender}} on the exact weak point.",
          "{{attacker}} thrusts violently, burying the point deep into {{defender}}.",
          "A masterful lunge from {{attacker}} pierces {{defender}}'s defenses cleanly.",
          "{{attacker}} drives the weapon forward with terrifying precision.",
          "With a practiced thrust, {{attacker}} penetrates {{defender}}'s guard.",
          "{{attacker}}'s strike is a blur, leaving a deep puncture wound.",
          "With pinpoint accuracy, {{attacker}} slips the point precisely into a gap in {{defender}}'s guard.",
          "An exquisitely timed lunge from {{attacker}} finds its mark with surgical perfection against {{defender}}."
        ],
        critical_human: [
          "{{attacker}} extends fully, every ounce of reach behind his {{weapon}} as it sinks deep into the {{bodyPart}}!",
          "A cruel twist of {{possessive}} {{weapon}} by {{attacker}} as it pierces deep into the {{bodyPart}}.",
          "{{attacker}} steps into a terrifying lunge, burying {{possessive}} {{weapon}} frighteningly deep.",
          "{{attacker}} finds the gap in {{defender}}'s armor, delivering a surgical and bloody thrust!",
          "{{attacker}} thrusts with deadly accuracy, punching straight through {{defender}}'s guard!",
          "A brutal, armor-piercing thrust from {{attacker}} leaves {{defender}} bleeding heavily!",
          "A lightning-fast lunge from {{attacker}} buries deep into {{defender}}'s flesh!",
          "{{defender}} gasps in pain as {{attacker}} lands a critical, puncturing strike!",
          "{{weapon}} drives deep into the gut, a truly grievous and fatal-looking wound!",
          "A horrific puncture wound fountains blood as {{weapon}} sinks in to the hilt!",
          "With a terrifyingly precise strike, {{attacker}} impales {{defender}} deeply!",
          "The sheer force of the thrust nearly pins {{defender}} to the arena floor!",
          "The vicious piercing strike hits an artery, causing massive blood loss!",
          "The savage thrust impales {{defender}} deeply, striking vital organs!",
          "{{defender}} gasps in agony as the deep stab collapses a lung!",
          "The brutal lunge punches straight through bone and sinew!",
          "{{attacker}}'s thrust violently impales {{defender}}, leaving a gaping, horrific wound.",
          "A surgical, terrifyingly deep stab from {{attacker}} finds a major artery, spewing crimson."
        ],
        critical_supernatural: [
          "{{possessive}} {{weapon}} hums a low, deathly note, bypassing reality to hit the {{bodyPart}} with cold light.",
          "{{attacker}} thrusts with blinding speed, {{possessive}} {{weapon}} appearing to teleport past the guard.",
          "{{possessive}} {{weapon}} strikes with needle-like perfection, bypassing all worldly resistance.",
          "A screeching dimensional tear is left in {{defender}}'s wake by the unnatural thrust!",
          "A surge of dark magic travels up the blade, necroticizing the deep puncture wound!",
          "The supernatural thrust leaves a glowing, burning hole right through {{defender}}!",
          "The weapon phases through armor, striking directly at {{defender}}'s life force!",
          "The enchanted blade pierces not just flesh, but the very soul of {{defender}}!",
          "The cursed tip injects pure shadowy agony straight into {{defender}}'s heart!",
          "A beam of coalesced light extends the thrust, piercing {{defender}} through.",
          "{{attacker}}'s lunge defies physics, flashing forward with magical speed.",
          "The {{weapon}} pulses with necrotic energy as it impales {{defender}}.",
          "Arcane venom sizzles where {{attacker}}'s {{weapon}} penetrates flesh.",
          "Spectral vines erupt from the wound as the {{weapon}} finds its mark.",
          "Ethereal frost spreads rapidly from the impossibly deep stab wound!",
          "The point phases through armor like smoke, sinking impossibly deep into {{defender}}'s essence.",
          "A ghastly piercing blow from {{attacker}} leaves a wound that refuses to bleed, only seeps cold light."
        ],
        fatal: [
          "{{attacker}} lunges forward, sinking {{possessive}} {{weapon}} so deeply into {{defender}}'s {{bodyPart}} that it requires leverage to pull it free.",
          "With snake-like speed, {{attacker}} drives {{possessive}} {{weapon}} deep into {{defender}}'s {{bodyPart}}. The light leaves {{defender}}'s eyes.",
          "A masterful thrust from {{attacker}} finds the seam in armor, skewering {{defender}} through the {{bodyPart}} and anchoring them to the sand.",
          "A fatal thrust! {{attacker}} impales {{defender}} through the {{bodyPart}}, twisting {{possessive}} {{weapon}} as the life leaves their eyes.",
          "With surgical precision, {{attacker}} drives {{possessive}} {{weapon}} through {{defender}}'s {{bodyPart}}, severing the vital arteries.",
          "{{attacker}} spots an opening and mercilessly skewers {{defender}}, sinking {{possessive}} {{weapon}} to the hilt in their {{bodyPart}}.",
          "{{attacker}} lunges with terrifying precision, driving the point of {{possessive}} {{weapon}} deep into {{defender}}'s {{bodyPart}}.",
          "With a surgical and deadly strike, {{attacker}} pierces {{defender}}'s {{bodyPart}}, pinning them to the very air before they drop.",
          "{{attacker}} finds the perfect angle, burying {{possessive}} {{weapon}} to the hilt in {{defender}}'s {{bodyPart}}. A clean kill.",
          "A blinding thrust! {{attacker}}'s {{weapon}} pierces directly through {{defender}}'s {{bodyPart}}, pinning them to their fate.",
          "{{defender}} gasps as {{attacker}}'s {{weapon}} slides into their {{bodyPart}}, the lethal point emerging from the other side.",
          "{{attacker}} finds a terrible opening, sinking the point of their {{weapon}} all the way through {{defender}}'s {{bodyPart}}.",
          "{{defender}}'s eyes widen in disbelief as they look down at {{attacker}}'s {{weapon}} protruding from their {{bodyPart}}.",
          "A blinding lunge from {{attacker}} catches {{defender}} perfectly in the {{bodyPart}}. The fight ends in a gurgling gasp.",
          "The tip of {{possessive}} {{weapon}} finds flesh, and {{attacker}} drives it ruthlessly into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} violently drives their point through {{defender}}'s {{bodyPart}}, lifting them momentarily off the ground.",
          "{{attacker}} pins {{defender}} against the metaphorical ropes, burying the blade to the hilt in their {{bodyPart}}.",
          "A perfectly angled jab from {{attacker}} pierces straight through {{defender}}'s guard and into their {{bodyPart}}.",
          "Like a viper, {{attacker}} darts forward, burying {{possessive}} {{weapon}} deep into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} executes {{defender}} with a chilling lunge of {{possessive}} {{weapon}} through the {{bodyPart}}!",
          "{{attacker}} drives their weapon forward in a blur, impaling {{defender}}'s {{bodyPart}} before they can blink.",
          "With a clinical thrust, {{attacker}} finds the gap in the armor and punctures {{defender}}'s {{bodyPart}}.",
          "With a sharp gasp, {{defender}} falls, {{attacker}}'s {{weapon}} buried firmly in their {{bodyPart}}.",
          "{{attacker}} punches through {{defender}}'s defenses, spearing their {{bodyPart}} with deadly intent.",
          "{{attacker}} strikes like a viper, burying the tip of their weapon into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} feints a slash, only to deliver a lightning-fast thrust to {{defender}}'s {{bodyPart}}.",
          "A vicious, twisting stab from {{attacker}} bores deeply into {{defender}}'s {{bodyPart}}.",
          "With a sudden, violent shove, {{attacker}} skewers {{defender}}'s {{bodyPart}}."
        ],
        critical: [
          "{{attacker}} drives {{possessive}} {{weapon}} deep into {{defender}}'s {{bodyPart}}, twisting it viciously before withdrawing!",
          "A masterful lunge from {{attacker}} skewers {{defender}} completely, finding a vital artery in their {{bodyPart}}.",
          "{{attacker}} lunges with terrifying intent, burying the point through {{defender}}'s guard and deep into flesh.",
          "Like a predator scenting blood, {{attacker}} drives a ruthless thrust squarely into a vulnerable gap.",
          "{{attacker}} drives {{possessive}} {{weapon}} deep into a vulnerable gap in {{defender}}'s defense.",
          "{{attacker}} finds the fatal gap, sinking their {{weapon}} deep into {{defender}}'s {{bodyPart}}.",
          "A flash of steel! {{attacker}} threads the needle, sinking their {{weapon}} with ruinous effect.",
          "With clinical precision, {{attacker}} punctures {{defender}}'s defenses, leaving a lethal wound.",
          "{{attacker}} twists the blade as it pierces deep, eliciting a cry of agony from {{defender}}.",
          "A vicious, precise lunge from {{attacker}} skewers {{defender}} completely, a fatal puncture.",
          "With snake-like speed, {{attacker}}'s thrust buries itself into {{defender}}'s {{bodyPart}}.",
          "A masterful, deadly lunge from {{attacker}} punctures {{defender}}'s armor entirely.",
          "{{attacker}} drives the weapon straight through {{defender}} in a horrific display!",
          "With surgical precision, {{attacker}} drives a critical thrust into {{defender}}.",
          "{{attacker}} finds the perfect angle, burying the point deep into a vital spot.",
          "Like a viper striking, {{attacker}} drives their point deep into a vital organ!",
          "{{attacker}}'s {{weapon}} darts forward, sinking deep with terrifying accuracy.",
          "Blood erupts as {{attacker}} twists the {{weapon}} deep inside {{defender}}.",
          "A devastating lunge punches straight through {{defender}}'s defenses.",
          "A fatal-looking puncture! {{attacker}} spears {{defender}} brutally!",
          "{{attacker}} sinks the {{weapon}} to the hilt in a vital spot!",
          "A surgical, lethal thrust impales {{defender}}'s {{bodyPart}}, finding vitals.",
          "{{attacker}} drives the point agonizingly deep into {{defender}}'s {{bodyPart}}.",
          "A brutal, twisting stab from {{attacker}} burrows into {{defender}}'s {{bodyPart}}.",
          "{{defender}} gasps in horror as {{attacker}} skewers their {{bodyPart}} entirely.",
          "A devastating impalement from {{attacker}} ravages {{defender}}'s {{bodyPart}}.",
          "{{attacker}} ruthlessly impales {{defender}}'s {{bodyPart}}, pinning them with agony!",
          "A devastating thrust from {{attacker}} punches completely through {{defender}}'s {{bodyPart}}!",
          "{{defender}} chokes on their own scream as {{attacker}} drives a critical stab deep into their {{bodyPart}}.",
          "{{attacker}}'s vicious lunge obliterates the flesh and bone of {{defender}}'s {{bodyPart}}!",
          "With brutal precision, {{attacker}} drives the point clear through {{defender}}'s {{bodyPart}}!"
        ]
      },
      fist: {
        glancing: [
          "A glancing blow from {{attacker}}'s knuckles leaves a red mark, but no real damage.",
          "{{attacker}} throws a PUNCH, but it merely grazes {{defender}}'s {{bodyPart}}.",
          "{{attacker}} swings wildly, clipping {{defender}} but dealing no real damage.",
          "{{attacker}} throws a wild haymaker that merely brushes {{defender}}'s jaw.",
          "{{attacker}}'s swift jab barely connects, sliding off {{defender}}'s guard.",
          "A glancing knuckle strike from {{attacker}} barely impacts {{defender}}.",
          "A quick jab from {{attacker}} glances off {{defender}}'s raised guard.",
          "{{attacker}} swings wide, landing only a weak blow to the shoulder.",
          "{{defender}} leans back, turning a solid punch into a mere graze.",
          "{{defender}} easily rides the momentum of the shallow punch.",
          "It's a glancing blow that lacks any real power behind it.",
          "A weak jab fails to find a solid mark on {{defender}}.",
          "The fist skims off {{defender}}'s shoulder harmlessly.",
          "The strike is muffled by clothing and does no damage.",
          "A rapid jab just barely scuffs {{defender}}'s cheek.",
          "The fist meets armor and slides off, doing no harm.",
          "A misjudged swing only slaps against {{defender}}.",
          "The punch barely grazes {{defender}}'s cheek.",
          "{{attacker}} throws a rushed jab that barely clips {{defender}}'s {{bodyPart}}.",
          "A wild swing from {{attacker}} bounces harmlessly off {{defender}}'s {{bodyPart}}.",
          "{{attacker}} misses the sweet spot, delivering a weak tap to {{defender}}'s {{bodyPart}}.",
          "A frantic flail of a punch misses entirely.",
          "The fist catches only a passing breeze.",
          "A hasty swing bounces off the armor harmlessly.",
          "The punch lacks conviction and grazes the arm.",
          "A weak jab is completely ignored by {{defender}}.",
          "A loose swing from {{attacker}} barely brushes against {{defender}}.",
          "{{attacker}}'s punch glances off {{defender}}'s shoulder.",
          "A hurried jab from {{attacker}} misses the mark, lightly grazing {{defender}}.",
          "{{defender}} slips the punch, catching only a grazing blow from {{attacker}}.",
          "{{attacker}}'s wild swing deflects off {{defender}}'s guard.",
          "{{attacker}}'s knuckles graze across {{defender}}'s {{bodyPart}}.",
          "A wild swing from {{attacker}} barely catches {{defender}}'s guard.",
          "{{defender}} slips the punch, catching only a light tap from {{attacker}}.",
          "{{attacker}}'s fist slides harmlessly off {{defender}}'s shoulder.",
          "A glancing blow from {{attacker}} fails to stagger {{defender}}."
        ],
        solid: [
          "{{attacker}} unleashes a raw, bare-knuckle brawl, overwhelming {{defender}} with relentless strikes.",
          "{{attacker}} steps inside {{defender}}'s reach and delivers a punishing cross to the {{bodyPart}}.",
          "{{attacker}} steps inside the guard and unleashes a horrific combination on the {{bodyPart}}!",
          "A savage flurry of fists! {{attacker}} batters {{defender}} with a rapid barrage of punches.",
          "{{attacker}} snaps a vicious combination into {{defender}}'s {{bodyPart}} with precision!",
          "{{attacker}} drives a piston-like straight punch directly into {{defender}}'s midsection.",
          "A heavy, calculated punch from {{attacker}} slams into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} throws a wild, haymaker punch, putting their entire weight behind it.",
          "{{attacker}}'s fist connects with {{defender}}'s {{bodyPart}} \u2014 a punishing blow!",
          "{{attacker}} closes the distance, throwing a brutal right hook at {{defender}}.",
          "{{attacker}} steps inside the guard and unloads a bone-shattering right hook.",
          "With a brutal uppercut, {{attacker}} lifts {{defender}} clean off their feet.",
          "A bone-crunching impact as {{attacker}} hammers {{defender}}'s {{bodyPart}}!",
          "{{attacker}} steps into the punch, burying their knuckles into {{defender}}.",
          "A flurry of fists from {{attacker}} finds its mark with devastating effect.",
          "{{attacker}} drives a devastating strike into {{defender}}'s {{bodyPart}}!",
          "{{attacker}} steps in and delivers a savage hook that rocks {{defender}}.",
          "With bare-knuckle savagery, {{attacker}} hammers a cross at {{defender}}.",
          "{{defender}} reels as {{attacker}}'s fist connects with explosive force.",
          "A blindingly fast jab from {{attacker}} snaps toward {{defender}}'s jaw.",
          "A bare-knuckle hook that snaps their head back with bone-jarring force.",
          "{{attacker}} lands a brutal, crunching punch squarely on {{defender}}.",
          "{{attacker}} steps into a devastating uppercut aimed at {{defender}}.",
          "{{attacker}} steps inside and unleashes a compact, bone-jarring jab.",
          "A heavy cross from {{attacker}} connects with bone-jarring force.",
          "{{attacker}} lands a heavy cross directly into the {{bodyPart}}.",
          "A flurry of heavy hooks from {{attacker}} batters the defense.",
          "{{attacker}} closes the distance with a devastating uppercut.",
          "With savage force, {{attacker}} delivers a crushing backfist.",
          "A piston-like straight punch that caves in the solar plexus.",
          "A heavy cross from {{attacker}} cracks against {{defender}}.",
          "A piston-like straight punch shoots out from {{attacker}}.",
          "A wild, desperate punch from {{attacker}} strikes true.",
          "A clean straight punch finds its mark on {{defender}}.",
          "{{attacker}} throws a brutal, looping overhand right.",
          "{{attacker}} connects with a firm, bruising hook.",
          "{{attacker}} lands a heavy hook on {{defender}}.",
          "The solid punch lands with a satisfying thwack.",
          "The blow leaves a red mark and a stinging ache.",
          "{{attacker}} steps in and crushes {{defender}}'s {{bodyPart}} with a devastating hook.",
          "A brutal, bare-knuckle smash from {{attacker}} connects heavily with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} drives all their weight into a punishing strike on {{defender}}'s {{bodyPart}}.",
          "A bone-jarring punch snaps into {{defender}}'s {{bodyPart}}.",
          "The heavy fist connects solidly with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands a punishing blow directly to {{defender}}'s {{bodyPart}}.",
          "A heavy, bone-jarring punch slams into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} drives a harsh straight punch into {{defender}}'s {{bodyPart}}.",
          "A heavy fist connects with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} steps in, pounding {{defender}}'s {{bodyPart}}.",
          "{{defender}} groans as a solid hook slams into their {{bodyPart}}.",
          "{{attacker}} throws a brutal combination, finishing on {{defender}}'s {{bodyPart}}.",
          "With raw, bare-knuckle force, {{attacker}} strikes {{defender}}'s {{bodyPart}}.",
          "{{attacker}} throws their weight behind a punch to {{defender}}'s {{bodyPart}}.",
          "{{attacker}} plants their feet and unloads a vicious hook into {{defender}}.",
          "A raw, powerful cross from {{attacker}} snaps {{defender}}'s head back.",
          "{{attacker}} throws a crushing haymaker that catches {{defender}} flush.",
          "A lightning-fast jab from {{attacker}} snaps {{defender}}'s head back.",
          "{{attacker}} steps inside and unleashes a brutal hook against {{defender}}.",
          "With bare-knuckle savagery, {{attacker}} pummels {{defender}}.",
          "{{attacker}} drives a heavy cross straight through {{defender}}'s guard.",
          "A devastating uppercut from {{attacker}} lifts {{defender}} off their feet.",
          "{{attacker}} lands a punishing combination on the reeling {{defender}}.",
          "{{defender}} absorbs a sickening bare-handed blow from {{attacker}}.",
          "{{attacker}} cracks {{defender}} across the jaw with a vicious punch.",
          "A heavy, piston-like strike from {{attacker}} slams into {{defender}}.",
          "{{attacker}} steps in and unloads a brutal hook straight into {{defender}}'s {{bodyPart}}.",
          "A piston-like straight from {{attacker}} snaps {{defender}}'s {{bodyPart}} backward.",
          "{{attacker}} unleashes a devastating bare-knuckle combination, finishing on {{defender}}'s {{bodyPart}}.",
          "With a sickening crunch, {{attacker}} drives a heavy cross into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} slips the guard and buries a rib-cracking blow in {{defender}}'s {{bodyPart}}.",
          "A vicious, winding uppercut from {{attacker}} connects flush with {{defender}}'s {{bodyPart}}.",
          "{{attacker}} rains relentless, heavy strikes down upon {{defender}}'s {{bodyPart}}.",
          "The sheer concussive force of {{attacker}}'s punch leaves {{defender}}'s {{bodyPart}} bruised and battered.",
          "A sharp, stiff jab from {{attacker}} snaps into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands a heavy cross squarely on {{defender}}'s {{bodyPart}}.",
          "A solid, thudding punch from {{attacker}} connects with {{defender}}'s {{bodyPart}}.",
          "{{defender}} takes a punishing blow from {{attacker}} to the {{bodyPart}}.",
          "{{attacker}} drives a harsh knuckle into {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands a heavy, bruising cross on {{defender}}'s {{bodyPart}}.",
          "A solid, meaty thwack echoes as {{attacker}} punches {{defender}}'s {{bodyPart}}.",
          "{{defender}} grimaces as {{attacker}}'s fist connects squarely with their {{bodyPart}}.",
          "{{attacker}} drives a punishing uppercut into {{defender}}'s {{bodyPart}}.",
          "A heavy, bare-knuckle strike from {{attacker}} rocks {{defender}}'s {{bodyPart}}."
        ],
        mastery: [
          "{{attacker}}'s limbs are a blur of technical perfection, striking the {{bodyPart}} with rhythmic violence.",
          "With the rhythm of a seasoned brawler, {{attacker}} finds the sweet spot on the {{bodyPart}}.",
          "Fluid as water, {{attacker}} redirects {{defender}}'s momentum into a brutal punch.",
          "The crowd roars at the absolute technical perfection of {{attacker}}'s combination.",
          "{{attacker}} demonstrates supreme unarmed mastery with a perfectly placed strike.",
          "{{attacker}} slips inside the guard and unloads a perfectly placed combination.",
          "No wasted movement, just pure kinetic transfer as {{attacker}}'s fist connects.",
          "With boxer-like perfection, the strike lands flush on the absolute weak point.",
          "The blow is delivered with cold, mechanical perfection and devastating timing.",
          "{{attacker}} slips inside the guard to deliver a textbook, staggering cross.",
          "A master martial artist's strike\u2014{{attacker}} hits the exact pressure point.",
          "The punch is a masterpiece of kinetic linking, transferring maximum force.",
          "A clinic in unarmed combat; the punch exploits a millimeter of an opening.",
          "A textbook, flawless punch perfectly dismantles {{defender}}'s guard.",
          "The punch is almost too fast to see, yet devastatingly precise.",
          "{{attacker}} threads the needle, catching {{defender}} flush with a staggering blow.",
          "A picture-perfect combination from {{attacker}} leaves {{defender}} disoriented.",
          "Using spectacular technique, {{attacker}} slips the guard and lands a flawless, devastating strike on {{defender}}.",
          "{{attacker}} exploits a tiny opening with a breathtakingly precise and powerful combination against {{defender}}."
        ],
        critical_human: [
          "{{attacker}} throws a rock-fisted PUNCH of incredible felling power into the {{bodyPart}}!",
          "A bone-rattling uppercut from {{attacker}} nearly lifts {{defender}} off their feet!",
          "{{attacker}} steps inside {{defender}}'s guard and lands a crushing, heavy punch!",
          "{{defender}} reels from a devastating flurry of blows delivered by {{attacker}}!",
          "The savage body blow visibly cracks ribs, leaving {{defender}} gasping for air!",
          "The monstrous punch ruptures internal organs, dropping {{defender}} instantly!",
          "{{attacker}} delivers a brutal hook that sounds like a butcher dropping meat.",
          "With explosive power, {{attacker}}'s strike crumples {{defender}}'s defenses!",
          "Bones break as the feral, bare-knuckle strike lands with maximum prejudice!",
          "The brutal uppercut shatters {{defender}}'s jaw with a sickening crunch!",
          "A haymaker from hell knocks teeth loose and sends {{defender}} reeling!",
          "A devastating blow from {{attacker}} leaves {{defender}} seeing stars.",
          "The sheer kinetic force of the punch causes severe concussive trauma!",
          "{{attacker}} delivers a sickening, jaw-cracking hook to {{defender}}!",
          "A devastating overhand right caves in {{defender}}'s orbital bone!",
          "{{attacker}} delivers a bare-knuckle haymaker so vicious it shatters {{defender}}'s jaw instantly.",
          "A concussive, brutal flurry of punches from {{attacker}} completely overwhelms {{defender}}'s guard."
        ],
        critical_supernatural: [
          "A golden light follows {{attacker}}'s strike, shattering the air as the {{bodyPart}} is struck by 'The Enlightened Hand'.",
          "{{attacker}}'s strike carries the weight of an avalanche, threatening to cave in the {{bodyPart}}.",
          "The monk-like, chi-infused strike erupts inside {{defender}}, causing immense internal damage!",
          "Ethereal flames trail {{attacker}}'s fist before it detonates against {{defender}}.",
          "The demonic punch shatters the sound barrier, liquifying {{defender}}'s insides!",
          "Aura flares around {{attacker}}'s hand, leaving a burning brand on {{defender}}.",
          "The supernatural blow hits with the force of a falling anvil, ignoring physics!",
          "An otherworldly aura surrounds the fist, fracturing {{defender}}'s very spirit!",
          "Arcane energy surges through the fist, blasting {{defender}} across the arena!",
          "A punch thrown with unnatural force, the impact echoing like a thunderclap.",
          "{{attacker}}'s fist strikes with the thunderous clap of a miniature storm.",
          "Fists wreathed in unnatural flame explode upon impact with {{defender}}!",
          "A strike infused with necrotic energy withers the flesh it touches!",
          "The very fabric of reality ripples as the supercharged punch lands.",
          "{{attacker}} strikes with the strength of a possessed titan.",
          "{{attacker}}'s fist strikes with the thunderous impact of a titan, violently launching {{defender}} backward.",
          "Unholy strength fuels {{attacker}}'s punch, hitting so hard it momentarily warps the air around {{defender}}."
        ],
        fatal: [
          "With an explosive surge of strength, {{attacker}} drives their fist into {{defender}}'s {{bodyPart}}, delivering a final, lethal strike.",
          "A devastating haymaker from {{attacker}} catches {{defender}} flush on the {{bodyPart}}, breaking bone and stopping their heart.",
          "A sickening snap resounds as {{attacker}} twists {{defender}}'s {{bodyPart}} into an unnatural angle, securing a lethal finish.",
          "{{attacker}} leaps forward, delivering a brutal flying strike that pulverizes {{defender}}'s {{bodyPart}} and ends their life.",
          "{{attacker}} pummels {{defender}} into the sand with merciless fury, the final strike to the {{bodyPart}} sealing their doom.",
          "In a terrifying display of raw power, {{attacker}} crushes {{defender}}'s {{bodyPart}} with a bare-handed execution.",
          "{{attacker}} rains a flurry of merciless blows upon {{defender}}'s {{bodyPart}}, battering them completely to death.",
          "{{attacker}} grabs his opponent and drives a sickening KNEE into their midsection. {{defender}} collapses dead.",
          "{{attacker}} grabs {{defender}}'s head and snaps their neck in one terrifying, fluid motion.",
          "{{attacker}}'s brutal strike caves in {{defender}}'s chest, stopping their breath forever.",
          "The sheer concussive force of the punch shatters {{defender}}'s skull completely.",
          "With a sickening crunch, {{attacker}}'s final punch ends {{defender}}'s life.",
          "A devastating blow crushes the skull, instantly ending {{defender}}'s life.",
          "The final punch is a lethal execution, snapping {{defender}}'s neck.",
          "{{attacker}} drives a fatal blow straight into {{defender}}'s heart.",
          "{{attacker}} steps in close and drives a punishing knuckle-strike straight into {{defender}}'s {{bodyPart}}.",
          "With a brutal uppercut, {{attacker}} connects solidly with {{defender}}'s {{bodyPart}}, sending shockwaves through them.",
          "{{attacker}} unleashes a rapid barrage of blows, ending with a crushing hook to {{defender}}'s {{bodyPart}}.",
          "A savage cross from {{attacker}} finds its mark on {{defender}}'s {{bodyPart}} with a sickening crack.",
          "{{attacker}} pivots and delivers a devastating punch directly into {{defender}}'s {{bodyPart}}, stunning them completely.",
          "Slipping past the guard, {{attacker}} buries a heavy fist in {{defender}}'s {{bodyPart}}.",
          "{{attacker}} unleashes a flying knee that impacts horribly against {{defender}}'s {{bodyPart}}.",
          "With a feral roar, {{attacker}} headbutts {{defender}} squarely on the {{bodyPart}}.",
          "{{attacker}} throws a wild haymaker that connects with surprising force against {{defender}}'s {{bodyPart}}.",
          "A precise, twisting palm strike from {{attacker}} leaves {{defender}} gasping from a hit to the {{bodyPart}}."
        ],
        critical: [
          "{{attacker}} unleashes a brutal, unyielding combo, culminating in an uppercut that devastates {{defender}}'s {{bodyPart}}!",
          "A flurry of violence culminates in a vicious uppercut from {{attacker}} that nearly lifts {{defender}} off the ground.",
          "Putting their entire weight behind the blow, {{attacker}} shatters {{defender}}'s {{bodyPart}} with a monstrous hook.",
          "With frightening velocity, {{attacker}}'s bare fist connects perfectly, dropping {{defender}} to their knees.",
          "{{attacker}}'s knuckles connect with a horrific crack against {{defender}}'s {{bodyPart}}.",
          "{{attacker}} steps inside {{defender}}'s guard and unloads a bone-shattering haymaker.",
          "A devastating haymaker from {{attacker}} lands flush, rattling {{defender}}'s skull!",
          "A perfectly timed cross from {{attacker}} snaps {{defender}}'s head back violently.",
          "{{attacker}} uncoils a punishing uppercut that lifts {{defender}} off their feet.",
          "With brutal momentum, {{attacker}} lands a skull-rattling strike on {{defender}}!",
          "{{attacker}} channels raw brutality into a piston-like punch that crunches bone.",
          "{{attacker}} unleashes a devastating haymaker, nearly decapitating {{defender}}!",
          "{{attacker}} delivers a bare-knuckle strike with the force of a swinging anvil!",
          "{{attacker}} drives a brutal knee-strike home, winding {{defender}} instantly.",
          "Bones splinter as {{attacker}} drives a monumental uppercut into {{defender}}.",
          "The sheer impact of the punch lifts {{defender}} momentarily off their feet!",
          "{{attacker}} lands a kidney punch so hard the crowd collectively winces.",
          "{{attacker}} unleashes a savage, breath-stealing body blow.",
          "A savage, bone-crushing haymaker from {{attacker}} detonates on {{defender}}'s {{bodyPart}}.",
          "{{attacker}} lands an explosive, jaw-breaking strike to {{defender}}'s {{bodyPart}}.",
          "The brutal impact of {{attacker}}'s fist shatters {{defender}}'s {{bodyPart}}.",
          "A devastating, pinpoint hook ravages {{defender}}'s {{bodyPart}}.",
          "{{defender}}'s {{bodyPart}} caves under the ruinous force of {{attacker}}'s punch.",
          "{{attacker}} unleashes a devastating haymaker, shattering {{defender}}'s {{bodyPart}}!",
          "With explosive force, {{attacker}} caves in {{defender}}'s {{bodyPart}} with a critical punch!",
          "{{defender}}'s eyes roll back as {{attacker}} lands a brutal, bone-breaking strike to the {{bodyPart}}.",
          "A savage, bloody beatdown from {{attacker}} leaves {{defender}}'s {{bodyPart}} a ruined mess!",
          "{{attacker}} delivers a savage, knuckle-busting hammer blow that destroys {{defender}}'s {{bodyPart}}!"
        ]
      }
    }
  };
});

// src/data/narrative/combatKillText.json
var require_combatKillText = __commonJS(function(exports, module) {
  module.exports = {
    kill_text: {
      execution: [
        "{{attacker}} feints low, catching {{defender}} off guard before striking their {{bodyPart}} with clinical precision. The crowd erupts as the final blow is struck!",
        "A masterful, theatrical execution! {{attacker}} plays to the crowd before delivering the final, fatal stroke to {{defender}}.",
        "The execution is swift, brutal, and entirely merciless. {{attacker}} leaves nothing but a ruin where {{defender}} once stood.",
        "Standing over their broken foe, {{attacker}} delivers a cold, merciless final strike, ending the fight with brutal finality.",
        "{{attacker}} steps over the broken form of {{defender}}, delivering a cold, calculated execution that silences the arena.",
        "{{attacker}} slowly circles the fallen {{defender}}, relishing the moment before delivering the final, brutal execution.",
        "{{attacker}} ruthlessly beats {{defender}} into the dirt until they simply stop moving, a bleak display of raw survival.",
        "{{attacker}} places a boot on {{defender}}'s chest, raising their {{weapon}} high before bringing down the curtain.",
        "The execution is absolute; {{defender}} is nearly cleaved in twain by the sheer force of {{attacker}}'s final blow.",
        "Blood fountains from {{defender}}'s ruined neck as {{attacker}}'s strike finds its mark, ending the bout instantly.",
        "A wet crunch echoes through the arena as {{attacker}} shatters {{defender}}'s skull, closing the bloody chapter.",
        "With a sneer, {{attacker}} forces {{defender}} to their knees before delivering the final, decapitating strike.",
        "With the crowd roaring for blood, {{attacker}} obliges, ending {{defender}} with a ruthless, calculated strike.",
        "{{attacker}} leans in, whispering something unheard to {{defender}} before delivering the fatal execution blow.",
        "{{attacker}} ensures there is no rising from the sands, bringing their {{weapon}} down with sickening finality.",
        "{{attacker}} stands victorious over the broken, lifeless body of {{defender}} after a devastating final attack.",
        "{{attacker}} delivers a grand, sweeping strike that ends {{defender}}'s life in a spray of theatrical crimson.",
        "{{attacker}} casually dismantles the remaining defenses, ending it with a dark chuckle and a precise thrust.",
        "{{defender}} falls, their name fading into the bloody history of the sands. {{attacker}} stands victorious.",
        "{{attacker}} executes a stunning, cinematic final maneuver, soaking in the dramatic silence of the crowd.",
        "With cold, clinical precision, {{attacker}} executes a flawless strike that ends {{defender}} instantly.",
        "{{attacker}} finds the artery with a measured, technical efficiency. {{defender}} falls without a sound.",
        "The crowd watches in stunned silence as {{attacker}} ends {{defender}}'s misery with a swift execution.",
        "{{attacker}} delivers a cold, clinical finishing blow, ending {{defender}}'s life without hesitation.",
        "The crowd erupts into a jubilant roar as {{attacker}} delivers a vibrant, celebratory finishing blow!",
        "{{attacker}} ends the bout with an exuberant strike, kicking off a boisterous celebration of victory!",
        "A dark humor in death; {{defender}} twitches once before stilling forever under {{attacker}}'s heel.",
        "With a theatrical flourish, {{attacker}} executes {{defender}}, soaking up the adulation of the mob.",
        "{{attacker}} delivers a horrifyingly brutal strike, ending {{defender}}'s story on the bloody sands.",
        "{{attacker}} unleashes a brutal, visceral final strike, painting the arena with {{defender}}'s gore.",
        "No mercy, no hesitation. {{attacker}} performs a brutal execution on the defenseless {{defender}}.",
        "A cold, dispassionate execution. {{attacker}} ends {{defender}}'s life with terrifying efficiency.",
        "{{attacker}} stands over the fallen form of {{defender}}, delivering a cold, merciless final blow.",
        "{{attacker}} stands over {{defender}}, delivering a final, merciless strike to end the suffering.",
        "A final, silencing blow from {{attacker}} leaves {{defender}} lifeless on the blood-soaked sands.",
        "With absolute finality, {{attacker}} drives their weapon home, extinguishing {{defender}}'s life.",
        "{{attacker}} casually wipes the blood from their {{weapon}} as {{defender}} twitches their last.",
        "With dark finality, {{attacker}} claims another soul for the sands, leaving {{defender}} broken.",
        "The brutal saga of {{defender}} concludes here, shattered by {{attacker}}'s relentless assault.",
        "A grim, efficient execution by {{attacker}}\u2014a stark reminder of the arena's unforgiving nature.",
        "{{attacker}} ends it with a cold, clinical decapitation, leaving the crowd in stunned silence.",
        "{{attacker}} delivers the heavy, mournful deathblow, ending {{defender}}'s sorrowful journey.",
        "The shadow of death falls as {{attacker}} grants a stoic, melancholy release to {{defender}}.",
        "The crowd gasps as {{attacker}} ruthlessly finishes {{defender}}, leaving nothing to chance.",
        "With a sickening crunch, {{attacker}} ends the match, leaving {{defender}} dead in the dirt.",
        "A collected, surgical blow from {{attacker}} quietly closes the book on {{defender}}'s life.",
        "A quiet, somber kill. {{attacker}} ends the fight quickly, offering a final nod of respect.",
        "With an operatic flourish, {{attacker}} delivers a magnificent, show-stopping killing blow!",
        "With theatrical flair, {{attacker}} delivers a magnificent, fatal blow to finish the bout.",
        "In a savage display of absolute butchery, {{attacker}} completely dismembers {{defender}}!",
        "An unforgiving, ferocious execution! {{attacker}} revels in the slaughter of {{defender}}.",
        "A somber, grim necessity. {{attacker}} ends {{defender}}'s life with a quiet, heavy heart.",
        "A cheerful, energetic execution! {{attacker}} dances over the fallen form of {{defender}}.",
        "{{attacker}} delivers a grim, silent killing blow, walking away before {{defender}} falls.",
        "In a display of absolute savagery, {{attacker}} butchers {{defender}} on the arena sands.",
        "{{defender}}'s final moments are cut short by a devastating execution from {{attacker}}.",
        "The crowd erupts in a frenzy as {{attacker}} lands the fatal blow, ending {{defender}}.",
        "A grand, flamboyant finish! {{attacker}} turns the death of {{defender}} into high art.",
        "There is no fanfare, only the grim reality of {{attacker}} delivering the killing blow.",
        "The arena demands blood, and {{attacker}} delivers, extinguishing {{defender}}'s life.",
        "The arena falls into a stunned silence as {{attacker}} brutally executes {{defender}}.",
        "{{attacker}} silences {{defender}} forever with a gruesome, heart-stopping final blow.",
        "{{attacker}} grants {{defender}} no reprieve, executing a flawless and fatal maneuver.",
        "With cold, clinical precision, {{attacker}} drives their weapon home to end the fight.",
        "{{defender}} looks up in time to see {{attacker}} bring down the executioner's strike.",
        "A brutal, clinical end. {{attacker}} shows no mercy, leaving {{defender}} motionless.",
        "The arena falls silent as {{attacker}} ends {{defender}}'s life with cold precision.",
        "{{attacker}} finishes the grisly work, a bleak reminder of the arena's true nature.",
        "With a merciless execution, {{attacker}} tears the life straight from {{defender}}.",
        "{{attacker}} ends the fight with a brutal, theatrical strike that sprays the crowd.",
        "{{attacker}} executes {{defender}} with a ruthless, clinical strike to the throat.",
        "{{attacker}} steps over the fallen {{defender}} and delivers a final, brutal blow.",
        "{{attacker}} ends it efficiently. Another body for the pyre, another victory won.",
        "{{attacker}} raises their weapon high before bringing it down in a merciless arc.",
        "{{attacker}} violently butchers {{defender}} in a display of unchecked savagery.",
        "{{attacker}} brings the bout to a dark, unceremonious end with a lethal thrust.",
        "With brutal finality, {{attacker}} ensures {{defender}} will never rise again.",
        "{{defender}} breathes their last, the light fading under the unforgiving sun.",
        "The arena falls silent as {{attacker}} executes a flawless, deadly finish.",
        "There is no mercy in {{attacker}}'s eyes as they strike the final blow.",
        "With clinical precision, {{attacker}} ends {{defender}}'s suffering.",
        "A brutal, final strike separates {{defender}} from the mortal coil.",
        "{{attacker}} executes a flawless, cold-blooded finishing blow.",
        "A brutal execution that leaves the crowd in stunned silence.",
        "{{attacker}} delivers a cold, methodical coup de gr\xE2ce.",
        "A final, unceremonious end to a bloody struggle.",
        "Death comes swiftly in the arena.",
        "The sands drink deeply today.",
        "A chillingly precise maneuver from {{attacker}} ends {{defender}}'s life before they even realize they are dead.",
        "{{attacker}} dispatches {{defender}} with an almost clinical detachment, a perfect, fatal strike.",
        "The arena goes dead silent as {{attacker}} brutally, efficiently executes {{defender}}.",
        "The blow shatters bone and splinters reality; {{defender}} is dead before they hit the ground, another sacrifice to the pit.",
        "A cold, clinical strike severs the spine. {{defender}} collapses like a puppet with cut strings, ending the bout."
      ],
      critical_chain: [
        "Like a machine built for slaughter, {{attacker}} executes a continuous, unbroken chain of critical hits, spelling doom for {{defender}}.",
        "A relentless flurry! {{attacker}} strings together a blinding series of strikes, the final one separating {{defender}} from their life.",
        "A blinding storm of steel! {{attacker}} unleashes a combo so fast and lethal that {{defender}} is dead before they hit the sand.",
        "{{attacker}} strings together a brutal combination, each hit more punishing than the last, completely obliterating {{defender}}.",
        "An unrelenting barrage leaves {{defender}} nowhere to run. The final, fatal blow from {{attacker}} is an act of sheer brutality.",
        "{{defender}} is caught in a hurricane of strikes! The final blow from {{attacker}} shatters their ribs and stops their heart.",
        "{{attacker}} unleashes an unrelenting chain of critical strikes, ending {{defender}} before they even realize what happened.",
        "With terrifying fluidity, {{attacker}} links one fatal strike into another, a storm of steel that tears {{defender}} apart.",
        "A whirlwind of steel! {{attacker}} delivers blow after blow until {{defender}}'s battered body finally yields to the void.",
        "Strike after strike! {{attacker}} overwhelms {{defender}}'s guard, culminating in a horrific, bone-shattering final blow.",
        "{{defender}} is overwhelmed by a flawless chain of precision strikes, {{attacker}} dismantling them with cold perfection.",
        "A masterful, flawless sequence of devastating blows from {{attacker}} leaves {{defender}} utterly ruined on the sands.",
        "{{defender}} is caught in a meatgrinder of attacks. The final strike from {{attacker}} simply ends the suffering.",
        "{{attacker}} unleashes a rapid-fire symphony of carnage, the final note being {{defender}}'s death rattle.",
        "{{defender}} never had a chance to breathe. {{attacker}}'s combo ends in a devastating, fatal crescendo.",
        "Strike, parry, strike! {{attacker}} breaks down every defense, culminating in a vicious execution combo.",
        "{{attacker}} unleashes a continuous storm of violence, leaving {{defender}} utterly broken.",
        "{{attacker}} overwhelms {{defender}} in a beautiful, horrific flurry of death.",
        "The final strike in {{attacker}}'s unbroken combo splinters {{defender}}'s resolve.",
        "{{attacker}} doesn't stop, raining down blows until {{defender}} stops moving entirely.",
        "A brutal combination leaves {{defender}} lifeless before they even hit the ground.",
        "A dizzying combination of strikes from {{attacker}} completely dismantles {{defender}}, leaving them dead before they hit the ground.",
        "{{attacker}} unleashes a blinding series of blows, the final strike crushing the life from {{defender}}.",
        "A blinding, overwhelming flurry from {{attacker}} completely dismantles {{defender}}, ending in a horrific final blow.",
        "{{attacker}} unleashes a relentless tempest of steel, breaking {{defender}} down piece by bloody piece.",
        "Unable to weather the furious storm, {{defender}} is finally, brutally put down by {{attacker}}."
      ],
      armor_failure: [
        "{{defender}}'s armor finally gives way under the relentless assault, {{attacker}} driving their weapon through the splintered ruin to end it.",
        "The last remnants of {{defender}}'s armor buckle and break. {{attacker}} doesn't hesitate, delivering a brutal killing blow through the gap.",
        "Straps snap and metal groans! {{defender}}'s armor completely fails, allowing {{attacker}} to bury their {{weapon}} deep into vital organs.",
        "With a sickening crunch, {{attacker}} shatters {{defender}}'s defenses, the broken armor doing nothing to stop the final, fatal blow.",
        "{{attacker}} finds the critical structural flaw in {{defender}}'s battered gear, punching through the sundered plating for the kill.",
        "{{attacker}} capitalizes on the ruined state of {{defender}}'s armor, driving a lethal strike straight through the exposed weakness.",
        "The flawed armor splinters inward, driving shards into {{defender}}'s flesh as {{attacker}}'s heavy blow seals their doom.",
        "Sparks fly as {{defender}}'s armor finally catastrophically fails, allowing {{attacker}} to deliver the execution stroke.",
        "A sickening crunch echoes as {{attacker}}'s weapon bypasses the fractured armor, ending {{defender}}'s life instantly.",
        "{{defender}}'s armor gives way! {{attacker}}'s {{weapon}} punches through the compromised defenses for a lethal blow.",
        "Leather tears and mail shatters! {{defender}}'s ruined gear offers no protection against {{attacker}}'s lethal blow.",
        "With a catastrophic structural failure, {{defender}}'s breastplate caves, allowing {{attacker}} to pierce the heart.",
        "A sickening rending of metal! {{defender}}'s armor collapses inward as {{attacker}}'s fatal strike finds a home.",
        "The final blow exploits a ruined pauldron, burying deep into {{defender}}'s vitals as their gear betrays them.",
        "Sparks fly as {{defender}}'s gear shatters, leaving them entirely exposed to {{attacker}}'s fatal strike.",
        "Sparks shower the sand as {{attacker}}'s weapon punches clean through {{defender}}'s compromised plate.",
        "{{defender}}'s battered armor finally gives way, leaving them completely exposed to the lethal blow.",
        "Steel shatters and flesh yields as {{attacker}} drives right through {{defender}}'s ruined defenses.",
        "A sickening crunch echoes as {{defender}}'s failing armor proves useless against the killing strike.",
        "{{defender}}'s armor finally gives way, allowing {{attacker}}'s weapon to bite deeply and fatally.",
        "Sparks fly as {{defender}}'s battered protection shatters, {{attacker}}'s blade finding a fatal mark.",
        "{{defender}}'s shattered defense offers no resistance as {{attacker}} drives a fatal strike straight through the ruined plate.",
        "With a horrifying crunch, {{attacker}} smashes right through {{defender}}'s compromised guard, ending it instantly.",
        "Relying on ruined gear costs {{defender}} everything, as {{attacker}} exploits the weakness for a lethal finish."
      ],
      fatigue_collapse: [
        "Exhaustion claims its toll. As {{defender}} drops their guard, gasping for air, {{attacker}} drives home a mercifully quick death.",
        "{{defender}} stumbles, utterly drained, their weapon slipping from exhausted fingers just as {{attacker}} delivers the final blow.",
        "Exhaustion claims {{defender}} completely. They simply have nothing left to give as {{attacker}} steps in for the merciless kill.",
        "{{defender}}'s lungs burn and their muscles fail. {{attacker}} takes full advantage of their total exhaustion to claim the life.",
        "{{defender}} simply lacks the strength to lift their weapon. {{attacker}} takes advantage, ending the bout with a fatal thrust.",
        "Fatigue finally breaks {{defender}}'s will to fight, leaving them entirely vulnerable to {{attacker}}'s finishing strike.",
        "Too weak to even raise their arms, {{defender}} can only watch in despair as {{attacker}} calmly delivers the deathblow.",
        "With nothing left in the tank, {{defender}} can only watch helplessly as {{attacker}} effortlessly ends their suffering.",
        "The heavy toll of combat breaks {{defender}}'s body. They collapse, offering their neck to {{attacker}}'s fatal swing.",
        "Gasping for air, {{defender}} stumbles, utterly spent. {{attacker}} delivers the deathblow with chilling calmness.",
        "Exhaustion drags {{defender}}'s weapon down. {{attacker}} takes the opening to end their life with a swift strike.",
        "Too weary to raise a shield, {{defender}} simply awaits the end. {{attacker}} obliges with a fatal, crushing blow.",
        "Legs trembling and lungs burning, {{defender}} offers no resistance to {{attacker}}'s final, merciful execution.",
        "Utterly spent, {{defender}} collapses to their knees. {{attacker}} obliges them with a swift, clean execution.",
        "The toll of the arena proves too much. As {{defender}} collapses from fatigue, {{attacker}} seals their fate.",
        "Lungs burning and arms heavy, {{defender}} collapses. {{attacker}} provides the final, lethal grace.",
        "Utterly spent, {{defender}} can only watch as the final blow descends.",
        "Too weak to even lift their weapon, {{defender}} collapses under the final blow.",
        "{{defender}}'s exhausted limbs betray them, making the lethal strike an inevitability.",
        "Exhausted and broken, {{defender}} simply cannot raise their weapon to stop {{attacker}}'s killing blow.",
        "{{defender}} collapses from pure exhaustion, offering no resistance as {{attacker}} delivers the end.",
        "Exhaustion claims {{defender}} completely, leaving them helpless as {{attacker}} steps in for the grim, final kill.",
        "Too exhausted to even raise a weapon, {{defender}} simply awaits the end as {{attacker}} delivers the deathblow.",
        "{{defender}}'s legs finally give out; {{attacker}} shows no mercy, finishing the exhausted gladiator."
      ],
      rivalry_finish: [
        "With a scream of pure hatred, {{attacker}} buries their {{weapon}} into {{defender}}, finishing the blood feud once and for all.",
        "Years of bad blood culminate in a single, hateful strike. {{attacker}} stands triumphant over their slain rival, {{defender}}.",
        "Decades of bad blood end in seconds of sheer butchery. {{attacker}} howls in triumph over the mangled corpse of {{defender}}.",
        "With a roar of pure vengeance, {{attacker}} ends the feud once and for all, staining the sands with {{defender}}'s blood.",
        "The long-standing grudge is settled in a spray of crimson. {{attacker}} stands over the broken remains of their nemesis.",
        "{{attacker}} makes sure it hurts. A slow, agonizing final strike ensures {{defender}} knows exactly who bested them.",
        "The hatred is palpable! {{attacker}} utterly annihilates their rival {{defender}}, leaving the body unrecognizable.",
        "{{attacker}} doesn't just kill {{defender}}; they destroy their legacy, ending the rivalry in a shower of gore.",
        "The bitter feud ends here! {{attacker}} delivers a spiteful, final blow to their hated rival, {{defender}}.",
        "The bitter feud concludes in absolute butchery. {{attacker}} spits on the fallen corpse of {{defender}}.",
        "A gruesome end to a long-standing feud. {{attacker}} walks away, leaving their nemesis in the dust.",
        "The hatred in {{attacker}}'s eyes burns bright as they end {{defender}}, closing a bitter chapter.",
        "{{attacker}} stands over their fallen rival, eyes burning with long-held vindication.",
        "{{attacker}} stands over their fallen rival, an old score finally settled in blood.",
        "The bitter feud ends here, with {{defender}}'s blood soaking the sand.",
        "With the feud finally settled, {{attacker}} watches their fallen rival grow still.",
        "Years of bad blood culminate in {{attacker}} driving the fatal blow into {{defender}}.",
        "A bitter feud reaches its bloody conclusion as {{attacker}} ends {{defender}}.",
        "Years of bitter hatred culminate as {{attacker}} violently tears the life from their nemesis, {{defender}}.",
        "{{attacker}} screams in triumph, standing victorious over the bloody corpse of their hated rival, {{defender}}.",
        "This blood feud ends here! {{attacker}} stands victorious, staring down at the lifeless body of their bitter rival, {{defender}}.",
        "Years of hatred culminate in a single, devastating stroke as {{attacker}} finally puts {{defender}} in the ground.",
        "The bitter rivalry is extinguished in blood. {{attacker}} walks away, leaving {{defender}} to the carrion birds."
      ],
      fatal_damage: [
        "The sheer kinetic energy of {{attacker}}'s strike pulverizes {{defender}}'s insides. A catastrophic and instantaneous death.",
        "A blow of unimaginable force! {{attacker}} essentially tears {{defender}} in half, painting the front rows red.",
        "Blood sprays in a wide arc! {{attacker}}'s {{weapon}} causes catastrophic, irreparable damage to {{defender}}.",
        "There is no recovering from that. {{attacker}} cleaves through {{defender}} in a horrific display of power.",
        "Bleeding from a dozen gashes, {{defender}}'s strength finally fails, and the reaper claims his due.",
        "{{defender}} takes one final, ragged breath before the blood loss takes them to the eternal shade.",
        "A catastrophic impact! {{attacker}} unleashes a monstrous blow that utterly destroys {{defender}}.",
        "The accumulated wounds prove too much; {{defender}} collapses lifelessly into the crimson sand.",
        "The light fades from {{possessive}} eyes before they even hit the sand. A clinical, brutal end.",
        "{{name}} crumples, life spilling onto the thirsty sands, joining the countless forgotten dead.",
        "The lethal trauma overwhelms {{defender}}, leaving them to bleed out under the uncaring sun.",
        "The strike separates soul from flesh instantly. The crowd roars as another life ends.",
        "A spasm, a sigh, and then absolute stillness. The circle of truth accepts its toll.",
        "{{name}} drops like a stone, life extinguished in a single, unceremonious motion.",
        "A sudden silence falls as the body collapses, another soul claimed by the arena.",
        "{{name}} falls like a puppet with cut strings, devoid of grace, devoid of life.",
        "No final words, no dramatic gasps. Just the cold reality of steel and death.",
        "Death arrives swiftly, a cold comfort on the sun-baked sands of the arena.",
        "The body hits the floor with a heavy, final thud. The contest is over.",
        "The devastating wound proves too much; {{defender}} slumps over, lifeless.",
        "Blood flows freely as the catastrophic injury finally claims {{defender}}'s life.",
        "A mortal wound brings {{defender}}'s journey to a brutal, abrupt end.",
        "{{defender}} collapses, the sheer trauma of the battle finally claiming their life.",
        "Unable to sustain the grevious wounds, {{defender}} falls still on the bloody sand.",
        "The accumulated damage is too much; {{defender}} breathes their last breath in the dirt.",
        "{{defender}} succumbs to their horrific injuries, another soul claimed by the arena.",
        "A final, gurgling breath escapes {{defender}} before the end.",
        "{{defender}}'s eyes glass over as the arena claims another soul.",
        "{{defender}} succumbs to catastrophic wounds, collapsing lifelessly to the sands.",
        "The sheer trauma of the battle finally claims {{defender}}.",
        "Bleeding out on the arena floor, {{defender}} draws their final, shuddering breath.",
        "{{defender}}'s body simply gives out, ruined beyond the capacity to live.",
        "The sheer trauma of the injury proves too much; {{defender}} expires instantly on the sand.",
        "A horrific wound spills {{defender}}'s lifeblood across the arena, ending their fighting days forever.",
        "Blood flows in rivers as {{defender}} takes a hit they cannot walk away from, their life pouring into the hungry sands.",
        "The final strike is unceremonious and brutal, snuffing out {{defender}}'s life with dull, wet finality."
      ],
      weapon_specific: {
        slashing: [
          "{{attacker}}'s blade finds the artery, and {{defender}} bleeds out in seconds.",
          "With a horrifying sweep, {{attacker}} leaves {{defender}} in absolute ruin.",
          "A sweeping decapitation leaves the crowd in stunned silence.",
          "{{attacker}}'s blade finds the neck, showering the sand in crimson.",
          "With a brutal horizontal slash, {{attacker}} cuts {{defender}} down for good.",
          "{{defender}} collapses as {{attacker}}'s edge neatly severs their main artery.",
          "A sickening wet thud marks the end as {{attacker}} cleaves through bone.",
          "{{attacker}}'s steel sings a fatal song, laying {{defender}} to rest.",
          "A final, desperate parry fails, and {{attacker}} opens {{defender}}'s throat.",
          "{{defender}} falls apart under a relentless flurry of lethal cuts.",
          "A brutal, sweeping arc from {{attacker}} severs {{defender}}'s neck.",
          "{{attacker}}'s blade carves a fatal path across {{defender}}'s torso.",
          "With a sickening wet thud, {{attacker}}'s slash ends {{defender}}'s life.",
          "{{defender}} drops in a spray of crimson as {{attacker}}'s slash bites deep.",
          "{{attacker}} eviscerates {{defender}} with a ruthless, arcing strike.",
          "A flashing blade from {{attacker}} finds the gap in {{defender}}'s armor, ending it.",
          "{{defender}} falls to pieces before {{attacker}}'s relentless slashing assault.",
          "With a savage horizontal cut, {{attacker}} executes {{defender}} on the spot.",
          "{{attacker}}'s blade arcs in a final, lethal sweep, severing {{defender}}'s mortal coil.",
          "A sickening spray of crimson follows as {{attacker}} cleaves through {{defender}}'s final defenses.",
          "{{defender}} crumples as {{attacker}}'s sweeping strike leaves a devastating, fatal wound.",
          "The edge of {{attacker}}'s weapon finds the mark, ending {{defender}} in a shower of gore.",
          "{{attacker}} executes a merciless dismemberment, leaving {{defender}} lifeless on the sands.",
          "With a sickening sound of parting flesh, {{attacker}}'s final slash brings {{defender}} to an end.",
          "{{defender}} is unmade by a single, perfectly aimed cut from {{attacker}}'s blade.",
          "{{attacker}} carves a brutal finale into {{defender}}, ending the bout in spectacular bloodshed.",
          "{{attacker}}'s blade whistles through the air, completely severing {{defender}}'s {{bodyPart}}.",
          "A horrific, sweeping slash from {{attacker}} leaves {{defender}} in two distinct pieces.",
          "Blood sprays in a wide arc as {{attacker}}'s {{weapon}} cleaves through {{defender}}'s neck.",
          "With a sickening slice, {{attacker}} removes {{defender}}'s {{bodyPart}}, ending the bout.",
          "{{attacker}} executes a flawless diagonal cut, butchering {{defender}} instantly.",
          "The edge of {{attacker}}'s weapon finds the throat, silencing {{defender}} forever.",
          "{{defender}} falls apart under a relentless flurry of masterful slashes from {{attacker}}.",
          "A devastating horizontal sweep from {{attacker}} unzips {{defender}} across the middle.",
          "A brutal, decapitating swing from {{attacker}} separates {{defender}}'s head from their shoulders.",
          "{{attacker}} eviscerates {{defender}} with a sickeningly smooth slash.",
          "A deep, fatal gash across the throat ends {{defender}}'s time in the arena.",
          "{{attacker}} chops deeply into {{defender}}'s torso, painting the sands crimson.",
          "{{defender}} collapses in a heap as {{attacker}}'s blade cleaves through flesh and bone.",
          "A terrifying sweep from {{attacker}} leaves {{defender}} in absolute, bloody ruin.",
          "{{attacker}} executes a flawless, fatal cut that stops {{defender}} dead in their tracks.",
          "With a sickening wet sound, {{attacker}} slices {{defender}} wide open.",
          "A gruesome spray of crimson paints the sands as {{defender}}'s body is cleaved in two.",
          "{{attacker}}'s blade finds a gap, ending {{defender}}'s struggle with a wet slicing sound.",
          "{{defender}} clutches their ruined throat as {{attacker}}'s slash proves immediately fatal.",
          "A sickening thud echoes as {{attacker}}'s swing cleanly separates {{defender}}'s limb.",
          "{{defender}} stares in disbelief at their own spilling entrails before collapsing lifeless.",
          "{{attacker}}'s weapon shears through armor and bone, sending {{defender}} to the ancestors.",
          "The crowd shrieks as {{defender}} is butchered by a merciless, sweeping cut.",
          "{{defender}} falls, their life leaking away from a devastating horizontal slash.",
          "A wide, terrible arc from {{attacker}} completely eviscerates {{defender}}.",
          "{{attacker}}'s edge bites deep, severing {{defender}}'s vital tendons and ending it all.",
          "With a sickening wet thud, {{attacker}}'s blade decapitates {{defender}}.",
          "{{attacker}} casually flick the blood from their blade as {{defender}} collapses in pieces.",
          "A flurry of razor-sharp cuts leaves {{defender}} a bloody, motionless ruin.",
          "{{defender}} tries to hold their own insides in, but {{attacker}}'s slashing finish is absolute.",
          "A final, perfectly angled draw cut from {{attacker}} ends {{defender}} instantly.",
          "The crowd roars as {{attacker}}'s weapon carves a fatal path through {{defender}}.",
          "{{attacker}}'s blade arcs in a final, brutal sweep, ending {{defender}}'s resistance.",
          "With a sickening wet thud, {{attacker}} cleaves through {{defender}}'s last defense.",
          "A swift decapitating arc from {{attacker}} leaves {{defender}} lifeless on the sands.",
          "{{defender}} collapses as {{attacker}}'s edge finds a fatal artery.",
          "{{attacker}} turns a parry into a disemboweling slash, dropping {{defender}}.",
          "A blindingly fast draw-cut from {{attacker}} silences {{defender}} forever.",
          "{{attacker}} steps past {{defender}}, leaving a fatal wake of crimson in the air.",
          "The crowd erupts as {{attacker}}'s steel cleanly severs {{defender}}'s thread of life.",
          "The blade arcs beautifully, slicing deeply into the {{bodyPart}} and ending the bout.",
          "A wide, horrific swing from {{attacker}} bisects {{defender}}'s armor and flesh.",
          "{{attacker}} dances past the guard, their edge biting clean through {{defender}}'s {{bodyPart}}.",
          "Blood sprays in a perfect crimson arc as the sweeping cut finds its mark.",
          "With a sickening wet sound, the edge carves a fatal canyon into {{defender}}.",
          "A merciless chop to the {{bodyPart}} leaves {{defender}} in ruin.",
          "The steel sings a deadly note as it effortlessly parts {{defender}}'s flesh.",
          "{{attacker}} spins, bringing the edge around in a devastating, lethal sweep.",
          "A clean, surgical slice leaves {{defender}} gasping as their life pours onto the sands.",
          "A vicious arc of steel leaves them ruined upon the ground.",
          "The blade parts flesh and bone, ending their struggle in a spray of crimson.",
          "With a sickening sound, the slashing blow ensures their final rest.",
          "Their life is severed as cleanly as the grim cut that brings them down.",
          "A brutal slash tears through their defenses and their life alike.",
          "The sharp edge finds its mark, drawing a final, fatal line across their form.",
          "A merciless cut leaves them bleeding out their last moments on the unforgiving sands.",
          "They are unmade by a flurry of devastating slashes that offer no mercy.",
          "{{attacker}} executes a flawless, sweeping decapitation, ending the bout instantly.",
          "A brutal flurry of slashes from {{attacker}} leaves {{defender}} in pieces on the sand.",
          "{{attacker}}'s blade shears cleanly through {{defender}}'s neck. A fountain of crimson erupts.",
          "With a terrifying scream, {{attacker}} cleaves {{defender}} perfectly in twain.",
          "{{attacker}} draws their weapon across {{defender}}'s throat in a cold, precise execution.",
          "A masterful, diagonal cut from {{attacker}} eviscerates {{defender}} completely.",
          "{{defender}} collapses as {{attacker}}'s final, devastating slash paints the arena red.",
          "{{attacker}} parts {{defender}} from their limbs in a gruesome display of slashing mastery.",
          "The crowd roars as {{attacker}}'s blade removes {{defender}}'s head from their shoulders."
        ],
        piercing: [
          "{{attacker}} drives their point straight through {{defender}}'s heart.",
          "A surgical thrust from {{attacker}} drops {{defender}} before they even realize they're dead.",
          "{{attacker}}'s point slips past the guard, puncturing a vital organ.",
          "With a sickening crunch, {{attacker}} impales {{defender}} through the chest.",
          "A swift lunge finds the eye, dropping {{defender}} lifeless to the sand.",
          "{{defender}} chokes on their own blood as {{attacker}} drives the spike deep.",
          "{{attacker}} skewers their prey like a master butcher.",
          "A quick inward twist of the blade, and {{defender}} breathes their last.",
          "{{attacker}} steps in close and drives the point straight upward into the heart.",
          "A precise, deadly thrust ends the contest in a heartbeat.",
          "{{attacker}} lunges perfectly, the point impaling {{defender}} through the chest.",
          "A wicked thrust from {{attacker}} punctures {{defender}}'s vital organs.",
          "{{defender}} gasps as {{attacker}}'s weapon punches clean through their heart.",
          "With clinical precision, {{attacker}} runs {{defender}} through.",
          "{{attacker}} buries their point deep into {{defender}}'s neck, a swift and fatal strike.",
          "A flash of steel and {{attacker}} pierces {{defender}}'s throat.",
          "{{defender}} collapses as {{attacker}} skewers them with brutal force.",
          "{{attacker}} finds the seam in the armor, driving a fatal thrust into {{defender}}.",
          "{{attacker}} thrusts forward, impaling {{defender}} upon their weapon with finality.",
          "A surgical, fatal puncture by {{attacker}} leaves {{defender}} gasping their last breath.",
          "The point of {{attacker}}'s weapon finds {{defender}}'s heart, bringing instant death.",
          "{{defender}} drops instantly as {{attacker}}'s thrust violently pierces their core.",
          "{{attacker}} runs {{defender}} completely through, ending the match in a brutal display.",
          "A lethal thrust from {{attacker}} finds the softest point, snuffing out {{defender}}'s life.",
          "{{defender}} is pinned by a fatal lunge from {{attacker}}, their eyes going dull.",
          "{{attacker}} delivers a flawless, fatal stab that cleanly severs {{defender}} from this world.",
          "{{attacker}} drives the point of their {{weapon}} straight through {{defender}}'s skull.",
          "A lightning-fast lunge from {{attacker}} impales {{defender}} squarely through the chest.",
          "With clinical precision, {{attacker}} skewers {{defender}}, pinning them to the very air.",
          "{{defender}} gasps as {{attacker}}'s {{weapon}} punches through their back, a fatal puncture.",
          "{{attacker}} sinks the {{weapon}} to the hilt in {{defender}}'s heart, a perfect kill.",
          "A surgical thrust finds the gap in armor, ending {{defender}}'s life in an instant.",
          "{{attacker}} twists the blade as it pierces deep, tearing the life from {{defender}}.",
          "A blinding jab from {{attacker}} completely punctures {{defender}}'s vital organs.",
          "{{attacker}} runs {{defender}} completely through, lifting them briefly before they drop.",
          "A precision thrust from {{attacker}} impales {{defender}} on the spot.",
          "{{attacker}} skewers {{defender}} with a vicious, unyielding lunge.",
          "The point of {{attacker}}'s weapon erupts from {{defender}}'s back in a spray of blood.",
          "{{defender}} gasps as {{attacker}}'s thrust finds a vital organ with deadly accuracy.",
          "{{attacker}} drives the point deep into {{defender}}'s neck, severing the spine.",
          "A sudden, deep puncture from {{attacker}} leaves {{defender}} suffocating on their own blood.",
          "{{defender}} slumps onto {{attacker}}'s weapon, fatally impaled.",
          "{{attacker}} drives the point home with sickening finality, skewering {{defender}} like a pig.",
          "{{defender}} gasps silently as the weapon punches straight through their heart.",
          "A perfect thrust! {{defender}} is pinned to the ground, dead before they hit the sand.",
          "{{attacker}} violently rips their weapon free, leaving {{defender}} to bleed out in seconds.",
          "{{defender}}'s eyes roll back as a surgical strike pierces directly into their skull.",
          "The piercing blow finds a vital artery, painting the arena red as {{defender}} collapses.",
          "{{attacker}} effortlessly slips the point past the guard, burying it deep in {{defender}}'s chest.",
          "{{defender}} coughs up a bloody mist as {{attacker}}'s thrust violently ends their life.",
          "{{attacker}} steps inside the guard, plunging the point fatally into {{defender}}.",
          "A blindingly fast lunge from {{attacker}} skewers {{defender}} completely.",
          "{{attacker}} pins {{defender}} to the arena floor with a brutal, final thrust.",
          "With clinical precision, {{attacker}} punctures {{defender}}'s lung, ending the bout.",
          "{{defender}} chokes on their own blood as {{attacker}} twists the embedded point.",
          "A final, devastating thrust from {{attacker}} leaves {{defender}} utterly lifeless.",
          "{{attacker}} finds the gap in the armor, driving their point home for the kill.",
          "The sheer force of {{attacker}}'s thrust crumples {{defender}} in a tragic finale.",
          "{{attacker}} drives the point home, skewering {{defender}} where they stand.",
          "With surgical precision, {{attacker}} punctures {{defender}}'s heart.",
          "{{defender}} gasps as {{attacker}}'s thrust finds the fatal gap in their armor.",
          "A devastating lunge from {{attacker}} impales {{defender}} on the spot.",
          "{{attacker}} twists the blade deep in {{defender}}'s vitals, securing the kill.",
          "{{defender}} slumps over {{attacker}}'s weapon, eyes fading to glass.",
          "A final, desperate thrust from {{attacker}} punches clean through {{defender}}.",
          "{{attacker}} withdraws their weapon with a sickening squelch, leaving {{defender}} to fall.",
          "A clinical thrust punches straight through the {{bodyPart}}, finding vitals.",
          "{{attacker}} lunges with terrifying speed, impaling {{defender}} on the spot.",
          "The point slips between armor plates, burying itself deep in {{defender}}'s core.",
          "A brutal, twisting stab ensures {{defender}} will never rise again.",
          "With a sharp gasp, {{defender}} falls as the point is driven ruthlessly home.",
          "The tip bites deep into the {{bodyPart}}, puncturing something critical.",
          "{{attacker}}'s precise lunge skewers the {{bodyPart}} with deadly intent.",
          "A lethal thrust skewers {{defender}}, holding them aloft for a morbid moment.",
          "The deadly point plunges deep, finding the very center of {{defender}}'s life.",
          "The thrust takes them perfectly, plunging deep and ending it all.",
          "A precise puncture finds the vital mark; they collapse instantly.",
          "Impaled upon the cruel point, they sag in defeat and death.",
          "The deadly point pierces through armor and flesh, extinguishing their spark.",
          "A swift, surgical thrust leaves them gasping their last breath.",
          "They are skewered by a relentless attack, their strength draining away with their blood.",
          "The penetrating strike finds the heart of the matter, literally and figuratively.",
          "A final, desperate lunge drives the point home, sealing their grim fate.",
          "{{attacker}} drives their point straight through {{defender}}'s heart, killing them instantly.",
          "A flurry of precise, lethal thrusts from {{attacker}} turns {{defender}} into a pincushion.",
          "{{attacker}} impales {{defender}} effortlessly, lifting them off the ground before letting them fall.",
          "With clinical precision, {{attacker}} pierces {{defender}}'s skull, ending the fight.",
          "{{defender}} gasps as {{attacker}}'s final lunge skewers their vitals completely.",
          "{{attacker}} drives the weapon deep into {{defender}}'s chest, twisting the blade cruelly.",
          "A perfectly placed thrust from {{attacker}} severs {{defender}}'s spine.",
          "{{attacker}} pins {{defender}} to the bloody sand with a devastating, fatal lunge.",
          "The arena falls silent as {{attacker}}'s blade punches perfectly through {{defender}}'s heart."
        ],
        bashing: [
          "A deafening crack signals the end as {{attacker}} crushes {{defender}}'s skull.",
          "{{attacker}} shatters {{defender}}'s chest cavity, ending the fight instantly.",
          "{{attacker}} delivers a crushing blow that turns bone to powder.",
          "The horrifying sound of a shattered ribcage echoes as {{defender}} drops.",
          "{{attacker}} brings the hammer down, and the lights go out for {{defender}}.",
          "A final, deafening smack, and {{defender}} is no more than broken meat.",
          "{{defender}}'s head snaps violently back, neck broken by the brutal impact.",
          "{{attacker}} caves in {{defender}}'s chest with an unstoppable, heavy swing.",
          "With a roar, {{attacker}} turns {{defender}} into a crumpled, lifeless heap.",
          "The impact shakes the arena floor as {{attacker}} delivers the deathblow.",
          "A crushing blow from {{attacker}} caves in {{defender}}'s ribcage.",
          "{{attacker}} brings down a world-shattering smash that instantly kills {{defender}}.",
          "With a sickening crunch, {{attacker}} obliterates {{defender}}'s skull.",
          "{{defender}} is flattened by a thunderous, fatal bash from {{attacker}}.",
          "{{attacker}} delivers a massive, bone-splintering strike that ends {{defender}}.",
          "A savage downward swing from {{attacker}} crushes the life out of {{defender}}.",
          "{{defender}}'s armor crumples like paper under {{attacker}}'s lethal smash.",
          "{{attacker}} swings with the force of a battering ram, obliterating {{defender}}.",
          "A sickening crunch echoes through the arena as {{attacker}} caves in {{defender}}'s defenses.",
          "{{attacker}} delivers a crushing, fatal blow, turning {{defender}} into a broken heap.",
          "{{defender}}'s body gives way under a devastating, bone-shattering smash from {{attacker}}.",
          "The sheer force of {{attacker}}'s final bludgeoning blow leaves {{defender}} lifeless.",
          "{{attacker}} brings their weapon down like a hammer of the gods, pulverizing {{defender}}.",
          "A brutal, concussive impact from {{attacker}} ends {{defender}}'s life on the spot.",
          "{{defender}}'s frame is shattered beyond repair by {{attacker}}'s merciless bashing attack.",
          "{{attacker}} crushes the very life out of {{defender}} with a cataclysmic final strike.",
          "{{attacker}} brings their {{weapon}} down with meteoric force, pulverizing {{defender}}'s skull.",
          "A devastating, sweeping bash from {{attacker}} completely shatters {{defender}}'s ribcage.",
          "{{defender}} is launched backward, every bone broken by {{attacker}}'s final, crushing blow.",
          "The sickening sound of a caved-in chest echoes as {{attacker}} ends {{defender}}.",
          "{{attacker}} bludgeons {{defender}} mercilessly into the sand, leaving a ruined heap.",
          "With a bone-shattering smash, {{attacker}} crushes the very life out of {{defender}}.",
          "{{attacker}} executes a thunderous overhead strike that folds {{defender}} like paper.",
          "A concussive, brutal impact from {{attacker}} stops {{defender}}'s heart instantly.",
          "A sickening crunch echoes through the arena as {{attacker}} caves in {{defender}}'s skull.",
          "{{attacker}} brings the weapon down with godlike force, flattening {{defender}}.",
          "A brutal smash from {{attacker}} shatters {{defender}}'s ribs, ending the fight.",
          "{{defender}} is thrown backward, their body broken by {{attacker}}'s crushing blow.",
          "{{attacker}} delivers a pulverized strike, leaving {{defender}} an unrecognizable mess.",
          "A heavy, concussive impact from {{attacker}} snaps {{defender}}'s neck instantly.",
          "{{attacker}} swings with brutal power, completely shattering {{defender}}'s defense and life.",
          "The arena shakes as {{attacker}} drops {{defender}} with a massive, crushing strike.",
          "A thunderous crack echoes as {{attacker}} crushes {{defender}}'s skull like a melon.",
          "{{defender}}'s ribcage caves in with a horrific crunch from {{attacker}}'s crushing blow.",
          "{{attacker}} unleashes a blunt force trauma so severe {{defender}}'s body simply gives out.",
          "The sheer impact shatters {{defender}}'s spine, ending the bout in brutal fashion.",
          "{{defender}} is pounded into the bloody dirt, pulverized beyond recognition.",
          "A sickening thud signals the end as {{attacker}} brutally caves in {{defender}}'s chest.",
          "{{defender}} spasms once and goes still after a devastating, bone-shattering smash.",
          "{{attacker}} delivers a crushing coup de grace, reducing {{defender}} to a broken mess.",
          "{{attacker}} brings the weapon down with earth-shattering force, flattening {{defender}}.",
          "A sickening crunch echoes through the arena as {{attacker}} caves in {{defender}}'s ribs.",
          "{{attacker}} swings like a lumberjack, turning {{defender}} into a broken heap.",
          "With brutal, concussive force, {{attacker}} obliterates {{defender}}'s final defense.",
          "{{defender}}'s bones shatter under the merciless impact of {{attacker}}'s final blow.",
          "A masterstroke of raw power from {{attacker}}! The weapon finds its mark with deadly blunt force.",
          "{{attacker}} executes a flawless bludgeoning technique, leaving {{defender}} no chance.",
          "The crushing weight of {{attacker}}'s weapon strike crumples {{defender}} entirely.",
          "{{attacker}} delivers a crushing blow that shatters {{defender}}'s skull.",
          "The sheer concussive force of {{attacker}}'s final strike pulverizes {{defender}}.",
          "{{defender}} is folded in half by a devastating swing from {{attacker}}.",
          "A thunderous impact from {{attacker}} caves in {{defender}}'s chest cavity.",
          "{{attacker}} brings the hammer down, flattening {{defender}} into the dirt.",
          "Bones splinter like dry wood as {{attacker}} smashes {{defender}} to the ground.",
          "{{defender}}'s defenses are violently dismantled by {{attacker}}'s crushing finisher.",
          "With a brutal overhead smash, {{attacker}} permanently retires {{defender}}.",
          "A thunderous swing shatters bone and hope in equal measure.",
          "The crushing blow caves in the {{bodyPart}} with a horrifying crunch.",
          "{{attacker}} brings the weapon down with the force of a falling anvil.",
          "A devastating smash leaves {{defender}} broken and motionless on the dirt.",
          "The blunt impact reverberates across the arena, a sickening sound of structural failure.",
          "{{defender}}'s frame crumples utterly under the overwhelming bludgeoning force.",
          "A skull-rattling slam terminates the contest instantly.",
          "The brutal concussive force shatters the {{bodyPart}} into fragments.",
          "{{attacker}} delivers a ruinous smash, reducing the defense to dust.",
          "The sheer concussive force shatters them, leaving only a broken shell.",
          "A horrific crunch signals the end, their body unable to withstand the trauma.",
          "They are hammered into the dirt, their spirit crushed along with their bones.",
          "The heavy blow lands with a devastating thud, extinguishing their life.",
          "A brutal bludgeoning leaves them senseless and forever stilled.",
          "They are pulverized by a merciless onslaught of crushing impacts.",
          "The crushing force shatters their resolve and their form in a single, terrible instant.",
          "A final, overwhelming smash brings a violent end to their struggle.",
          "{{attacker}} unleashes a skull-crushing blow, caving in {{defender}}'s head.",
          "A sickening crunch echoes through the coliseum as {{attacker}} obliterates {{defender}}'s chest cavity.",
          "{{attacker}} repeatedly smashes {{defender}} into the dirt until nothing remains but ruin.",
          "With a thunderous swing, {{attacker}} shatters every bone in {{defender}}'s body.",
          "{{defender}} is reduced to a bloody pulp by {{attacker}}'s merciless, crushing barrage.",
          "{{attacker}} caves in {{defender}}'s skull with a final, devastating overhead smash.",
          "The crowd gasps as {{attacker}}'s heavy weapon completely crushes {{defender}}.",
          "A terrifying, bone-pulverizing hit from {{attacker}} ends {{defender}}'s life instantly.",
          "{{attacker}} delivers a crushing coup de grace, leaving {{defender}} broken on the sands."
        ],
        fist: [
          "{{attacker}} delivers a lethal blow to the temple, dropping {{defender}} lifeless.",
          "A brutal, neck-snapping strike from {{attacker}} ends {{defender}}'s misery.",
          "{{attacker}} lands a terrifying bare-knuckle hook, shattering the jaw and dropping {{defender}} dead.",
          "A sickening crack of the neck, and {{attacker}}'s raw strength claims a life.",
          "{{defender}} collapses from internal bleeding after a merciless gut punch.",
          "{{attacker}} mounts and pummels {{defender}} into a grisly end.",
          "With a final brutal strike, {{attacker}} beats the remaining life out of their foe.",
          "{{attacker}}'s fists prove deadlier than any blade, finishing the job.",
          "A rapid one-two combo leaves {{defender}} lifeless in the dirt.",
          "{{defender}} simply folds in half, organs ruptured by {{attacker}}'s monstrous blow.",
          "{{attacker}} unleashes a devastating haymaker that breaks {{defender}}'s neck.",
          "A rapid volley of brutal punches from {{attacker}} beats the life out of {{defender}}.",
          "{{attacker}} drives a concussive blow straight through {{defender}}'s guard, killing them.",
          "With raw, blunt force, {{attacker}} caves in {{defender}}'s face.",
          "{{defender}}'s heart stops after a massive, bone-shattering body blow from {{attacker}}.",
          "A lethal uppercut from {{attacker}} snaps {{defender}}'s head back with fatal force.",
          "{{attacker}} drops {{defender}} lifeless with a single, perfectly placed strike.",
          "With brutal, bare-handed savagery, {{attacker}} pounds {{defender}} into the dirt forever.",
          "{{attacker}} delivers a horrific, skull-cracking punch that drops {{defender}} forever.",
          "A brutal bare-knuckle barrage from {{attacker}} leaves {{defender}} lifeless in the dirt.",
          "{{defender}}'s neck snaps back from a lethal uppercut delivered by {{attacker}}.",
          "{{attacker}} beats {{defender}} into a lifeless pulp with unrelenting, savage blows.",
          "A sickening impact from {{attacker}}'s fist sends {{defender}} into an eternal slumber.",
          "{{attacker}}'s final, devastating haymaker caves in {{defender}}'s very structure.",
          "{{defender}} is hammered into the sands by a fatal, merciless punch from {{attacker}}.",
          "With a brutal display of physical dominance, {{attacker}} pummels {{defender}} to death.",
          "{{attacker}} delivers a bare-knuckle strike that visibly snaps {{defender}}'s neck.",
          "A colossal uppercut from {{attacker}} lifts {{defender}} off their feet, dead before they land.",
          "{{defender}}'s skull caves in under the raw, primal force of {{attacker}}'s final punch.",
          "{{attacker}} relentlessly pummels {{defender}} into the dirt, stopping only when the breathing ends.",
          "A devastating, unyielding barrage of fists from {{attacker}} completely breaks {{defender}}.",
          "{{attacker}} steps into a crushing hook that shuts off {{defender}}'s lights forever.",
          "With bare hands, {{attacker}} ruthlessly beats the remaining life out of {{defender}}.",
          "A brutal palm strike to the chest stops {{defender}}'s heart cold on the sands.",
          "{{attacker}} delivers a bare-knuckle knockout blow that snaps {{defender}}'s neck.",
          "A savage, bloody beatdown ends with {{attacker}} crushing {{defender}}'s windpipe.",
          "{{attacker}} drives a ruthless punch straight through {{defender}}'s faltering guard.",
          "A flurry of devastating strikes from {{attacker}} beats {{defender}} completely lifeless.",
          "{{attacker}} lands a brutal uppercut, launching {{defender}} into the air before they land dead.",
          "With raw, brutal strength, {{attacker}} pummels {{defender}} into the bloody sands.",
          "{{attacker}} delivers a sickening hook that instantly shuts off {{defender}}'s lights forever.",
          "A raw, primal strike from {{attacker}} caves in {{defender}}'s chest.",
          "{{attacker}} caves in {{defender}}'s face with a horrific, bare-knuckle haymaker.",
          "A sickening snap! {{attacker}} breaks {{defender}}'s neck with a brutal, barehanded twist.",
          "{{defender}} chokes on their own blood after a devastating throat punch ends it all.",
          "{{attacker}} mercilessly beats {{defender}} to death, leaving the sands soaked in gore.",
          "The sheer force of {{attacker}}'s punch stops {{defender}}'s heart instantly.",
          "{{defender}}'s jaw shatters in a lethal spray of bone as {{attacker}} delivers the final blow.",
          "With a sickening crunch, {{attacker}}'s fist punches straight through {{defender}}'s ribs.",
          "{{defender}} slumps lifelessly after suffering a barrage of lethal, unmitigated strikes.",
          "{{attacker}} unleashes a flurry of fatal bare-knuckle strikes, pummeling {{defender}} to death.",
          "A sickening crunch of cartilage signals the end as {{attacker}} crushes {{defender}}'s throat.",
          "{{attacker}} drives a piston-like punch through {{defender}}'s guard, snapping their neck.",
          "With brutal, bare-handed savagery, {{attacker}} beats the life out of {{defender}}.",
          "{{defender}} collapses like a puppet with cut strings after {{attacker}}'s final punch.",
          "A masterstroke of martial violence from {{attacker}} ends {{defender}} instantly.",
          "{{attacker}} executes a flawless hand-to-hand finisher, leaving {{defender}} motionless.",
          "The sheer concussive force of {{attacker}}'s fist crumples {{defender}} in a bloody finale.",
          "{{attacker}} unleashes a brutal hook that snaps {{defender}}'s neck.",
          "A relentless flurry of bare-knuckle strikes from {{attacker}} beats the life from {{defender}}.",
          "{{attacker}} lands an uppercut so devastating it lifts {{defender}} off their feet into the grave.",
          "With a sickening crunch, {{attacker}} caves in {{defender}}'s throat.",
          "{{defender}} crumples under a final, piston-like straight right from {{attacker}}.",
          "{{attacker}} mounts the fallen {{defender}}, raining blows until the referee finally calls it.",
          "A perfectly timed overhand right from {{attacker}} turns the lights out on {{defender}} forever.",
          "{{attacker}} crushes {{defender}}'s windpipe with a desperate, crushing grip.",
          "A savage hook connects with the {{bodyPart}}, extinguishing {{defender}}'s consciousness.",
          "The sheer brute force of the punch shatters the {{bodyPart}}.",
          "{{attacker}} delivers a bare-knuckle execution with a horrifyingly heavy blow.",
          "A rapid barrage of brutal strikes ends with a final, lethal hammer fist.",
          "The sickening thud of knuckle on bone echoes as {{defender}} drops lifelessly.",
          "An explosive straight punch caves in the {{bodyPart}} instantly.",
          "{{attacker}} steps in, driving a ruinous punch straight through the guard.",
          "With savage intensity, a final haymaker destroys {{defender}}'s resolve.",
          "The brutal impact of the bare fist shatters bone and spirit alike.",
          "The sheer brutal force of the bare-handed blow stops their heart.",
          "A relentless pummeling leaves them broken and lifeless on the arena floor.",
          "They are beaten down, unable to rise from the savage barrage of fists.",
          "The primal ferocity of the strike overwhelms them, extinguishing their fight.",
          "A devastating bare-knuckle blow shatters their defenses and their life.",
          "They are battered into submission and beyond, succumbing to the raw power.",
          "The visceral impact of the final strike leaves them a broken heap on the sands.",
          "A merciless flurry of blows brings a brutal and unceremonious end to their days.",
          "{{attacker}} pummels {{defender}}'s face into an unrecognizable ruin.",
          "A devastating, bone-shattering uppercut from {{attacker}} snaps {{defender}}'s neck.",
          "{{attacker}} mounts {{defender}} and delivers a savage, bare-knuckle execution.",
          "With a sickening crunch, {{attacker}} caves in {{defender}}'s windpipe with a final punch.",
          "{{defender}} falls lifeless after {{attacker}} lands a terrifying, fatal haymaker.",
          "{{attacker}} beats the absolute life out of {{defender}} in a brutal display of pure ferocity.",
          "A savage flurry of blows from {{attacker}} ends {{defender}}'s life on the blood-soaked sand.",
          "{{attacker}} shatters {{defender}}'s skull with a single, monstrous punch.",
          "The crowd winces as {{attacker}} literally beats {{defender}} to death with their bare hands."
        ]
      },
      default: [
        "The fatal blow is delivered with cold, mechanical efficiency, instantly halting {{defender}}'s vitals.",
        "A surgical strike from {{attacker}} completely severs {{defender}}'s essential lifelines.",
        "With a final, desperate gasp, {{defender}} falls, their soul joining the countless ghosts of the arena!",
        "{{attacker}} raises their weapon high as {{defender}}'s lifeblood paints the hot sands crimson!",
        "Well, that's one way to solve a dispute. {{defender}} is dead, and the sand is a bit redder.",
        "{{attacker}}'s weapon finds the squishy part. Turns out {{defender}} needed that.",
        "Another meaningless death on the endless blood-soaked sands. {{defender}} is forgotten instantly.",
        "The crowd cheers briefly, then demands the next slaughter as {{defender}}'s body grows cold.",
        "The light fades from {{defender}}'s eyes as they join the fallen.",
        "Another corpse for the cart. {{attacker}} walks away victorious.",
        "{{defender}} falls heavily, their story ended on the bloody sands.",
        "A gasp, a shudder, and stillness. The arena claims another soul.",
        "{{attacker}} claims a brutal victory, leaving {{defender}} utterly unmade on the sands.",
        "The crowd falls silent as {{attacker}} executes a final, devastating blow on {{defender}}.",
        "{{defender}} meets a grim fate at the hands of {{attacker}}, falling permanently.",
        "{{attacker}} asserts absolute dominance, extinguishing {{defender}}'s life without hesitation.",
        "A chilling silence settles as {{attacker}} confirms the death of {{defender}}.",
        "{{defender}} pays the ultimate price, torn apart by {{attacker}}'s final, lethal strike.",
        "{{attacker}} ends the fight with a swift, decisive strike that leaves {{defender}} lifeless.",
        "The crowd roars its approval as {{attacker}} strikes down {{defender}} in cold blood.",
        "Another soul claimed by the sands. {{attacker}} stands tall over the ruined {{defender}}.",
        "The final blow lands true, and {{defender}} collapses heavily, their struggles ended.",
        "{{defender}} collapses into a lifeless heap, ending the brutal exchange.",
        "The crowd roars as {{attacker}} strikes the final, devastating blow.",
        "{{defender}} falls to the sand, their fight finally over.",
        "A swift and merciless finish from {{attacker}} brings the bout to a bloody close.",
        "{{defender}} breathes their last, completely overwhelmed by {{attacker}}'s lethal prowess.",
        "The gods look away as {{attacker}} ends {{defender}}'s miserable existence in the arena.",
        "{{attacker}} ends the bout with a brutal and final blow, leaving {{defender}} motionless on the arena floor.",
        "{{attacker}} delivers a sudden, decisive blow that drops {{defender}} in a lifeless heap.",
        "The crowd gasps as {{attacker}}'s final attack strikes true, concluding the fight instantly.",
        "{{attacker}} delivers the coup de gr\xE2ce, standing triumphant over {{defender}}.",
        "The life leaves {{defender}}'s eyes as {{attacker}} secures the final victory.",
        "A hush falls over the arena as {{attacker}} ends {{defender}}'s miserable existence.",
        "{{defender}}'s fight is over, snuffed out by {{attacker}}'s unrelenting assault.",
        "{{attacker}} seals {{defender}}'s fate with a merciless finishing blow.",
        "Blood soaks the sands as {{attacker}} finally puts {{defender}} down for good.",
        "{{defender}} succumbs to their wounds, leaving {{attacker}} as the sole survivor.",
        "With brutal finality, {{attacker}} terminates {{defender}}'s agonizing struggle.",
        "{{attacker}} delivers a final, shattering blow that extinguishes {{defender}}'s life.",
        "The arena falls momentarily silent as {{defender}} is struck down for the last time.",
        "A merciless execution leaves {{defender}} broken and bleeding out on the dirt.",
        "{{attacker}} ends it, driving a final, brutal strike that leaves no room for survival.",
        "{{defender}}'s light fades as {{attacker}} lands a completely devastating finisher.",
        "A catastrophic strike from {{attacker}} permanently ends {{defender}}'s career and life.",
        "The crowd gasps as {{attacker}} ruthlessly terminates the bout.",
        "With grim finality, {{attacker}} destroys {{defender}}'s final defenses.",
        "{{defender}} falls, their ruin complete after a horrifying, lethal blow.",
        "{{attacker}}'s final strike is absolute, leaving {{defender}} motionless.",
        "A final, breathless gasp escapes them as the light fades.",
        "The arena stands in momentary silence as they fall, never to rise again.",
        "Their blood stains the sands, a grim testament to the harsh reality of the games.",
        "{{attacker}} delivers the final, lethal blow, silencing {{defender}} forever.",
        "The crowd roars as {{attacker}} ends {{defender}}'s miserable existence.",
        "{{defender}} falls, their lifeblood staining the arena sand, courtesy of {{attacker}}.",
        "A brutal, merciless execution from {{attacker}} concludes the bout.",
        "{{attacker}} stands victorious over the ruined corpse of {{defender}}.",
        "The ARENAMASTER signals the end as {{attacker}} finishes {{defender}} off.",
        "{{defender}}'s lifeless body hits the dirt. {{attacker}} is triumphant.",
        "With a final, devastating strike, {{attacker}} sends {{defender}} to the void.",
        "{{attacker}} claims victory, leaving {{defender}} dead upon the sands."
      ]
    }
  };
});

// src/data/narrative/combatConclusions.json
var require_combatConclusions = __commonJS(function(exports, module) {
  module.exports = {
    conclusions: {
      Kill: [
        "The arena falls utterly silent for a heartbeat, before erupting at the brutal execution delivered by {{attacker}}.",
        "The match concludes in the most final way possible. {{defender}} is no more, and {{attacker}} ascends in glory.",
        "A bloody end to a bitter struggle. {{attacker}} is the last one breathing, while {{defender}} feeds the sands.",
        "{{attacker}} wipes the gore from their weapon, standing victorious over the mangled corpse of {{defender}}.",
        "{{attacker}} strikes a triumphant pose over {{defender}}'s lifeless form, soaking in the theatrical glory.",
        "The gods of the arena are appeased today, as {{attacker}} claims the ultimate price from {{defender}}.",
        "With a grim finality, {{attacker}} ends {{defender}}'s misery. A somber silence falls over the arena.",
        "The crowd erupts into a frenzy as {{attacker}} savagely finishes {{defender}} in a spray of crimson!",
        "{{attacker}} roars a challenge to the heavens, having just claimed another soul in the Blood Sands.",
        "{{attacker}} stands triumphant over the remains of {{defender}}, as blood soaks the thirsty sands.",
        "An absolutely brutal finish! {{attacker}} shows no mercy, leaving {{defender}} utterly broken.",
        "In a terrifying display of lethal intent, {{attacker}} reduces {{defender}} to a mere memory.",
        "A clinical, terrifying end. {{attacker}} delivers the killing blow with cold precision.",
        "The arena erupts in morbid cheer as {{defender}}'s lifeblood stains the earth.",
        "Dark humor fills the stands; that was not a fight, it was a butcher's bill.",
        "The life fades from {{defender}}'s eyes as {{attacker}} stands victorious.",
        "A clinical, professional slaughter. The deed is done."
      ],
      KO: [
        "{{defender}} drops, legs gone, and does not rise. {{attacker}} is declared the winner.",
        "The arena holds its breath, then roars \u2014 {{defender}} is out. {{attacker}} wins by KO!",
        "The ARENAMASTER steps in the instant {{defender}} goes limp. Victory to {{attacker}}!",
        "The ARENAMASTER waves it off. {{defender}} is out cold. {{attacker}} takes the bout!",
        "The crowd erupts as {{defender}} hits the sand and does not stir. {{attacker}} wins!",
        "A clinical finish. {{defender}} is out cold \u2014 {{attacker}} claims the knockout.",
        "{{defender}} collapses into the sand, unconscious. {{attacker}} is the victor.",
        "{{attacker}} stands over the prone form of {{defender}}. The bout is over.",
        "{{defender}} crumbles to the sand. {{attacker}} raises a fist in victory.",
        "{{defender}} is down and not getting up. {{attacker}} wins by knockout!"
      ],
      Stoppage: [
        "Seeing the one-sided carnage, the officials rush in to save {{defender}} from further ruin.",
        "The arbiters signal the end as {{defender}}'s injuries become too severe to continue.",
        "The bout is stopped. {{defender}} has taken too much punishment. {{attacker}} wins!",
        "{{defender}} cannot answer \u2014 the ARENAMASTER calls it. {{attacker}} is the victor.",
        "Mercy from the officials saves {{defender}} further punishment. {{attacker}} wins.",
        "It is called off. {{defender}} is done. {{attacker}} takes the stoppage victory.",
        "The ARENAMASTER steps in. {{defender}} is done. {{attacker}} is victorious!",
        "Seeing enough, the officials halt the bout. {{attacker}} wins on stoppage.",
        "The match is called. {{defender}} cannot continue. {{attacker}} wins!",
        "{{defender}} is waved off \u2014 {{attacker}} claims the stoppage victory."
      ],
      Exhaustion: [
        "Gasping for air, {{defender}} falls to their knees, their body refusing to fight on.",
        "{{defender}}'s legs simply give out, collapsing in a heap of utter exhaustion.",
        "{{attacker}} conserved just enough to take the decision. A hard-earned win.",
        "Both warriors are spent, but {{attacker}} is awarded the victory on merit.",
        "A war of attrition ends in favour of {{attacker}} on the officials' cards.",
        "Two spent warriors, one decision \u2014 it goes to {{attacker}} on control.",
        "Neither fighter could finish it, but the judges favour {{attacker}}.",
        "Legs gone, breath gone \u2014 the judges award the bout to {{attacker}}.",
        "The crowd applauds the effort, but only {{attacker}} gets the nod.",
        "The bout is decided on exhaustion. {{attacker}} edges it out."
      ],
      Surrender: [
        "{{defender}} throws down their weapon, yielding before {{attacker}} can deliver the final blow.",
        "Broken and bleeding, {{defender}} signals their surrender, escaping with their life.",
        "{{defender}} acknowledges defeat and offers {{attacker}} {{possessive}} hand.",
        "{{defender}} accepts her loss, jaw clenched to keep from admitting her pain!",
        "{{defender}} offers {{attacker}} a warrior's handshake in defeat.",
        "{{defender}} surrenders, and offers his hand to his foe.",
        "{{defender}} bows before {{attacker}}'s superior skill.",
        "{{defender}} compliments {{attacker}} on a good fight.",
        "{{defender}} surrenders with what dignity remains.",
        "{{defender}} yields the bout to {{attacker}}."
      ],
      Incapacitated: [
        "{{defender}} motions to the ARENAMASTER that {{pronoun}} cannot continue! {{attacker}} is the victor of the match!",
        "{{defender}} is stopped by an outcry from the LORD PROTECTORS! {{attacker}} has won the duel!",
        "{{defender}} can no longer defend {{reflexive}} - the match is called! {{attacker}} wins!",
        "The ARENAMASTER halts the bout! {{defender}} cannot continue. {{attacker}} is the victor!",
        "{{defender}} motions that {{pronoun}} cannot continue. {{attacker}} has won the duel!",
        "{{attacker}} steps back as it becomes clear {{defender}} is entirely incapacitated.",
        "The crowd murmurs as {{defender}} remains unresponsive on the blood-soaked sand.",
        "{{defender}} lies motionless, completely incapacitated by the brutal onslaught.",
        "{{defender}} collapses, unable to rise! {{attacker}} is declared victor!",
        "{{defender}} is dragged from the arena, too broken to stand."
      ]
    }
  };
});

// src/data/narrative/combatPassives.json
var require_combatPassives = __commonJS(function(exports, module) {
  module.exports = {
    passives: {
      "AIMED BLOW": [
        "{{attacker}} studies the opponent's rhythm, waiting for the perfect opening.",
        "%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)",
        "A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)",
        "%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)"
      ],
      "BASHING ATTACK": [
        "{{attacker}} hammers through the defensive stance \u2014 raw power overwhelms technique!",
        "%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)",
        "A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)",
        "%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)"
      ],
      "LUNGING ATTACK": [
        "{{attacker}} overextends with a desperate lunge, trading balance for lethal reach.",
        "%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)",
        "A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)",
        "%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)"
      ],
      "PARRY-LUNGE": [
        "{{attacker}} catches the blade on their hilt, pivoting into a lightning-fast riposte lunge.",
        "%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)",
        "A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)",
        "%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)"
      ],
      "PARRY-RIPOSTE": [
        "{{attacker}} deflects the strike and immediately circles back with a precision counter-attack.",
        "%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)",
        "A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)",
        "%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)"
      ],
      "PARRY-STRIKE": [
        "{{attacker}} knocks the opponent's weapon aside and follows through with a heavy, crushing strike."
      ],
      "SLASHING ATTACK": [
        "{{attacker}} unleashes a wide, sweeping arc, forcing the opponent to retreat or be rent asunder."
      ],
      "STRIKING ATTACK": [
        "{{attacker}} steps into the guard, delivering a flurry of rapid, overwhelming strikes."
      ],
      "TOTAL PARRY": [
        "{{attacker}} enters a state of absolute defense, their weapon becoming an impenetrable wall of steel."
      ],
      "WALL OF STEEL": [
        "{{attacker}} holds their ground with mountain-like stability, negating the opponent's momentum."
      ]
    }
  };
});

// src/types/shared.types.ts
var FightingStyle;
((FightingStyle2) => {
  FightingStyle2["AimedBlow"] = "AIMED BLOW";
  FightingStyle2["BashingAttack"] = "BASHING ATTACK";
  FightingStyle2["LungingAttack"] = "LUNGING ATTACK";
  FightingStyle2["ParryLunge"] = "PARRY-LUNGE";
  FightingStyle2["ParryRiposte"] = "PARRY-RIPOSTE";
  FightingStyle2["ParryStrike"] = "PARRY-STRIKE";
  FightingStyle2["SlashingAttack"] = "SLASHING ATTACK";
  FightingStyle2["StrikingAttack"] = "STRIKING ATTACK";
  FightingStyle2["TotalParry"] = "TOTAL PARRY";
  FightingStyle2["WallOfSteel"] = "WALL OF STEEL";
})(FightingStyle ||= {});
var STYLE_DISPLAY_NAMES = {
  ["AIMED BLOW" /* AimedBlow */]: "Aimed-Blow",
  ["BASHING ATTACK" /* BashingAttack */]: "Basher",
  ["LUNGING ATTACK" /* LungingAttack */]: "Lunger",
  ["PARRY-LUNGE" /* ParryLunge */]: "Parry-Lunger",
  ["PARRY-RIPOSTE" /* ParryRiposte */]: "Parry-Riposte",
  ["PARRY-STRIKE" /* ParryStrike */]: "Parry-Striker",
  ["SLASHING ATTACK" /* SlashingAttack */]: "Slasher",
  ["STRIKING ATTACK" /* StrikingAttack */]: "Striker",
  ["TOTAL PARRY" /* TotalParry */]: "Total-Parry",
  ["WALL OF STEEL" /* WallOfSteel */]: "Wall of Steel"
};

// src/utils/math.ts
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// src/engine/ai/plan/levers.ts
var AGGRESSIVE_STYLES = new Set([
  "BASHING ATTACK" /* BashingAttack */,
  "STRIKING ATTACK" /* StrikingAttack */,
  "LUNGING ATTACK" /* LungingAttack */,
  "SLASHING ATTACK" /* SlashingAttack */
]);
var DEFENSIVE_STYLES = new Set([
  "TOTAL PARRY" /* TotalParry */,
  "WALL OF STEEL" /* WallOfSteel */,
  "PARRY-RIPOSTE" /* ParryRiposte */,
  "PARRY-STRIKE" /* ParryStrike */,
  "PARRY-LUNGE" /* ParryLunge */
]);
function getAITactics(style) {
  switch (style) {
    case "AIMED BLOW" /* AimedBlow */:
      return { offTactic: "Slash", defTactic: "Dodge" };
    case "BASHING ATTACK" /* BashingAttack */:
      return { offTactic: "Bash", defTactic: "none" };
    case "LUNGING ATTACK" /* LungingAttack */:
      return { offTactic: "Lunge", defTactic: "Dodge" };
    case "PARRY-LUNGE" /* ParryLunge */:
      return { offTactic: "Lunge", defTactic: "Parry" };
    case "PARRY-RIPOSTE" /* ParryRiposte */:
      return { offTactic: "none", defTactic: "Parry" };
    case "PARRY-STRIKE" /* ParryStrike */:
      return { offTactic: "Decisiveness", defTactic: "Parry" };
    case "SLASHING ATTACK" /* SlashingAttack */:
      return { offTactic: "Slash", defTactic: "none" };
    case "STRIKING ATTACK" /* StrikingAttack */:
      return { offTactic: "Decisiveness", defTactic: "none" };
    case "TOTAL PARRY" /* TotalParry */:
      return { offTactic: "none", defTactic: "Parry" };
    case "WALL OF STEEL" /* WallOfSteel */:
      return { offTactic: "Bash", defTactic: "Parry" };
    default:
      return { offTactic: "none", defTactic: "none" };
  }
}

// src/engine/bout/stylePresets.ts
function makePhases(opening, mid, late) {
  return {
    opening: { OE: opening.OE, AL: opening.AL, killDesire: opening.KD },
    mid: { OE: mid.OE, AL: mid.AL, killDesire: mid.KD },
    late: { OE: late.OE, AL: late.AL, killDesire: late.KD }
  };
}
function makePreset(style, name, description, base, phases) {
  const { offTactic, defTactic } = getAITactics(style);
  return {
    name,
    description,
    plan: {
      style,
      OE: base.OE,
      AL: base.AL,
      killDesire: base.KD,
      target: "Any",
      protect: "Any",
      offensiveTactic: offTactic,
      defensiveTactic: defTactic,
      phases: makePhases(phases.opening, phases.mid, phases.late)
    }
  };
}
var STYLE_PRESETS = {
  ["AIMED BLOW" /* AimedBlow */]: [
    makePreset("AIMED BLOW" /* AimedBlow */, "Patient Surgeon", "Conservative opening, ramping precision through mid and late phases.", { OE: 6, AL: 5, KD: 5 }, {
      opening: { OE: 4, AL: 5, KD: 3 },
      mid: { OE: 6, AL: 5, KD: 5 },
      late: { OE: 7, AL: 4, KD: 7 }
    }),
    makePreset("AIMED BLOW" /* AimedBlow */, "Aggressive Precision", "Higher activity early, finishing with maximum kill desire late.", { OE: 6, AL: 5, KD: 6 }, {
      opening: { OE: 6, AL: 6, KD: 5 },
      mid: { OE: 7, AL: 5, KD: 6 },
      late: { OE: 5, AL: 3, KD: 8 }
    })
  ],
  ["BASHING ATTACK" /* BashingAttack */]: [
    makePreset("BASHING ATTACK" /* BashingAttack */, "Steamroller", "Overwhelming aggression early, fading to defensive late-game finish.", { OE: 7, AL: 4, KD: 7 }, {
      opening: { OE: 8, AL: 5, KD: 6 },
      mid: { OE: 7, AL: 4, KD: 7 },
      late: { OE: 5, AL: 3, KD: 9 }
    }),
    makePreset("BASHING ATTACK" /* BashingAttack */, "Measured Brute", "Paced aggression that escalates through the bout for a late kill.", { OE: 7, AL: 4, KD: 6 }, {
      opening: { OE: 6, AL: 4, KD: 4 },
      mid: { OE: 7, AL: 5, KD: 6 },
      late: { OE: 8, AL: 3, KD: 8 }
    })
  ],
  ["LUNGING ATTACK" /* LungingAttack */]: [
    makePreset("LUNGING ATTACK" /* LungingAttack */, "Blitz", "All-out opening assault, conserving energy for a late finish.", { OE: 6, AL: 6, KD: 6 }, {
      opening: { OE: 8, AL: 8, KD: 5 },
      mid: { OE: 6, AL: 6, KD: 6 },
      late: { OE: 4, AL: 4, KD: 7 }
    }),
    makePreset("LUNGING ATTACK" /* LungingAttack */, "Sustained Pressure", "Even tempo throughout, wearing the opponent down steadily.", { OE: 6, AL: 6, KD: 5 }, {
      opening: { OE: 6, AL: 7, KD: 4 },
      mid: { OE: 6, AL: 6, KD: 5 },
      late: { OE: 5, AL: 5, KD: 6 }
    })
  ],
  ["PARRY-LUNGE" /* ParryLunge */]: [
    makePreset("PARRY-LUNGE" /* ParryLunge */, "Counter-Strike", "Defensive opening, transitioning to aggressive lunges in mid and late.", { OE: 6, AL: 5, KD: 5 }, {
      opening: { OE: 4, AL: 5, KD: 3 },
      mid: { OE: 6, AL: 6, KD: 5 },
      late: { OE: 7, AL: 5, KD: 7 }
    }),
    makePreset("PARRY-LUNGE" /* ParryLunge */, "Explosive Opener", "High-tempo opening, settling into a measured mid-late game.", { OE: 5, AL: 5, KD: 5 }, {
      opening: { OE: 7, AL: 7, KD: 5 },
      mid: { OE: 5, AL: 5, KD: 5 },
      late: { OE: 4, AL: 4, KD: 6 }
    })
  ],
  ["PARRY-RIPOSTE" /* ParryRiposte */]: [
    makePreset("PARRY-RIPOSTE" /* ParryRiposte */, "Classic Counter", "Pure counter-punching: low effort early, escalating through the bout.", { OE: 4, AL: 4, KD: 4 }, {
      opening: { OE: 3, AL: 4, KD: 3 },
      mid: { OE: 4, AL: 5, KD: 4 },
      late: { OE: 5, AL: 4, KD: 6 }
    }),
    makePreset("PARRY-RIPOSTE" /* ParryRiposte */, "Aggressive Riposte", "More active counter style with consistent pressure and late kill focus.", { OE: 5, AL: 5, KD: 5 }, {
      opening: { OE: 5, AL: 5, KD: 4 },
      mid: { OE: 5, AL: 5, KD: 5 },
      late: { OE: 6, AL: 4, KD: 7 }
    })
  ],
  ["PARRY-STRIKE" /* ParryStrike */]: [
    makePreset("PARRY-STRIKE" /* ParryStrike */, "Measured Defense", "Balanced defense with gradual escalation toward a late finish.", { OE: 5, AL: 5, KD: 5 }, {
      opening: { OE: 5, AL: 5, KD: 3 },
      mid: { OE: 5, AL: 5, KD: 5 },
      late: { OE: 6, AL: 4, KD: 7 }
    }),
    makePreset("PARRY-STRIKE" /* ParryStrike */, "Quick Finish", "Aggressive opening and mid, going for an early-to-mid kill.", { OE: 6, AL: 5, KD: 6 }, {
      opening: { OE: 6, AL: 6, KD: 5 },
      mid: { OE: 7, AL: 5, KD: 6 },
      late: { OE: 5, AL: 3, KD: 8 }
    })
  ],
  ["SLASHING ATTACK" /* SlashingAttack */]: [
    makePreset("SLASHING ATTACK" /* SlashingAttack */, "Pressure Cutter", "Relentless pressure with high activity, finishing strong.", { OE: 7, AL: 6, KD: 6 }, {
      opening: { OE: 7, AL: 6, KD: 5 },
      mid: { OE: 7, AL: 6, KD: 6 },
      late: { OE: 6, AL: 4, KD: 7 }
    }),
    makePreset("SLASHING ATTACK" /* SlashingAttack */, "Cautious Slasher", "Measured opening, ramping up through mid for a late kill.", { OE: 6, AL: 6, KD: 5 }, {
      opening: { OE: 5, AL: 5, KD: 3 },
      mid: { OE: 6, AL: 6, KD: 5 },
      late: { OE: 7, AL: 5, KD: 7 }
    })
  ],
  ["STRIKING ATTACK" /* StrikingAttack */]: [
    makePreset("STRIKING ATTACK" /* StrikingAttack */, "Fast Finish", "Aggressive from the start, going for a quick kill.", { OE: 7, AL: 5, KD: 7 }, {
      opening: { OE: 7, AL: 6, KD: 6 },
      mid: { OE: 7, AL: 5, KD: 7 },
      late: { OE: 6, AL: 3, KD: 9 }
    }),
    makePreset("STRIKING ATTACK" /* StrikingAttack */, "Technical Striker", "Measured approach with consistent tempo and late escalation.", { OE: 6, AL: 5, KD: 5 }, {
      opening: { OE: 5, AL: 5, KD: 4 },
      mid: { OE: 6, AL: 5, KD: 5 },
      late: { OE: 6, AL: 4, KD: 7 }
    })
  ],
  ["TOTAL PARRY" /* TotalParry */]: [
    makePreset("TOTAL PARRY" /* TotalParry */, "Endurance Wall", "Minimal effort throughout, outlasting the opponent for a late opening.", { OE: 3, AL: 3, KD: 2 }, {
      opening: { OE: 2, AL: 3, KD: 1 },
      mid: { OE: 3, AL: 3, KD: 2 },
      late: { OE: 4, AL: 3, KD: 4 }
    }),
    makePreset("TOTAL PARRY" /* TotalParry */, "Opportunistic", "Slightly more active parry style, looking for counter opportunities.", { OE: 4, AL: 4, KD: 4 }, {
      opening: { OE: 3, AL: 4, KD: 2 },
      mid: { OE: 4, AL: 4, KD: 4 },
      late: { OE: 5, AL: 4, KD: 6 }
    })
  ],
  ["WALL OF STEEL" /* WallOfSteel */]: [
    makePreset("WALL OF STEEL" /* WallOfSteel */, "Iron Curtain", "Defensive wall with high activity, gradually reducing effort.", { OE: 5, AL: 5, KD: 4 }, {
      opening: { OE: 5, AL: 6, KD: 3 },
      mid: { OE: 5, AL: 5, KD: 4 },
      late: { OE: 4, AL: 4, KD: 5 }
    }),
    makePreset("WALL OF STEEL" /* WallOfSteel */, "Aggressive Wall", "Active wall style with consistent pressure and kill intent.", { OE: 6, AL: 6, KD: 5 }, {
      opening: { OE: 6, AL: 7, KD: 5 },
      mid: { OE: 6, AL: 6, KD: 5 },
      late: { OE: 5, AL: 5, KD: 6 }
    })
  ]
};
function defaultStylePreset(style) {
  return STYLE_PRESETS[style]?.[0] ?? STYLE_PRESETS["STRIKING ATTACK" /* StrikingAttack */]?.[0];
}

// src/engine/bout/planDefaults.ts
function defaultPlanForWarrior(warrior) {
  const style = warrior.style;
  const presetPlan = defaultStylePreset(style).plan;
  const feintTendency = warrior.attributes.WT >= 15 ? Math.min(10, Math.floor((warrior.attributes.WT - 14) * 1.5)) : 0;
  const { phases, ...basePlan } = presetPlan;
  return {
    ...basePlan,
    feintTendency
  };
}
// src/data/equipment/weaponStyles.ts
var S = FightingStyle;
var ALL_STYLES = [
  S.AimedBlow,
  S.BashingAttack,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.ParryStrike,
  S.SlashingAttack,
  S.StrikingAttack,
  S.TotalParry,
  S.WallOfSteel
];
function without(...excluded) {
  const ex = new Set(excluded);
  return ALL_STYLES.filter((style) => !ex.has(style));
}
var FENCING_PREFERRED_STYLES = without(S.BashingAttack, S.WallOfSteel);
var BASHING_STRIKE_STYLES = [S.BashingAttack, S.StrikingAttack];
var CRUSHING_PREFERRED_STYLES = [
  S.BashingAttack,
  S.StrikingAttack,
  S.WallOfSteel
];
var FENCING_RESTRICTED_STYLES = [S.BashingAttack, S.WallOfSteel];
var SPEAR_RESTRICTED_STYLES = [
  S.BashingAttack,
  S.SlashingAttack,
  S.WallOfSteel
];
var HEAVY_RESTRICTED_STYLES = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte
];
var CRUSHING_RESTRICTED_STYLES = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.SlashingAttack,
  S.TotalParry
];
var BASHING_RESTRICTED_STYLES = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.SlashingAttack,
  S.WallOfSteel
];

// src/data/equipment/weapons.ts
var WEAPONS = [
  {
    id: "fist",
    code: "FI",
    name: "Fist",
    slot: "weapon",
    weight: 0,
    description: "Bare fists. No requirements, but minimal reach and power.",
    preferredStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "BASHING ATTACK" /* BashingAttack */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */
    ],
    restrictedStyles: [
      "LUNGING ATTACK" /* LungingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ]
  },
  {
    id: "dagger",
    code: "DA",
    name: "Dagger",
    slot: "weapon",
    weight: 1,
    reqST: 3,
    reqSZ: 3,
    reqWT: 5,
    reqDF: 7,
    description: "Fast, light. Precise styles excel.",
    preferredStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */
    ],
    restrictedStyles: [
      "BASHING ATTACK" /* BashingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "WALL OF STEEL" /* WallOfSteel */
    ]
  },
  {
    id: "epee",
    code: "EP",
    name: "Ep\xE9e",
    slot: "weapon",
    weight: 2,
    reqST: 7,
    reqSZ: 3,
    reqWT: 15,
    reqDF: 15,
    dualWieldReq: { DF: 22 },
    dualWieldReqAmbi: { DF: 17 },
    description: "Thrusting weapon. CW for Parry-Riposte. W for most styles.",
    favoredStyles: ["PARRY-RIPOSTE" /* ParryRiposte */],
    preferredStyles: FENCING_PREFERRED_STYLES,
    restrictedStyles: FENCING_RESTRICTED_STYLES
  },
  {
    id: "hatchet",
    code: "HA",
    name: "Hatchet",
    slot: "weapon",
    weight: 2,
    reqST: 7,
    reqSZ: 3,
    reqWT: 7,
    reqDF: 7,
    description: "Light chopping weapon. Quick and versatile.",
    preferredStyles: [
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "PARRY-STRIKE" /* ParryStrike */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */
    ],
    restrictedStyles: [
      "BASHING ATTACK" /* BashingAttack */,
      "LUNGING ATTACK" /* LungingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "WALL OF STEEL" /* WallOfSteel */
    ]
  },
  {
    id: "short_sword",
    code: "SH",
    name: "Shortsword",
    slot: "weapon",
    weight: 2,
    reqST: 5,
    reqSZ: 3,
    reqWT: 11,
    reqDF: 3,
    dualWieldReq: { ST: 7 },
    description: "Quick slashing weapon. Versatile. CW for Parry-Strike.",
    favoredStyles: ["PARRY-STRIKE" /* ParryStrike */],
    preferredStyles: FENCING_PREFERRED_STYLES,
    restrictedStyles: FENCING_RESTRICTED_STYLES
  },
  {
    id: "scimitar",
    code: "SC",
    name: "Scimitar",
    slot: "weapon",
    weight: 3,
    reqST: 9,
    reqSZ: 3,
    reqWT: 11,
    reqDF: 11,
    dualWieldReq: { DF: 17 },
    dualWieldReqAmbi: { DF: 15 },
    description: "Curved slashing blade. CW for Slashing Attack.",
    favoredStyles: ["SLASHING ATTACK" /* SlashingAttack */],
    preferredStyles: without("BASHING ATTACK" /* BashingAttack */, "LUNGING ATTACK" /* LungingAttack */),
    restrictedStyles: ["BASHING ATTACK" /* BashingAttack */]
  },
  {
    id: "short_spear",
    code: "SS",
    name: "Short Spear",
    slot: "weapon",
    weight: 4,
    reqST: 9,
    reqSZ: 3,
    reqWT: 5,
    reqDF: 7,
    description: "One-handed thrusting spear. CW for Lunging Attack.",
    favoredStyles: ["LUNGING ATTACK" /* LungingAttack */],
    preferredStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "LUNGING ATTACK" /* LungingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */
    ],
    restrictedStyles: SPEAR_RESTRICTED_STYLES
  },
  {
    id: "broadsword",
    code: "BS",
    name: "Broadsword",
    slot: "weapon",
    weight: 4,
    reqST: 11,
    reqSZ: 3,
    reqWT: 9,
    reqDF: 7,
    description: "Standard slashing weapon. CW for Striking Attack.",
    favoredStyles: ["STRIKING ATTACK" /* StrikingAttack */],
    preferredStyles: [
      "PARRY-STRIKE" /* ParryStrike */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: ["LUNGING ATTACK" /* LungingAttack */, "PARRY-RIPOSTE" /* ParryRiposte */]
  },
  {
    id: "longsword",
    code: "LO",
    name: "Longsword",
    slot: "weapon",
    weight: 3,
    reqST: 11,
    reqSZ: 3,
    reqWT: 13,
    reqDF: 11,
    dualWieldReq: { DF: 17 },
    dualWieldReqAmbi: { DF: 15 },
    description: "Versatile thrusting/slashing sword. CW for Parry-Lunge.",
    favoredStyles: ["PARRY-LUNGE" /* ParryLunge */],
    preferredStyles: FENCING_PREFERRED_STYLES,
    restrictedStyles: FENCING_RESTRICTED_STYLES
  },
  {
    id: "long_spear",
    code: "LS",
    name: "Long Spear",
    slot: "weapon",
    weight: 4,
    reqST: 11,
    reqSZ: 9,
    reqWT: 5,
    reqDF: 9,
    description: "Long reach thrusting spear. Dominates at Extended range.",
    preferredStyles: without("BASHING ATTACK" /* BashingAttack */, "SLASHING ATTACK" /* SlashingAttack */, "WALL OF STEEL" /* WallOfSteel */),
    restrictedStyles: SPEAR_RESTRICTED_STYLES
  },
  {
    id: "mace",
    code: "MA",
    name: "Mace",
    slot: "weapon",
    weight: 3,
    reqST: 13,
    reqSZ: 3,
    reqWT: 3,
    reqDF: 5,
    description: "One-handed crushing weapon. CW for Bashing Attack.",
    favoredStyles: ["BASHING ATTACK" /* BashingAttack */],
    preferredStyles: BASHING_STRIKE_STYLES,
    restrictedStyles: BASHING_RESTRICTED_STYLES
  },
  {
    id: "morning_star",
    code: "MS",
    name: "Morning Star",
    slot: "weapon",
    weight: 4,
    reqST: 13,
    reqSZ: 3,
    reqWT: 9,
    reqDF: 11,
    description: "Spiked crushing weapon. CW for Wall of Steel.",
    favoredStyles: ["WALL OF STEEL" /* WallOfSteel */],
    preferredStyles: CRUSHING_PREFERRED_STYLES,
    restrictedStyles: CRUSHING_RESTRICTED_STYLES
  },
  {
    id: "war_flail",
    code: "WF",
    name: "War Flail",
    slot: "weapon",
    weight: 4,
    reqST: 11,
    reqSZ: 3,
    reqWT: 5,
    reqDF: 5,
    description: "Chained weapon. Hard to parry.",
    preferredStyles: CRUSHING_PREFERRED_STYLES,
    restrictedStyles: CRUSHING_RESTRICTED_STYLES
  },
  {
    id: "war_hammer",
    code: "WH",
    name: "War Hammer",
    slot: "weapon",
    weight: 5,
    reqST: 13,
    reqSZ: 3,
    reqWT: 5,
    reqDF: 7,
    description: "Heavy crushing hammer. Slow but punishing.",
    preferredStyles: [
      "BASHING ATTACK" /* BashingAttack */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */
    ],
    restrictedStyles: BASHING_RESTRICTED_STYLES
  },
  {
    id: "small_shield",
    code: "SM",
    name: "Small Shield",
    slot: "weapon",
    weight: 2,
    reqST: 5,
    reqSZ: 3,
    reqWT: 3,
    reqDF: 7,
    description: "Buckler. +1 DEF, no ATT penalty.",
    preferredStyles: [
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-STRIKE" /* ParryStrike */
    ],
    coverage: "MEDIUM",
    shieldParryBonus: 1,
    shieldAttPenalty: 0
  },
  {
    id: "medium_shield",
    code: "ME",
    name: "Medium Shield",
    slot: "weapon",
    weight: 4,
    reqST: 9,
    reqSZ: 3,
    reqWT: 3,
    reqDF: 7,
    description: "Round shield. CW for Total-Parry. +2 DEF, no ATT penalty.",
    favoredStyles: ["TOTAL PARRY" /* TotalParry */],
    preferredStyles: [
      "TOTAL PARRY" /* TotalParry */,
      "PARRY-STRIKE" /* ParryStrike */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: ["AIMED BLOW" /* AimedBlow */],
    coverage: "MEDIUM",
    shieldParryBonus: 2,
    shieldAttPenalty: 0
  },
  {
    id: "large_shield",
    code: "LG",
    name: "Large Shield",
    slot: "weapon",
    weight: 6,
    reqST: 13,
    reqSZ: 3,
    reqWT: 3,
    reqDF: 7,
    offHandReq: { WT: 3 },
    description: "Tower shield. CW for Total-Parry. +3 DEF, -1 ATT.",
    favoredStyles: ["TOTAL PARRY" /* TotalParry */],
    preferredStyles: ["TOTAL PARRY" /* TotalParry */],
    restrictedStyles: [
      "LUNGING ATTACK" /* LungingAttack */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "AIMED BLOW" /* AimedBlow */
    ],
    coverage: "HIGH",
    shieldParryBonus: 3,
    shieldAttPenalty: -1
  },
  {
    id: "quarterstaff",
    code: "QS",
    name: "Quarterstaff",
    slot: "weapon",
    weight: 4,
    reqST: 11,
    reqSZ: 9,
    reqWT: 11,
    reqDF: 11,
    twoHanded: true,
    description: "Balanced staff. CW for Aimed-Blow. W for many styles.",
    favoredStyles: ["AIMED BLOW" /* AimedBlow */],
    preferredStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "BASHING ATTACK" /* BashingAttack */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: [
      "LUNGING ATTACK" /* LungingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "SLASHING ATTACK" /* SlashingAttack */
    ]
  },
  {
    id: "great_axe",
    code: "GA",
    name: "Great Axe",
    slot: "weapon",
    weight: 5,
    reqST: 13,
    reqSZ: 3,
    reqWT: 9,
    reqDF: 11,
    twoHanded: true,
    description: "Massive chopping weapon. No shield.",
    preferredStyles: [
      "BASHING ATTACK" /* BashingAttack */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "LUNGING ATTACK" /* LungingAttack */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "PARRY-STRIKE" /* ParryStrike */,
      "TOTAL PARRY" /* TotalParry */
    ]
  },
  {
    id: "greatsword",
    code: "GS",
    name: "Greatsword",
    slot: "weapon",
    weight: 6,
    reqST: 15,
    reqSZ: 9,
    reqWT: 9,
    reqDF: 11,
    twoHanded: true,
    description: "Massive two-handed blade. No shield.",
    preferredStyles: [
      "BASHING ATTACK" /* BashingAttack */,
      "PARRY-STRIKE" /* ParryStrike */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: HEAVY_RESTRICTED_STYLES
  },
  {
    id: "battle_axe",
    code: "BA",
    name: "Battle Axe",
    slot: "weapon",
    weight: 4,
    reqST: 15,
    reqSZ: 7,
    reqWT: 7,
    reqDF: 9,
    twoHanded: true,
    twoHandedReq: { SZ: 3 },
    description: "Heavy two-handed axe. No shield. SZ requirement eases when gripped two-handed.",
    preferredStyles: [
      "PARRY-STRIKE" /* ParryStrike */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "STRIKING ATTACK" /* StrikingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ],
    restrictedStyles: HEAVY_RESTRICTED_STYLES
  },
  {
    id: "halberd",
    code: "HL",
    name: "Halberd",
    slot: "weapon",
    weight: 8,
    reqST: 17,
    reqSZ: 9,
    reqWT: 9,
    reqDF: 11,
    twoHanded: true,
    description: "Polearm with axe blade and spike. Versatile.",
    preferredStyles: BASHING_STRIKE_STYLES,
    restrictedStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "PARRY-LUNGE" /* ParryLunge */,
      "PARRY-RIPOSTE" /* ParryRiposte */,
      "PARRY-STRIKE" /* ParryStrike */,
      "SLASHING ATTACK" /* SlashingAttack */,
      "TOTAL PARRY" /* TotalParry */,
      "WALL OF STEEL" /* WallOfSteel */
    ]
  },
  {
    id: "maul",
    code: "ML",
    name: "Maul",
    slot: "weapon",
    weight: 8,
    reqST: 15,
    reqSZ: 9,
    reqWT: 5,
    reqDF: 7,
    twoHanded: true,
    description: "Massive hammer. Devastating but slow.",
    preferredStyles: BASHING_STRIKE_STYLES,
    restrictedStyles: without("BASHING ATTACK" /* BashingAttack */, "STRIKING ATTACK" /* StrikingAttack */)
  }
];
var SHIELD_ITEM_IDS = ["small_shield", "medium_shield", "large_shield"];
var SHIELD_COVERAGE = {
  small_shield: "MEDIUM",
  medium_shield: "MEDIUM",
  large_shield: "HIGH"
};
// src/data/equipment/armor.ts
var ARMORS = [
  {
    id: "none_armor",
    code: "",
    name: "None",
    slot: "armor",
    weight: 0,
    description: "No armor. Maximum mobility.",
    mitigation: 0,
    defenseMod: 0,
    enduranceCostMod: 1
  },
  {
    id: "padded",
    code: "AP",
    name: "Padded",
    slot: "armor",
    weight: 2,
    description: "Quilted cloth armor. Basic protection.",
    mitigation: 1,
    defenseMod: 0,
    enduranceCostMod: 1.1
  },
  {
    id: "leather",
    code: "AL",
    name: "Leather",
    slot: "armor",
    weight: 4,
    description: "Cured leather armor. Light and flexible.",
    mitigation: 2,
    defenseMod: 1,
    enduranceCostMod: 1.2
  },
  {
    id: "studded_leather",
    code: "AS",
    name: "Studded Leather",
    slot: "armor",
    weight: 5,
    description: "Leather reinforced with metal studs.",
    mitigation: 3,
    defenseMod: 1,
    enduranceCostMod: 1.3
  },
  {
    id: "ring_mail",
    code: "AR",
    name: "Ring Mail",
    slot: "armor",
    weight: 6,
    description: "Leather with metal rings sewn on.",
    mitigation: 4,
    defenseMod: 1,
    enduranceCostMod: 1.4
  },
  {
    id: "scale_mail",
    code: "ASM",
    name: "Scalemail",
    slot: "armor",
    weight: 8,
    description: "Overlapping metal scales. Heavy.",
    mitigation: 5,
    defenseMod: 2,
    enduranceCostMod: 1.6
  },
  {
    id: "chain_mail",
    code: "ACM",
    name: "Chainmail",
    slot: "armor",
    weight: 10,
    description: "Interlocking metal rings. Standard heavy protection.",
    mitigation: 6,
    defenseMod: 2,
    enduranceCostMod: 1.8
  },
  {
    id: "plate_mail",
    code: "APM",
    name: "Platemail",
    slot: "armor",
    weight: 12,
    description: "Full plate mail. Very heavy.",
    restrictedStyles: ["AIMED BLOW" /* AimedBlow */, "LUNGING ATTACK" /* LungingAttack */],
    mitigation: 8,
    defenseMod: 3,
    enduranceCostMod: 2
  },
  {
    id: "plate_armor",
    code: "APA",
    name: "Plate Armor",
    slot: "armor",
    weight: 14,
    description: "Maximum protection. Extremely heavy.",
    restrictedStyles: [
      "AIMED BLOW" /* AimedBlow */,
      "LUNGING ATTACK" /* LungingAttack */,
      "SLASHING ATTACK" /* SlashingAttack */
    ],
    mitigation: 10,
    defenseMod: 3,
    enduranceCostMod: 2.5
  }
];
// src/data/equipment/helms.ts
var HELMS = [
  {
    id: "none_helm",
    code: "",
    name: "None",
    slot: "helm",
    weight: 0,
    description: "No helm. Risky but light.",
    mitigation: 0,
    defenseMod: 0,
    enduranceCostMod: 1
  },
  {
    id: "leather_cap",
    code: "L",
    name: "Leather Cap",
    slot: "helm",
    weight: 1,
    description: "Basic head protection.",
    mitigation: 1,
    defenseMod: 0,
    enduranceCostMod: 1.05
  },
  {
    id: "steel_cap",
    code: "S",
    name: "Steel Cap",
    slot: "helm",
    weight: 2,
    description: "Open-faced metal helm.",
    mitigation: 2,
    defenseMod: 0,
    enduranceCostMod: 1.1
  },
  {
    id: "helm",
    code: "H",
    name: "Helm",
    slot: "helm",
    weight: 3,
    description: "Standard enclosed helm.",
    mitigation: 3,
    defenseMod: 1,
    enduranceCostMod: 1.15
  },
  {
    id: "full_helm",
    code: "FF",
    name: "Full Helm",
    slot: "helm",
    weight: 4,
    description: "Fully enclosed helm. Great protection, reduces visibility.",
    restrictedStyles: ["AIMED BLOW" /* AimedBlow */],
    mitigation: 4,
    defenseMod: 1,
    enduranceCostMod: 1.2
  }
];
// src/data/equipment/shields.ts
var SHIELDS = [
  {
    id: "none_shield",
    code: "",
    name: "None",
    slot: "shield",
    weight: 0,
    description: "No shield. Free off-hand."
  }
];
// src/data/equipment/equipment.utils.ts
var SHIELD_ID_SET = new Set(SHIELD_ITEM_IDS);
var ALL_EQUIPMENT = [...WEAPONS, ...ARMORS, ...SHIELDS, ...HELMS];
var ITEM_BY_ID = new Map(ALL_EQUIPMENT.map((item) => [item.id, item]));
var ITEM_BY_CODE = new Map(ALL_EQUIPMENT.filter((item) => item.code !== "").map((item) => [item.code, item]));
function getItemById(id) {
  return ITEM_BY_ID.get(id);
}
function getItemByCode(code) {
  return ITEM_BY_CODE.get(code);
}
var DEFAULT_LOADOUT = {
  weapon: "broadsword",
  armor: "leather",
  shield: "none_shield",
  helm: "leather_cap"
};
function getStyleDefaultLoadout(style) {
  const classic = STYLE_CLASSIC_WEAPONS[style] ?? "broadsword";
  return {
    weapon: classic,
    armor: "leather",
    shield: "none_shield",
    helm: "leather_cap"
  };
}
function getLoadoutWeight(loadout) {
  return [loadout.weapon, loadout.armor, loadout.shield, loadout.helm].reduce((sum, id) => sum + (getItemById(id)?.weight ?? 0), 0);
}
function effectiveWeaponReqs(item, mode, ambidextrous) {
  const base = { ST: item.reqST, SZ: item.reqSZ, WT: item.reqWT, DF: item.reqDF };
  const override = mode === "two_handed" ? item.twoHandedReq : mode === "off_hand" ? item.offHandReq : mode === "dual" ? ambidextrous ? item.dualWieldReqAmbi ?? item.dualWieldReq : item.dualWieldReq : undefined;
  return { ...base, ...override ?? {} };
}
function checkWeaponRequirements(weaponId, attrs, opts) {
  const item = getItemById(weaponId);
  if (!item || item.slot !== "weapon")
    return { met: true, failures: [], attPenalty: 0, endurancePenalty: 1 };
  const mode = opts?.wield ?? (item.twoHanded ? "two_handed" : "normal");
  const req = effectiveWeaponReqs(item, mode, opts?.ambidextrous ?? false);
  const checks = [];
  const consider = (stat, label, required, current) => {
    if (required && current < required)
      checks.push({ stat, label, required, current, deficit: required - current });
  };
  consider("ST", "Strength", req.ST, attrs.ST);
  consider("SZ", "Size", req.SZ, attrs.SZ);
  consider("WT", "Wit", req.WT, attrs.WT);
  consider("DF", "Deftness", req.DF, attrs.DF);
  let totalDeficit = 0;
  for (const check of checks) {
    totalDeficit += check.deficit;
  }
  return {
    met: checks.length === 0,
    failures: checks,
    attPenalty: totalDeficit * -2,
    endurancePenalty: 1 + totalDeficit * 0.1
  };
}
function getShieldModifiers(id) {
  if (!id)
    return { def: 0, att: 0 };
  const item = getItemById(id);
  if (!item)
    return { def: 0, att: 0 };
  return {
    def: item.shieldParryBonus ?? 0,
    att: item.shieldAttPenalty ?? 0
  };
}
var STYLE_CLASSIC_WEAPONS = {
  ["AIMED BLOW" /* AimedBlow */]: "quarterstaff",
  ["BASHING ATTACK" /* BashingAttack */]: "mace",
  ["LUNGING ATTACK" /* LungingAttack */]: "short_spear",
  ["PARRY-LUNGE" /* ParryLunge */]: "longsword",
  ["PARRY-RIPOSTE" /* ParryRiposte */]: "epee",
  ["PARRY-STRIKE" /* ParryStrike */]: "short_sword",
  ["SLASHING ATTACK" /* SlashingAttack */]: "scimitar",
  ["STRIKING ATTACK" /* StrikingAttack */]: "broadsword",
  ["TOTAL PARRY" /* TotalParry */]: "medium_shield",
  ["WALL OF STEEL" /* WallOfSteel */]: "morning_star"
};
function getClassicWeaponBonus(style, weaponId) {
  if (style === "TOTAL PARRY" /* TotalParry */) {
    return SHIELD_ID_SET.has(weaponId) ? 1 : 0;
  }
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
// src/utils/random.ts
class SeededRNG {
  state;
  constructor(seed) {
    this.state = seed;
  }
  next() {
    let t = this.state += 1831565813;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  roll(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  chance(threshold) {
    return this.next() < threshold;
  }
  pick(arr) {
    if (arr.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = Math.floor(this.next() * arr.length);
    const item = arr[idx];
    if (item === undefined) {
      throw new Error("RNG index out of bounds");
    }
    return item;
  }
  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1;i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tempI = copy[i];
      const tempJ = copy[j];
      if (tempI === undefined || tempJ === undefined) {
        throw new Error("Shuffle index out of bounds");
      }
      copy[i] = tempJ;
      copy[j] = tempI;
    }
    return copy;
  }
  uuid(prefix) {
    const chars = "abcdef0123456789";
    let str = "";
    for (let i = 0;i < 12; i++) {
      str += chars[Math.floor(this.next() * chars.length)];
    }
    return prefix ? `${prefix}-${str}` : str;
  }
  clone() {
    const clone = new SeededRNG(0);
    clone.state = this.state;
    return clone;
  }
  rollWeighted(weights) {
    return rollWeighted(weights, this);
  }
}
function rollWeighted(weights, rng) {
  const entries = Object.entries(weights);
  if (entries.length === 0) {
    throw new Error("No entries available for weighted roll");
  }
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0)
    return entries[0]?.[0];
  let roll = rng.next() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0)
      return key;
  }
  const fallback = entries[entries.length - 1];
  if (!fallback) {
    throw new Error("No entries available for weighted roll");
  }
  return fallback[0];
}
var SeededRNGService = SeededRNG;

// src/data/equipment/encumbrance.ts
var TIER_THRESHOLDS = [
  { tier: "OVER", min: 1.2 },
  { tier: "HEAVY", min: 1 },
  { tier: "MEDIUM", min: 0.8 },
  { tier: "LIGHT", min: 0.6 },
  { tier: "NONE", min: 0 }
];
var TIER_PENALTIES = {
  NONE: { iniPenalty: 0, defPenalty: 0, parPenalty: 0, enduranceMult: 1 },
  LIGHT: { iniPenalty: -1, defPenalty: 0, parPenalty: 0, enduranceMult: 1.05 },
  MEDIUM: { iniPenalty: -2, defPenalty: -1, parPenalty: 0, enduranceMult: 1.15 },
  HEAVY: { iniPenalty: -3, defPenalty: -1, parPenalty: -1, enduranceMult: 1.3 },
  OVER: { iniPenalty: -4, defPenalty: -2, parPenalty: -2, enduranceMult: 1.5 }
};
function getEncumbranceRatio(loadout, carryCap) {
  if (carryCap <= 0)
    return Infinity;
  return getLoadoutWeight(loadout) / carryCap;
}
function getEncumbranceTier(ratio) {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (ratio >= min)
      return tier;
  }
  return "NONE";
}
function getEncumbrancePenalties(tier) {
  return TIER_PENALTIES[tier];
}

// src/engine/trainers.ts
var TIER_BONUS = {
  Novice: 1,
  Seasoned: 2,
  Master: 3
};
function getTrainingBonus(trainers, warriorStyle) {
  const bonus = {
    Aggression: 0,
    Defense: 0,
    Endurance: 0,
    Mind: 0,
    Healing: 0
  };
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0)
      continue;
    let b = TIER_BONUS[t.tier];
    if (t.styleBonusStyle === warriorStyle)
      b += 1;
    bonus[t.focus] += b;
  }
  return bonus;
}

// src/engine/favorites.ts
var STYLE_RHYTHM_RANGES = {
  ["AIMED BLOW" /* AimedBlow */]: { oe: [4, 7], al: [4, 6] },
  ["BASHING ATTACK" /* BashingAttack */]: { oe: [7, 9], al: [2, 5] },
  ["LUNGING ATTACK" /* LungingAttack */]: { oe: [6, 9], al: [6, 9] },
  ["PARRY-LUNGE" /* ParryLunge */]: { oe: [4, 7], al: [4, 7] },
  ["PARRY-RIPOSTE" /* ParryRiposte */]: { oe: [3, 6], al: [4, 7] },
  ["PARRY-STRIKE" /* ParryStrike */]: { oe: [4, 7], al: [4, 7] },
  ["SLASHING ATTACK" /* SlashingAttack */]: { oe: [6, 9], al: [4, 7] },
  ["STRIKING ATTACK" /* StrikingAttack */]: { oe: [6, 9], al: [4, 7] },
  ["TOTAL PARRY" /* TotalParry */]: { oe: [1, 4], al: [1, 4] },
  ["WALL OF STEEL" /* WallOfSteel */]: { oe: [5, 8], al: [4, 7] }
};
function getFavoriteWeaponBonus(warrior2) {
  const fav = warrior2.favorites;
  if (!fav?.discovered.weapon)
    return 0;
  const equippedWeapon = warrior2.equipment?.weapon ?? "broadsword";
  return equippedWeapon === fav.weaponId ? 1 : 0;
}
function getFavoriteRhythmBonus(warrior2, currentOE, currentAL) {
  const fav = warrior2.favorites;
  if (!fav?.discovered.rhythm)
    return 0;
  const oeDelta = Math.abs(currentOE - fav.rhythm.oe);
  const alDelta = Math.abs(currentAL - fav.rhythm.al);
  if (oeDelta === 0 && alDelta === 0)
    return 2;
  if (oeDelta <= 1 && alDelta <= 1)
    return 1;
  return 0;
}

// src/engine/favorites/weaponMastery.ts
var ZERO = { att: 0, dmg: 0, ini: 0, def: 0, rip: 0 };
var MASTERY_AXIS = {
  ["BASHING ATTACK" /* BashingAttack */]: "dmg",
  ["STRIKING ATTACK" /* StrikingAttack */]: "dmg",
  ["LUNGING ATTACK" /* LungingAttack */]: "ini",
  ["SLASHING ATTACK" /* SlashingAttack */]: "ini",
  ["TOTAL PARRY" /* TotalParry */]: "def",
  ["WALL OF STEEL" /* WallOfSteel */]: "def",
  ["PARRY-RIPOSTE" /* ParryRiposte */]: "rip",
  ["PARRY-STRIKE" /* ParryStrike */]: "rip",
  ["PARRY-LUNGE" /* ParryLunge */]: "rip",
  ["AIMED BLOW" /* AimedBlow */]: "att"
};
function getMasteryBonus(style, mastered) {
  if (!mastered)
    return { ...ZERO };
  const axis = MASTERY_AXIS[style] ?? "att";
  return { ...ZERO, [axis]: 1 };
}

// src/engine/traitData/flaws.ts
var NEW_FLAWS = {
  glass_jaw: {
    id: "glass_jaw",
    name: "Glass Jaw",
    description: "\u22122 parry \u2014 a fragile guard that buckles under pressure.",
    effect: { parMod: -2 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  hesitant: {
    id: "hesitant",
    name: "Hesitant",
    description: "\u22121 decisiveness \u2014 second-guesses the opening.",
    effect: { decMod: -1 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  short_winded: {
    id: "short_winded",
    name: "Short-Winded",
    description: "\xD71.08 endurance cost \u2014 tires quickly.",
    effect: { enduranceMult: 1.08 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  timid: {
    id: "timid",
    name: "Timid",
    description: "Fights cautiously \u2014 lower aggression and killing intent.",
    effect: { fightPlanMod: { OE: -3, killDesire: -5 } },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  predictable: {
    id: "predictable",
    name: "Predictable",
    description: "\u22121 riposte \u2014 easy to read, slow to counter.",
    effect: { ripMod: -1 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  brittle: {
    id: "brittle",
    name: "Brittle",
    description: "\u22121 defense and tires faster \u2014 a body that takes a toll.",
    effect: { defMod: -1, enduranceMult: 1.05 },
    weight: 0.35,
    tier: "Flaw",
    sign: "negative"
  },
  coward: {
    id: "coward",
    name: "Coward",
    description: "Avoids the kill \u2014 sharply lower killing intent.",
    effect: { fightPlanMod: { killDesire: -10 } },
    weight: 0.3,
    tier: "Flaw",
    sign: "negative"
  },
  clumsy: {
    id: "clumsy",
    name: "Clumsy",
    description: "\u22121 attack \u2014 heavy-footed and imprecise.",
    effect: { attMod: -1 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  thin_skinned: {
    id: "thin_skinned",
    name: "Thin-Skinned",
    description: "\u22122 defense when bloodied \u2014 falls apart once hurt.",
    effect: { defModLowHp: -2 },
    weight: 0.35,
    tier: "Flaw",
    sign: "negative"
  }
};

// src/engine/traitData/classTraits.ts
var S2 = FightingStyle;
var CLASS_TRAITS = {
  steady_hand: {
    id: "steady_hand",
    name: "Steady Hand",
    description: "+1 decisiveness \u2014 never rushes the shot.",
    effect: { decMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.AimedBlow]
  },
  called_shot: {
    id: "called_shot",
    name: "Called Shot",
    description: "+1 damage \u2014 picks the gap and drives through it.",
    effect: { dmgBonus: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.AimedBlow]
  },
  dead_aim: {
    id: "dead_aim",
    name: "Dead Aim",
    description: "+1 damage, +1 decisiveness \u2014 ruthless precision.",
    effect: { dmgBonus: 1, decMod: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.AimedBlow]
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    description: "+1 damage, +1 decisiveness, opens the kill window sooner.",
    effect: { dmgBonus: 1, decMod: 1, killWindowBonus: 0.01 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.AimedBlow]
  },
  heavy_swing: {
    id: "heavy_swing",
    name: "Heavy Swing",
    description: "+1 damage \u2014 every blow lands with weight.",
    effect: { dmgBonus: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.BashingAttack]
  },
  relentless: {
    id: "relentless",
    name: "Relentless",
    description: "+1 attack in the late rounds \u2014 never lets up.",
    effect: { attModLate: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.BashingAttack]
  },
  bonebreaker: {
    id: "bonebreaker",
    name: "Bonebreaker",
    description: "+2 damage, +1 late attack \u2014 wears the guard down.",
    effect: { dmgBonus: 2, attModLate: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.BashingAttack]
  },
  juggernaut: {
    id: "juggernaut",
    name: "Juggernaut",
    description: "+2 damage, tireless \u2014 an unstoppable advance.",
    effect: { dmgBonus: 2, enduranceMult: 0.95 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.BashingAttack]
  },
  demolisher: {
    id: "demolisher",
    name: "Demolisher",
    description: "+3 damage, +1 late attack \u2014 shatters any defense.",
    effect: { dmgBonus: 3, attModLate: 1 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.BashingAttack]
  },
  quickdraw: {
    id: "quickdraw",
    name: "Quickdraw",
    description: "+1 initiative \u2014 first to the strike.",
    effect: { iniMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.LungingAttack]
  },
  fleet_footed: {
    id: "fleet_footed",
    name: "Fleet-Footed",
    description: "+2 initiative while fresh \u2014 explosive early.",
    effect: { iniModFresh: 2 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.LungingAttack]
  },
  lightning_step: {
    id: "lightning_step",
    name: "Lightning Step",
    description: "+1 initiative, +1 more while fresh.",
    effect: { iniMod: 1, iniModFresh: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.LungingAttack]
  },
  blitz: {
    id: "blitz",
    name: "Blitz",
    description: "+1 initiative, +1 attack on a streak \u2014 overwhelms.",
    effect: { iniMod: 1, attModConsecutiveHits: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.LungingAttack]
  },
  untouchable: {
    id: "untouchable",
    name: "Untouchable",
    description: "+2 initiative, +1 defense \u2014 too fast to pin.",
    effect: { iniMod: 2, defMod: 1 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.LungingAttack]
  },
  counterlunge: {
    id: "counterlunge",
    name: "Counterlunge",
    description: "+1 riposte \u2014 punishes the over-extension.",
    effect: { ripMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.ParryLunge]
  },
  fighting_rhythm: {
    id: "fighting_rhythm",
    name: "Fighting Rhythm",
    description: "+1 attack on a hit-streak \u2014 finds the beat.",
    effect: { attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryLunge]
  },
  riposte_flow: {
    id: "riposte_flow",
    name: "Riposte Flow",
    description: "+1 riposte, +1 streak attack.",
    effect: { ripMod: 1, attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryLunge]
  },
  duelist: {
    id: "duelist",
    name: "Duelist",
    description: "+1 riposte, +1 damage \u2014 a clinical counter-fighter.",
    effect: { ripMod: 1, dmgBonus: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.ParryLunge]
  },
  whirlwind: {
    id: "whirlwind",
    name: "Whirlwind",
    description: "+2 riposte, +1 streak attack \u2014 relentless counters.",
    effect: { ripMod: 2, attModConsecutiveHits: 1 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.ParryLunge]
  },
  riposte_natural: {
    id: "riposte_natural",
    name: "Natural Riposte",
    description: "+1 riposte \u2014 counters come naturally.",
    effect: { ripMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.ParryRiposte]
  },
  vindicator: {
    id: "vindicator",
    name: "Vindicator",
    description: "+1 riposte, +1 damage \u2014 makes them pay.",
    effect: { ripMod: 1, dmgBonus: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryRiposte]
  },
  parry_master: {
    id: "parry_master",
    name: "Parry Master",
    description: "+1 parry, +1 riposte \u2014 a wall that bites back.",
    effect: { parMod: 1, ripMod: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryRiposte]
  },
  nemesis: {
    id: "nemesis",
    name: "Nemesis",
    description: "+2 riposte, +1 damage \u2014 the brawler's bane.",
    effect: { ripMod: 2, dmgBonus: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.ParryRiposte]
  },
  retribution: {
    id: "retribution",
    name: "Retribution",
    description: "+2 riposte, +1 damage, +1 decisiveness.",
    effect: { ripMod: 2, dmgBonus: 1, decMod: 1 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.ParryRiposte]
  },
  counterpuncher: {
    id: "counterpuncher",
    name: "Counterpuncher",
    description: "+1 attack on a hit-streak \u2014 builds off the counter.",
    effect: { attModConsecutiveHits: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.ParryStrike]
  },
  opportunist: {
    id: "opportunist",
    name: "Opportunist",
    description: "+1 parry while strong, +1 streak attack.",
    effect: { parModHighHp: 1, attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryStrike]
  },
  riposte_strike: {
    id: "riposte_strike",
    name: "Riposte Strike",
    description: "+1 riposte, +1 streak attack.",
    effect: { ripMod: 1, attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.ParryStrike]
  },
  counter_artist: {
    id: "counter_artist",
    name: "Counter Artist",
    description: "+1 parry, +2 streak attack \u2014 defend, then punish.",
    effect: { parMod: 1, attModConsecutiveHits: 2 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.ParryStrike]
  },
  perfect_counter: {
    id: "perfect_counter",
    name: "Perfect Counter",
    description: "+1 parry, +1 riposte, +2 streak attack.",
    effect: { parMod: 1, ripMod: 1, attModConsecutiveHits: 2 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.ParryStrike]
  },
  keen_edge: {
    id: "keen_edge",
    name: "Keen Edge",
    description: "+1 damage \u2014 a blade kept razor-sharp.",
    effect: { dmgBonus: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.SlashingAttack]
  },
  flurry: {
    id: "flurry",
    name: "Flurry",
    description: "+1 attack on a streak \u2014 a storm of cuts.",
    effect: { attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.SlashingAttack]
  },
  lacerate: {
    id: "lacerate",
    name: "Lacerate",
    description: "+1 damage, +1 streak attack \u2014 cuts that keep coming.",
    effect: { dmgBonus: 1, attModConsecutiveHits: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.SlashingAttack]
  },
  hemorrhage: {
    id: "hemorrhage",
    name: "Hemorrhage",
    description: "+1 damage, +2 streak attack \u2014 relentless bleeding.",
    effect: { dmgBonus: 1, attModConsecutiveHits: 2 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.SlashingAttack]
  },
  exsanguinate: {
    id: "exsanguinate",
    name: "Exsanguinate",
    description: "+2 damage, +1 streak attack \u2014 bleeds them dry.",
    effect: { dmgBonus: 2, attModConsecutiveHits: 1 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.SlashingAttack]
  },
  crushing_blow: {
    id: "crushing_blow",
    name: "Crushing Blow",
    description: "+1 damage \u2014 explosive power behind each strike.",
    effect: { dmgBonus: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.StrikingAttack]
  },
  opener: {
    id: "opener",
    name: "Opener",
    description: "+1 attack \u2014 sets a ferocious early pace.",
    effect: { attMod: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.StrikingAttack]
  },
  executioner: {
    id: "executioner",
    name: "Executioner",
    description: "+2 attack against a wounded foe \u2014 smells blood.",
    effect: { attModLowHp: 2 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.StrikingAttack]
  },
  berserker_rush: {
    id: "berserker_rush",
    name: "Berserker Rush",
    description: "+2 attack when they bleed, +1 damage.",
    effect: { attModLowHp: 2, dmgBonus: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.StrikingAttack]
  },
  annihilator: {
    id: "annihilator",
    name: "Annihilator",
    description: "+3 attack vs the wounded, +1 damage, faster kills.",
    effect: { attModLowHp: 3, dmgBonus: 1, killWindowBonus: 0.01 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.StrikingAttack]
  },
  enduring: {
    id: "enduring",
    name: "Enduring",
    description: "Tireless \u2014 outlasts the aggressor.",
    effect: { enduranceMult: 0.92 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.TotalParry]
  },
  stonewall: {
    id: "stonewall",
    name: "Stonewall",
    description: "+2 defense in the late rounds \u2014 the wall holds.",
    effect: { defModLate: 2 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.TotalParry]
  },
  war_of_attrition: {
    id: "war_of_attrition",
    name: "War of Attrition",
    description: "+2 late defense, tireless \u2014 wins the long fight.",
    effect: { defModLate: 2, enduranceMult: 0.95 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.TotalParry]
  },
  immovable_object: {
    id: "immovable_object",
    name: "Immovable Object",
    description: "+2 late defense, +1 late parry \u2014 cannot be moved.",
    effect: { defModLate: 2, parModLate: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.TotalParry]
  },
  unbreakable: {
    id: "unbreakable",
    name: "Unbreakable",
    description: "+2 late defense, +2 late parry, tireless.",
    effect: { defModLate: 2, parModLate: 2, enduranceMult: 0.95 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.TotalParry]
  },
  braced: {
    id: "braced",
    name: "Braced",
    description: "+1 parry \u2014 set and ready.",
    effect: { parMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive",
    styles: [S2.WallOfSteel]
  },
  bulwark: {
    id: "bulwark",
    name: "Bulwark",
    description: "+1 parry, +1 defense \u2014 a living barricade.",
    effect: { parMod: 1, defMod: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.WallOfSteel]
  },
  anchor: {
    id: "anchor",
    name: "Anchor",
    description: "+2 parry \u2014 rooted and unyielding.",
    effect: { parMod: 2 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive",
    styles: [S2.WallOfSteel]
  },
  fortress: {
    id: "fortress",
    name: "Fortress",
    description: "+2 parry, +1 defense \u2014 nothing gets through.",
    effect: { parMod: 2, defMod: 1 },
    weight: 0.45,
    tier: "Exceptional",
    sign: "positive",
    styles: [S2.WallOfSteel]
  },
  living_wall: {
    id: "living_wall",
    name: "Living Wall",
    description: "+2 parry, +2 defense \u2014 the wall that walks.",
    effect: { parMod: 2, defMod: 2 },
    weight: 0.3,
    tier: "Signature",
    sign: "positive",
    styles: [S2.WallOfSteel]
  }
};

// src/engine/traitDefs.ts
var TRAITS = {
  orphan_resilience: {
    id: "orphan_resilience",
    name: "Orphan Resilience",
    description: "Accustomed to taking a beating and surviving against the odds.",
    effect: { defModLate: 1, enduranceMult: 0.95 },
    tier: "Notable",
    sign: "positive",
    weight: 0.6
  },
  hollow_gaze: {
    id: "hollow_gaze",
    name: "Hollow Gaze",
    description: "An unnerving stare that throws opponents off balance when tired.",
    effect: { defModLate: 1, attModLate: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.7
  },
  scab_survivor: {
    id: "scab_survivor",
    name: "Scab Survivor",
    description: "Hardened by the slums, giving them an edge when injured.",
    effect: { attModLowHp: 1, defModLowHp: 1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.4
  },
  gutter_shadow: {
    id: "gutter_shadow",
    name: "Gutter Shadow",
    description: "Accustomed to fighting in cramped, lightless alleys.",
    effect: { attMod: 1, iniMod: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.8
  },
  guttersnipe_cunning: {
    id: "guttersnipe_cunning",
    name: "Guttersnipe Cunning",
    description: "Fights dirty and unpredictable. Harder to pin down in prolonged engagements.",
    effect: { defModLate: 1, iniMod: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.6
  },
  iron_stomach: {
    id: "iron_stomach",
    name: "Iron Stomach",
    description: "Raised on garbage and sour water. Shrugs off stamina loss slightly better than most.",
    effect: { enduranceMult: 0.95 },
    tier: "Common",
    sign: "positive",
    weight: 0.8
  },
  ashen_lung: {
    id: "ashen_lung",
    name: "Ashen Lung",
    description: "Breathed the soot of the forges too long. Prone to coughing fits when exhausted.",
    effect: { enduranceMult: 1.1, attModLate: -1 },
    tier: "Flaw",
    sign: "negative",
    weight: 0.4
  },
  wild_instinct: {
    id: "wild_instinct",
    name: "Wild Instinct",
    description: "Reacts purely on survival instinct. Fast off the mark, but reckless.",
    effect: { iniMod: 2, parMod: -1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.5
  },
  shadow_watcher: {
    id: "shadow_watcher",
    name: "Shadow Watcher",
    description: "Always keeps an eye on the unseen. Improved defense early in the fight.",
    effect: { defModEarly: 1, defMod: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 1
  },
  knife_juggler: {
    id: "knife_juggler",
    name: "Knife Juggler",
    description: "Uncanny hand-eye coordination from youth.",
    effect: { attMod: 1 },
    tier: "Common",
    sign: "positive",
    weight: 1
  },
  stone_skin_orphan: {
    id: "stone_skin_orphan",
    name: "Stone Skin",
    description: "Beatings hardened their flesh.",
    effect: { defMod: 0.95 },
    tier: "Notable",
    sign: "positive",
    weight: 1
  },
  starving_dog: {
    id: "starving_dog",
    name: "Starving Dog",
    description: "Fights like a cornered animal when heavily wounded. Bonus attack when at low health.",
    effect: { attModLowHp: 2, defModLowHp: -1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.6
  },
  iron_knuckles: {
    id: "iron_knuckles",
    name: "Iron Knuckles",
    description: "Calloused fists from countless street brawls. Bonus to unarmed strikes and disarms.",
    effect: { attModEarly: 1, ripMod: 1 },
    tier: "Common",
    sign: "positive",
    weight: 0.8
  },
  jumpy: {
    id: "jumpy",
    name: "Jumpy",
    description: "Always expects a knife in the back. Better defense and parry, but lower attack.",
    effect: { defMod: 1, parMod: 1, attMod: -1 },
    tier: "Flaw",
    sign: "negative",
    weight: 0.7
  },
  gutter_ghost: {
    id: "gutter_ghost",
    name: "Gutter Ghost",
    description: "Moves unseen in the shadows of the arena. High evasion when healthy.",
    effect: { defMod: 1, parModHighHp: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.6
  },
  workhouse_resilience: {
    id: "workhouse_resilience",
    name: "Workhouse Resilience",
    description: "Bones hardened by endless grueling labor. Better endurance, defense, and parry.",
    effect: { defMod: 1, parMod: 1, enduranceMult: 0.9 },
    tier: "Notable",
    sign: "positive",
    weight: 0.6
  },
  silent_stalker: {
    id: "silent_stalker",
    name: "Silent Stalker",
    description: "Learned to move without a sound in the slums. Increased initiative early.",
    effect: { iniModEarly: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.8
  },
  gutters_edge: {
    id: "gutters_edge",
    name: "Gutter's Edge",
    description: "A desperate, wild fighting style born from alleyway brawls. Bonus damage but lowered early defense.",
    effect: { dmgBonus: 1, defModEarly: -1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.5
  },
  feral_endurance: {
    id: "feral_endurance",
    name: "Feral Endurance",
    description: "Used to surviving on nothing but scraps and spite. Reduced endurance drain.",
    effect: { enduranceMult: 0.9 },
    tier: "Notable",
    sign: "positive",
    weight: 0.8
  },
  orphan_vengeance: {
    id: "orphan_vengeance",
    name: "Orphan Vengeance",
    description: "Driven by a dark past. Gains brutal offensive capability in the late stages of a fight.",
    effect: { attModLate: 2, killWindowBonus: 1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.2
  },
  orphan_fragility: {
    id: "orphan_fragility",
    name: "Orphan Fragility",
    description: "Malnourished in youth. Susceptible to early damage.",
    effect: { defModEarly: -1, enduranceMult: 0.9 },
    tier: "Flaw",
    sign: "negative",
    weight: 0.1
  },
  orphan_blood: {
    id: "orphan_blood",
    name: "Orphan Blood",
    description: "Raised in the gutters. Inured to early punishment and fiercely defensive when wounded.",
    effect: { defModEarly: 1, attModLowHp: 1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.3
  },
  shadow_walker: {
    id: "shadow_walker",
    name: "Shadow Walker",
    description: "Learned to survive unseen. Swift reflexes and enhanced evasion when fresh.",
    effect: { iniModFresh: 1, decMod: 1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.2
  },
  orphan_instinct: {
    id: "orphan_instinct",
    name: "Orphan Instinct",
    description: "+1 defense in early phase \u2014 years of running from danger have sharpened their reflexes.",
    effect: { defModEarly: 1, iniMod: 1 },
    weight: 0.8,
    tier: "Exceptional",
    sign: "positive"
  },
  born_in_shadows: {
    id: "born_in_shadows",
    name: "Born in Shadows",
    description: "+1 initiative in OPENING phase \u2014 used to striking before being seen.",
    effect: { iniModEarly: 1 },
    weight: 0.8,
    tier: "Exceptional",
    sign: "positive"
  },
  orphan_shadow: {
    id: "orphan_shadow",
    name: "Orphan Shadow",
    description: "+1 initiative and +1 decisiveness \u2014 forged in the darkest corners of the undercity.",
    effect: { iniMod: 1, decMod: 1 },
    weight: 0.8,
    tier: "Exceptional",
    sign: "positive"
  },
  gutter_phantom: {
    id: "gutter_phantom",
    name: "Gutter Phantom",
    description: "+1 defense in the early phase and +1 attack when at low HP.",
    effect: { defModEarly: 1, attModLowHp: 1 },
    weight: 0.8,
    tier: "Exceptional",
    sign: "positive"
  },
  gutter_born: {
    id: "gutter_born",
    name: "Gutter Born",
    description: "Forged in the merciless streets. Increased decisiveness and attack in early rounds.",
    effect: { decMod: 1, attModEarly: 1 },
    tier: "Exceptional",
    sign: "positive",
    weight: 0.5
  },
  beast_blood: {
    id: "beast_blood",
    name: "Beast Blood",
    description: "+1 attack when at low HP and +1 initiative while fresh \u2014 lashes out like a wounded animal but starts strong.",
    effect: { attModLowHp: 1, iniModFresh: 1 },
    weight: 0.7,
    tier: "Signature",
    sign: "positive"
  },
  rusted_resolve: {
    id: "rusted_resolve",
    name: "Rusted Resolve",
    description: "+1 defense when bloodied and +1 defense in LATE phase \u2014 pain only hardens them further.",
    effect: { defModLowHp: 1, defModLate: 1 },
    weight: 0.7,
    tier: "Signature",
    sign: "positive"
  },
  spore_kissed: {
    id: "spore_kissed",
    name: "Spore Kissed",
    description: "Inhaled chaos spores. Improved endurance and decisiveness.",
    effect: { enduranceMult: 0.85, decMod: 1 },
    tier: "Notable",
    sign: "positive",
    weight: 0.5
  },
  cornered_rat: {
    id: "cornered_rat",
    name: "Cornered Rat",
    description: "+1 attack and +1 defense in LATE phase \u2014 extremely dangerous when backed into a corner.",
    effect: { attModLate: 1, defModLate: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  orphan_fury: {
    id: "orphan_fury",
    name: "Orphan Fury",
    description: "+1 attack and +1 initiative when bloodied \u2014 fueled by a lifetime of rage.",
    effect: { attModLowHp: 1, iniMod: 1 },
    weight: 0.8,
    tier: "Exceptional",
    sign: "positive"
  },
  asylum_survivor: {
    id: "asylum_survivor",
    name: "Asylum Survivor",
    description: "+1 defense and +1 initiative during early phase \u2014 hardened by years of survival.",
    effect: { defModEarly: 1, iniMod: 1 },
    weight: 0.8,
    tier: "Notable",
    sign: "positive"
  },
  asylum_born: {
    id: "asylum_born",
    name: "Asylum Born",
    description: "+1 defense when at low HP \u2014 accustomed to surviving desperate situations.",
    effect: { defModLowHp: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  street_rat_cunning: {
    id: "street_rat_cunning",
    name: "Street Rat Cunning",
    description: "+1 initiative while fresh, +1 decisiveness \u2014 always ready to run or strike first.",
    effect: { iniModFresh: 1, decMod: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  street_scrapper: {
    id: "street_scrapper",
    name: "Street Scrapper",
    description: "+1 defense in LATE phase \u2014 they excel when things get dirty.",
    effect: { defModLate: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  gutter_cunning: {
    id: "gutter_cunning",
    name: "Gutter Cunning",
    description: "+1 attack during early phase \u2014 strikes fast before the guards arrive.",
    effect: { attModEarly: 1 },
    weight: 0.5,
    tier: "Notable",
    sign: "positive"
  },
  gutter_blood: {
    id: "gutter_blood",
    name: "Gutter Blood",
    description: "+1 attack against low HP opponents \u2014 they can smell the end.",
    effect: { attModLowHp: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  clutch_survivor: {
    id: "clutch_survivor",
    name: "Clutch Survivor",
    description: "+1 attack in LATE phase \u2014 they thrive when the crowd thinks it's over.",
    effect: { attModLate: 1 },
    weight: 0.6,
    tier: "Exceptional",
    sign: "positive"
  },
  adrenaline_surge: {
    id: "adrenaline_surge",
    name: "Adrenaline Surge",
    description: "+1 initiative while fresh \u2014 their adrenaline spikes right out of the gate.",
    effect: { iniModFresh: 1 },
    weight: 0.8,
    tier: "Common",
    sign: "positive"
  },
  feral_instinct: {
    id: "feral_instinct",
    name: "Feral Instinct",
    description: "+1 initiative and +1 attack when bloodied (HP < 50%) \u2014 reverting to survival instincts learned in the gutters.",
    effect: { iniMod: 1, attModLowHp: 1 },
    weight: 0.8,
    tier: "Notable",
    sign: "positive"
  },
  gutter_rat: {
    id: "gutter_rat",
    name: "Gutter Rat",
    description: "+2 defense in LATE phase \u2014 accustomed to outlasting stronger opponents in grueling street fights.",
    effect: { defModLate: 2 },
    weight: 0.8,
    tier: "Notable",
    sign: "positive"
  },
  quick: {
    id: "quick",
    name: "Quick",
    description: "+1 initiative \u2014 naturally fast on the draw.",
    effect: { iniMod: 1 },
    weight: 1,
    tier: "Common",
    sign: "positive"
  },
  patient: {
    id: "patient",
    name: "Patient",
    description: "+2 defense in OPENING phase \u2014 sizes up the foe before committing.",
    effect: { defModEarly: 2 },
    weight: 1,
    tier: "Notable",
    sign: "positive"
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    description: "+2 attack when bloodied (HP < 50%).",
    effect: { attModLowHp: 2 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  stalwart: {
    id: "stalwart",
    name: "Stalwart",
    description: "+2 parry while still strong (HP > 75%).",
    effect: { parModHighHp: 2 },
    weight: 0.8,
    tier: "Notable",
    sign: "positive"
  },
  heavy_handed: {
    id: "heavy_handed",
    name: "Heavy-Handed",
    description: "+1 damage on every successful hit.",
    effect: { dmgBonus: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  disciplined: {
    id: "disciplined",
    name: "Disciplined",
    description: "+1 attack in LATE phase \u2014 endurance discipline pays off.",
    effect: { attModLate: 1, parMod: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  ironlung: {
    id: "ironlung",
    name: "Iron Lung",
    description: "\xD70.92 endurance cost \u2014 efficient breathing.",
    effect: { enduranceMult: 0.92 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive"
  },
  bloodthirsty: {
    id: "bloodthirsty",
    name: "Bloodthirsty",
    description: "+0.005 to kill window \u2014 hungrier for the finish.",
    effect: { killWindowBonus: 0.005 },
    weight: 0.5,
    tier: "Common",
    sign: "positive"
  },
  agile: {
    id: "agile",
    name: "Agile",
    description: "+1 defense baseline \u2014 light on the feet.",
    effect: { defMod: 1 },
    weight: 0.9,
    tier: "Common",
    sign: "positive"
  },
  precise: {
    id: "precise",
    name: "Precise",
    description: "+1 decisiveness baseline \u2014 picks the right opening.",
    effect: { decMod: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive"
  },
  comboartist: {
    id: "comboartist",
    name: "Combo Artist",
    description: "+1 attack when on a hit-streak (\u22652 consecutive hits).",
    effect: { attModConsecutiveHits: 1 },
    weight: 0.7,
    tier: "Common",
    sign: "positive"
  },
  fragile: {
    id: "fragile",
    name: "Fragile",
    description: "\u22122 defense baseline \u2014 drops guard easily.",
    effect: { defMod: -2 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  slow: {
    id: "slow",
    name: "Slow",
    description: "\u22121 initiative \u2014 late on the draw.",
    effect: { iniMod: -1 },
    weight: 0.4,
    tier: "Flaw",
    sign: "negative"
  },
  iron_grip: {
    id: "iron_grip",
    name: "Iron Grip",
    description: "+1 damage, \u22121 initiative \u2014 sacrifices speed for a crushing hold on their weapon.",
    effect: { dmgBonus: 1, iniMod: -1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive"
  },
  cornered_beast: {
    id: "cornered_beast",
    name: "Cornered Beast",
    description: "+2 defense when bloodied (HP < 50%) \u2014 fights harder when backed into a corner.",
    effect: { defModLowHp: 2 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive"
  },
  vengeful: {
    id: "vengeful",
    name: "Vengeful",
    description: "+1 damage when bloodied (HP < 50%) \u2014 pain only makes them angrier.",
    effect: { attModLowHp: 1, dmgBonus: 1 },
    weight: 0.6,
    tier: "Notable",
    sign: "positive"
  },
  stoic: {
    id: "stoic",
    name: "Stoic",
    description: "+1 defense in LATE phase \u2014 ignores mounting fatigue and pain.",
    effect: { defModLate: 1, parModLate: 1 },
    weight: 0.7,
    tier: "Notable",
    sign: "positive"
  },
  aggressive: {
    id: "aggressive",
    name: "Aggressive",
    description: "Fights with reckless abandon, favoring strength over defense.",
    effect: { fightPlanMod: { OE: 4, AL: -1, killDesire: 5 }, attrBonus: { ST: 1, WL: 1 } },
    weight: 1,
    synergy: ["brutal"],
    antiSynergy: ["tank"],
    tier: "Exceptional",
    sign: "positive"
  },
  disciplined_mind: {
    id: "disciplined_mind",
    name: "Disciplined",
    description: "Calm and focused, waiting for the perfect moment to strike.",
    effect: { fightPlanMod: { AL: 3, OE: -1, feintTendency: 5 }, attrBonus: { DF: 1, WL: 1 } },
    weight: 1,
    synergy: ["cunning", "tank"],
    tier: "Exceptional",
    sign: "positive"
  },
  cunning: {
    id: "cunning",
    name: "Cunning",
    description: "Favors trickery and misdirection to find the killing blow.",
    effect: {
      fightPlanMod: { feintTendency: 10, AL: 2, killDesire: -2 },
      attrBonus: { SP: 1, DF: 1 }
    },
    weight: 1,
    synergy: ["cunning", "agile"],
    antiSynergy: ["brutal"],
    tier: "Exceptional",
    sign: "positive"
  },
  sturdy: {
    id: "sturdy",
    name: "Sturdy",
    description: "An unbreakable wall that outlasts any opponent.",
    effect: { fightPlanMod: { AL: -3, OE: -2, killDesire: -5 }, attrBonus: { CN: 1, SZ: 1 } },
    weight: 1,
    synergy: ["tank"],
    antiSynergy: ["agile"],
    tier: "Exceptional",
    sign: "positive"
  },
  feral: {
    id: "feral",
    name: "Feral",
    description: "Fights with a savage, unpredictable intensity.",
    effect: { fightPlanMod: { OE: 6, AL: -4, killDesire: 10 }, attrBonus: { ST: 1, SP: 1 } },
    weight: 0.6,
    synergy: ["brutal", "agile"],
    antiSynergy: ["tank", "cunning"],
    tier: "Signature",
    sign: "positive"
  },
  merciless: {
    id: "merciless",
    name: "Merciless",
    description: "Relentlessly pursues the kill, ignoring all distractions.",
    effect: { fightPlanMod: { killDesire: 12, OE: 2 }, attrBonus: { ST: 1, WL: 1 } },
    weight: 0.6,
    synergy: ["brutal"],
    tier: "Signature",
    sign: "positive"
  },
  calculated: {
    id: "calculated",
    name: "Calculated",
    description: "Every move is a deliberate setup for a final strike.",
    effect: { fightPlanMod: { feintTendency: 8, AL: 4, OE: -3 }, attrBonus: { SP: 1, DF: 1 } },
    weight: 0.8,
    synergy: ["cunning"],
    antiSynergy: ["brutal"],
    tier: "Exceptional",
    sign: "positive"
  },
  resilient: {
    id: "resilient",
    name: "Resilient",
    description: "Absorbs punishment that would fell a lesser warrior.",
    effect: { fightPlanMod: { AL: -2, killDesire: -8 }, attrBonus: { CN: 2 } },
    weight: 0.8,
    synergy: ["tank"],
    antiSynergy: ["agile"],
    tier: "Exceptional",
    sign: "positive"
  },
  evasive: {
    id: "evasive",
    name: "Evasive",
    description: "A ghost on the sand, near-impossible to pin down.",
    effect: { fightPlanMod: { AL: 2, OE: -3, feintTendency: 5 }, attrBonus: { SP: 2 } },
    weight: 0.8,
    synergy: ["agile"],
    antiSynergy: ["brutal", "tank"],
    tier: "Signature",
    sign: "positive"
  },
  brutal: {
    id: "brutal",
    name: "Brutal",
    description: "Values raw power and crushing impact above all else.",
    effect: { fightPlanMod: { OE: 8, killDesire: 5, AL: -5 }, attrBonus: { ST: 2 } },
    weight: 0.8,
    synergy: ["brutal"],
    antiSynergy: ["cunning", "tank"],
    tier: "Signature",
    sign: "positive"
  },
  silent_one: {
    id: "silent_one",
    name: "Silent One",
    description: "+1 defense, +1 decisiveness \u2014 unnervingly quiet, they waste no breath on roars or taunts.",
    effect: { defMod: 1, decMod: 1, fightPlanMod: { feintTendency: -2 } },
    weight: 0.6,
    synergy: ["cunning"],
    antiSynergy: ["brutal"],
    tier: "Notable",
    sign: "positive"
  },
  blood_drunk: {
    id: "blood_drunk",
    name: "Blood Drunk",
    description: "+2 attack and \u22122 defense when bloodied (HP < 50%) \u2014 loses all sense of self-preservation once injured.",
    effect: { attModLowHp: 2, defModLowHp: -2, fightPlanMod: { killDesire: 3 } },
    weight: 0.6,
    synergy: ["brutal", "agile"],
    antiSynergy: ["tank"],
    tier: "Signature",
    sign: "positive"
  },
  paranoid: {
    id: "paranoid",
    name: "Paranoid",
    description: "+2 defense in OPENING phase, but \u22121 decisiveness overall \u2014 constantly expects ambushes.",
    effect: { defModEarly: 2, decMod: -1, fightPlanMod: { AL: -2 } },
    weight: 0.6,
    synergy: ["cunning"],
    tier: "Notable",
    sign: "positive"
  },
  cold_eyed: {
    id: "cold_eyed",
    name: "Cold-Eyed",
    description: "+1 initiative, +1 decisiveness \u2014 unnervingly calm, viewing combat purely as geometry and physics.",
    effect: { iniMod: 1, decMod: 1, fightPlanMod: { feintTendency: 4, AL: 2 } },
    weight: 0.6,
    synergy: ["cunning", "tank"],
    antiSynergy: ["brutal"],
    tier: "Notable",
    sign: "positive"
  },
  death_marked: {
    id: "death_marked",
    name: "Death-Marked",
    description: "+2 kill window bonus and +1 decisiveness \u2014 an eerie aura that makes their lethal strikes more likely to finish the job.",
    effect: { killWindowBonus: 2, decMod: 1, fightPlanMod: { killDesire: 4 } },
    weight: 0.5,
    synergy: ["brutal", "cunning"],
    antiSynergy: ["tank"],
    tier: "Exceptional",
    sign: "positive"
  },
  shadow_step: {
    id: "shadow_step",
    name: "Shadow Step",
    description: "+1 defense, \u22121 damage \u2014 favors elusive positioning over heavy strikes.",
    effect: { defMod: 1, dmgBonus: -1 },
    weight: 0.5,
    tier: "Common",
    sign: "positive"
  },
  ashen_lungs: {
    id: "ashen_lungs",
    name: "Ashen Lungs",
    description: "\u221210% Endurance, +1 Damage \u2014 hacking coughs hide a desperate, brutal strength honed in the soot mines.",
    effect: { enduranceMult: 0.9, dmgBonus: 1 },
    weight: 0.6,
    synergy: ["brutal"],
    tier: "Notable",
    sign: "positive"
  },
  alley_stalker: {
    id: "alley_stalker",
    name: "Alley Stalker",
    description: "+1 Initiative, +1 Kill Window Bonus \u2014 honed senses from a life of ambushing marks in the shadowed alleys.",
    effect: { iniMod: 1, killWindowBonus: 1, fightPlanMod: { AL: 2 } },
    weight: 0.6,
    synergy: ["agile", "cunning"],
    antiSynergy: ["tank"],
    tier: "Notable",
    sign: "positive"
  },
  iron_vein: {
    id: "iron_vein",
    name: "Iron Vein",
    description: "+1 Defense, +10% Endurance \u2014 raised in the deep mines, with bones hardened by labor and scarcity.",
    effect: { defMod: 1, enduranceMult: 0.9, fightPlanMod: { OE: -1 } },
    weight: 0.6,
    synergy: ["tank", "brutal"],
    antiSynergy: ["agile"],
    tier: "Notable",
    sign: "positive"
  },
  gallows_humor: {
    id: "gallows_humor",
    name: "Gallows Humor",
    description: "+1 Decisiveness, +1 Defense in the LATE phase \u2014 laughs in the face of exhaustion and death.",
    effect: { decMod: 1, defModLate: 1 },
    weight: 0.5,
    synergy: ["tank"],
    tier: "Notable",
    sign: "positive"
  },
  chaos_touched: {
    id: "chaos_touched",
    name: "Chaos Touched",
    description: "Touched by strange forces, their strikes grow stronger and wilder as the fight drags on.",
    effect: { dmgBonus: 1, attModLate: 1 },
    weight: 0.1,
    tier: "Exceptional",
    sign: "positive"
  }
};
Object.assign(TRAITS, NEW_FLAWS);
Object.assign(TRAITS, CLASS_TRAITS);
// src/constants/aging/aging.ts
var WARRIOR_AGING = {
  BASE_AGE: 18,
  PENALTY_START: 25,
  PENALTY_INTERVAL: 3,
  FORCED_RETIREMENT_MIN: 26,
  FORCED_RETIREMENT_MAX: 32
};
// src/constants/combat/combat.ts
var GLOBAL_ATT_BONUS = 2.5;
var GLOBAL_PAR_PENALTY = -2.5;
var MAX_EXCHANGES = 30;
var EXCHANGES_PER_MINUTE = 3;
var BOUT_DURATION_MINUTES = MAX_EXCHANGES / EXCHANGES_PER_MINUTE;
var INITIATIVE_PRESS_BONUS = 1;
var WIN_XP = 2;
var LOSS_XP = 1;
var OE_ATT_SCALING = 0.85;
var OE_DEF_SCALING = 0.5;
var AL_INI_SCALING = 0.7;
var DEFENDER_ENDURANCE_DISCOUNT = 0.6;
var KILL_WINDOW_ENDURANCE = 0.4;
var TACTIC_OVERUSE_CAP = 3;
var CRIT_DAMAGE_MULT = 1.7;
var TRAINER_IRONGUARD_ENDURANCE = 0.6;
var TRAINER_ROPEADOPE_CAP = 0.5;
var DAMAGE_RECEIVED_MULT_FLOOR = 0.5;
var AGING_PENALTY_START = WARRIOR_AGING.PENALTY_START;
var VETERAN_WISDOM_FACTOR = 0.25;
var LU_MOMENTUM_DMG_COEFF = 0.5;
var WS_ATTRITION_FLOOR = 0.5;
var PS_COUNTERSTRIKE_ATT = 2;
var BA_PARDEGRADE_PER_HIT = 0.5;
var BA_PARDEGRADE_CAP = 3;
var AB_ARMOR_BYPASS_MAX = 0.4;
var AB_ARMOR_BYPASS_DF_DIVISOR = 50;
var TP_FATIGUE_SEVERE_RATIO = 0.25;
var TP_FATIGUE_MODERATE_RATIO = 0.5;
var TP_FATIGUE_SEVERE_RIP = 5;
var TP_FATIGUE_SEVERE_DMG = 2;
var TP_FATIGUE_MODERATE_RIP = 2;
var TP_FATIGUE_MODERATE_DMG = 1;
var PL_MOMENTUM_RIPOSTE_DMG_COEFF = 0.5;
var PR_COUNTER_ON_PARRY = 4;
var PR_COMMIT_PUNISH = {
  Cautious: 0,
  Standard: 1,
  Full: 2
};
var PR_CHAIN_STEP = 0.5;
var PR_CHAIN_CAP = 1.5;
var SL_BLEED_STACKS_PER_HIT = 2;
var SL_BLEED_CAP = 5;
var SL_BLEED_TICK_DMG = 1;
var SL_BLEED_DECAY = 1;
var ST_FRONTLOAD_START = 1.3;
var ST_FRONTLOAD_WINDOW = 6;
var ST_CRIT_CHANCE_BONUS = 0.1;
var ST_CRIT_DAMAGE_BONUS = 0.2;
var ST_EXECUTE_HP_THRESHOLD = 0.3;
var ST_EXECUTE_BONUS = 2;
var COMMIT_HP_THRESHOLD = 0.35;
var COMMIT_KILL_DESIRE = 7;
var COMMIT_DAMAGE_MULT = 1.2;
var KNOCKDOWN_HP_RATIO = 0.4;
var KNOCKDOWN_DAMAGE_RATIO = 0.12;
var KNOCKDOWN_CHANCE_CAP = 0.35;
var KNOCKDOWN_LEG_BONUS = 0.05;
var INSIGHT_CHANCE = 0.2;
var CRITICAL_CHAIN_HITS = 3;
var ARMOR_FAILURE_DMG_THRESHOLD = 20;
var MOMENTUM_CAP = 3;
var MOMENTUM_FLOOR = -3;
var MOMENTUM_INI_MULT = 2;
var WHIFF_ENDURANCE_COST_MULT = 0.5;
var WHIFF_RIPOSTE_DEF_PENALTY = 4;
var PASSIVE_NARRATIVE_CHANCE = 0.4;
var FEINT_FAILED_DEF_BONUS = 2;
var STYLE_ORDER = [
  "AIMED BLOW" /* AimedBlow */,
  "BASHING ATTACK" /* BashingAttack */,
  "LUNGING ATTACK" /* LungingAttack */,
  "PARRY-LUNGE" /* ParryLunge */,
  "PARRY-RIPOSTE" /* ParryRiposte */,
  "PARRY-STRIKE" /* ParryStrike */,
  "SLASHING ATTACK" /* SlashingAttack */,
  "STRIKING ATTACK" /* StrikingAttack */,
  "TOTAL PARRY" /* TotalParry */,
  "WALL OF STEEL" /* WallOfSteel */
];
var MATCHUP_MATRIX = [
  [0, 1, 2, 1, 1, 1, 2, 2, 1, 3],
  [-1, 0, 0, -1, -1, 0, -1, -1, -1, 0],
  [-2, 0, 0, 0, 0, -1, -1, -1, 0, 0],
  [-1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [-1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
  [-1, 0, 1, -1, 0, 0, 0, 2, 0, 2],
  [-2, 1, 1, 0, 0, 0, 0, -1, 0, 1],
  [-2, 1, 1, 0, -1, -2, 1, 0, 1, 2],
  [-1, 1, 0, -1, 0, 0, 0, -1, 0, 0],
  [-3, 1, 0, -1, 0, -1, -1, -1, 0, 0]
];
function getMatchupBonus(attStyle, defStyle) {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0)
    return 0;
  return MATCHUP_MATRIX[ai]?.[di] ?? 0;
}

// src/engine/traitGeneration.ts
var TRAIT_IDS = Object.keys(TRAITS);
// src/engine/traitMods.ts
function getStaticTraitMods(warrior2) {
  const acc = {
    attMod: 0,
    parMod: 0,
    defMod: 0,
    iniMod: 0,
    ripMod: 0,
    decMod: 0,
    dmgBonus: 0,
    enduranceMult: 1
  };
  if (!warrior2?.traits)
    return acc;
  for (const id of warrior2.traits) {
    const t = TRAITS[id];
    if (!t)
      continue;
    acc.attMod += t.effect.attMod ?? 0;
    acc.parMod += t.effect.parMod ?? 0;
    acc.defMod += t.effect.defMod ?? 0;
    acc.iniMod += t.effect.iniMod ?? 0;
    acc.ripMod += t.effect.ripMod ?? 0;
    acc.decMod += t.effect.decMod ?? 0;
    acc.dmgBonus += t.effect.dmgBonus ?? 0;
    if (t.effect.enduranceMult != null)
      acc.enduranceMult *= t.effect.enduranceMult;
  }
  return acc;
}
function getDynamicTraitMods(warrior2, ctx) {
  const acc = { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 };
  if (!warrior2?.traits)
    return acc;
  for (const id of warrior2.traits) {
    const t = TRAITS[id];
    if (!t)
      continue;
    const e = t.effect;
    if (e.attModLowHp != null && ctx.hpRatio < 0.5)
      acc.attMod += e.attModLowHp;
    if (e.defModLowHp != null && ctx.hpRatio < 0.5)
      acc.defMod += e.defModLowHp;
    if (e.parModHighHp != null && ctx.hpRatio > 0.75)
      acc.parMod += e.parModHighHp;
    if (e.defModEarly != null && ctx.phase === "OPENING")
      acc.defMod += e.defModEarly;
    if (e.iniModEarly != null && ctx.phase === "OPENING")
      acc.iniMod += e.iniModEarly;
    if (e.attModEarly != null && ctx.phase === "OPENING")
      acc.attMod += e.attModEarly;
    if (e.attModLate != null && ctx.phase === "LATE")
      acc.attMod += e.attModLate;
    if (e.defModLate != null && ctx.phase === "LATE")
      acc.defMod += e.defModLate;
    if (e.parModLate != null && ctx.phase === "LATE")
      acc.parMod += e.parModLate;
    if (e.iniModFresh != null && ctx.endRatio > 0.7)
      acc.iniMod += e.iniModFresh;
    if (e.attModConsecutiveHits != null && ctx.consecutiveHits >= 2)
      acc.attMod += e.attModConsecutiveHits;
    if (e.killWindowBonus != null)
      acc.killWindowBonus += e.killWindowBonus;
  }
  return acc;
}
function getTraitFightPlanMods(warrior2) {
  const mods = {};
  if (!warrior2?.traits)
    return mods;
  for (const id of warrior2.traits) {
    const t = TRAITS[id];
    if (!t?.effect.fightPlanMod)
      continue;
    for (const [key, val] of Object.entries(t.effect.fightPlanMod)) {
      const k = key;
      if (typeof val === "number") {
        mods[k] = (mods[k] || 0) + val;
      }
    }
  }
  return mods;
}
// src/engine/injuries.ts
function getInjuryPenalties(injuries) {
  const totals = {};
  for (const inj of injuries) {
    for (const [stat, penalty] of Object.entries(inj.penalties)) {
      totals[stat] = (totals[stat] ?? 0) + (penalty ?? 0);
    }
  }
  return totals;
}

// src/data/terrabloodCharts.ts
var SZ_MOD = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 5,
  12: 5,
  13: 6,
  14: 6,
  15: 7,
  16: 7,
  17: 8,
  18: 8,
  19: 9,
  20: 9,
  21: 10
};
var WL_MOD_HP = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 2,
  13: 2,
  14: 2,
  15: 3,
  16: 3,
  17: 4,
  18: 4,
  19: 5,
  20: 5,
  21: 6,
  22: 7,
  23: 8,
  24: 9,
  25: 10
};
function computeHP(cn, sz, wl) {
  const szMod = SZ_MOD[clamp(sz, 3, 21)] ?? 0;
  const wlMod = WL_MOD_HP[clamp(wl, 3, 25)] ?? 0;
  return cn * 2 + szMod + wlMod;
}
var DMG_TABLE = [
  [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  [1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  [1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
  [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5],
  [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 6],
  [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6],
  [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6],
  [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7],
  [4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8],
  [4, 4, 4, 4, 6, 5, 5, 5, 5, 5, 6, 6, 7, 7, 7, 7, 7, 9, 9],
  [4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 9],
  [5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9]
];
function computeDamageClass(st, sz) {
  const stIdx = clamp(st - 3, 0, 22);
  const szIdx = clamp(sz - 3, 0, 18);
  return DMG_TABLE[stIdx]?.[szIdx] ?? 2;
}
var ENCUMBRANCE_CAPACITY = {
  A: 6,
  B: 12,
  C: 18,
  D: 24,
  E: 30,
  F: 36
};
var ENC_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
  [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
];
var ENC_CLASSES = ["A", "B", "C", "D", "E", "F"];
function computeEncumbranceClass(st, cn) {
  const stIdx = clamp(st - 3, 0, 22);
  const cnIdx = clamp(cn - 3, 0, 22);
  const classIdx = ENC_TABLE[stIdx]?.[cnIdx] ?? 2;
  return ENC_CLASSES[classIdx] ?? "C";
}
function computeEncumbranceCapacity(st, cn) {
  return ENCUMBRANCE_CAPACITY[computeEncumbranceClass(st, cn)];
}
var ENDURANCE_VALUES = {
  L: 12,
  P: 18,
  N: 25,
  G: 33,
  R: 42,
  T: 52,
  A: 65,
  U: 80
};
function computeEnduranceTier(st, cn, wl) {
  const stcn = st + cn;
  const score = wl * 3 + stcn;
  if (score >= 95)
    return "A";
  if (score >= 85)
    return "T";
  if (score >= 75)
    return "R";
  if (score >= 62)
    return "G";
  if (score >= 48)
    return "N";
  if (score >= 35)
    return "P";
  return "L";
}
function computeEnduranceValue(st, cn, wl) {
  return ENDURANCE_VALUES[computeEnduranceTier(st, cn, wl)];
}

// src/engine/skillBreakpoints.ts
function bp(breakpoints, val) {
  let total = 0;
  for (const [threshold, bonus] of breakpoints) {
    if (val >= threshold)
      total += bonus;
  }
  return total;
}
var ST_ATT = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var ST_PAR = ST_ATT;
var WT_ATT = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var WT_DEF = WT_ATT;
var WT_INI = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 4],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var WT_RIP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var WT_DEC = [
  [5, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var WL_ATT = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var WL_PAR = WL_ATT;
var WL_DEF = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2]
];
var WL_DEC = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1]
];
var SP_DEC = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [18, 1],
  [20, 1]
];
var SP_DEF = [
  [5, 1],
  [7, 1],
  [15, 1]
];
var SP_INI = [
  [4, 1],
  [6, 1],
  [9, 1],
  [12, 1],
  [18, 1]
];
var SP_RIP = [
  [4, 1],
  [6, 1],
  [7, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [21, 1]
];
var DF_ATT = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2]
];
var DF_DEF = [
  [5, 1],
  [13, 1],
  [15, 1],
  [21, 1]
];
var DF_INI = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2]
];
var DF_PAR = [
  [5, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [17, 1]
];
var DF_RIP = [
  [6, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [16, 1],
  [18, 1],
  [20, 1]
];
var SZ_INI_MOD = {
  3: -2,
  4: -2,
  5: -1,
  6: -1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 1,
  16: 1,
  17: 2,
  18: 2,
  19: 2,
  20: 2,
  21: 4
};
var SZ_PAR_MOD = {
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: -1,
  16: -1,
  17: -2,
  18: -2,
  19: -2,
  20: -2,
  21: -4
};
var SZ_DEF_MOD = SZ_PAR_MOD;
function szMod(table, sz) {
  return table[clamp(sz, 3, 21)] ?? 0;
}
var STYLE_PENALTIES = {
  ["AIMED BLOW" /* AimedBlow */]: [-12, -7, -11, -7, -6, 1],
  ["PARRY-RIPOSTE" /* ParryRiposte */]: [-12, -6, -13, -6, -1, -1],
  ["PARRY-STRIKE" /* ParryStrike */]: [-10, -5, -10, -5, -3, 0],
  ["PARRY-LUNGE" /* ParryLunge */]: [-9, -5, -11, -5, -5, 0],
  ["LUNGING ATTACK" /* LungingAttack */]: [-6, -8, -9, -3, -3, 0],
  ["SLASHING ATTACK" /* SlashingAttack */]: [-12, -14, -15, -4, -7, -2],
  ["BASHING ATTACK" /* BashingAttack */]: [-9, -11, -15, -2, -5, 0],
  ["STRIKING ATTACK" /* StrikingAttack */]: [-9, -7, -10, -3, -3, 1],
  ["TOTAL PARRY" /* TotalParry */]: [-15, -1, -12, -6, -4, -2],
  ["WALL OF STEEL" /* WallOfSteel */]: [-8, -6, -10, 0, -4, -2]
};

// src/engine/skillCalc.ts
function computeBaseSkills(attrs, style) {
  const { ST, SZ, WT, WL, SP, DF } = attrs;
  const pen = STYLE_PENALTIES[style];
  const ATT_raw = bp(ST_ATT, ST) + bp(WT_ATT, WT) + bp(WL_ATT, WL) + bp(DF_ATT, DF) + pen[0];
  const PAR_raw = bp(ST_PAR, ST) + szMod(SZ_PAR_MOD, SZ) + bp(WL_PAR, WL) + bp(DF_PAR, DF) + pen[1];
  const DEF_raw = szMod(SZ_DEF_MOD, SZ) + bp(WT_DEF, WT) + bp(WL_DEF, WL) + bp(SP_DEF, SP) + bp(DF_DEF, DF) + pen[2];
  const INI_raw = szMod(SZ_INI_MOD, SZ) + bp(WT_INI, WT) + bp(SP_INI, SP) + bp(DF_INI, DF) + pen[3];
  const RIP_raw = bp(WT_RIP, WT) + bp(SP_RIP, SP) + bp(DF_RIP, DF) + pen[4];
  const DEC_raw = bp(WT_DEC, WT) + bp(WL_DEC, WL) + bp(SP_DEC, SP) + pen[5];
  return {
    ATT: clamp(ATT_raw, 1, 20),
    PAR: clamp(PAR_raw, 1, 20),
    DEF: clamp(DEF_raw, 1, 20),
    INI: clamp(INI_raw, 1, 20),
    RIP: clamp(RIP_raw, 1, 20),
    DEC: clamp(DEC_raw, 1, 20)
  };
}
function applyLuckfactor(skills, luck) {
  if (!luck)
    return skills;
  return {
    ATT: Math.max(1, skills.ATT + (luck.ATT ?? 0)),
    PAR: Math.max(1, skills.PAR + (luck.PAR ?? 0)),
    DEF: Math.max(1, skills.DEF + (luck.DEF ?? 0)),
    INI: Math.max(1, skills.INI + (luck.INI ?? 0)),
    RIP: Math.max(1, skills.RIP + (luck.RIP ?? 0)),
    DEC: Math.max(1, skills.DEC + (luck.DEC ?? 0))
  };
}
function computeHP2(attrs) {
  return computeHP(attrs.CN, attrs.SZ, attrs.WL);
}
function computeEndurance(attrs) {
  return computeEnduranceValue(attrs.ST, attrs.CN, attrs.WL);
}
function computeDamage(attrs) {
  return computeDamageClass(attrs.ST, attrs.SZ);
}
function computeEncumbrance(attrs) {
  return computeEncumbranceCapacity(attrs.ST, attrs.CN);
}
function computeDerivedStats(attrs) {
  return {
    hp: computeHP2(attrs),
    endurance: computeEndurance(attrs),
    damage: computeDamage(attrs),
    encumbrance: computeEncumbrance(attrs)
  };
}
function computeWarriorStats(attrs, style) {
  return {
    baseSkills: computeBaseSkills(attrs, style),
    derivedStats: computeDerivedStats(attrs)
  };
}

// src/engine/aging/veteranCompensation.ts
function agingAttributeLoss(age) {
  const penalty = Math.max(0, Math.floor((age - AGING_PENALTY_START) / WARRIOR_AGING.PENALTY_INTERVAL));
  return penalty * 2;
}
function getVeteranDefBonus(age, will) {
  const lost = agingAttributeLoss(age);
  if (lost === 0)
    return 0;
  const wlScale = will / 15;
  const bonus = lost * VETERAN_WISDOM_FACTOR * wlScale;
  return Math.min(bonus, lost);
}

// src/engine/bout/fighterState.ts
function getTrainerMods(trainers, style) {
  const bonus = getTrainingBonus(trainers, style);
  return {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing
  };
}
function createFighterState(label, plan, warrior2, trainers) {
  const attrs = warrior2?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const skills = applyLuckfactor(warrior2?.baseSkills ?? { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 }, warrior2?.luckfactor);
  const derived = warrior2?.derivedStats ?? { hp: 100, endurance: 100, damage: 5, encumbrance: 0 };
  const equip = warrior2?.equipment ?? getStyleDefaultLoadout(plan.style);
  const trainerMods = trainers ? getTrainerMods(trainers, plan.style) : null;
  const favWeapon = warrior2 ? getFavoriteWeaponBonus(warrior2) : 0;
  const isMastered = favWeapon > 0;
  const mastery = getMasteryBonus(plan.style, isMastered);
  const veteranDef = warrior2 ? getVeteranDefBonus(warrior2.age ?? 18, attrs.WL) : 0;
  const wShield = getShieldModifiers(equip.weapon);
  const oShield = getShieldModifiers(equip.shield);
  const totalShieldDef = wShield.def + oShield.def;
  const totalShieldAtt = wShield.att + oShield.att;
  const weaponReq = checkWeaponRequirements(equip.weapon, {
    ST: attrs.ST,
    SZ: attrs.SZ,
    WT: attrs.WT,
    DF: attrs.DF
  });
  const encRatio = getEncumbranceRatio(equip, derived.encumbrance);
  const encTier = getEncumbranceTier(encRatio);
  const encPenalties = getEncumbrancePenalties(encTier);
  const encumbranceIniPenalty = encPenalties.iniPenalty;
  const encumbranceDefPenalty = encPenalties.defPenalty;
  const encumbranceParPenalty = encPenalties.parPenalty;
  const encumbranceEndMult = encPenalties.enduranceMult;
  const armorItem = getItemById(equip.armor);
  const helmItem = getItemById(equip.helm);
  const armorDefMod = armorItem?.defenseMod ?? 0;
  const helmDefMod = helmItem?.defenseMod ?? 0;
  const classicBonus = warrior2 ? getClassicWeaponBonus(plan.style, equip.weapon) : 0;
  const drills = warrior2?.skillDrills ?? {};
  const traitMods = getStaticTraitMods(warrior2);
  const injuryPenalties = getInjuryPenalties(warrior2?.injuries ?? []);
  const effSkills = {
    ATT: skills.ATT + (trainerMods?.attMod ?? 0) + mastery.att + classicBonus + weaponReq.attPenalty + totalShieldAtt + (drills.ATT ?? 0) + traitMods.attMod + (injuryPenalties["ATT"] ?? 0),
    PAR: skills.PAR + (trainerMods?.parMod ?? 0) + totalShieldDef + encumbranceParPenalty + (drills.PAR ?? 0) + traitMods.parMod + (injuryPenalties["PAR"] ?? 0),
    DEF: skills.DEF + (trainerMods?.defMod ?? 0) + totalShieldDef + armorDefMod + helmDefMod + encumbranceDefPenalty + veteranDef + mastery.def + (drills.DEF ?? 0) + traitMods.defMod + (injuryPenalties["DEF"] ?? 0),
    INI: skills.INI + (trainerMods?.iniMod ?? 0) + encumbranceIniPenalty + mastery.ini + (drills.INI ?? 0) + traitMods.iniMod + (injuryPenalties["INI"] ?? 0),
    RIP: skills.RIP + mastery.rip + (drills.RIP ?? 0) + traitMods.ripMod + (injuryPenalties["RIP"] ?? 0),
    DEC: skills.DEC + (trainerMods?.decMod ?? 0) + (drills.DEC ?? 0) + traitMods.decMod + (injuryPenalties["DEC"] ?? 0)
  };
  const aiMods = getTraitFightPlanMods(warrior2);
  const traitPlan = { ...plan };
  if (aiMods.OE != null)
    traitPlan.OE = clamp(traitPlan.OE + aiMods.OE, 0, 10);
  if (aiMods.AL != null)
    traitPlan.AL = clamp(traitPlan.AL + aiMods.AL, 0, 10);
  if (aiMods.killDesire != null)
    traitPlan.killDesire = Math.max(0, Math.min(100, (traitPlan.killDesire ?? 0) + aiMods.killDesire));
  if (aiMods.feintTendency != null)
    traitPlan.feintTendency = Math.max(0, Math.min(100, (traitPlan.feintTendency ?? 0) + aiMods.feintTendency));
  return {
    label,
    style: traitPlan.style,
    attributes: attrs,
    skills: effSkills,
    derived: {
      ...derived,
      damage: derived.damage + mastery.dmg + traitMods.dmgBonus
    },
    plan: traitPlan,
    activePlan: { ...traitPlan },
    psychState: "Neutral",
    hp: derived.hp,
    maxHp: derived.hp,
    endurance: derived.endurance + (trainerMods?.endMod ?? 0),
    maxEndurance: derived.endurance + (trainerMods?.endMod ?? 0),
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
    favorites: warrior2?.favorites,
    traits: warrior2?.traits,
    staticEnduranceMult: traitMods.enduranceMult,
    totalFights: warrior2?.career ? warrior2.career.wins + warrior2.career.losses : 0,
    encumbrancePenalty: {
      iniPenalty: encumbranceIniPenalty,
      defPenalty: encumbranceDefPenalty,
      parPenalty: encumbranceParPenalty,
      enduranceMult: encumbranceEndMult
    },
    weaponId: equip.weapon,
    armorId: equip.armor,
    shieldId: equip.shield,
    helmId: equip.helm,
    bleedStacks: 0,
    momentum: 0,
    riposteStreak: 0,
    parDegrade: 0,
    committed: false,
    survivalStrike: false,
    counterstrikePrimed: false,
    recoveryDebt: 0
  };
}
// src/engine/trainerSpecialties.ts
function defaultSpecialtyMods() {
  return {
    attMod: 0,
    defMod: 0,
    parMod: 0,
    iniMod: 0,
    decMod: 0,
    endMod: 0,
    killWindowBonus: 0,
    damageReceivedMult: 1,
    riposteDamageMult: 1,
    fatiguePenaltyReduction: 0
  };
}
var SPECIALTY_HANDLERS = {
  KillerInstinct: (mods, _self, opponent, _ctx, tier) => {
    if (opponent.hp / opponent.maxHp < KILL_WINDOW_ENDURANCE) {
      mods.killWindowBonus += 0.01 * tier;
    }
  },
  IronConditioning: (mods, _self, _opponent, ctx, tier) => {
    if (ctx.phase === "LATE") {
      mods.endMod += 0.1 * tier;
    }
  },
  CounterFighter: (mods, _self, _opponent, _ctx, tier) => {
    mods.riposteDamageMult += 0.15 * tier;
  },
  Footwork: (mods, _self, _opponent, ctx, tier) => {
    if (ctx.phase !== "OPENING") {
      mods.iniMod += 3 * tier;
    }
  },
  IronGuard: (mods, self, _opponent, _ctx, tier) => {
    if (self.endurance / self.maxEndurance > TRAINER_IRONGUARD_ENDURANCE) {
      mods.damageReceivedMult *= 1 - 0.1 * tier;
    }
  },
  Finisher: (mods, self, _opponent, _ctx, tier) => {
    if (self.momentum >= 2) {
      mods.attMod += 0.1 * tier;
    }
  },
  RopeADope: (mods, _self, _opponent, _ctx, tier) => {
    mods.fatiguePenaltyReduction = Math.min(TRAINER_ROPEADOPE_CAP, mods.fatiguePenaltyReduction + 0.3 * tier);
  }
};
function getSpecialtyMods(trainers, self, opponent, ctx) {
  const mods = defaultSpecialtyMods();
  if (!trainers)
    return mods;
  const hasKillerInstinct = trainers.some((t) => t.contractWeeksLeft > 0 && t.specialty === "KillerInstinct");
  const hasFinisher = trainers.some((t) => t.contractWeeksLeft > 0 && t.specialty === "Finisher");
  for (const trainer of trainers) {
    if (trainer.contractWeeksLeft <= 0 || !trainer.specialty)
      continue;
    const tier = TIER_BONUS[trainer.tier] ?? 1;
    const handler = SPECIALTY_HANDLERS[trainer.specialty];
    if (handler)
      handler(mods, self, opponent, ctx, tier);
  }
  if (hasKillerInstinct && hasFinisher && opponent.hp / opponent.maxHp < KILL_WINDOW_ENDURANCE && self.momentum >= 2) {
    mods.killWindowBonus += 0.005;
  }
  mods.damageReceivedMult = Math.max(DAMAGE_RECEIVED_MULT_FLOOR, mods.damageReceivedMult);
  return mods;
}

// src/engine/combat/mechanics/simulateHelpers.ts
function getTrainerMods2(trainers, style, fighter, opponent, ctx) {
  if (!trainers) {
    return {
      attMod: 0,
      defMod: 0,
      iniMod: 0,
      parMod: 0,
      decMod: 0,
      endMod: 0,
      healMod: 0,
      killWindowBonus: 0,
      damageReceivedMult: 1,
      riposteDamageMult: 1,
      fatiguePenaltyReduction: 0
    };
  }
  const bonus = getTrainingBonus(trainers, style);
  const base = {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing
  };
  if (fighter && opponent && ctx) {
    const spec = getSpecialtyMods(trainers, fighter, opponent, ctx);
    return {
      attMod: base.attMod + spec.attMod,
      parMod: base.parMod + spec.parMod,
      defMod: base.defMod + spec.defMod,
      iniMod: base.iniMod + spec.iniMod,
      decMod: base.decMod + spec.decMod,
      endMod: base.endMod + spec.endMod,
      healMod: base.healMod,
      killWindowBonus: spec.killWindowBonus,
      damageReceivedMult: spec.damageReceivedMult,
      riposteDamageMult: spec.riposteDamageMult,
      fatiguePenaltyReduction: spec.fatiguePenaltyReduction
    };
  }
  return {
    ...base,
    killWindowBonus: 0,
    damageReceivedMult: 1,
    riposteDamageMult: 1,
    fatiguePenaltyReduction: 0
  };
}

// src/engine/combat/mechanics/weatherOpeningLines.ts
var WEATHER_OPENING_LINES = {
  "Cosmic Anomaly": "A tear in the sky reveals the screaming void. Cosmic energies crackle across the sand.",
  "Abyssal Tempest": "An abyssal vortex rips across the arena, plunging the fighters into agonizing gloom.",
  "Prismatic Rain": "A strange, iridescent rain begins to fall. The air itself feels charged with anticipation.",
  "Eldritch Eclipse": "The sky turns a sickening purple as an Eldritch Eclipse blocks the sun. Madness descends.",
  "Moonlight Duel": "The arena is silent save for the clash of steel under the pale moonlight.",
  Zephyr: "A soothing zephyr sweeps across the sands, bringing a momentary peace.",
  "Wild Magic": "Crackling energy arcs through the arena. Magic is in the air.",
  Clear: null,
  "Crimson Snow": "Blood-red snow falls silently, covering the arena in a thick, terrifying blanket of crimson.",
  Overcast: null,
  Rainy: "Rain slicks the sand \u2014 footwork will be treacherous today.",
  Sweltering: "The air hangs thick and hot. Stamina will be the deciding factor.",
  Breezy: "A cool breeze sweeps through the arena. The fighters look sharp.",
  "Blazing Sun": "The sun beats down mercilessly. Heavy fighters will suffer.",
  Gale: "Gale-force winds tear through the stands. Timing will be everything.",
  "Eclipse of Chaos": "The sky darkens as a chaotic eclipse sets in, filling the arena with unnatural tension.",
  "Blood Moon": "A crimson moon hangs overhead. The crowd is already baying for blood.",
  "Weeping Skies": "A strange localized rain cloud hovers over the arena.",
  Eclipse: "Darkness falls mid-day. An eerie calm descends before the violence.",
  Sandstorm: "A howling sandstorm blinds the arena. Every breath is a battle.",
  Tornado: "A terrifying tornado tears through the arena, throwing sand and debris everywhere.",
  Blizzard: "A brutal blizzard freezes the arena. Survival is the only goal.",
  "Dense Fog": "A thick mist swallows the fighters. Every shadow is a threat.",
  Mist: "A light mist rolls across the sand, clinging to the fighters.",
  "Glittering Frost": "A beautiful, sharp glittering frost covers the arena. The air bites the lungs.",
  Thunderstorm: "Thunder shakes the ground while lightning splits the sky.",
  Ashfall: "Gray ash falls like snow. The air itself tastes of death.",
  "Acid Rain": "Hissing rain burns the skin. This fight will be short and brutal.",
  "Mana Surge": "The air crackles with power. The fighters move with impossible speed.",
  "Astral Dust": "Shimmering astral dust falls from the sky, making movements erratic.",
  "Scorching Wind": "A hot, dry wind sweeps the arena, parching throats and sapping strength.",
  "Spooky Night": "An unnatural chill settles over the arena, and shadows seem to move on their own.",
  "Meteor Shower": "The night sky burns with falling stars, casting chaotic shadows across the sand.",
  "Abyssal Gloom": "A terrifying, supernatural darkness swallows the arena. Fighters vanish into the abyssal gloom.",
  "Cursed Miasma": "A sickening purple miasma clings to the arena floor, draining life and hope alike.",
  Hailstorm: "Ice falls from the sky like stones, battering armor and bare flesh alike.",
  "Solar Flare": "A blinding flash of light bakes the arena. The sun itself seems to attack the fighters.",
  "Arcane Storm": "The air rips open with raw arcane power. Reality itself seems to bend.",
  "Blood Rain": "Thick red drops fall from an unnatural sky. The air smells of copper and dread.",
  "Locust Swarm": "A deafening swarm of locusts descends upon the arena, gnawing at everything in sight.",
  "Aurora Borealis": "The heavens are ablaze with ethereal, dancing lights. A serene calm settles over the sands.",
  "Chaotic Winds": "Fierce, swirling winds kick up the sand, creating unpredictable combat conditions.",
  "Aether Storm": "Raw aether winds rip through the arena. The boundaries of reality are fraying.",
  Mirage: "The arena shimmers with intense heat, causing the air itself to ripple with illusions.",
  Rainbow: "A vibrant rainbow curves over the arena, bringing a moment of strange peace.",
  "Ember Rain": "Glowing embers rain down from the sky, searing the sand and the fighters alike.",
  "Wildfire Smoke": "A thick blanket of acrid smoke settles over the sands. Every breath burns.",
  "Gravity Anomaly": "The very air feels unnaturally light, then crushingly heavy. The laws of physics are breaking down.",
  "Blood Fog": "A thick, crimson fog rolls across the arena, smelling of rust and death.",
  "Shimmering Heat": "The air ripples with shimmering heat, distorting every shape upon the sands.",
  "Crystal Rain": "Sharp, shimmering crystals plummet from the sky. Blood will undoubtedly be drawn.",
  "Winds of Chaos": "Unpredictable magical gales whip through the arena, carrying the scent of ozone and madness.",
  "Rain of Frogs": "The sky darkens and an absurd, writhing rain of frogs begins to fall, confusing everyone.",
  "Chaos Storm": "A swirling vortex of raw chaos descends upon the arena. Reality itself seems to fracture as the storm intensifies.",
  "Whispering Winds": "Unseen voices murmur through the arena. The fighters glance around nervously.",
  "Chaos Squall": "A chaotic squall of purple energy descends upon the arena, making every shadow twitch.",
  "Diamond Rain": "A bizarre rain of diamonds begins to fall, cutting flesh and armor alike.",
  "Temporal Rift": "Reality shudders as a Temporal Rift opens. Time itself seems to bend to the fighters' will.",
  "Stardust Gale": "A shimmering gale of stardust sweeps the arena. Fighters move with hastened, exhausting speed.",
  "Mana Storm": "Raw mana erupts across the arena in crackling waves. The fighters' eyes glow with arcane fire.",
  "Dreamweavers Mist": "A surreal, hallucinogenic mist envelops the arena, distorting senses and lulling the crowd.",
  "Shattered Skies": "The sky shatters like glass, raining ethereal shards onto the sand."
};
function weatherOpeningLine(weather) {
  return WEATHER_OPENING_LINES[weather] ?? null;
}

// src/engine/combat/mechanics/weatherEffects.ts
var WEATHER_EFFECTS = {
  "Cosmic Anomaly": {
    staminaMult: 0.9,
    initiativeMod: 5,
    riposteMod: -2,
    damageMult: 1.25,
    description: "The fabric of space tears open. Cosmic energies empower fighters but make them erratic."
  },
  "Abyssal Tempest": {
    staminaMult: 1.6,
    initiativeMod: -2,
    riposteMod: -2,
    damageMult: 1.1,
    description: "A violent tear into the abyss that heavily drains stamina and unnerves the combatants."
  },
  "Dreamweavers Mist": {
    staminaMult: 0.85,
    initiativeMod: -1,
    riposteMod: 2,
    damageMult: 0.95,
    description: "A hallucinogenic mist rolls in. Fighters move languidly, saving stamina and dodging gracefully, but hits lack their usual sting."
  },
  "Prismatic Rain": {
    staminaMult: 1.15,
    initiativeMod: 1,
    riposteMod: 1,
    damageMult: 1.05,
    description: "Iridescent rain falls, strangely energizing the fighters."
  },
  "Eldritch Eclipse": {
    staminaMult: 0.95,
    initiativeMod: 2,
    riposteMod: 2,
    damageMult: 1.2,
    description: "An otherworldly eclipse that drives fighters to the brink of madness."
  },
  "Moonlight Duel": {
    staminaMult: 1.1,
    initiativeMod: 1,
    riposteMod: 0,
    damageMult: 1,
    description: "A secret midnight challenge. 10% more stamina drain in combat."
  },
  Zephyr: {
    staminaMult: 0.85,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 1,
    description: "A gentle, otherworldly breeze that refreshes fighters."
  },
  "Wild Magic": {
    staminaMult: 1,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.1,
    description: "Unpredictable magical surges empower strikes."
  },
  Clear: {
    staminaMult: 1,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1,
    description: "Ideal conditions. No advantage given."
  },
  "Crimson Snow": {
    staminaMult: 1.4,
    initiativeMod: -3,
    riposteMod: 2,
    damageMult: 1.15,
    description: "Red snow numbs the limbs and hides the true amount of blood spilled."
  },
  Rainy: {
    staminaMult: 1.1,
    initiativeMod: -3,
    riposteMod: 5,
    damageMult: 0.9,
    description: "Slick sand \u2014 footwork suffers, counters come easier."
  },
  Sweltering: {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1,
    description: "Oppressive heat drains stamina rapidly."
  },
  Breezy: {
    staminaMult: 0.9,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 1,
    description: "Cool air aids recovery and sharpens reflexes."
  },
  Overcast: {
    staminaMult: 1,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1,
    description: "Flat light, neutral conditions."
  },
  "Blazing Sun": {
    staminaMult: 1.4,
    initiativeMod: -2,
    riposteMod: -3,
    damageMult: 1.1,
    description: "Brutal sun \u2014 heavy fighters suffer, attacks hit harder."
  },
  Gale: {
    staminaMult: 1.2,
    initiativeMod: -5,
    riposteMod: 3,
    damageMult: 0.85,
    description: "Gale-force winds disrupt attacks and reward counters."
  },
  "Eclipse of Chaos": {
    staminaMult: 1.4,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.25,
    description: "An unearthly eclipse that saps the breath but fuels destructive strikes."
  },
  "Blood Moon": {
    staminaMult: 0.9,
    initiativeMod: 3,
    riposteMod: 0,
    damageMult: 1.2,
    description: "Crimson moon \u2014 crowd frenzy drives fighters harder."
  },
  "Weeping Skies": {
    staminaMult: 1.2,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 0.95,
    description: "A sorrowful localized rain saps energy but clears the mind."
  },
  Eclipse: {
    staminaMult: 0.8,
    initiativeMod: 5,
    riposteMod: 5,
    damageMult: 1.3,
    description: "Eerie darkness heightens all combat instincts."
  },
  Sandstorm: {
    staminaMult: 1.2,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.9,
    description: "Choking dust drains stamina and blinds fighters."
  },
  Tornado: {
    staminaMult: 1.4,
    initiativeMod: -6,
    riposteMod: -2,
    damageMult: 0.8,
    description: "Violent swirling winds threaten to lift fighters off their feet, destroying coordination."
  },
  Blizzard: {
    staminaMult: 1.5,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.8,
    description: "Freezing winds drain stamina rapidly and numb the limbs."
  },
  "Dense Fog": {
    staminaMult: 1,
    initiativeMod: -8,
    riposteMod: 12,
    damageMult: 1.1,
    description: "Zero visibility \u2014 ambush tactics and counters reign supreme."
  },
  Mist: {
    staminaMult: 1,
    initiativeMod: -2,
    riposteMod: 2,
    damageMult: 1,
    description: "A light mist obscures the arena, making initial strikes trickier."
  },
  "Glittering Frost": {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.1,
    description: "A beautiful, sharp glittering frost covers the arena. The air bites the lungs."
  },
  Thunderstorm: {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.25,
    description: "The roar of thunder and flash of lightning drives up the stakes."
  },
  Ashfall: {
    staminaMult: 1.4,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 0.9,
    description: "Falling ash chokes the air and exhausts the lungs."
  },
  "Acid Rain": {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: -6,
    damageMult: 1.2,
    description: "Burning rain erodes armor and creates a desperate struggle."
  },
  "Mana Surge": {
    staminaMult: 0.7,
    initiativeMod: 10,
    riposteMod: 10,
    damageMult: 1.5,
    description: "Raw magical energy empowers every strike and movement."
  },
  "Astral Dust": {
    staminaMult: 1.2,
    initiativeMod: 3,
    riposteMod: 0,
    damageMult: 0.9,
    description: "Shimmering star dust makes movements erratic and draining."
  },
  "Scorching Wind": {
    staminaMult: 1.3,
    initiativeMod: 1,
    riposteMod: -1,
    damageMult: 1,
    description: "Hot winds sap stamina and dry the throat, pushing fighters to act rashly."
  },
  "Spooky Night": {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: -2,
    damageMult: 0.9,
    description: "An unnatural chill and eerie shadows make fighters nervous and jumpy."
  },
  "Meteor Shower": {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: -3,
    damageMult: 1.15,
    description: "Falling stars distract fighters and add a chaotic unpredictability to combat."
  },
  "Abyssal Gloom": {
    staminaMult: 0.9,
    initiativeMod: -5,
    riposteMod: 5,
    damageMult: 1.15,
    description: "Impenetrable, supernatural darkness swallows the arena. Attacks are devastating, but finding the target is grueling."
  },
  "Cursed Miasma": {
    staminaMult: 1.3,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 1.1,
    description: "A vile, clinging mist saps energy and clouds the mind, leaving fighters desperate."
  },
  Hailstorm: {
    staminaMult: 1.2,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 0.95,
    description: "Pummeling hail batters the fighters, hurting momentum and stamina."
  },
  "Solar Flare": {
    staminaMult: 1.5,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.25,
    description: "A blinding flash of light bakes the arena, draining stamina aggressively while giving eager attackers a burst of destructive energy."
  },
  "Arcane Storm": {
    staminaMult: 0.8,
    initiativeMod: 8,
    riposteMod: 5,
    damageMult: 1.4,
    description: "Raw magical energy warps reality, supercharging strikes and accelerating reflexes wildly."
  },
  "Blood Rain": {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: 2,
    damageMult: 1.2,
    description: "Red rain slickens the sand. Violence feels inevitable."
  },
  "Locust Swarm": {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 0.9,
    description: "A blinding swarm of locusts descends upon the arena, gnawing at everything in sight."
  },
  "Aurora Borealis": {
    staminaMult: 0.85,
    initiativeMod: 2,
    riposteMod: 1,
    damageMult: 0.95,
    description: "The sky dances with spectral light. Fighters feel a strange, invigorating calm."
  },
  "Chaotic Winds": {
    staminaMult: 1.3,
    initiativeMod: -4,
    riposteMod: 3,
    damageMult: 0.85,
    description: "Erratic winds buffet the arena, disrupting movement and throwing off attacks."
  },
  "Aether Storm": {
    staminaMult: 0.8,
    initiativeMod: 8,
    riposteMod: 3,
    damageMult: 1.3,
    description: "Raw aetherical winds warp reality, quickening reflexes and amplifying blows."
  },
  Mirage: {
    staminaMult: 1.1,
    initiativeMod: -5,
    riposteMod: -2,
    damageMult: 0.9,
    description: "Shimmering heat distortions create optical illusions. Fighters struggle to judge distance."
  },
  Rainbow: {
    staminaMult: 0.9,
    initiativeMod: 1,
    riposteMod: 0,
    damageMult: 1,
    description: "A beautiful rainbow spans the sky. Spirits are high."
  },
  "Ember Rain": {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 1,
    description: "Glowing embers rain down from the sky, searing the sand and the fighters alike."
  },
  "Wildfire Smoke": {
    staminaMult: 1.35,
    initiativeMod: -4,
    riposteMod: 2,
    damageMult: 0.9,
    description: "Thick smoke chokes the lungs and stings the eyes, turning fights into desperate brawls."
  },
  "Gravity Anomaly": {
    staminaMult: 0.9,
    initiativeMod: -3,
    riposteMod: 5,
    damageMult: 1.2,
    description: "Fluctuating gravity makes movements unpredictable, rewarding opportunistic counters and heavy strikes."
  },
  "Blood Fog": {
    staminaMult: 1.1,
    initiativeMod: -6,
    riposteMod: 6,
    damageMult: 1.25,
    description: "A crimson fog obscures vision and incites a frantic, bloody panic."
  },
  "Shimmering Heat": {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1,
    description: "A rippling heatwave blurs vision and exhausts fighters."
  },
  "Crystal Rain": {
    staminaMult: 1.1,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 1.2,
    description: "Sharp, shimmering crystals fall from the sky, cutting through armor."
  },
  "Winds of Chaos": {
    staminaMult: 0.8,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.15,
    description: "Unpredictable magical gales that make initiative erratic but conserve stamina."
  },
  "Rain of Frogs": {
    staminaMult: 1.1,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 0.9,
    description: "A bizarre rain of frogs covers the arena, causing widespread confusion and making footing treacherous."
  },
  "Chaos Storm": {
    staminaMult: 0.8,
    initiativeMod: -5,
    riposteMod: 10,
    damageMult: 1.5,
    description: "A swirling vortex of raw chaos tears across the arena, draining stamina, scrambling timing, and amplifying every blow with unpredictable violence."
  },
  "Whispering Winds": {
    staminaMult: 1,
    initiativeMod: -1,
    riposteMod: 2,
    damageMult: 0.95,
    description: "Strange voices carried by the wind distract fighters, slightly lowering initiative but heightening paranoia and riposte chances."
  },
  "Diamond Rain": {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.15,
    description: "A bizarre rain of diamonds cuts flesh and armor alike."
  },
  "Temporal Rift": {
    staminaMult: 2,
    initiativeMod: 10,
    riposteMod: 5,
    damageMult: 1,
    description: "Time fractures, heavily accelerating combat at the cost of immense stamina."
  },
  "Stardust Gale": {
    staminaMult: 1.15,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 1,
    description: "A shimmering gale of stardust accelerates initiative but drains stamina faster."
  },
  "Chaos Squall": {
    staminaMult: 0.85,
    initiativeMod: 3,
    riposteMod: -2,
    damageMult: 1.1,
    description: "Unpredictable bursts of raw energy whip through the arena, empowering strikes but punishing mistakes."
  },
  "Mana Storm": {
    staminaMult: 1.5,
    initiativeMod: 4,
    riposteMod: 1,
    damageMult: 1.1,
    description: "Violent purple energy crackles in the air, giving extreme energy but draining stamina massively."
  },
  "Shattered Skies": {
    staminaMult: 1.1,
    initiativeMod: 2,
    riposteMod: -2,
    damageMult: 1.15,
    description: "The sky cracks like glass, unleashing raw aether that empowers blows but tires fighters quickly."
  }
};
function resolveEffectiveWeather(weather, arenaTags) {
  const isIndoor = arenaTags.includes("indoor");
  return isIndoor ? "Clear" : weather;
}
function getWeatherEffect(weather) {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS["Clear"];
}

// src/data/arenas.ts
var registry = new Map;
var allCache = null;
var tagIndex = new Map;
var tierIndex = new Map;
function registerArena(arena) {
  registry.set(arena.id, arena);
  allCache = null;
  tagIndex.clear();
  tierIndex.clear();
}
function getArenaById(id) {
  return registry.get(id) ?? STANDARD_ARENA;
}
var STANDARD_ARENA = {
  id: "standard_arena",
  name: "The Proving Grounds",
  tags: ["outdoor", "open"],
  tier: 1,
  size: "standard",
  description: "A flat, sandy arena. No particular advantage to either style.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 0 },
  startingZone: "Center"
};
var MIST_SHROUDED_RUINS = {
  id: "mist_shrouded_ruins",
  name: "Mist-Shrouded Ruins",
  tags: ["ruins", "magical", "outdoor"],
  tier: 2,
  description: "Ancient, crumbling walls obscured by an unnatural fog.",
  size: "open",
  zoneDef: { Edge: -2 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1 }
};
var THE_GALLOWS_TREE = {
  id: "the_gallows_tree",
  name: "The Gallows Tree",
  tags: ["outdoor", "cursed", "uneven"],
  tier: 1,
  description: "A cursed fighting pit dug around the roots of a hanging tree.",
  size: "cramped",
  zoneDef: { Corner: -4 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.1 }
};
var BRASS_RING = {
  id: "brass_ring",
  name: "The Brass Ring",
  tags: ["outdoor", "cramped", "uneven"],
  tier: 1,
  size: "cramped",
  description: "A tiny, brutal ring with uneven stones that penalize lunging and favor close-quarters brawling.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.1, riposteMod: 1 },
  startingZone: "Center"
};
var NARROW_BRIDGE = {
  id: "narrow_bridge",
  name: "The Narrow Bridge",
  tags: ["outdoor", "cramped", "elevated"],
  tier: 2,
  size: "cramped",
  description: "A dizzying span where low endurance fighters struggle to breathe and long weapons are useless.",
  zoneDef: { Edge: -5, Corner: -6 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.2, riposteMod: 0 },
  startingZone: "Center"
};
var MUDPIT_ARENA = {
  id: "mudpit_arena",
  name: "The Mudpit",
  tags: ["outdoor", "water"],
  tier: 1,
  size: "standard",
  description: "A sunken, rain-soaked arena. Footing is treacherous.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: -1 },
  startingZone: "Center"
};
var BLOODSANDS_ARENA = {
  id: "bloodsands_arena",
  name: "The Bloodsands",
  tags: ["outdoor", "open", "premium"],
  tier: 2,
  size: "standard",
  description: "The grand arena. Fine sand, firm and even footing \u2014 no surface favours any style.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 0 },
  startingZone: "Center"
};
var UNDERPIT_ARENA = {
  id: "underpit_arena",
  name: "The Underpit",
  tags: ["indoor", "cramped"],
  tier: 2,
  size: "cramped",
  description: "A torch-lit subterranean pit. Tight quarters favour close-range fighters.",
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -1 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: "Center"
};
var HIGHPLAIN_ARENA = {
  id: "highplain_arena",
  name: "The High Plain",
  tags: ["outdoor", "open"],
  tier: 2,
  size: "open",
  description: "A wind-swept highland plateau. Long sight lines and open ground favour reach weapons and fighters who want distance.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1, riposteMod: 0 },
  startingZone: "Center"
};
var LANTERN_HALL_ARENA = {
  id: "lantern_hall_arena",
  name: "The Lantern Hall",
  tags: ["indoor", "premium"],
  tier: 2,
  size: "standard",
  description: "A grand torch-lit hall with vaulted ceilings and raised galleries. The enclosed space lets fighters read each other clearly \u2014 counter-fighting styles thrive here.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 1 },
  startingZone: "Center"
};
var WALLED_COURT_ARENA = {
  id: "walled_court_arena",
  name: "The Walled Court",
  tags: ["outdoor", "cramped"],
  tier: 1,
  size: "cramped",
  description: "A tight stone courtyard hemmed in on all sides. Reach weapons are a liability here; the confined angles reward fighters who can counter and punish over-extension.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 1 },
  startingZone: "Center"
};
var CLIFFTOP_ARENA = {
  id: "clifftop_arena",
  name: "The Clifftop",
  tags: ["outdoor", "elevated"],
  tier: 3,
  size: "standard",
  description: "A stone platform carved into a high cliff face. Buffeting winds make initiative reads unreliable and push tired fighters toward the edge faster.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: "Center"
};
var FLOODED_VAULT_ARENA = {
  id: "flooded_vault_arena",
  name: "The Flooded Vault",
  tags: ["indoor", "water", "cramped"],
  tier: 3,
  size: "cramped",
  description: "A subterranean vault knee-deep in murky water. Cramped quarters and the gruelling drag of the water make this the most exhausting arena; only the hardiest survive deep into a fight.",
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -2 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.25, riposteMod: -1 },
  startingZone: "Center"
};
var SUNDERED_COLISEUM = {
  id: "sundered_coliseum",
  name: "The Sundered Coliseum",
  tags: ["outdoor", "uneven", "ruins"],
  tier: 2,
  size: "standard",
  description: "Ancient arena crumbling into disrepair. Uneven footing from broken flagstones punishes fast movers and favors careful footwork.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: -1 },
  startingZone: "Center"
};
var SUNKEN_TEMPLE = {
  id: "sunken_temple",
  name: "The Sunken Temple",
  tags: ["indoor", "water", "cramped", "uneven"],
  tier: 3,
  size: "cramped",
  description: "Flooded sanctuary with submerged altars. Treacherous footing in sacred waters exhausts even hardy fighters.",
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -2 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.2, riposteMod: -2 },
  startingZone: "Center"
};
var CRYSTAL_CAVERN = {
  id: "crystal_cavern",
  name: "The Crystal Cavern",
  tags: ["indoor", "cramped", "magical"],
  tier: 3,
  size: "cramped",
  description: "Luminescent crystal chamber. Echoes amplify ripostes; tight quarters favor grapplers and short weapons.",
  zoneDef: { Edge: -2, Corner: -3 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 0.95, riposteMod: 2 },
  startingZone: "Center"
};
var WHISPERING_GROVE = {
  id: "whispering_grove",
  name: "The Whispering Grove",
  tags: ["outdoor", "open", "uneven", "living"],
  tier: 2,
  size: "open",
  description: "Ancient grove with shifting root systems. Living forest watches and reacts to the battle, tangling the feet of lungers.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1, riposteMod: 1 },
  startingZone: "Center"
};
var CHARNEL_PITS = {
  id: "charnel_pits",
  name: "The Charnel Pits",
  tags: ["indoor", "cramped", "elevated", "cursed"],
  tier: 2,
  size: "cramped",
  description: "Arena built over mass graves. Blood stains the ancient stones; violence feels inevitable here, especially under a blood moon.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 0 },
  startingZone: "Center"
};
var FLESH_GARDENS = {
  id: "flesh_gardens",
  name: "The Flesh Gardens",
  tags: ["outdoor", "uneven", "living", "cursed"],
  tier: 3,
  size: "standard",
  description: "Twisted garden of carnivorous flora. The ground itself hungers; heavy-footed bashers crush thorns while nimble fighters risk entanglement.",
  zoneDef: { Edge: -2, Corner: -4, Obstacle: -3 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: 0 },
  startingZone: "Center"
};
var GUTTER_PIT = {
  id: "gutter_pit",
  name: "The Gutter Pit",
  tags: ["outdoor", "cramped", "uneven"],
  tier: 1,
  size: "cramped",
  description: "A miserable, uneven pit. Tight quarters and broken ground punish lungers and favor dirty fighting.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.1, riposteMod: 0 },
  startingZone: "Center"
};
var STORMTOP_TERRACE = {
  id: "stormtop_terrace",
  name: "Stormtop Terrace",
  tags: ["outdoor", "elevated", "open"],
  tier: 2,
  size: "open",
  description: "An open terrace high above the city. The thin air and open space heavily penalize low-endurance fighters.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.15, riposteMod: 0 },
  startingZone: "Center"
};
var GLACIAL_RIFT = {
  id: "glacial_rift",
  name: "The Glacial Rift",
  tags: ["outdoor", "cramped", "uneven"],
  tier: 2,
  size: "cramped",
  description: "A frozen, narrow crevasse where footing is treacherous and space is tight.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.1, riposteMod: 1 },
  startingZone: "Center"
};
var SKY_PLATFORM = {
  id: "sky_platform",
  name: "The Sky Platform",
  tags: ["outdoor", "elevated", "open"],
  tier: 3,
  size: "open",
  description: "A floating stone platform high above the clouds. Thin air and high winds challenge stamina and precision.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.2, riposteMod: 0 },
  startingZone: "Center"
};
var MISTY_VALLEY = {
  id: "misty_valley",
  name: "The Misty Valley",
  tags: ["outdoor", "open", "magical"],
  tier: 1,
  size: "open",
  description: "A wide valley filled with shifting, magically infused mists. Perfect for those who rely on reflexes over raw sight.",
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1, riposteMod: 2 },
  startingZone: "Center"
};
var THE_MEAT_GRINDER = {
  id: "the_meat_grinder",
  name: "The Meat Grinder",
  tags: ["cramped", "uneven", "outdoor", "cursed"],
  tier: 2,
  size: "cramped",
  description: "A terrifying, tight, uneven cursed pit.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.2, riposteMod: 1 },
  startingZone: "Center"
};
var JUNGLE_RUINS = {
  id: "jungle_ruins",
  zoneDef: { Edge: -1, Corner: -2 },
  name: "Jungle Ruins",
  description: "Ancient stonework reclaimed by aggressive flora.",
  tier: 2,
  size: "cramped",
  tags: ["cramped", "uneven", "outdoor", "ruins", "living"],
  surfaceMod: {
    initiativeMod: -1,
    riposteMod: 1,
    enduranceMult: 1.1
  }
};
var THE_ABYSSAL_PIT = {
  id: "the_abyssal_pit",
  name: "The Abyssal Pit",
  tags: ["indoor", "elevated", "magical", "cramped"],
  tier: 3,
  size: "cramped",
  description: "An elevated, magical indoor platform where space is tight.",
  zoneDef: { Edge: -4, Corner: -6 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.1, riposteMod: 2 },
  startingZone: "Center"
};
var THE_SUNKEN_VAULT = {
  id: "the_sunken_vault",
  name: "The Sunken Vault",
  tags: ["water", "indoor", "magical"],
  tier: 2,
  size: "cramped",
  description: "A submerged treasure room where ancient magic and knee-deep water slow movement.",
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: 1 }
};
var IRON_FORGE = {
  id: "iron_forge",
  name: "Iron Forge",
  tags: ["cramped", "indoor", "premium"],
  tier: 3,
  size: "cramped",
  description: "An intense, claustrophobic forge reserved for the elite. Sparks fly with every clash.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.3, riposteMod: 0 }
};
var THE_BRAMBLE_RING = {
  id: "the_bramble_ring",
  name: "The Bramble Ring",
  tags: ["cramped", "uneven", "outdoor", "living"],
  tier: 1,
  size: "cramped",
  description: "A tight clearing surrounded by dense, thorny overgrowth. Blood only encourages the roots.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.1 }
};
var THUNDER_PEAK = {
  id: "thunder_peak",
  name: "Thunder Peak",
  tags: ["open", "elevated", "outdoor"],
  tier: 3,
  size: "open",
  description: "Atop the highest jagged spire, thin air and sheer drops test the stamina and nerves of any fighter.",
  zoneDef: { Edge: -1, Corner: -5 },
  surfaceMod: { initiativeMod: 0, riposteMod: 0, enduranceMult: 1.25 }
};
var SUN_BAKED_PLATEAU = {
  id: "sun_baked_plateau",
  name: "Sun-Baked Plateau",
  tags: ["open", "elevated", "outdoor", "cursed"],
  tier: 2,
  size: "open",
  description: "A desolate, cursed high plateau bathed in relentless sunlight. Stamina is heavily tested.",
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: 0, riposteMod: 0, enduranceMult: 1.3 }
};
var ANCIENT_AQUEDUCT = {
  id: "ancient_aqueduct",
  name: "Ancient Aqueduct",
  tags: ["water", "ruins", "cramped"],
  tier: 1,
  size: "cramped",
  description: "Cramped, flooded stone corridors that punish long weapons and footwork.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 0, enduranceMult: 1.15 }
};
var FORGOTTEN_CRYPT = {
  id: "forgotten_crypt",
  name: "Forgotten Crypt",
  tags: ["indoor", "cramped", "cursed"],
  tier: 2,
  size: "cramped",
  description: "A subterranean burial chamber where the shadows seem to swallow the light, hiding fatal mistakes.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.1 }
};
var RUSTED_GORGE = {
  id: "rusted_gorge",
  name: "Rusted Gorge",
  tags: ["outdoor", "uneven", "open"],
  tier: 1,
  size: "open",
  description: "An ancient industrial trench filled with twisted scrap metal and treacherous, uneven terrain.",
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.2 }
};
var THE_ASYLUM = {
  id: "the_asylum",
  name: "The Asylum",
  tags: ["indoor", "cramped", "cursed"],
  tier: 2,
  size: "cramped",
  description: "A maddening enclosed space echoing with the screams of past victims. Stamina drains quickly.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.25 }
};
var VOLCANIC_CRATER = {
  id: "volcanic_crater",
  name: "Volcanic Crater",
  tags: ["outdoor", "elevated", "uneven", "living"],
  tier: 3,
  size: "open",
  description: "An unstable volcanic rim that occasionally spews ash and fire. Heat is unbearable.",
  zoneDef: { Edge: -2, Corner: -6 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.35 }
};
var THE_WAILING_CHASM = {
  id: "the_wailing_chasm",
  name: "The Wailing Chasm",
  tags: ["cramped", "uneven", "outdoor", "cursed"],
  tier: 2,
  size: "cramped",
  description: "A cursed, narrow chasm filled with wailing winds that distract the mind.",
  zoneDef: { Edge: -2, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 0, enduranceMult: 1.1 }
};
var SHATTERED_MONOLITH = {
  id: "shattered_monolith",
  name: "Shattered Monolith",
  tags: ["elevated", "ruins", "magical", "open"],
  tier: 3,
  size: "open",
  description: "An ancient, magical monolith fractured into floating, elevated platforms.",
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 0, riposteMod: 1, enduranceMult: 1 }
};
var VERDANT_LABYRINTH = {
  id: "verdant_labyrinth",
  name: "Verdant Labyrinth",
  tags: ["cramped", "living", "outdoor", "water"],
  tier: 2,
  size: "cramped",
  description: "A flooded, living labyrinth of vines and roots that actively grabs at fighters.",
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.2 }
};
[
  STANDARD_ARENA,
  MUDPIT_ARENA,
  BLOODSANDS_ARENA,
  UNDERPIT_ARENA,
  HIGHPLAIN_ARENA,
  LANTERN_HALL_ARENA,
  WALLED_COURT_ARENA,
  CLIFFTOP_ARENA,
  FLOODED_VAULT_ARENA,
  SUNDERED_COLISEUM,
  SUNKEN_TEMPLE,
  CRYSTAL_CAVERN,
  WHISPERING_GROVE,
  CHARNEL_PITS,
  FLESH_GARDENS,
  GUTTER_PIT,
  STORMTOP_TERRACE,
  GLACIAL_RIFT,
  SKY_PLATFORM,
  MISTY_VALLEY,
  BRASS_RING,
  NARROW_BRIDGE,
  THE_MEAT_GRINDER,
  THE_ABYSSAL_PIT,
  JUNGLE_RUINS,
  THE_BRAMBLE_RING,
  THUNDER_PEAK,
  SUN_BAKED_PLATEAU,
  ANCIENT_AQUEDUCT,
  THE_SUNKEN_VAULT,
  IRON_FORGE,
  MIST_SHROUDED_RUINS,
  THE_GALLOWS_TREE,
  FORGOTTEN_CRYPT,
  RUSTED_GORGE,
  THE_ASYLUM,
  VOLCANIC_CRATER,
  THE_WAILING_CHASM,
  SHATTERED_MONOLITH,
  VERDANT_LABYRINTH
].forEach(registerArena);

// src/engine/combat/mechanics/combatMath.ts
function skillCheck(rng, skill, modifier = 0) {
  const roll = Math.floor(rng() * 20) + 1;
  const target = clamp(Math.floor(skill) + modifier, 1, 19);
  const success = roll === 1 || roll !== 20 && roll <= target;
  return success;
}
function contestCheck(rng, a, d, modA = 0, modD = 0) {
  const rollA = Math.floor(rng() * 20) + 1 + a + modA;
  const rollD = Math.floor(rng() * 20) + 1 + d + modD;
  return rollA > rollD;
}

// src/engine/combat/mechanics/distanceResolution.ts
var ARENA_SIZE_PROFILES = {
  cramped: { startRange: "Tight", maxRange: "Striking", zoneStepBias: 1 },
  standard: { startRange: "Striking", maxRange: "Extended", zoneStepBias: 0 },
  open: { startRange: "Striking", maxRange: "Extended", zoneStepBias: 0 }
};
var WEAPON_PREFERRED_RANGE = {
  fist: "Tight",
  dagger: "Tight",
  short_sword: "Tight",
  mace: "Tight",
  hatchet: "Tight",
  war_hammer: "Tight",
  broadsword: "Striking",
  longsword: "Striking",
  scimitar: "Striking",
  battle_axe: "Striking",
  morning_star: "Striking",
  war_flail: "Striking",
  epee: "Striking",
  halberd: "Extended",
  greatsword: "Extended",
  great_axe: "Extended",
  short_spear: "Extended",
  long_spear: "Extended",
  maul: "Extended",
  quarterstaff: "Extended"
};
function getWeaponPreferredRange(weaponId) {
  if (!weaponId)
    return "Striking";
  return WEAPON_PREFERRED_RANGE[weaponId] ?? "Striking";
}
var WEAPON_RANGE_MODIFIERS = {
  fist: { Grapple: 4, Tight: 3, Striking: -2, Extended: -7 },
  dagger: { Grapple: 3, Tight: 4, Striking: 0, Extended: -5 },
  short_sword: { Grapple: 2, Tight: 4, Striking: 0, Extended: -4 },
  mace: { Grapple: -1, Tight: 3, Striking: 0, Extended: -2 },
  hatchet: { Grapple: 0, Tight: 3, Striking: 0, Extended: -3 },
  broadsword: { Grapple: -3, Tight: 0, Striking: 0, Extended: -1 },
  longsword: { Grapple: -4, Tight: -1, Striking: 0, Extended: 2 },
  scimitar: { Grapple: -2, Tight: -1, Striking: 0, Extended: -1 },
  battle_axe: { Grapple: -5, Tight: -2, Striking: 0, Extended: 1 },
  morning_star: { Grapple: -3, Tight: -1, Striking: 0, Extended: 1 },
  war_flail: { Grapple: -2, Tight: 0, Striking: 0, Extended: 2 },
  epee: { Grapple: -2, Tight: 0, Striking: 1, Extended: 0 },
  short_spear: { Grapple: -4, Tight: -2, Striking: 0, Extended: 3 },
  long_spear: { Grapple: -5, Tight: -3, Striking: 0, Extended: 4 },
  war_hammer: { Grapple: -2, Tight: 2, Striking: 0, Extended: -3 },
  halberd: { Grapple: -7, Tight: -4, Striking: 0, Extended: 4 },
  greatsword: { Grapple: -6, Tight: -3, Striking: 0, Extended: 3 },
  great_axe: { Grapple: -6, Tight: -3, Striking: 0, Extended: 3 },
  maul: { Grapple: -6, Tight: -3, Striking: 0, Extended: 2 },
  quarterstaff: { Grapple: -2, Tight: -1, Striking: 1, Extended: 2 }
};
function getWeaponRangeMod(weaponId, range) {
  if (!weaponId)
    return 0;
  const mods = WEAPON_RANGE_MODIFIERS[weaponId];
  if (!mods)
    return 0;
  return mods[range] ?? 0;
}
function computeReachScore(ini, OE, motivationBonus, recoveryDebt) {
  return ini + (OE - 5) * 2 + motivationBonus - recoveryDebt * 2;
}
function contestDistance(rng, fA, fD, OE_A, OE_D, currentRange, sizeProfile) {
  const events = [];
  const profile = sizeProfile ?? ARENA_SIZE_PROFILES["standard"];
  const prefA = fA.activePlan.rangePreference ?? getWeaponPreferredRange(fA.weaponId);
  const prefD = fD.activePlan.rangePreference ?? getWeaponPreferredRange(fD.weaponId);
  const prefABeyondCap = RANGE_ORDER.indexOf(prefA) > RANGE_ORDER.indexOf(profile.maxRange);
  const prefDBeyondCap = RANGE_ORDER.indexOf(prefD) > RANGE_ORDER.indexOf(profile.maxRange);
  const rawMotA = prefA !== currentRange ? 2 : 0;
  const rawMotD = prefD !== currentRange ? 2 : 0;
  const motA = prefABeyondCap ? Math.floor(rawMotA / 2) : rawMotA;
  const motD = prefDBeyondCap ? Math.floor(rawMotD / 2) : rawMotD;
  const reachA = computeReachScore(fA.skills.INI, OE_A, motA, fA.recoveryDebt);
  const reachD = computeReachScore(fD.skills.INI, OE_D, motD, fD.recoveryDebt);
  const aWins = contestCheck(rng, reachA, reachD);
  const winner = aWins ? "A" : "D";
  const winnerPref = aWins ? prefA : prefD;
  const shifted = shiftRangeToward(currentRange, winnerPref);
  const newRange = clampRangeToMax(shifted, profile.maxRange);
  if (newRange !== currentRange) {
    events.push({ type: "RANGE_SHIFT", actor: winner, result: newRange });
  }
  return {
    distanceWinner: winner,
    rangeModA: aWins ? 1 : -1,
    rangeModD: aWins ? -1 : 1,
    newRange,
    events
  };
}
var RANGE_ORDER = ["Grapple", "Tight", "Striking", "Extended"];
function shiftRangeToward(current, target) {
  const ci = RANGE_ORDER.indexOf(current);
  const ti = RANGE_ORDER.indexOf(target);
  if (ci === ti)
    return current;
  return RANGE_ORDER[ci + (ti > ci ? 1 : -1)] ?? current;
}
function clampRangeToMax(range, maxRange) {
  const ri = RANGE_ORDER.indexOf(range);
  const mi = RANGE_ORDER.indexOf(maxRange);
  return ri > mi ? maxRange : range;
}
function getZonePenalty(zone, arenaConfig) {
  if (zone === "Center")
    return 0;
  return arenaConfig.zoneDef[zone] ?? 0;
}
function transitionZone(current) {
  switch (current) {
    case "Center":
      return "Edge";
    case "Edge":
      return "Corner";
    case "Corner":
      return "Corner";
    case "Obstacle":
      return "Obstacle";
  }
}
function resetZone(current) {
  switch (current) {
    case "Corner":
      return "Edge";
    case "Edge":
      return "Center";
    default:
      return current;
  }
}

// src/engine/simulate/initialization.ts
var CROWD_KILL_BONUS = {
  Calm: 0,
  Bloodthirsty: 0.004,
  Theatrical: 0,
  Solemn: -0.002,
  Festive: 0
};
function initializeRng(providedRng) {
  let rngService;
  let seed;
  if (providedRng && typeof providedRng === "object") {
    rngService = providedRng;
    seed = Math.floor(rngService.next() * 2147483647);
  } else {
    seed = typeof providedRng === "number" ? providedRng : crypto.getRandomValues(new Uint32Array(1))[0];
    rngService = new SeededRNGService(seed);
  }
  const rng = () => rngService.next();
  return { rngService, rng, seed };
}
function initializeFighters(planA, planD, warriorA, warriorD, trainers, weather = "Clear", arenaId = "standard_arena") {
  const arena = getArenaById(arenaId);
  const effectiveWeather = resolveEffectiveWeather(weather, arena.tags);
  const fA = createFighterState("A", planA, warriorA, trainers);
  const fD = createFighterState("D", planD, warriorD, trainers);
  if (effectiveWeather === "Blood Moon") {
    fA.plan = { ...fA.plan, killDesire: Math.min(10, (fA.plan.killDesire ?? 5) + 3) };
    fD.plan = { ...fD.plan, killDesire: Math.min(10, (fD.plan.killDesire ?? 5) + 3) };
  }
  return { fA, fD, effectiveWeather };
}
function initializeResolutionContext(planA, planD, effectiveWeather, warriorA, warriorD, trainers, arenaId = "standard_arena", crowdMood) {
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;
  const modsA = trainers ? getTrainerMods2(trainers, planA.style) : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };
  const modsD = trainers ? getTrainerMods2(trainers, planD.style) : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };
  const weaponReqA = checkWeaponRequirements(weaponA, warriorA?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 });
  const weaponReqD = checkWeaponRequirements(weaponD, warriorD?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 });
  const arenaConfig = getArenaById(arenaId);
  return {
    rng: () => 0,
    phase: "OPENING",
    exchange: 0,
    weather: effectiveWeather,
    weatherEffect: getWeatherEffect(effectiveWeather),
    matchupA: getMatchupBonus(planA.style, planD.style),
    matchupD: getMatchupBonus(planD.style, planA.style),
    trainerModsA: modsA,
    trainerModsD: modsD,
    trainers: trainers ?? [],
    weaponReqA: {
      endurancePenalty: weaponReqA.endurancePenalty,
      attPenalty: weaponReqA.attPenalty
    },
    weaponReqD: {
      endurancePenalty: weaponReqD.endurancePenalty,
      attPenalty: weaponReqD.attPenalty
    },
    tacticStreakA: 0,
    tacticStreakD: 0,
    range: ARENA_SIZE_PROFILES[arenaConfig.size].startRange,
    zone: arenaConfig.startingZone ?? "Center",
    arenaConfig,
    surfaceMod: arenaConfig.surfaceMod,
    maxRange: ARENA_SIZE_PROFILES[arenaConfig.size].maxRange,
    zoneStepBias: ARENA_SIZE_PROFILES[arenaConfig.size].zoneStepBias,
    pushedFighter: undefined,
    crowdKillBonus: crowdMood ? CROWD_KILL_BONUS[crowdMood] : 0
  };
}

// src/engine/tacticSuitability.ts
var OFFENSIVE_MATRIX = {
  ["AIMED BLOW" /* AimedBlow */]: { Lunge: "WS", Slash: "WS", Bash: "WS", Decisiveness: "U" },
  ["BASHING ATTACK" /* BashingAttack */]: { Lunge: "U", Slash: "U", Bash: "WS", Decisiveness: "WS" },
  ["LUNGING ATTACK" /* LungingAttack */]: { Lunge: "WS", Slash: "U", Bash: "U", Decisiveness: "S" },
  ["PARRY-LUNGE" /* ParryLunge */]: { Lunge: "WS", Slash: "U", Bash: "U", Decisiveness: "U" },
  ["PARRY-RIPOSTE" /* ParryRiposte */]: { Lunge: "WS", Slash: "U", Bash: "U", Decisiveness: "U" },
  ["PARRY-STRIKE" /* ParryStrike */]: { Lunge: "U", Slash: "U", Bash: "U", Decisiveness: "WS" },
  ["SLASHING ATTACK" /* SlashingAttack */]: { Lunge: "U", Slash: "WS", Bash: "U", Decisiveness: "S" },
  ["STRIKING ATTACK" /* StrikingAttack */]: { Lunge: "WS", Slash: "WS", Bash: "WS", Decisiveness: "WS" },
  ["TOTAL PARRY" /* TotalParry */]: { Lunge: "U", Slash: "U", Bash: "U", Decisiveness: "U" },
  ["WALL OF STEEL" /* WallOfSteel */]: { Lunge: "U", Slash: "WS", Bash: "WS", Decisiveness: "U" }
};
var DEFENSIVE_MATRIX = {
  ["AIMED BLOW" /* AimedBlow */]: { Dodge: "WS", Parry: "U", Riposte: "WS", Responsiveness: "U" },
  ["BASHING ATTACK" /* BashingAttack */]: { Dodge: "U", Parry: "U", Riposte: "U", Responsiveness: "U" },
  ["LUNGING ATTACK" /* LungingAttack */]: { Dodge: "WS", Parry: "U", Riposte: "WS", Responsiveness: "U" },
  ["PARRY-LUNGE" /* ParryLunge */]: { Dodge: "WS", Parry: "WS", Riposte: "S", Responsiveness: "U" },
  ["PARRY-RIPOSTE" /* ParryRiposte */]: { Dodge: "U", Parry: "WS", Riposte: "WS", Responsiveness: "U" },
  ["PARRY-STRIKE" /* ParryStrike */]: { Dodge: "WS", Parry: "WS", Riposte: "WS", Responsiveness: "WS" },
  ["SLASHING ATTACK" /* SlashingAttack */]: { Dodge: "U", Parry: "U", Riposte: "U", Responsiveness: "U" },
  ["STRIKING ATTACK" /* StrikingAttack */]: { Dodge: "U", Parry: "U", Riposte: "S", Responsiveness: "WS" },
  ["TOTAL PARRY" /* TotalParry */]: { Dodge: "WS", Parry: "WS", Riposte: "WS", Responsiveness: "WS" },
  ["WALL OF STEEL" /* WallOfSteel */]: { Dodge: "U", Parry: "WS", Riposte: "WS", Responsiveness: "U" }
};
function getOffensiveSuitability(style, tactic) {
  if (tactic === "none")
    return "WS";
  return OFFENSIVE_MATRIX[style]?.[tactic] ?? "S";
}
function getDefensiveSuitability(style, tactic) {
  if (tactic === "none")
    return "WS";
  return DEFENSIVE_MATRIX[style]?.[tactic] ?? "S";
}
function suitabilityMultiplier(rating) {
  const multipliers = {
    WS: 1,
    S: 0.6,
    U: 0.3
  };
  return multipliers[rating];
}

// src/engine/combat/mechanics/tacticResolution.ts
function oeAttMod(oe, style) {
  const isAggressive = style === "BASHING ATTACK" /* BashingAttack */ || style === "SLASHING ATTACK" /* SlashingAttack */ || style === "STRIKING ATTACK" /* StrikingAttack */;
  const base = Math.floor((oe - 5) * OE_ATT_SCALING);
  return isAggressive ? base + 1 : base;
}
function oeDefMod(oe) {
  if (oe <= 5)
    return Math.floor((5 - oe) * OE_DEF_SCALING);
  return -Math.floor((oe - 5) * OE_DEF_SCALING);
}
function alIniMod(al) {
  return Math.floor((al - 5) * AL_INI_SCALING);
}
var ZERO_OFF = {
  attBonus: 0,
  dmgBonus: 0,
  defPenalty: 0,
  endCost: 0,
  decBonus: 0,
  parryBypass: 0
};
var OFFENSIVE_TACTIC_MAP = {
  Lunge: (mult) => ({
    attBonus: Math.round(2 * mult),
    dmgBonus: 0,
    defPenalty: Math.round(1 * mult),
    endCost: 2,
    decBonus: 0,
    parryBypass: 0
  }),
  Slash: (mult) => ({
    attBonus: 0,
    dmgBonus: Math.round(2 * mult),
    defPenalty: 0,
    endCost: 1,
    decBonus: 0,
    parryBypass: Math.round(2 * mult)
  }),
  Bash: (mult) => ({
    attBonus: Math.round(1 * mult),
    dmgBonus: Math.round(1 * mult),
    defPenalty: Math.round(2 * mult),
    endCost: 2,
    decBonus: 0,
    parryBypass: Math.round(4 * mult)
  }),
  Decisiveness: (mult) => ({
    attBonus: 0,
    dmgBonus: 0,
    defPenalty: 0,
    endCost: 1,
    decBonus: Math.round(3 * mult),
    parryBypass: 0
  })
};
function getOffensiveTacticMods(tactic, style) {
  if (!tactic || tactic === "none")
    return ZERO_OFF;
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  return (OFFENSIVE_TACTIC_MAP[tactic] ?? (() => ZERO_OFF))(mult);
}
var ZERO_DEF = { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };
var DEFENSIVE_TACTIC_MAP = {
  Parry: (mult) => ({
    parBonus: Math.round(3 * mult),
    defBonus: 0,
    ripBonus: -Math.round(1 * mult),
    iniBonus: 0
  }),
  Dodge: (mult) => ({
    parBonus: -Math.round(1 * mult),
    defBonus: Math.round(3 * mult),
    ripBonus: 0,
    iniBonus: 0
  }),
  Riposte: (mult) => ({
    parBonus: Math.round(1 * mult),
    defBonus: 0,
    ripBonus: Math.round(3 * mult),
    iniBonus: 0
  }),
  Responsiveness: (mult) => ({
    parBonus: 0,
    defBonus: 0,
    ripBonus: 0,
    iniBonus: Math.round(2 * mult)
  })
};
function getDefensiveTacticMods(tactic, style) {
  if (!tactic || tactic === "none")
    return ZERO_DEF;
  const mult = suitabilityMultiplier(getDefensiveSuitability(style, tactic));
  return (DEFENSIVE_TACTIC_MAP[tactic] ?? (() => ZERO_DEF))(mult);
}
function calculateFinalOEAL(effOE, effAL, plan, hp, maxHp, end, maxEnd, exchange) {
  let openOE = 0, openAL = 0;
  if (exchange < 3) {
    if (plan.openingMove === "Aggressive") {
      openOE = 1;
      openAL = 1;
    } else if (plan.openingMove === "Safe") {
      openOE = -1;
      openAL = -1;
    }
  }
  let fallOE = 0, fallAL = 0;
  if (plan.fallbackCondition === "FLEE" && hp < maxHp * 0.3) {
    fallOE = -3;
    fallAL = -3;
  } else if (plan.fallbackCondition === "TURTLE" && end < maxEnd * 0.3) {
    fallOE = -4;
    fallAL = 2;
  } else if (plan.fallbackCondition === "BERZERK" && hp < maxHp * 0.3) {
    fallOE = 4;
    fallAL = -2;
  }
  const finalOE = clamp(effOE + openOE + fallOE, 1, 10);
  const finalAL = clamp(effAL + openAL + fallAL, 1, 10);
  return [finalOE, finalAL];
}

// src/engine/combat/resolution/exchangeHelpers/checks/attackCheck.ts
function performAttackCheck(rng, att, curAttOE, matchup, fat, curOffMods, curPass, curAntiSyn, curBiasAtt, overAtt, curAttWepReq, extraBonus = 0) {
  const commitBonus = att.committed ? 10 : 0;
  return skillCheck(rng, att.skills.ATT, oeAttMod(curAttOE, att.style) + matchup + fat + curOffMods.attBonus + curPass.attBonus + Math.round((curAntiSyn.offMult - 1) * 5) + INITIATIVE_PRESS_BONUS + GLOBAL_ATT_BONUS + curBiasAtt - overAtt - att.armHits + curAttWepReq.attPenalty + extraBonus + commitBonus);
}
// src/engine/combat/resolution/exchangeHelpers/checks/riposteCheck.ts
function performRiposteCheck(rng, def, matchup, fat, penaltyOrBonus, curPass, curAntiSynDef) {
  const antiSyn = curAntiSynDef ? Math.round((curAntiSynDef.defMult - 1) * 3) : 0;
  return skillCheck(rng, def.skills.RIP, matchup + fat + penaltyOrBonus + curPass.ripBonus + antiSyn);
}
// src/engine/combat/resolution/exchangeHelpers/checks/defenseCheck.ts
function performDefenseCheck(rng, def, curDefOE, matchup, fat, curDefMods, curPassD, curBiasDef, overDef, isDodge, curAntiSynDef, curOffMods, ctx, attacker, extraDefPenalty = 0) {
  const commitPenalty = attacker?.committed ? 15 : 0;
  if (isDodge) {
    const success = skillCheck(rng, def.skills.DEF, oeDefMod(curDefOE) + matchup + fat + curDefMods.defBonus + curPassD.defBonus + curBiasDef - overDef - def.legHits + commitPenalty - extraDefPenalty);
    return { success, type: "DODGE" };
  } else {
    const riposteMod = ctx?.weatherEffect?.riposteMod ?? 0;
    const success = skillCheck(rng, def.skills.PAR, oeDefMod(curDefOE) + matchup + fat + curDefMods.parBonus + curPassD.parBonus + Math.round((curAntiSynDef.defMult - 1) * 3) - curOffMods.defPenalty - curOffMods.parryBypass + GLOBAL_PAR_PENALTY + curBiasDef - overDef - def.armHits + commitPenalty + riposteMod - extraDefPenalty);
    return { success, type: "PARRY" };
  }
}
// src/engine/combat/mechanics/hitLocation.ts
var HIT_LOCATIONS = [
  "head",
  "chest",
  "abdomen",
  "right arm",
  "left arm",
  "right leg",
  "left leg"
];
var TARGET_HIT_CHANCE = 0.7;
var TARGET_MISS_CHANCE = 0.3;
var LOCATION_DAMAGE_MULT = {
  head: 1.5,
  chest: 1.2,
  abdomen: 1.1,
  "right arm": 1,
  "left arm": 1,
  "right leg": 1,
  "left leg": 1
};
var LOCATION_KILL_MULT = {
  head: 6,
  chest: 3.5,
  abdomen: 3.5,
  "right arm": 0.1,
  "left arm": 0.1,
  "right leg": 0.1,
  "left leg": 0.1
};
function protectCovers(protect) {
  if (!protect || protect === "Any" || protect === "none_armor" || protect === "none_helm")
    return [];
  const p = protect.toLowerCase();
  if (p.includes("helm") || p.includes("cap") || p === "head")
    return ["head"];
  if (p === "leather" || p === "padded" || p === "studded_leather" || p.includes("armor") || p.includes("mail") || p === "body")
    return ["chest", "abdomen"];
  if (p === "arms")
    return ["right arm", "left arm"];
  if (p === "legs")
    return ["right leg", "left leg"];
  return [];
}
function rollHitLocation(rng, target, protect) {
  const covered = protectCovers(protect);
  if (target && target !== "Any") {
    const t = target.toLowerCase();
    if (HIT_LOCATIONS.includes(t)) {
      const hitChance = covered.includes(t) ? TARGET_MISS_CHANCE : TARGET_HIT_CHANCE;
      if (rng() < hitChance)
        return t;
    }
  }
  if (rng() < 0.3) {
    const exposed = HIT_LOCATIONS.filter((l) => !covered.includes(l));
    if (exposed.length > 0) {
      const pick2 = exposed[Math.floor(rng() * exposed.length)];
      if (pick2)
        return pick2;
    }
  }
  const pick = HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
  return pick ?? "chest";
}
// src/engine/combat/mechanics/weaponArmor.ts
var WEAPON_DAMAGE_TYPE = {
  dagger: "pierce",
  epee: "pierce",
  short_spear: "pierce",
  long_spear: "pierce",
  hatchet: "slash",
  short_sword: "slash",
  scimitar: "slash",
  longsword: "slash",
  battle_axe: "slash",
  broadsword: "slash",
  greatsword: "slash",
  great_axe: "slash",
  fist: "bash",
  mace: "bash",
  war_hammer: "bash",
  morning_star: "bash",
  war_flail: "bash",
  maul: "bash",
  halberd: "bash",
  quarterstaff: "bash",
  small_shield: "none",
  medium_shield: "none",
  large_shield: "none"
};
var ARMOR_TYPE_MULT = {
  none_armor: {},
  padded: { bash: 0.9, pierce: 1.05 },
  leather: { slash: 0.9, pierce: 1.05 },
  studded_leather: { slash: 0.88, pierce: 1.05 },
  ring_mail: { slash: 0.9, pierce: 0.9, bash: 1.1 },
  scale_mail: { slash: 0.8, pierce: 1.15 },
  chain_mail: { pierce: 0.8, slash: 1.1 },
  plate_mail: { slash: 0.85, bash: 0.85, pierce: 0.85 },
  plate_armor: { slash: 0.8, bash: 0.8, pierce: 0.8 }
};
function applyArmorTypeMod(damage, weaponId, armorId) {
  if (!weaponId || !armorId)
    return damage;
  const dtype = WEAPON_DAMAGE_TYPE[weaponId];
  if (!dtype || dtype === "none")
    return damage;
  const mult = ARMOR_TYPE_MULT[armorId]?.[dtype] ?? 1;
  return Math.round(damage * mult);
}
function applyFlatMitigation(damage, armorId, helmId) {
  if (damage <= 0)
    return 0;
  const armorItem = armorId ? getItemById(armorId) : undefined;
  const helmItem = helmId ? getItemById(helmId) : undefined;
  const totalMitigation = (armorItem?.mitigation ?? 0) + (helmItem?.mitigation ?? 0);
  return Math.max(1, damage - totalMitigation);
}
// src/engine/combat/mechanics/protectShield.ts
var PROTECT_DAMAGE_REDUCTION = 0.75;
var PROTECT_DAMAGE_PENALTY = 1.1;
function applyProtectMod(damage, location, protect) {
  const covered = protectCovers(protect);
  if (covered.includes(location)) {
    return Math.floor(damage * PROTECT_DAMAGE_REDUCTION);
  }
  return Math.floor(damage * PROTECT_DAMAGE_PENALTY);
}
var SHIELD_ZONE_LOCATIONS = {
  LOW: ["right leg", "left leg"],
  MEDIUM: ["chest", "abdomen", "right arm", "left arm"],
  HIGH: ["head", "chest", "right arm", "left arm"]
};
var SHIELD_ZONE_MITIGATION = {
  LOW: 0.92,
  MEDIUM: 0.88,
  HIGH: 0.85
};
function applyShieldZoneMod(damage, location, coverage) {
  if (!coverage)
    return damage;
  const zones = SHIELD_ZONE_LOCATIONS[coverage];
  if (!zones.includes(location))
    return damage;
  return Math.floor(damage * SHIELD_ZONE_MITIGATION[coverage]);
}
// src/engine/combat/mechanics/damageCalc.ts
var DAMAGE_BASE_MIN = 4;
var DAMAGE_VARIANCE_MIN = 0.7;
var DAMAGE_VARIANCE_MAX = 1.3;
function computeHitDamage(rng, damageClass, location) {
  const base = damageClass + DAMAGE_BASE_MIN;
  const locMult = LOCATION_DAMAGE_MULT[location] ?? 1;
  const variance = DAMAGE_VARIANCE_MIN + rng() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  return Math.max(1, Math.round(base * locMult * variance));
}
function calculateKillWindow(hpRatio, enduranceRatio, location, killDesire, phaseLevel, attOE = 5, attAL = 5, matchupBonus = 0, decSkill = 10, momentum = 0, specialtyBonus = 0, crowdKillBonus = 0) {
  if (momentum < 0)
    return 0;
  let threshold = 0.012;
  if (hpRatio < 0.3)
    threshold += 0.004;
  else if (hpRatio < 0.5)
    threshold += 0.001;
  if (enduranceRatio < 0.2)
    threshold += 0.006;
  else if (enduranceRatio < KILL_WINDOW_ENDURANCE)
    threshold += 0.003;
  else if (enduranceRatio < 0.6)
    threshold += 0.001;
  const locMult = LOCATION_KILL_MULT[location] ?? 1;
  threshold *= locMult;
  threshold += (attOE + attAL - 10) * 0.00025;
  threshold += matchupBonus * 0.001;
  threshold += (killDesire - 5) * 0.002;
  threshold += (decSkill - 10) * 0.0003;
  threshold += phaseLevel * 0.0015;
  if (momentum >= 3)
    threshold += 0.0075;
  else if (momentum >= 2)
    threshold += 0.004;
  threshold += specialtyBonus;
  threshold += crowdKillBonus;
  return clamp(threshold, 0, 0.04);
}
// src/engine/weaponSuitability.ts
var S3 = FightingStyle;
var COLUMN_ORDER = [
  S3.AimedBlow,
  S3.BashingAttack,
  S3.LungingAttack,
  S3.ParryLunge,
  S3.ParryRiposte,
  S3.ParryStrike,
  S3.StrikingAttack,
  S3.SlashingAttack,
  S3.TotalParry,
  S3.WallOfSteel
];
var RAW_ROWS = {
  fist: ["W", "W", "U", "U", "U", "W", "W", "U", "U", "U"],
  dagger: ["W", "U", "M", "U", "U", "W", "W", "M", "W", "U"],
  short_sword: ["W", "U", "W", "W", "W", "CW", "W", "W", "W", "U"],
  hatchet: ["M", "U", "U", "U", "W", "W", "W", "W", "W", "U"],
  epee: ["W", "U", "W", "W", "CW", "W", "W", "W", "W", "U"],
  scimitar: ["W", "U", "M", "W", "W", "W", "W", "CW", "W", "W"],
  short_spear: ["W", "U", "CW", "W", "W", "W", "W", "U", "M", "U"],
  longsword: ["W", "U", "W", "CW", "W", "W", "W", "W", "W", "U"],
  broadsword: ["M", "M", "U", "M", "U", "W", "CW", "W", "W", "W"],
  quarterstaff: ["CW", "W", "U", "U", "U", "W", "W", "U", "W", "W"],
  long_spear: ["W", "U", "W", "W", "W", "W", "W", "U", "W", "U"],
  war_hammer: ["U", "W", "U", "U", "U", "W", "W", "U", "W", "U"],
  mace: ["U", "CW", "U", "U", "U", "M", "W", "U", "M", "U"],
  war_flail: ["U", "W", "U", "U", "U", "M", "W", "U", "U", "W"],
  morning_star: ["U", "W", "U", "U", "U", "M", "W", "U", "U", "CW"],
  great_axe: ["U", "W", "U", "U", "U", "U", "W", "W", "U", "W"],
  battle_axe: ["U", "M", "U", "U", "U", "W", "W", "W", "W", "W"],
  greatsword: ["U", "W", "U", "U", "U", "W", "W", "M", "W", "W"],
  maul: ["U", "W", "U", "U", "U", "U", "W", "U", "U", "U"],
  halberd: ["U", "W", "M", "U", "U", "U", "W", "U", "U", "U"],
  small_shield: ["M", "M", "M", "W", "W", "W", "M", "M", "M", "M"],
  medium_shield: ["U", "M", "M", "M", "M", "W", "M", "M", "CW", "W"],
  large_shield: ["U", "M", "U", "M", "M", "M", "M", "U", "CW", "M"]
};
var WEAPON_STYLE_SUITABILITY = Object.fromEntries(Object.entries(RAW_ROWS).map(([weaponId, row]) => [
  weaponId,
  Object.fromEntries(COLUMN_ORDER.map((style, i) => [style, row[i]]))
]));
function getWeaponSuitability(weaponId, style) {
  if (!weaponId)
    return "M";
  return WEAPON_STYLE_SUITABILITY[weaponId]?.[style] ?? "M";
}
function weaponSuitabilityDamageMod(rating) {
  return rating === "CW" ? 1 : rating === "W" ? 0 : rating === "M" ? -1 : -2;
}

// src/engine/combat/mechanics/weaponStats.ts
var WEAPON_BY_ID = new Map;
for (const w of WEAPONS) {
  WEAPON_BY_ID.set(w.id, w);
}
function weaponDamageBonus(weaponId, style) {
  if (!weaponId)
    return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w)
    return 0;
  const heft = Math.round((w.weight - 3) * 0.8);
  const suitability = style ? weaponSuitabilityDamageMod(getWeaponSuitability(weaponId, style)) : 0;
  return heft + suitability;
}
function getWeaponInitiativeMod(weaponId) {
  if (!weaponId)
    return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w)
    return 0;
  return -Math.round((w.weight - 3) * 0.5);
}

// src/engine/combat/resolution/exchangeHelpers/execution/riposteExecution.ts
function executeRiposte(events, rng, attacker, defender, defTactics, defPassive, attLabel, defLabel, specialtyRiposteMult = 1, extraDmg = 0) {
  const ripLoc = rollHitLocation(rng, defTactics.target, attacker.activePlan.protect);
  let ripDmgRaw = computeHitDamage(rng, defender.derived.damage + defPassive.dmgBonus + weaponDamageBonus(defender.weaponId, defender.style), ripLoc);
  ripDmgRaw = applyArmorTypeMod(ripDmgRaw, defender.weaponId, attacker.armorId);
  ripDmgRaw = applyFlatMitigation(ripDmgRaw, attacker.armorId, attacker.helmId);
  ripDmgRaw = Math.round(ripDmgRaw * specialtyRiposteMult);
  const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.activePlan.protect) + Math.round(extraDmg);
  events.push({ type: "DEFENSE", actor: defLabel, result: "RIPOSTE" });
  events.push({ type: "HIT", actor: defLabel, target: attLabel, location: ripLoc, value: ripDmg });
  attacker.hp -= ripDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  defender.ripostes++;
  defender.consecutiveHits++;
  attacker.consecutiveHits = 0;
  const prevDefMom = defender.momentum;
  const prevAttMom = attacker.momentum;
  defender.momentum = Math.min(MOMENTUM_CAP, defender.momentum + 1);
  attacker.momentum = Math.max(MOMENTUM_FLOOR, attacker.momentum - 1);
  if (defender.momentum !== prevDefMom || attacker.momentum !== prevAttMom) {
    events.push({
      type: "MOMENTUM_SHIFT",
      actor: defLabel,
      target: attLabel,
      value: defender.momentum,
      metadata: { prev: prevDefMom, oppPrev: prevAttMom, oppNew: attacker.momentum }
    });
  }
}
// src/engine/stylePassives/identity.ts
var STYLE_IDENTITY = {
  ["AIMED BLOW" /* AimedBlow */]: {
    voice: "Surgical",
    attackFreq: "Sparing",
    killBias: "Methodical",
    fatigueBurn: "Low",
    tagline: "patient surgeon of the arena"
  },
  ["BASHING ATTACK" /* BashingAttack */]: {
    voice: "Brutal",
    attackFreq: "Relentless",
    killBias: "Savage",
    fatigueBurn: "Moderate",
    tagline: "wall-breaker with the weight of a storm"
  },
  ["LUNGING ATTACK" /* LungingAttack */]: {
    voice: "Explosive",
    attackFreq: "Measured",
    killBias: "Opportunistic",
    fatigueBurn: "High",
    tagline: "sudden-strike specialist"
  },
  ["PARRY-LUNGE" /* ParryLunge */]: {
    voice: "Cunning",
    attackFreq: "Measured",
    killBias: "Opportunistic",
    fatigueBurn: "Moderate",
    tagline: "counter-strike technician"
  },
  ["PARRY-RIPOSTE" /* ParryRiposte */]: {
    voice: "Fortified",
    attackFreq: "Sparing",
    killBias: "Methodical",
    fatigueBurn: "Low",
    tagline: "iron bulwark, waiting for the error"
  },
  ["PARRY-STRIKE" /* ParryStrike */]: {
    voice: "Cunning",
    attackFreq: "Measured",
    killBias: "Methodical",
    fatigueBurn: "Moderate",
    tagline: "coiled counter-striker"
  },
  ["STRIKING ATTACK" /* StrikingAttack */]: {
    voice: "Flowing",
    attackFreq: "Measured",
    killBias: "Methodical",
    fatigueBurn: "Moderate",
    tagline: "rhythmic striker, reading the tempo"
  },
  ["SLASHING ATTACK" /* SlashingAttack */]: {
    voice: "Flowing",
    attackFreq: "Relentless",
    killBias: "Savage",
    fatigueBurn: "Moderate",
    tagline: "whirl of razored arcs"
  },
  ["WALL OF STEEL" /* WallOfSteel */]: {
    voice: "Fortified",
    attackFreq: "Sparing",
    killBias: "Methodical",
    fatigueBurn: "High",
    tagline: "unmoving bastion of blade and brace"
  },
  ["TOTAL PARRY" /* TotalParry */]: {
    voice: "Fortified",
    attackFreq: "Sparing",
    killBias: "Opportunistic",
    fatigueBurn: "Low",
    tagline: "immovable defender, drawing mistakes from the foe"
  }
};
// src/engine/stylePassives/mastery.ts
var MASTERY_THRESHOLDS = [
  { tier: "Grandmaster", minFights: 50, bonus: 2, mult: 1.5 },
  { tier: "Master", minFights: 30, bonus: 1, mult: 1.3 },
  { tier: "Veteran", minFights: 20, bonus: 1, mult: 1.15 },
  { tier: "Practiced", minFights: 10, bonus: 0, mult: 1.05 },
  { tier: "Novice", minFights: 0, bonus: 0, mult: 1 }
];
function getMastery(totalFights) {
  for (const t of MASTERY_THRESHOLDS) {
    if (totalFights >= t.minFights)
      return { tier: t.tier, fights: totalFights, bonus: t.bonus, mult: t.mult };
  }
  return { tier: "Novice", fights: totalFights, bonus: 0, mult: 1 };
}
// src/engine/stylePassives/strategies.ts
var EMPTY_PASSIVE = {
  attBonus: 0,
  parBonus: 0,
  defBonus: 0,
  ripBonus: 0,
  dmgBonus: 0,
  critChance: 0,
  iniBonus: 0,
  mastery: "Novice"
};
function scale(val, m) {
  return Math.round(val * m.mult);
}
var STYLES = {
  ["AIMED BLOW" /* AimedBlow */]: {
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.94 },
    getPassive: (ctx, m) => {
      const targeted = ctx.targetedLocation && ctx.targetedLocation !== "Any";
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(targeted ? 4 : 3, m),
        parBonus: 2,
        critChance: targeted ? 0.12 + (ctx.exchange > 8 ? 0.05 : 0) : 0.06,
        hasPassiveNarrative: !!(targeted && ctx.exchange > 5)
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitLocation === "head" ? 0.15 : ctx.targetedLocation !== "Any" ? 0.05 : 0,
      decBonus: ctx.targetedLocation !== "Any" ? 3 : 0,
      extendedKillWindow: ctx.hitLocation === "head",
      killWindowHpMult: 0.8,
      killNarrative: "delivers a precise, clinical strike to a vital point!"
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 })
  },
  ["BASHING ATTACK" /* BashingAttack */]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.98 },
    getPassive: (ctx, m) => {
      const momentumDmg = Math.min(2 + m.bonus, Math.floor(ctx.consecutiveHits / 2));
      const vsTP = ctx.opponentStyle === "TOTAL PARRY" /* TotalParry */;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        dmgBonus: scale(momentumDmg, m) + (vsTP ? 1 : 0),
        attBonus: scale(ctx.consecutiveHits >= 4 ? 2 : 0, m) + (vsTP ? 1 : 0),
        hasPassiveNarrative: vsTP && ctx.consecutiveHits >= 2 || ctx.consecutiveHits >= 4
      };
    },
    getKillMechanic: (ctx) => {
      const momentum = Math.min(3, ctx.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        extendedKillWindow: ctx.consecutiveHits >= 3,
        killWindowHpMult: ctx.consecutiveHits >= 3 ? 0.5 : 0.4,
        killNarrative: "unleashes the full weight of their momentum in a crushing final blow!"
      };
    },
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Lunge") {
        offMult = 0.7;
        warning = "Bashers are too heavy for effective lunging";
      }
      if (def === "Dodge") {
        defMult = 0.7;
        warning = (warning ? warning + "; " : "") + "Bashers cannot dodge effectively";
      }
      if (def === "Riposte") {
        defMult = 0.7;
      }
      return { offMult, defMult, warning };
    }
  },
  ["LUNGING ATTACK" /* LungingAttack */]: {
    tempo: { opening: 1, mid: 0, late: -1, enduranceMult: 1.02 },
    getPassive: (ctx, m) => {
      const isFirst = ctx.exchange === 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: isFirst ? m.bonus : 0,
        attBonus: isFirst ? 0 : ctx.phase === "LATE" ? -2 : -1,
        hasPassiveNarrative: isFirst
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === "OPENING" ? 0.08 : 0,
      decBonus: ctx.phase === "OPENING" ? 2 : 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: "springs forward with a sudden, lethal thrust!"
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Bash") {
        offMult = 0.5;
        warning = "Lungers lack the weight for effective bashing";
      }
      if (def === "Parry") {
        defMult = 0.6;
        warning = (warning ? warning + "; " : "") + "Lungers are overextended for strong parries";
      }
      return { offMult, defMult, warning };
    }
  },
  ["PARRY-LUNGE" /* ParryLunge */]: {
    tempo: { opening: 0, mid: 2, late: 0, enduranceMult: 1 },
    getPassive: (ctx, m) => {
      const counterReady = ctx.hitsTaken > ctx.hitsLanded;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(counterReady ? 2 : 1, m),
        parBonus: 2 + m.bonus,
        iniBonus: counterReady ? 2 : 0,
        hasPassiveNarrative: counterReady
      };
    },
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: "exploits a gap in the defense to strike home!"
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 })
  },
  ["PARRY-RIPOSTE" /* ParryRiposte */]: {
    tempo: { opening: 0, mid: 1, late: 0, enduranceMult: 1.04 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.phase === "OPENING" ? -1 : 0,
      parBonus: 4,
      ripBonus: 2 + (ctx.ripostes >= 2 ? 1 : 0),
      hasPassiveNarrative: ctx.ripostes >= 3
    }),
    getKillMechanic: () => ({
      killBonus: 0.03,
      decBonus: 2,
      extendedKillWindow: false,
      killWindowHpMult: 0.4,
      killNarrative: "pivots around the attack and delivers a stinging riposte!"
    }),
    getAntiSynergy: (_off) => {
      let offMult = 1, warning;
      const defMult = 1;
      if (_off === "Bash") {
        offMult = 0.5;
        warning = "Riposte specialists lack bashing power";
      }
      if (_off === "Decisiveness") {
        offMult = 0.7;
      }
      return { offMult, defMult, warning };
    }
  },
  ["PARRY-STRIKE" /* ParryStrike */]: {
    tempo: { opening: 0, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      parBonus: 3,
      attBonus: 1 + (ctx.hitsTaken > ctx.hitsLanded ? 2 : 0)
    }),
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: "blocks and strikes in a single fluid motion!"
    }),
    getAntiSynergy: (_off) => ({ offMult: _off === "Bash" ? 0.6 : 1, defMult: 1 })
  },
  ["SLASHING ATTACK" /* SlashingAttack */]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => {
      const flurryDmg = ctx.hitsLanded >= 4 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: ctx.phase !== "LATE" ? 1 + m.bonus : 0,
        parBonus: 1,
        dmgBonus: flurryDmg,
        hasPassiveNarrative: ctx.hitsLanded >= 4
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitsLanded >= 4 ? 0.06 : 0,
      decBonus: 0,
      extendedKillWindow: ctx.hitsLanded >= 5,
      killWindowHpMult: ctx.hitsLanded >= 5 ? 0.5 : 0.4,
      killNarrative: "overwhelms their foe with a flurry of precise cuts!"
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Bash") {
        offMult = 0.5;
        warning = "Slashers rely on blade edge, not blunt force";
      }
      if (def === "Parry") {
        defMult = 0.6;
        warning = (warning ? warning + "; " : "") + "Slashers struggle with disciplined parries";
      }
      return { offMult, defMult, warning };
    }
  },
  ["STRIKING ATTACK" /* StrikingAttack */]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.hitsLanded >= 1 ? 1 + m.bonus : 0,
      dmgBonus: 1,
      hasPassiveNarrative: ctx.hitsLanded >= 1
    }),
    getKillMechanic: (ctx) => ({
      killBonus: 0.07,
      decBonus: 2,
      extendedKillWindow: ctx.hitsLanded >= 2,
      killWindowHpMult: 0.4,
      killNarrative: "lands a devastating, direct strike!"
    }),
    getAntiSynergy: (_off, def) => ({ offMult: 1, defMult: def === "Riposte" ? 0.6 : 1 })
  },
  ["TOTAL PARRY" /* TotalParry */]: {
    tempo: { opening: -1, mid: 1, late: 1, enduranceMult: 0.9 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -1,
      parBonus: 1 + (ctx.phase === "LATE" ? m.bonus : 0),
      iniBonus: 1,
      hasPassiveNarrative: ctx.phase === "LATE" && ctx.endRatio > 0.5
    }),
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === "LATE" ? 0 : ctx.phase === "MID" ? -0.02 : -0.05,
      decBonus: ctx.phase === "LATE" ? 1 : -1,
      extendedKillWindow: false,
      killWindowHpMult: 0.35,
      killNarrative: "finds a momentary opening in their own defensive shell!"
    }),
    getAntiSynergy: (off) => {
      let offMult = 1, warning;
      if (["Lunge", "Bash", "Slash"].includes(off || "")) {
        offMult = off === "Slash" ? 0.5 : 0.4;
        warning = `Total Parry fighters are not built for ${off?.toLowerCase()}`;
      }
      return { offMult, defMult: 1, warning };
    }
  },
  ["WALL OF STEEL" /* WallOfSteel */]: {
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.92 },
    getPassive: (ctx, m) => {
      const wallBonus = Math.min(1 + m.bonus, Math.floor(ctx.exchange / 10));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        defBonus: scale(wallBonus, m),
        parBonus: wallBonus > 0 ? 1 : 0,
        iniBonus: scale(wallBonus, m),
        hasPassiveNarrative: wallBonus >= 1
      };
    },
    getKillMechanic: () => ({
      killBonus: -0.03,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.4,
      killNarrative: "shifts their weight and drives through the defense!"
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 })
  }
};

// src/engine/stylePassives/api.ts
function getTempoBonus(style, phase) {
  const t = STYLES[style]?.tempo;
  if (!t)
    return 0;
  return phase === "OPENING" ? t.opening : phase === "MID" ? t.mid : t.late;
}
function getEnduranceMult(style) {
  return STYLES[style]?.tempo.enduranceMult ?? 1;
}
function getStylePassive(style, context) {
  const m = getMastery(context.totalFights ?? 0);
  const strategy = STYLES[style];
  if (!strategy)
    return {
      attBonus: 0,
      parBonus: 0,
      defBonus: 0,
      ripBonus: 0,
      dmgBonus: 0,
      critChance: 0,
      iniBonus: 0,
      mastery: m.tier
    };
  return strategy.getPassive(context, m);
}
function getKillMechanic(attackerStyle, context) {
  const strategy = STYLES[attackerStyle];
  if (!strategy)
    return {
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: "strikes home!"
    };
  return strategy.getKillMechanic(context);
}
function getStyleAntiSynergy(style, offTactic, defTactic) {
  const strategy = STYLES[style];
  if (!strategy)
    return { offMult: 1, defMult: 1 };
  return strategy.getAntiSynergy(offTactic, defTactic);
}
// src/constants/arena/weather.ts
var WEATHER_PENALTIES = {
  ASYLUM_CURSE_DRAIN: 1.25,
  VOLCANIC_HEAT_INITIATIVE: -2,
  ASYLUM_CURSE_RIPOSTE: 2,
  VOLCANIC_HEAT_DAMAGE: 1.1,
  MIST_SHROUDED_DEFENSE_PENALTY: 0.9,
  GALLOWS_CURSE_DAMAGE: 1.15,
  RAIN_LUNGE_INITIATIVE: -2,
  DENSE_FOG_RIPOSTE_BONUS: 3,
  DENSE_FOG_LUNGE_BONUS: 2,
  SANDSTORM_AIMED_INITIATIVE: -4,
  BLOOD_MOON_BASHING_DAMAGE: 1.1,
  BLOOD_MOON_SLASHING_DAMAGE: 1.05,
  BLIZZARD_LUNGE_INITIATIVE: -3,
  BLIZZARD_STRIKING_INITIATIVE: -2,
  MANA_SURGE_AIMED_DAMAGE: 1.15,
  RAIN_LUNGE_PENALTY: 0.15,
  DUST_RIPOSTE_PENALTY: 0.1,
  MIST_BASHING_DAMAGE: 0.9,
  GALE_LUNGE_INITIATIVE: -3,
  RAIN_SLASHING_PENALTY: -0.1,
  SANDSTORM_BASHING_BONUS: 0.15,
  CURSED_BLOOD_MOON_DAMAGE: 1.1,
  WATER_RAINY_INITIATIVE: -1,
  UNEVEN_BLIZZARD_INITIATIVE: -2,
  MAGICAL_MANA_SURGE_RIPOSTE: 3,
  LIVING_GALE_INITIATIVE: -2,
  ACID_RAIN_SLASHING_DAMAGE: 1.1,
  ECLIPSE_STRIKING_BONUS: 0.2,
  ACID_RAIN_LUNGE_DAMAGE: 1.1,
  SPARK_FORGE_RIPOSTE: 2,
  WAILING_CHASM_LUNGE_PENALTY: 0.15,
  SHATTERED_MONOLITH_RIPOSTE_BONUS: 2,
  LABYRINTH_LIVING_INITIATIVE: -3
};

// src/constants/arena/arena.ts
var STYLE_WEATHER_MODIFIERS = {
  "cursed:Blood Moon": {
    damageMult: WEATHER_PENALTIES.GALLOWS_CURSE_DAMAGE,
    description: "The blood moon empowers the curse of the gallows"
  },
  "ruins:Dense Fog": {
    damageMult: WEATHER_PENALTIES.MIST_SHROUDED_DEFENSE_PENALTY,
    description: "The unnatural fog in the ruins dampens impacts"
  },
  "Rainy:SLASHING ATTACK": {
    damageMult: 1 + WEATHER_PENALTIES.RAIN_SLASHING_PENALTY,
    description: "Rain softens slashing impacts"
  },
  "Sandstorm:BASHING ATTACK": {
    damageMult: 1 + WEATHER_PENALTIES.SANDSTORM_BASHING_BONUS,
    description: "Sandstorm winds carry bashing momentum"
  },
  "Rainy:LUNGING ATTACK": {
    initiativeMod: WEATHER_PENALTIES.RAIN_LUNGE_INITIATIVE,
    damageMult: 1 - WEATHER_PENALTIES.RAIN_LUNGE_PENALTY,
    description: "Rain-slicked sand hinders lunging footwork"
  },
  "Dense Fog:PARRY-RIPOSTE": {
    riposteMod: WEATHER_PENALTIES.DENSE_FOG_RIPOSTE_BONUS,
    description: "Fog favors counter-fighters hiding their movements"
  },
  "Dense Fog:PARRY-LUNGE": {
    riposteMod: WEATHER_PENALTIES.DENSE_FOG_LUNGE_BONUS,
    description: "Fog aids the cunning counter-striker"
  },
  "Sandstorm:PARRY-RIPOSTE": {
    damageMult: 1 - WEATHER_PENALTIES.DUST_RIPOSTE_PENALTY,
    description: "Dust in the eyes hampers counter-strikes"
  },
  "Sandstorm:AIMED BLOW": {
    initiativeMod: WEATHER_PENALTIES.SANDSTORM_AIMED_INITIATIVE,
    description: "Dust blinds precision targeting"
  },
  "Blood Moon:BASHING ATTACK": {
    damageMult: WEATHER_PENALTIES.BLOOD_MOON_BASHING_DAMAGE,
    description: "Bloodlust amplifies brutal strikes"
  },
  "Blood Moon:SLASHING ATTACK": {
    damageMult: WEATHER_PENALTIES.BLOOD_MOON_SLASHING_DAMAGE,
    description: "The crimson moon whets the blade"
  },
  "Blizzard:LUNGING ATTACK": {
    initiativeMod: WEATHER_PENALTIES.BLIZZARD_LUNGE_INITIATIVE,
    description: "Freezing winds slow explosive movement"
  },
  "Blizzard:STRIKING ATTACK": {
    initiativeMod: WEATHER_PENALTIES.BLIZZARD_STRIKING_INITIATIVE,
    description: "Snow drifts hamper rhythmic striking"
  },
  "Mist:BASHING ATTACK": {
    damageMult: WEATHER_PENALTIES.MIST_BASHING_DAMAGE,
    description: "Reduced visibility weakens heavy blows"
  },
  "Gale:LUNGING ATTACK": {
    initiativeMod: WEATHER_PENALTIES.GALE_LUNGE_INITIATIVE,
    description: "Strong winds disrupt lunging footwork"
  },
  "Mana Surge:AIMED BLOW": {
    damageMult: WEATHER_PENALTIES.MANA_SURGE_AIMED_DAMAGE,
    description: "Arcane focus sharpens precision strikes"
  },
  "cursed:Dense Fog": {
    riposteMod: WEATHER_PENALTIES.ASYLUM_CURSE_RIPOSTE,
    description: "Cursed fog heavily favors ripostes"
  },
  "indoor:Blood Moon": {
    damageMult: WEATHER_PENALTIES.ASYLUM_CURSE_DRAIN,
    description: "Blood Moon echoes in closed cursed spaces"
  },
  "living:Ashfall": {
    initiativeMod: WEATHER_PENALTIES.VOLCANIC_HEAT_INITIATIVE,
    damageMult: WEATHER_PENALTIES.VOLCANIC_HEAT_DAMAGE,
    description: "Living ash clouds burn lungs and empower strikes"
  },
  "water:Rainy": {
    initiativeMod: WEATHER_PENALTIES.WATER_RAINY_INITIATIVE,
    description: "Standing water deepens with fresh rain"
  },
  "uneven:Blizzard": {
    initiativeMod: WEATHER_PENALTIES.UNEVEN_BLIZZARD_INITIATIVE,
    description: "Ice forms on broken ground"
  },
  "magical:Mana Surge": {
    riposteMod: WEATHER_PENALTIES.MAGICAL_MANA_SURGE_RIPOSTE + WEATHER_PENALTIES.SHATTERED_MONOLITH_RIPOSTE_BONUS,
    description: "Magical resonance immensely aids riposte timing on shattered grounds"
  },
  "living:Gale": {
    initiativeMod: WEATHER_PENALTIES.LIVING_GALE_INITIATIVE,
    description: "The living forest writhes in the gale"
  },
  "indoor:Acid Rain": {
    damageMult: WEATHER_PENALTIES.ACID_RAIN_LUNGE_DAMAGE,
    description: "Acid rain leaking through the roof burns the skin"
  },
  "premium:Ember Rain": {
    riposteMod: WEATHER_PENALTIES.SPARK_FORGE_RIPOSTE,
    description: "The forge sparks blind the attacker, aiding a counter"
  },
  "Acid Rain:SLASHING ATTACK": {
    damageMult: WEATHER_PENALTIES.ACID_RAIN_SLASHING_DAMAGE,
    description: "Acid rain corrodes armor and weakens defenses against blades"
  },
  "cursed:Eclipse": {
    damageMult: 1 + WEATHER_PENALTIES.ECLIPSE_STRIKING_BONUS,
    description: "Unearthly darkness enhances the power of striking weapons on cursed ground"
  },
  "cursed:Blizzard": {
    damageMult: 1 - WEATHER_PENALTIES.WAILING_CHASM_LUNGE_PENALTY,
    description: "The cursed frozen chasm winds suppress lunging momentum"
  },
  "living:Rainy": {
    initiativeMod: WEATHER_PENALTIES.LABYRINTH_LIVING_INITIATIVE,
    description: "The living labyrinth flourishes in the rain, aggressively slowing footwork"
  }
};
function getStyleWeatherModifier(style, weather, arenaTags) {
  let initiativeMod = 0;
  let riposteMod = 0;
  let damageMult = 1;
  const descriptions = [];
  const styleKey = `${weather}:${style}`;
  const styleMod = STYLE_WEATHER_MODIFIERS[styleKey];
  if (styleMod) {
    initiativeMod += styleMod.initiativeMod ?? 0;
    riposteMod += styleMod.riposteMod ?? 0;
    damageMult *= styleMod.damageMult ?? 1;
    descriptions.push(styleMod.description);
  }
  for (const tag of arenaTags) {
    const tagKey = `${tag}:${weather}`;
    const tagMod = STYLE_WEATHER_MODIFIERS[tagKey];
    if (tagMod) {
      initiativeMod += tagMod.initiativeMod ?? 0;
      riposteMod += tagMod.riposteMod ?? 0;
      damageMult *= tagMod.damageMult ?? 1;
      descriptions.push(tagMod.description);
    }
  }
  return { initiativeMod, riposteMod, damageMult, descriptions };
}
// src/constants/arenaEvents.ts
var ARENA_EVENT_CONSTANTS = {
  HAUNTING_WHISPERS_TRIGGER: 18,
  COLLAPSING_PILLAR_TRIGGER: 15,
  CROWD_RIOT_TRIGGER: 15,
  CROWD_RIOT_DAMAGE: 2,
  BLOOD_MOON_LIGHTING_TRIGGER: 1,
  BLOOD_MOON_LIGHTING_DAMAGE: 1.3,
  GEYSER_ERUPTION_TRIGGER: 6,
  SHADOW_TENDRIL_TRIGGER: 20,
  SHADOW_TENDRIL_DRAIN: 5,
  THORN_BARBS_TRIGGER: 10,
  SHIFTING_ROOTS_TRIGGER: 3,
  DEEPENING_MUCK_TRIGGER: 4,
  AQUEDUCT_FLOOD_TRIGGER: 10,
  VOLCANIC_ERUPTION_TRIGGER: 8,
  WHISPERS_OF_MADNESS_TRIGGER: 2,
  CHASM_COLLAPSE_TRIGGER: 18,
  MONOLITH_PULSE_TRIGGER: 12
};

// src/constants/arena/arenaEvents.ts
var ARENA_EVENTS = {
  collapsing_pillar: {
    id: "collapsing_pillar",
    name: "Collapsing Pillar",
    description: "Ancient stonework crumbles under the impact of combat",
    requiredTags: ["ruins"],
    triggerCondition: "heavy_hit",
    triggerValue: ARENA_EVENT_CONSTANTS.COLLAPSING_PILLAR_TRIGGER,
    narrativeText: "A nearby pillar cracks and collapses in a cloud of dust!"
  },
  falling_debris: {
    id: "falling_debris",
    name: "Falling Debris",
    description: "Ceiling fragments rain down on the fighters",
    requiredTags: ["ruins", "indoor"],
    triggerCondition: "random",
    triggerValue: 0.03,
    narrativeText: "Chunks of stone fall from above, forcing both fighters to dodge!"
  },
  chasm_collapse: {
    id: "chasm_collapse",
    name: "Chasm Collapse",
    description: "The walls of the chasm cave in during fierce clashes",
    requiredTags: ["cramped", "cursed"],
    triggerCondition: "heavy_hit",
    triggerValue: ARENA_EVENT_CONSTANTS.CHASM_COLLAPSE_TRIGGER,
    narrativeText: "A heavy impact shatters the cursed chasm walls, raining debris!",
    mechanicalEffect: {
      type: "damage",
      value: 2
    }
  },
  monolith_pulse: {
    id: "monolith_pulse",
    name: "Monolith Pulse",
    description: "The shattered monolith pulses with arcane energy",
    requiredTags: ["magical", "elevated"],
    triggerCondition: "random",
    triggerValue: 0.05,
    narrativeText: "The floating monolith releases a blinding magical pulse!",
    mechanicalEffect: {
      type: "initiative_mod",
      value: -3
    }
  },
  shadow_tendrils: {
    id: "shadow_tendrils",
    name: "Shadow Tendrils",
    description: "Cursed shadows lash out",
    requiredTags: ["cursed"],
    triggerCondition: "heavy_hit",
    triggerValue: ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_TRIGGER,
    narrativeText: "Shadow tendrils lash out from the darkness!",
    mechanicalEffect: {
      type: "endurance_drain",
      value: ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_DRAIN
    }
  },
  crystal_resonance: {
    id: "crystal_resonance",
    name: "Crystal Resonance",
    description: "The crystals hum with sympathetic energy",
    requiredTags: ["magical"],
    triggerCondition: "exchange_interval",
    triggerValue: 5,
    narrativeText: "The crystal walls pulse with light, amplifying every strike!"
  },
  aether_surge: {
    id: "aether_surge",
    name: "Aether Surge",
    description: "Raw magical energy surges through the arena",
    requiredTags: ["magical"],
    triggerCondition: "weather_combo",
    triggerValue: 1,
    narrativeText: "Arcane energy crackles through the air, empowering attacks!"
  },
  blood_moon_amplification: {
    id: "blood_moon_amplification",
    name: "Blood Moon Amplification",
    description: "The cursed ground drinks in the crimson light",
    requiredTags: ["cursed"],
    triggerCondition: "weather_combo",
    triggerValue: 1,
    narrativeText: "The blood moon shines brighter here. Violence feels inevitable."
  },
  restless_spirits: {
    id: "restless_spirits",
    name: "Restless Spirits",
    description: "The dead beneath the arena stir",
    requiredTags: ["cursed"],
    triggerCondition: "random",
    triggerValue: 0.05,
    narrativeText: "Ghostly hands reach from the ground, grasping at the living!"
  },
  thorn_barbs: {
    id: "thorn_barbs",
    name: "Thorn Barbs",
    description: "The flora lashes out at retreating fighters",
    requiredTags: ["living"],
    triggerCondition: "heavy_hit",
    triggerValue: ARENA_EVENT_CONSTANTS.THORN_BARBS_TRIGGER,
    narrativeText: "Thorny vines whip at the fighters as they move!"
  },
  shifting_roots: {
    id: "shifting_roots",
    name: "Shifting Roots",
    description: "The ground itself seems to move",
    requiredTags: ["living", "uneven"],
    triggerCondition: "exchange_interval",
    triggerValue: ARENA_EVENT_CONSTANTS.SHIFTING_ROOTS_TRIGGER,
    narrativeText: "Roots writhe beneath the sand, tangling footwork!"
  },
  unstable_footing: {
    id: "unstable_footing",
    name: "Unstable Footing",
    description: "Broken flagstones shift under pressure",
    requiredTags: ["uneven"],
    triggerCondition: "random",
    triggerValue: 0.05,
    narrativeText: "The uneven ground shifts, throwing off balance!"
  },
  volcanic_eruption: {
    id: "volcanic_eruption",
    name: "Volcanic Eruption",
    description: "The crater spews fire and ash",
    requiredTags: ["living"],
    triggerCondition: "exchange_interval",
    triggerValue: ARENA_EVENT_CONSTANTS.VOLCANIC_ERUPTION_TRIGGER,
    narrativeText: "A vent violently erupts, showering the arena with searing ash!"
  },
  whispers_of_madness: {
    id: "whispers_of_madness",
    name: "Whispers of Madness",
    description: "The cursed asylum echoes with spectral torment",
    requiredTags: ["cursed", "indoor"],
    triggerCondition: "exchange_interval",
    triggerValue: ARENA_EVENT_CONSTANTS.WHISPERS_OF_MADNESS_TRIGGER,
    narrativeText: "Ghostly screams echo off the walls, fraying the nerves of the fighters!"
  },
  crowd_riot: {
    id: "crowd_riot",
    name: "Crowd Riot",
    description: "The wealthy patrons demand blood and throw debris",
    requiredTags: ["premium"],
    triggerCondition: "heavy_hit",
    triggerValue: ARENA_EVENT_CONSTANTS.CROWD_RIOT_TRIGGER,
    narrativeText: "The crowd riots in a frenzy, throwing debris into the arena!",
    mechanicalEffect: { type: "damage", value: ARENA_EVENT_CONSTANTS.CROWD_RIOT_DAMAGE }
  },
  blood_moon_lighting: {
    id: "blood_moon_lighting",
    name: "Blood Moon Lighting",
    description: "The cursed ground glows ominously under the blood moon",
    requiredTags: ["cursed"],
    triggerCondition: "weather_combo",
    triggerValue: ARENA_EVENT_CONSTANTS.BLOOD_MOON_LIGHTING_TRIGGER,
    narrativeText: "The blood moon illuminates the cursed ground, driving fighters mad!",
    mechanicalEffect: { type: "damage", value: ARENA_EVENT_CONSTANTS.BLOOD_MOON_LIGHTING_DAMAGE }
  },
  geyser_eruption: {
    id: "geyser_eruption",
    name: "Geyser Eruption",
    description: "Scalding water erupts from the ground",
    requiredTags: ["water", "uneven"],
    triggerCondition: "exchange_interval",
    triggerValue: ARENA_EVENT_CONSTANTS.GEYSER_ERUPTION_TRIGGER,
    narrativeText: "A hidden geyser erupts, blasting scalding water into the air!"
  },
  deepening_muck: {
    id: "deepening_muck",
    name: "Deepening Muck",
    description: "Waterlogged ground becomes more treacherous",
    requiredTags: ["water"],
    triggerCondition: "exchange_interval",
    triggerValue: ARENA_EVENT_CONSTANTS.DEEPENING_MUCK_TRIGGER,
    narrativeText: "The waterlogged ground sucks at boots, slowing movement!"
  }
};
// src/engine/combat/resolution/guardBreak.ts
function accumulateGuardBreak(current) {
  return Math.min(BA_PARDEGRADE_CAP, current + BA_PARDEGRADE_PER_HIT);
}

// src/engine/combat/resolution/bleed.ts
function accumulateBleed(current) {
  return Math.min(SL_BLEED_CAP, current + SL_BLEED_STACKS_PER_HIT);
}
function tickBleed(stacks) {
  return {
    damage: stacks * SL_BLEED_TICK_DMG,
    next: Math.max(0, stacks - SL_BLEED_DECAY)
  };
}

// src/engine/combat/resolution/tempoMechanics.ts
function getMomentumDamageBonus(attackerStyle, attackerMomentum, defenderStyle) {
  if (defenderStyle === "WALL OF STEEL" /* WallOfSteel */)
    return 0;
  if (attackerStyle === "LUNGING ATTACK" /* LungingAttack */ && attackerMomentum > 0) {
    return attackerMomentum * LU_MOMENTUM_DMG_COEFF;
  }
  return 0;
}
function getWsAttritionBonus(attackerStyle) {
  return attackerStyle === "WALL OF STEEL" /* WallOfSteel */ ? WS_ATTRITION_FLOOR : 0;
}

// src/engine/combat/resolution/strikingAttack.ts
var isST = (style) => style === "STRIKING ATTACK" /* StrikingAttack */;
function getFrontloadMult(style, exchange) {
  if (!isST(style))
    return 1;
  const t = Math.max(0, 1 - exchange / ST_FRONTLOAD_WINDOW);
  return 1 + (ST_FRONTLOAD_START - 1) * t;
}
function getStCritChanceBonus(style) {
  return isST(style) ? ST_CRIT_CHANCE_BONUS : 0;
}
function getStCritDamageBonus(style) {
  return isST(style) ? ST_CRIT_DAMAGE_BONUS : 0;
}
function getExecuteBonus(style, hp, maxHp) {
  if (!isST(style))
    return 0;
  return hp / Math.max(1, maxHp) < ST_EXECUTE_HP_THRESHOLD ? ST_EXECUTE_BONUS : 0;
}

// src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts
function handleSurvivalStrike(events, rng, attacker, defender, attTactics, defPassive, attLabel, defLabel) {
  if (!defender.survivalStrike)
    return false;
  defender.survivalStrike = false;
  const freeRipLoc = rollHitLocation(rng, attTactics.target, attacker.activePlan.protect);
  let freeRipDmg = computeHitDamage(rng, defender.derived.damage + (defPassive?.dmgBonus ?? 0) + weaponDamageBonus(defender.weaponId, defender.style), freeRipLoc);
  freeRipDmg = applyArmorTypeMod(freeRipDmg, defender.weaponId, attacker.armorId);
  freeRipDmg = applyProtectMod(freeRipDmg, freeRipLoc, attacker.activePlan.protect);
  events.push({ type: "DEFENSE", actor: defLabel, result: "RIPOSTE" });
  events.push({
    type: "HIT",
    actor: defLabel,
    target: attLabel,
    location: freeRipLoc,
    value: freeRipDmg,
    metadata: { appliedDamage: freeRipDmg }
  });
  attacker.hp -= freeRipDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  if (attacker.hp <= 0) {
    events.push({
      type: "BOUT_END",
      actor: defLabel,
      result: "KO",
      metadata: { location: freeRipLoc, cause: "SURVIVAL_STRIKE" }
    });
  }
  return true;
}
function computePreArmorDamage(rng, attacker, defender, attTactics, attOffMods, attPassive) {
  let hitLoc = rollHitLocation(rng, attTactics.target, defender.activePlan.protect);
  if (attacker.style === "AIMED BLOW" /* AimedBlow */) {
    const locIdx = HIT_LOCATIONS.indexOf(hitLoc);
    if (locIdx > 0)
      hitLoc = HIT_LOCATIONS[locIdx - 1];
  }
  let preArmor = computeHitDamage(rng, attacker.derived.damage + attOffMods.dmgBonus + attPassive.dmgBonus + weaponDamageBonus(attacker.weaponId, attacker.style), hitLoc);
  preArmor += getMomentumDamageBonus(attacker.style, attacker.momentum, defender.style);
  preArmor += getWsAttritionBonus(attacker.style);
  if (attacker.style === "BASHING ATTACK" /* BashingAttack */) {
    defender.parDegrade = accumulateGuardBreak(defender.parDegrade ?? 0);
  }
  if (attacker.style === "SLASHING ATTACK" /* SlashingAttack */) {
    defender.bleedStacks = accumulateBleed(defender.bleedStacks ?? 0);
  }
  return { hitLoc, preArmor };
}
function applyDamageMultipliers(preArmor, attacker, defender, ctx) {
  const postArmor = applyArmorTypeMod(preArmor, attacker.weaponId, defender.armorId);
  const postFlat = applyFlatMitigation(postArmor, defender.armorId, defender.helmId);
  let rawDamage;
  if (attacker.style === "AIMED BLOW" /* AimedBlow */) {
    const bypass = Math.max(0, Math.min(AB_ARMOR_BYPASS_MAX, attacker.attributes.DF / AB_ARMOR_BYPASS_DF_DIVISOR));
    rawDamage = Math.round(postFlat + bypass * (preArmor - postFlat));
  } else {
    rawDamage = postFlat;
  }
  const weatherDamageMult = ctx?.weatherEffect?.damageMult ?? 1;
  const styleWeatherMod = ctx?.arenaConfig ? getStyleWeatherModifier(attacker.style, ctx.weather, ctx.arenaConfig.tags) : { damageMult: 1 };
  const totalDamageMult = weatherDamageMult * styleWeatherMod.damageMult;
  rawDamage = Math.round(rawDamage * totalDamageMult);
  if (attacker.committed) {
    rawDamage = Math.round(rawDamage * COMMIT_DAMAGE_MULT);
  }
  const defSpecDamageMult = ctx ? defender.label === "A" ? ctx.trainerModsA.damageReceivedMult ?? 1 : ctx.trainerModsD.damageReceivedMult ?? 1 : 1;
  rawDamage = Math.round(rawDamage * defSpecDamageMult);
  rawDamage = Math.round(rawDamage * getFrontloadMult(attacker.style, ctx?.exchange ?? 0));
  rawDamage += getExecuteBonus(attacker.style, defender.hp, defender.maxHp);
  return rawDamage;
}
function applyHitAndCounters(events, rng, rawDamage, hitLoc, attacker, defender, attPassive, attLabel, defLabel) {
  const effectiveCritChance = attPassive.critChance + getStCritChanceBonus(attacker.style);
  const isCrit = effectiveCritChance > 0 && rng() < effectiveCritChance;
  if (isCrit) {
    rawDamage = Math.round(rawDamage * (CRIT_DAMAGE_MULT + getStCritDamageBonus(attacker.style)));
  }
  const defShieldCov = SHIELD_COVERAGE[defender.shieldId ?? ""] ?? SHIELD_COVERAGE[defender.weaponId ?? ""];
  const postShieldDamage = applyShieldZoneMod(rawDamage, hitLoc, defShieldCov);
  const damage = applyProtectMod(postShieldDamage, hitLoc, defender.activePlan.protect);
  if (isCrit) {
    events.push({
      type: "HIT",
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
      metadata: { crit: true, appliedDamage: damage }
    });
  } else {
    events.push({
      type: "HIT",
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
      metadata: { appliedDamage: damage }
    });
  }
  defender.hp -= damage;
  defender.hitsTaken++;
  attacker.hitsLanded++;
  attacker.consecutiveHits++;
  defender.consecutiveHits = 0;
  if (hitLoc.includes("arm"))
    defender.armHits++;
  if (hitLoc.includes("leg"))
    defender.legHits++;
  return { damage, isCrit, rawDamage };
}
function checkKnockdown(events, rng, defender, damage, defLabel) {
  const hpRatioAfterHit = defender.hp / defender.maxHp;
  const damageRatio = damage / defender.maxHp;
  if (!defender.knockedDown && defender.hp > 0 && hpRatioAfterHit < KNOCKDOWN_HP_RATIO && damageRatio >= KNOCKDOWN_DAMAGE_RATIO && rng() < Math.min(KNOCKDOWN_CHANCE_CAP, damageRatio + defender.legHits * KNOCKDOWN_LEG_BONUS)) {
    defender.knockedDown = true;
    events.push({ type: "KNOCKDOWN", actor: defLabel });
  }
}
function applyMomentumShift(events, attacker, defender, attLabel, defLabel) {
  const prevAttMom = attacker.momentum;
  const prevDefMom = defender.momentum;
  attacker.momentum = Math.min(MOMENTUM_CAP, attacker.momentum + 1);
  defender.momentum = Math.max(MOMENTUM_FLOOR, defender.momentum - 1);
  if (attacker.momentum !== prevAttMom || defender.momentum !== prevDefMom) {
    events.push({
      type: "MOMENTUM_SHIFT",
      actor: attLabel,
      target: defLabel,
      value: attacker.momentum,
      metadata: { prev: prevAttMom, oppPrev: prevDefMom, oppNew: defender.momentum }
    });
  }
}
function checkKillWindow(events, rng, attacker, defender, ctx, hitLoc, rawDamage, attTactics, attLabel, stylePhase, phase, attKD, attOE, attAL, attMatchup) {
  const killMech = getKillMechanic(attacker.style, {
    phase: stylePhase,
    hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits,
    targetedLocation: attTactics.target,
    hitLocation: hitLoc
  });
  let didKill = false;
  let causeBucket = "EXECUTION";
  if (defender.hp <= defender.maxHp * killMech.killWindowHpMult) {
    const killPos = phase === "LATE" ? 2 : phase === "MID" ? 1 : 0;
    const effectiveDec = attacker.skills.DEC + killMech.decBonus;
    const specKillBonus = ctx ? attacker.label === "A" ? ctx.trainerModsA.killWindowBonus ?? 0 : ctx.trainerModsD.killWindowBonus ?? 0 : 0;
    const attackerTraitKill = attacker.traits ? getDynamicTraitMods(attacker, {
      phase,
      hpRatio: attacker.hp / attacker.maxHp,
      endRatio: attacker.endurance / attacker.maxEndurance,
      consecutiveHits: attacker.consecutiveHits
    }).killWindowBonus : 0;
    const crowdKillBonus = ctx?.crowdKillBonus ?? 0;
    const killThreshold = calculateKillWindow(defender.hp / defender.maxHp, defender.endurance / defender.maxEndurance, hitLoc, attKD + killMech.killBonus, killPos, attOE, attAL, attMatchup, effectiveDec, attacker.momentum, specKillBonus + attackerTraitKill, crowdKillBonus);
    if (rng() < killThreshold) {
      defender.hp = 0;
      didKill = true;
      if (attacker.consecutiveHits >= CRITICAL_CHAIN_HITS) {
        causeBucket = "CRITICAL_CHAIN";
      } else {
        const wasCovered = !!defender.activePlan.protect && defender.activePlan.protect !== "Any";
        if (wasCovered && rawDamage >= ARMOR_FAILURE_DMG_THRESHOLD)
          causeBucket = "ARMOR_FAILURE";
      }
    }
  }
  if (defender.hp <= 0) {
    if (didKill) {
      events.push({
        type: "BOUT_END",
        actor: attLabel,
        result: "Kill",
        metadata: { location: hitLoc, cause: causeBucket }
      });
    } else {
      events.push({
        type: "BOUT_END",
        actor: attLabel,
        result: "KO",
        metadata: { location: hitLoc, cause: "FATAL_DAMAGE" }
      });
    }
  }
}
function executeHit(events, rng, attacker, defender, attTactics, attOffMods, attPassive, attLabel, defLabel, stylePhase, phase, attKD, attOE, attAL, attMatchup, ctx, defPassive) {
  if (handleSurvivalStrike(events, rng, attacker, defender, attTactics, defPassive, attLabel, defLabel)) {
    return;
  }
  const kdForCommit = attacker.activePlan.killDesire ?? attKD;
  const isAtLowHp = attacker.hp / attacker.maxHp < COMMIT_HP_THRESHOLD;
  if (!attacker.committed && isAtLowHp && kdForCommit >= COMMIT_KILL_DESIRE) {
    attacker.committed = true;
    events.push({ type: "STATE_CHANGE", actor: attLabel, result: "COMMIT" });
  }
  const { hitLoc, preArmor } = computePreArmorDamage(rng, attacker, defender, attTactics, attOffMods, attPassive);
  const rawDamagePreCrit = applyDamageMultipliers(preArmor, attacker, defender, ctx);
  const { damage, rawDamage } = applyHitAndCounters(events, rng, rawDamagePreCrit, hitLoc, attacker, defender, attPassive, attLabel, defLabel);
  checkKnockdown(events, rng, defender, damage, defLabel);
  applyMomentumShift(events, attacker, defender, attLabel, defLabel);
  if (attacker.committed && defender.hp > 0) {
    defender.survivalStrike = true;
    events.push({ type: "STATE_CHANGE", actor: defLabel, result: "SURVIVAL_STRIKE" });
  }
  if (damage > 0 && rng() < INSIGHT_CHANCE) {
    const attrs = ["ST", "SP", "DF", "WL"];
    events.push({
      type: "INSIGHT",
      actor: attLabel,
      metadata: { attribute: attrs[Math.floor(rng() * attrs.length)] }
    });
  }
  checkKillWindow(events, rng, attacker, defender, ctx, hitLoc, rawDamage, attTactics, attLabel, stylePhase, phase, attKD, attOE, attAL, attMatchup);
}
// src/engine/combat/mechanics/combatFatigue.ts
var ENDURANCE_OE_SCALING = 0.18;
var ENDURANCE_AL_SCALING = 0.09;
var FATIGUE_MODERATE_THRESHOLD = 0.45;
var FATIGUE_HEAVY_THRESHOLD = 0.25;
var FATIGUE_MODERATE_PENALTY = -4;
var FATIGUE_HEAVY_PENALTY = -8;
function enduranceCost(oe, al, weather2) {
  const baseCost = oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING;
  const weatherMod = getWeatherEffect(weather2 ?? "Clear").staminaMult;
  return baseCost * weatherMod;
}
function fatiguePenalty(endurance, maxEndurance, penaltyReduction = 0) {
  const ratio = endurance / Math.max(1, maxEndurance);
  let base = 0;
  if (ratio <= FATIGUE_HEAVY_THRESHOLD)
    base = FATIGUE_HEAVY_PENALTY;
  else if (ratio <= FATIGUE_MODERATE_THRESHOLD)
    base = FATIGUE_MODERATE_PENALTY;
  if (base === 0 || penaltyReduction === 0)
    return base;
  return Math.ceil(base * (1 - penaltyReduction));
}

// src/engine/combat/mechanics/conditionEngine.ts
function evaluationInterval(wt) {
  if (wt >= 7)
    return 1;
  if (wt >= 4)
    return 3;
  return 5;
}
function conditionMet(trigger, fighter, _opponent, ctx) {
  const { type, value } = trigger;
  switch (type) {
    case "HP_BELOW":
      return fighter.hp / fighter.maxHp < Number(value);
    case "HP_ABOVE":
      return fighter.hp / fighter.maxHp > Number(value);
    case "MOMENTUM_LEAD":
      return fighter.momentum >= Number(value);
    case "MOMENTUM_DEFICIT":
      return fighter.momentum <= -Number(value);
    case "PHASE_IS": {
      const phaseMap = {
        opening: "OPENING",
        mid: "MID",
        late: "LATE",
        OPENING: "OPENING",
        MID: "MID",
        LATE: "LATE"
      };
      return ctx.phase === (phaseMap[String(value)] ?? value);
    }
    case "ENDURANCE_BELOW":
      return fighter.endurance / fighter.maxEndurance < Number(value);
    default:
      return false;
  }
}
function derivePsychState(fighter, opponent) {
  const hpRatio = fighter.hp / fighter.maxHp;
  const endRatio = fighter.endurance / fighter.maxEndurance;
  if (endRatio < 0.1) {
    const wt = fighter.attributes?.WT ?? 10;
    if (wt < 12)
      return "FatiguePanic";
    return "Desperate";
  }
  if (hpRatio < 0.3)
    return "Desperate";
  if (fighter.momentum >= 2 && hpRatio > 0.7)
    return "InTheZone";
  if (opponent.consecutiveHits >= 3 && fighter.consecutiveHits === 0)
    return "Rattled";
  if (fighter.hitsLanded > fighter.hitsTaken * 1.5 && endRatio > 0.6 && fighter.hitsLanded >= 3) {
    return "Cruising";
  }
  return "Neutral";
}
function evaluateConditions(fighter, opponent, ctx, wt) {
  const psychState = derivePsychState(fighter, opponent);
  if (ctx.exchange % evaluationInterval(wt) !== 0) {
    return { newPlan: fighter.activePlan, psychState };
  }
  const conditions = fighter.plan.conditions;
  if (conditions && conditions.length > 0) {
    for (const cond of conditions) {
      if (conditionMet(cond.trigger, fighter, opponent, ctx)) {
        return { newPlan: { ...fighter.plan, ...cond.override }, psychState };
      }
    }
  }
  return { newPlan: fighter.plan, psychState };
}
var PSYCH_STATE_MODS = {
  Neutral: { attMod: 0, iniMod: 0, defMod: 0, parMod: 0, decMod: 0, enduranceCostMult: 1 },
  InTheZone: { attMod: 5, iniMod: 3, defMod: 0, parMod: 0, decMod: 0, enduranceCostMult: 1 },
  Rattled: { attMod: 0, iniMod: 0, defMod: -5, parMod: -3, decMod: 0, enduranceCostMult: 1 },
  Desperate: { attMod: -3, iniMod: -3, defMod: -3, parMod: -3, decMod: -5, enduranceCostMult: 1 },
  Cruising: { attMod: 0, iniMod: 0, defMod: 0, parMod: 0, decMod: 0, enduranceCostMult: 0.9 },
  FatiguePanic: {
    attMod: -5,
    iniMod: -5,
    defMod: -6,
    parMod: -6,
    decMod: -8,
    enduranceCostMult: 1.1
  }
};

// src/engine/combat/resolution/exchangeHelpers/mechanics/enduranceCosts.ts
function applyEnduranceCosts(events, ctx, fA, fD, aGoesFirst, curAttOE, curAttAL, curAttWepReq, curDefWepReq, OE_D, AL_D, OE_A, AL_A) {
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;
  const arenaEndMult = ctx.surfaceMod?.enduranceMult ?? 1;
  const psychEndMultA = PSYCH_STATE_MODS[fA.psychState]?.enduranceCostMult ?? 1;
  const psychEndMultD = PSYCH_STATE_MODS[fD.psychState]?.enduranceCostMult ?? 1;
  const traitEndMultAtt = att.staticEnduranceMult ?? 1;
  const traitEndMultDef = def.staticEnduranceMult ?? 1;
  const attArmor = att.armorId ? getItemById(att.armorId) : undefined;
  const attHelm = att.helmId ? getItemById(att.helmId) : undefined;
  const attEquipEndMult = (attArmor?.enduranceCostMod ?? 1) * (attHelm?.enduranceCostMod ?? 1);
  const defArmor = def.armorId ? getItemById(def.armorId) : undefined;
  const defHelm = def.helmId ? getItemById(def.helmId) : undefined;
  const defEquipEndMult = (defArmor?.enduranceCostMod ?? 1) * (defHelm?.enduranceCostMod ?? 1);
  att.endurance -= Math.round(enduranceCost(curAttOE, curAttAL, ctx.weather) * getEnduranceMult(att.style) * curAttWepReq.endurancePenalty * (att.encumbrancePenalty?.enduranceMult ?? 1) * attEquipEndMult * arenaEndMult * (aGoesFirst ? psychEndMultA : psychEndMultD) * traitEndMultAtt);
  def.endurance -= Math.max(1, Math.round(enduranceCost(aGoesFirst ? OE_D : OE_A, aGoesFirst ? AL_D : AL_A, ctx.weather) * DEFENDER_ENDURANCE_DISCOUNT * getEnduranceMult(def.style) * curDefWepReq.endurancePenalty * (def.encumbrancePenalty?.enduranceMult ?? 1) * defEquipEndMult * arenaEndMult * (aGoesFirst ? psychEndMultD : psychEndMultA) * traitEndMultDef));
  if ((fA.endurance <= 0 || fD.endurance <= 0) && !events.some((e) => e.result === "Kill" || e.result === "KO")) {
    if (fA.endurance <= 0 && fD.endurance <= 0) {
      events.push({
        type: "BOUT_END",
        actor: "A",
        result: "Exhaustion",
        metadata: { cause: "FATIGUE_COLLAPSE" }
      });
    } else {
      const collapsed = fA.endurance <= 0 ? fA : fD;
      const cause = collapsed.hp < collapsed.maxHp * 0.15 ? "FATIGUE_COLLAPSE" : undefined;
      events.push({
        type: "BOUT_END",
        actor: fA.endurance <= 0 ? "A" : "D",
        result: "Stoppage",
        metadata: cause ? { cause } : undefined
      });
    }
  }
}
// src/engine/combat/resolution/exchangeSubPhases.ts
function makeExchangeState() {
  return {
    rangeModA: 0,
    rangeModD: 0,
    distanceWinner: null,
    feintBonus: 0,
    feintFailed: false,
    commitLevelA: "Standard",
    commitLevelD: "Standard",
    recoveryDebtToWriteA: 0,
    recoveryDebtToWriteD: 0,
    events: []
  };
}
function runApproach(rng, fA, fD, OE_A, OE_D, ctx, es) {
  const sizeProfile = {
    startRange: ARENA_SIZE_PROFILES[ctx.arenaConfig.size].startRange,
    maxRange: ctx.maxRange,
    zoneStepBias: ctx.zoneStepBias
  };
  const result = contestDistance(rng, fA, fD, OE_A, OE_D, ctx.range, sizeProfile);
  es.rangeModA = 0;
  es.rangeModD = 0;
  es.distanceWinner = result.distanceWinner;
  es.events.push(...result.events);
  ctx.range = result.newRange;
}
function runFeint(rng, att, def) {
  const plan = att.activePlan;
  const wt = att.attributes.WT;
  const feintTendency = plan.feintTendency ?? 0;
  const OE = plan.OE;
  if (feintTendency === 0 || wt < 15 || OE < 4) {
    return { triggered: false, feintBonus: 0, feintFailed: false, events: [] };
  }
  const defAL = def.activePlan.AL;
  const defWT = def.attributes.WT;
  const roll = wt + feintTendency - defAL - defWT * 0.5;
  const threshold = clamp(roll / 20, 0.05, 0.95);
  const succeeded = rng() < threshold;
  const events = [
    {
      type: succeeded ? "FEINT_SUCCESS" : "FEINT_FAIL",
      actor: att.label,
      target: def.label
    }
  ];
  return {
    triggered: true,
    succeeded,
    feintBonus: succeeded ? 4 : 0,
    feintFailed: !succeeded,
    events
  };
}
function runCommit(fighter, OE) {
  const hpRatio = fighter.hp / fighter.maxHp;
  if (hpRatio < 0.3 || OE <= 3) {
    return { level: "Cautious", attBonus: 0, defPenalty: 1, debtToWrite: 0 };
  }
  if (OE >= 7 || fighter.momentum >= 2) {
    return { level: "Full", attBonus: 1, defPenalty: -1, debtToWrite: 1 };
  }
  return { level: "Standard", attBonus: 0, defPenalty: 0, debtToWrite: 0 };
}
function runRecovery(fA, fD, debtToWriteA, debtToWriteD, events, ctx) {
  if (debtToWriteA > 0) {
    fA.recoveryDebt = clamp(debtToWriteA, fA.recoveryDebt, 3);
  } else {
    fA.recoveryDebt = Math.max(0, fA.recoveryDebt - 1);
  }
  if (debtToWriteD > 0) {
    fD.recoveryDebt = clamp(debtToWriteD, fD.recoveryDebt, 3);
  } else {
    fD.recoveryDebt = Math.max(0, fD.recoveryDebt - 1);
  }
  if (!ctx || ctx.zone == null)
    return;
  const currentZone = ctx.zone;
  const zoneStepBias = ctx.zoneStepBias ?? 0;
  const hitOnA = events.some((e) => e.type === "HIT" && e.target === "A");
  const hitOnD = events.some((e) => e.type === "HIT" && e.target === "D");
  if (hitOnA) {
    let newZone = transitionZone(currentZone);
    if (zoneStepBias > 0 && newZone !== "Corner" && newZone !== "Obstacle") {
      newZone = transitionZone(newZone);
    }
    if (newZone !== ctx.zone) {
      ctx.pushedFighter = "A";
      ctx.zone = newZone;
      events.push({ type: "ZONE_SHIFT", actor: "D", target: "A", result: newZone });
    }
  } else if (hitOnD) {
    let newZone = transitionZone(currentZone);
    if (zoneStepBias > 0 && newZone !== "Corner" && newZone !== "Obstacle") {
      newZone = transitionZone(newZone);
    }
    if (newZone !== ctx.zone) {
      ctx.pushedFighter = "D";
      ctx.zone = newZone;
      events.push({ type: "ZONE_SHIFT", actor: "A", target: "D", result: newZone });
    }
  } else {
    if (ctx.pushedFighter) {
      ctx.zone = resetZone(currentZone);
      if (ctx.zone === "Center") {
        ctx.pushedFighter = undefined;
      }
    }
  }
}

// src/engine/combat/resolution/initiativePhase.ts
function resolveInitiativePhase(ctx, fA, fD, OE_A, AL_A, OE_D, AL_D, fatA, fatD, defModsA, defModsD, passA, passD, psychA, psychD, dynTraitsA, dynTraitsD) {
  const { rng, phase } = ctx;
  const stylePhase = phase;
  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD, OE_D, AL_D) : 0;
  const styleWeatherModA = getStyleWeatherModifier(fA.style, ctx.weather, ctx.arenaConfig.tags);
  const styleWeatherModD = getStyleWeatherModifier(fD.style, ctx.weather, ctx.arenaConfig.tags);
  const iniA = fA.skills.INI + alIniMod(AL_A) + ctx.matchupA + fatA + defModsA.iniBonus + getTempoBonus(fA.style, stylePhase) + passA.iniBonus + masteryIniA - fA.legHits + psychA.iniMod + fA.momentum * MOMENTUM_INI_MULT + (ctx.trainerModsA.iniMod ?? 0) + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod + styleWeatherModA.initiativeMod + getWeaponInitiativeMod(fA.weaponId) + dynTraitsA.iniMod;
  const iniD = fD.skills.INI + alIniMod(AL_D) + ctx.matchupD + fatD + defModsD.iniBonus + getTempoBonus(fD.style, stylePhase) + passD.iniBonus + masteryIniD - fD.legHits + psychD.iniMod + fD.momentum * MOMENTUM_INI_MULT + (ctx.trainerModsD.iniMod ?? 0) + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod + styleWeatherModD.initiativeMod + getWeaponInitiativeMod(fD.weaponId) + dynTraitsD.iniMod;
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attLabel = aGoesFirst ? "A" : "D";
  const attMasteryIni = aGoesFirst ? masteryIniA : masteryIniD;
  const event = {
    type: "INITIATIVE",
    actor: attLabel,
    value: aGoesFirst ? iniA : iniD,
    result: true,
    metadata: { isMastery: attMasteryIni > 0 }
  };
  return { aGoesFirst, iniA, iniD, event };
}
// src/engine/combat/resolution/counterstrike.ts
function getCounterstrikeAttBonus(fighter) {
  if (fighter.style !== "PARRY-STRIKE" /* ParryStrike */)
    return 0;
  return fighter.counterstrikePrimed ? PS_COUNTERSTRIKE_ATT : 0;
}

// src/engine/combat/resolution/styleRiposteBonus.ts
function styleRiposteBonus(def, att, opts = {}) {
  let ripBonus = 0;
  let dmgBonus = 0;
  if (def.style === "TOTAL PARRY" /* TotalParry */) {
    const endRatio = att.endurance / Math.max(1, att.maxEndurance);
    if (endRatio < TP_FATIGUE_SEVERE_RATIO) {
      ripBonus += TP_FATIGUE_SEVERE_RIP;
      dmgBonus += TP_FATIGUE_SEVERE_DMG;
    } else if (endRatio < TP_FATIGUE_MODERATE_RATIO) {
      ripBonus += TP_FATIGUE_MODERATE_RIP;
      dmgBonus += TP_FATIGUE_MODERATE_DMG;
    }
  }
  if (def.style === "PARRY-LUNGE" /* ParryLunge */ && def.momentum > 0 && att.style !== "WALL OF STEEL" /* WallOfSteel */) {
    ripBonus += def.momentum;
    dmgBonus += def.momentum * PL_MOMENTUM_RIPOSTE_DMG_COEFF;
  }
  if (def.style === "PARRY-RIPOSTE" /* ParryRiposte */) {
    if (opts.afterParry)
      ripBonus += PR_COUNTER_ON_PARRY;
    dmgBonus += PR_COMMIT_PUNISH[opts.attCommitLevel ?? "Standard"];
    dmgBonus += Math.min(PR_CHAIN_CAP, (opts.riposteStreak ?? 0) * PR_CHAIN_STEP);
  }
  return { ripBonus, dmgBonus };
}

// src/engine/combat/resolution/offenseDefense.ts
function resolveWhiffRiposte(s) {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng } = ctx;
  events.push({ type: "ATTACK", actor: attLabel, result: "WHIFF" });
  att.consecutiveHits = 0;
  att.endurance -= Math.max(1, Math.floor(enduranceCost(s.curAttOE, s.curAttAL, ctx.weather) * WHIFF_ENDURANCE_COST_MULT)) + s.curOffMods.endCost;
  const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? s.tactD : s.tactA).offTactic, (aGoesFirst ? s.tactD : s.tactA).defTactic);
  const styleRip = styleRiposteBonus(def, att, {
    afterParry: false,
    attCommitLevel: s.attCommit.level,
    riposteStreak: def.riposteStreak ?? 0
  });
  const styleWeatherRipMod = getStyleWeatherModifier(def.style, ctx.weather, ctx.arenaConfig.tags).riposteMod;
  const ripCheck = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? s.fatD : s.fatA, s.curOffMods.defPenalty - WHIFF_RIPOSTE_DEF_PENALTY + styleRip.ripBonus + ctx.weatherEffect.riposteMod + styleWeatherRipMod, aGoesFirst ? s.passD : s.passA, curAntiSynDef);
  if (def.style === "PARRY-RIPOSTE" /* ParryRiposte */) {
    def.riposteStreak = ripCheck ? (def.riposteStreak ?? 0) + 1 : 0;
  }
  if (ripCheck) {
    executeRiposte(events, rng, att, def, aGoesFirst ? s.tactD : s.tactA, aGoesFirst ? s.passD : s.passA, attLabel, defLabel, 1, styleRip.dmgBonus);
  }
}
function computeExtraDefPenalty(s) {
  const { ctx, def } = s;
  const zonePenalty = ctx.pushedFighter === def.label ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig)) : 0;
  const defRangePenalty = Math.max(0, -s.defWeaponRangeMod);
  return zonePenalty - s.defCommit.defPenalty + s.feintDefBonus + defRangePenalty - s.defDynTraitPar - s.defDynTraitDef + (def.parDegrade ?? 0);
}
function handleSuccessfulDefense(s) {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng } = ctx;
  const prevDefMomParry = def.momentum;
  const prevAttMomParry = att.momentum;
  def.momentum = Math.min(MOMENTUM_CAP, def.momentum + 1);
  att.momentum = Math.max(MOMENTUM_FLOOR, att.momentum - 1);
  if (def.momentum !== prevDefMomParry || att.momentum !== prevAttMomParry) {
    events.push({
      type: "MOMENTUM_SHIFT",
      actor: defLabel,
      value: def.momentum,
      metadata: {
        prev: prevDefMomParry,
        reason: "PARRY",
        attPrev: prevAttMomParry,
        attNew: att.momentum
      }
    });
  }
  if (def.style === "PARRY-STRIKE" /* ParryStrike */) {
    def.counterstrikePrimed = true;
  }
  const styleRip = styleRiposteBonus(def, att, {
    afterParry: true,
    attCommitLevel: s.attCommit.level,
    riposteStreak: def.riposteStreak ?? 0
  });
  const styleWeatherRipMod = getStyleWeatherModifier(def.style, ctx.weather, ctx.arenaConfig.tags).riposteMod;
  const ripPostParry = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? s.fatD : s.fatA, (aGoesFirst ? s.defModsD : s.defModsA).ripBonus + ctx.weatherEffect.riposteMod + styleRip.ripBonus + styleWeatherRipMod, aGoesFirst ? s.passD : s.passA, undefined);
  const specRiposteMult = aGoesFirst ? ctx.trainerModsD.riposteDamageMult ?? 1 : ctx.trainerModsA.riposteDamageMult ?? 1;
  if (def.style === "PARRY-RIPOSTE" /* ParryRiposte */) {
    def.riposteStreak = ripPostParry ? (def.riposteStreak ?? 0) + 1 : 0;
  }
  if (ripPostParry) {
    executeRiposte(events, rng, att, def, aGoesFirst ? s.tactD : s.tactA, aGoesFirst ? s.passD : s.passA, attLabel, defLabel, specRiposteMult, styleRip.dmgBonus);
  }
}
function resolveContestedDefense(s) {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng, phase } = ctx;
  const curDefOE = aGoesFirst ? s.OE_D : s.OE_A;
  const curDefMods = aGoesFirst ? s.defModsD : s.defModsA;
  const curPassD = aGoesFirst ? s.passD : s.passA;
  const curBiasDef = aGoesFirst ? s.biasDefD : s.biasDefA;
  const curDefAL = aGoesFirst ? s.AL_D : s.AL_A;
  const defTacticType = (aGoesFirst ? s.tactD : s.tactA).defTactic;
  const isDodge = curDefAL <= 3 ? false : curDefAL >= 7 && defTacticType === "none" ? true : defTacticType === "Dodge";
  const overDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);
  const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? s.tactD : s.tactA).offTactic, (aGoesFirst ? s.tactD : s.tactA).defTactic);
  const extraDefPenalty = computeExtraDefPenalty(s);
  const defCheck = performDefenseCheck(rng, def, curDefOE, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? s.fatD : s.fatA, curDefMods, curPassD, curBiasDef, overDef, isDodge, curAntiSynDef, s.curOffMods, ctx, att, extraDefPenalty);
  if (defCheck.success) {
    events.push({ type: "DEFENSE", actor: defLabel, result: defCheck.type });
    if (!isDodge) {
      handleSuccessfulDefense(s);
    }
    att.consecutiveHits = 0;
  } else {
    const killDesire = aGoesFirst ? s.fA.activePlan.phases?.[s.phaseKey]?.killDesire ?? s.fA.activePlan.killDesire ?? 5 : s.fD.activePlan.phases?.[s.phaseKey]?.killDesire ?? s.fD.activePlan.killDesire ?? 5;
    executeHit(events, rng, att, def, aGoesFirst ? s.tactA : s.tactD, s.curOffMods, s.curPassA, attLabel, defLabel, s.stylePhase, phase, killDesire, s.curAttOE, s.curAttAL, aGoesFirst ? ctx.matchupA : ctx.matchupD, ctx, curPassD);
  }
}
function computeAttackBonuses(ctx, aGoesFirst, att, def, psychA, psychD, dynTraitsA, dynTraitsD) {
  const attMomentumBonus = att.momentum * MOMENTUM_INI_MULT;
  const attPsychMod = aGoesFirst ? psychA.attMod : psychD.attMod;
  const attWeaponRangeMod = getWeaponRangeMod(att.weaponId, ctx.range);
  const defWeaponRangeMod = getWeaponRangeMod(def.weaponId, ctx.range);
  const attDynTraitAtt = aGoesFirst ? dynTraitsA.attMod : dynTraitsD.attMod;
  const counterstrikeAtt = getCounterstrikeAttBonus(att);
  att.counterstrikePrimed = false;
  const defDynTraitPar = aGoesFirst ? dynTraitsD.parMod : dynTraitsA.parMod;
  const defDynTraitDef = aGoesFirst ? dynTraitsD.defMod : dynTraitsA.defMod;
  return {
    momentumBonus: attMomentumBonus,
    psychMod: attPsychMod,
    weaponRangeMod: attWeaponRangeMod,
    dynTraitAtt: attDynTraitAtt,
    counterstrikeAtt,
    defWeaponRangeMod,
    defDynTraitPar,
    defDynTraitDef
  };
}
function resolveCombatOffenseDefense(ctx, fA, fD, aGoesFirst, OE_A, AL_A, OE_D, AL_D, fatA, fatD, offModsA, offModsD, defModsA, defModsD, passA, passD, biasAttA, biasDefA, biasAttD, biasDefD, tactA, tactD, psychA, psychD, dynTraitsA, dynTraitsD, feintAttBonus, feintDefBonus, attCommit, defCommit, es, phaseKey, stylePhase, events) {
  const { rng } = ctx;
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";
  const curAttOE = aGoesFirst ? OE_A : OE_D;
  const curAttAL = aGoesFirst ? AL_A : AL_D;
  const curOffMods = aGoesFirst ? offModsA : offModsD;
  const curPassA = aGoesFirst ? passA : passD;
  const curBiasAtt = aGoesFirst ? biasAttA : biasAttD;
  const curAntiSyn = getStyleAntiSynergy(att.style, (aGoesFirst ? tactA : tactD).offTactic, (aGoesFirst ? tactA : tactD).defTactic);
  const overAtt = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD);
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const bonuses = computeAttackBonuses(ctx, aGoesFirst, att, def, psychA, psychD, dynTraitsA, dynTraitsD);
  const attSucc = performAttackCheck(rng, att, curAttOE, aGoesFirst ? ctx.matchupA : ctx.matchupD, aGoesFirst ? fatA : fatD, curOffMods, curPassA, curAntiSyn, curBiasAtt, overAtt, curAttWepReq, bonuses.momentumBonus + bonuses.psychMod + (aGoesFirst ? es.rangeModA : es.rangeModD) + attCommit.attBonus + feintAttBonus + bonuses.weaponRangeMod + bonuses.dynTraitAtt + bonuses.counterstrikeAtt);
  const s = {
    ctx,
    fA,
    fD,
    aGoesFirst,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    fatA,
    fatD,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
    passA,
    passD,
    biasDefA,
    biasDefD,
    tactA,
    tactD,
    dynTraitsA,
    dynTraitsD,
    feintDefBonus,
    attCommit,
    defCommit,
    phaseKey,
    stylePhase,
    events,
    att,
    def,
    attLabel,
    defLabel,
    curAttOE,
    curAttAL,
    curOffMods,
    curPassA,
    defWeaponRangeMod: bonuses.defWeaponRangeMod,
    defDynTraitPar: bonuses.defDynTraitPar,
    defDynTraitDef: bonuses.defDynTraitDef
  };
  if (!attSucc) {
    resolveWhiffRiposte(s);
  } else {
    resolveContestedDefense(s);
  }
}
// src/engine/combat/resolution/psychState.ts
function evaluatePsychState(fA, fD, _ctx, condResultA, condResultD) {
  const events = [];
  if (condResultA.psychState !== fA.psychState) {
    fA.psychState = condResultA.psychState;
    if (condResultA.psychState !== "Neutral") {
      events.push({
        type: "STATE_CHANGE",
        actor: "A",
        result: `PSYCH_${condResultA.psychState.toUpperCase()}`
      });
    }
  }
  if (condResultD.psychState !== fD.psychState) {
    fD.psychState = condResultD.psychState;
    if (condResultD.psychState !== "Neutral") {
      events.push({
        type: "STATE_CHANGE",
        actor: "D",
        result: `PSYCH_${condResultD.psychState.toUpperCase()}`
      });
    }
  }
  return events;
}
function getPsychStateMods(fA, fD) {
  return {
    psychA: PSYCH_STATE_MODS[fA.psychState],
    psychD: PSYCH_STATE_MODS[fD.psychState]
  };
}
function handleDesperateState(fA, fD) {
  const events = [];
  for (const f of [fA, fD]) {
    if (!f.desperate && f.plan.desperatePlan && (f.hp < f.maxHp * 0.3 || f.endurance < f.maxEndurance * 0.2)) {
      const dp = f.plan.desperatePlan;
      f.activePlan = {
        ...f.plan,
        OE: dp.OE,
        AL: dp.AL,
        ...dp.killDesire !== undefined && { killDesire: dp.killDesire },
        offensiveTactic: dp.offensiveTactic ?? f.plan.offensiveTactic,
        defensiveTactic: dp.defensiveTactic ?? f.plan.defensiveTactic,
        target: dp.target ?? f.plan.target,
        protect: dp.protect ?? f.plan.protect,
        phases: undefined
      };
      f.desperate = true;
      events.push({ type: "STATE_CHANGE", actor: f.label, result: "DESPERATE" });
    }
  }
  return events;
}

// src/engine/combat/resolution/specialtyMods.ts
function applySpecialtyMods(ctx, fA, fD) {
  if (ctx.trainers?.length) {
    if (!ctx.baseTrainerModsA)
      ctx.baseTrainerModsA = { ...ctx.trainerModsA };
    if (!ctx.baseTrainerModsD)
      ctx.baseTrainerModsD = { ...ctx.trainerModsD };
    const specA = getSpecialtyMods(ctx.trainers, fA, fD, ctx);
    const specD = getSpecialtyMods(ctx.trainers, fD, fA, ctx);
    const baseA = ctx.baseTrainerModsA;
    const baseD = ctx.baseTrainerModsD;
    ctx.trainerModsA = {
      attMod: (baseA.attMod ?? 0) + specA.attMod,
      parMod: (baseA.parMod ?? 0) + specA.parMod,
      defMod: (baseA.defMod ?? 0) + specA.defMod,
      iniMod: (baseA.iniMod ?? 0) + specA.iniMod,
      decMod: (baseA.decMod ?? 0) + specA.decMod,
      endMod: (baseA.endMod ?? 0) + specA.endMod,
      healMod: baseA.healMod ?? 0,
      killWindowBonus: specA.killWindowBonus,
      damageReceivedMult: specA.damageReceivedMult,
      riposteDamageMult: specA.riposteDamageMult,
      fatiguePenaltyReduction: specA.fatiguePenaltyReduction
    };
    ctx.trainerModsD = {
      attMod: (baseD.attMod ?? 0) + specD.attMod,
      parMod: (baseD.parMod ?? 0) + specD.parMod,
      defMod: (baseD.defMod ?? 0) + specD.defMod,
      iniMod: (baseD.iniMod ?? 0) + specD.iniMod,
      decMod: (baseD.decMod ?? 0) + specD.decMod,
      endMod: (baseD.endMod ?? 0) + specD.endMod,
      healMod: baseD.healMod ?? 0,
      killWindowBonus: specD.killWindowBonus,
      damageReceivedMult: specD.damageReceivedMult,
      riposteDamageMult: specD.riposteDamageMult,
      fatiguePenaltyReduction: specD.fatiguePenaltyReduction
    };
  }
}

// src/engine/combat/resolution/tactics.ts
function resolveEffectiveTactics(plan, phaseKey) {
  const phase = plan.phases?.[phaseKey];
  return {
    offTactic: phase?.offensiveTactic ?? plan.offensiveTactic ?? "none",
    defTactic: phase?.defensiveTactic ?? plan.defensiveTactic ?? "none",
    target: phase?.target ?? plan.target ?? "Any"
  };
}
function applyAggressionBias(aggressionBias) {
  return aggressionBias > 5 ? [(aggressionBias - 5) * 0.5, -(aggressionBias - 5) * 0.5] : [(aggressionBias - 5) * 0.5, (5 - aggressionBias) * 0.5];
}

// src/engine/combat/resolution/exchangePrep.ts
function resolveTacticsAndBias(fA, fD, phaseKey) {
  const tactA = resolveEffectiveTactics(fA.activePlan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.activePlan, phaseKey);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);
  const [biasAttA, biasDefA] = applyAggressionBias(fA.activePlan.phases?.[phaseKey]?.aggressionBias ?? fA.activePlan.aggressionBias ?? 5);
  const [biasAttD, biasDefD] = applyAggressionBias(fD.activePlan.phases?.[phaseKey]?.aggressionBias ?? fD.activePlan.aggressionBias ?? 5);
  return {
    tactA,
    tactD,
    offModsA,
    defModsA,
    offModsD,
    defModsD,
    biasAttA,
    biasDefA,
    biasAttD,
    biasDefD
  };
}
function resolveOEAL(fA, fD, phaseKey, exchange) {
  const [OE_A, AL_A] = calculateFinalOEAL(fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE, fA.activePlan.phases?.[phaseKey]?.AL ?? fA.activePlan.AL, fA.activePlan, fA.hp, fA.maxHp, fA.endurance, fA.maxEndurance, exchange);
  const [OE_D, AL_D] = calculateFinalOEAL(fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE, fD.activePlan.phases?.[phaseKey]?.AL ?? fD.activePlan.AL, fD.activePlan, fD.hp, fD.maxHp, fD.endurance, fD.maxEndurance, exchange);
  return { OE_A, AL_A, OE_D, AL_D };
}
function resolveStylePassives(rng, fA, fD, stylePhase, exchange, tactA, tactD, events) {
  const passA = getStylePassive(fA.style, {
    phase: stylePhase,
    exchange,
    hitsLanded: fA.hitsLanded,
    hitsTaken: fA.hitsTaken,
    ripostes: fA.ripostes,
    consecutiveHits: fA.consecutiveHits,
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    opponentStyle: fD.style,
    targetedLocation: tactA.target,
    totalFights: fA.totalFights
  });
  const passD = getStylePassive(fD.style, {
    phase: stylePhase,
    exchange,
    hitsLanded: fD.hitsLanded,
    hitsTaken: fD.hitsTaken,
    ripostes: fD.ripostes,
    consecutiveHits: fD.consecutiveHits,
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    opponentStyle: fA.style,
    targetedLocation: tactD.target,
    totalFights: fD.totalFights
  });
  if (passA.narrative && rng() < PASSIVE_NARRATIVE_CHANCE) {
    events.push({ type: "PASSIVE", actor: "A", result: passA.narrative });
  }
  if (passD.narrative && rng() < PASSIVE_NARRATIVE_CHANCE) {
    events.push({ type: "PASSIVE", actor: "D", result: passD.narrative });
  }
  return { passA, passD };
}
function resolveDynamicTraits(fA, fD, stylePhase) {
  const traitCtxA = {
    phase: stylePhase,
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    consecutiveHits: fA.consecutiveHits
  };
  const traitCtxD = {
    phase: stylePhase,
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    consecutiveHits: fD.consecutiveHits
  };
  return {
    dynTraitsA: getDynamicTraitMods(fA, traitCtxA),
    dynTraitsD: getDynamicTraitMods(fD, traitCtxD)
  };
}
function prepareExchange(ctx, fA, fD, events) {
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase;
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
  if (fA.knockedDown) {
    fA.knockedDown = false;
    events.push({ type: "RECOVERY", actor: "A" });
  }
  if (fD.knockedDown) {
    fD.knockedDown = false;
    events.push({ type: "RECOVERY", actor: "D" });
  }
  const wtA = fA.attributes.WT;
  const wtD = fD.attributes.WT;
  const condResultA = evaluateConditions(fA, fD, ctx, wtA);
  const condResultD = evaluateConditions(fD, fA, ctx, wtD);
  fA.activePlan = condResultA.newPlan;
  fD.activePlan = condResultD.newPlan;
  events.push(...evaluatePsychState(fA, fD, ctx, condResultA, condResultD));
  applySpecialtyMods(ctx, fA, fD);
  const { psychA, psychD } = getPsychStateMods(fA, fD);
  events.push(...handleDesperateState(fA, fD));
  const tac = resolveTacticsAndBias(fA, fD, phaseKey);
  const oal = resolveOEAL(fA, fD, phaseKey, exchange);
  const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance, ctx.trainerModsA.fatiguePenaltyReduction ?? 0) + psychA.defMod + psychA.parMod;
  const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance, ctx.trainerModsD.fatiguePenaltyReduction ?? 0) + psychD.defMod + psychD.parMod;
  const { passA, passD } = resolveStylePassives(rng, fA, fD, stylePhase, exchange, tac.tactA, tac.tactD, events);
  const { dynTraitsA, dynTraitsD } = resolveDynamicTraits(fA, fD, stylePhase);
  return {
    condResultA,
    condResultD,
    ...tac,
    ...oal,
    fatA,
    fatD,
    passA,
    passD,
    dynTraitsA,
    dynTraitsD,
    psychA,
    psychD
  };
}

// src/engine/combat/resolution/resolution.ts
function resolveExchange(ctx, fA, fD) {
  const events = [];
  const { rng, phase } = ctx;
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
  const s = prepareExchange(ctx, fA, fD, events);
  const es = makeExchangeState();
  runApproach(rng, fA, fD, s.OE_A, s.OE_D, ctx, es);
  events.push(...es.events.splice(0));
  const { aGoesFirst, event: iniEvent } = resolveInitiativePhase(ctx, fA, fD, s.OE_A, s.AL_A, s.OE_D, s.AL_D, s.fatA, s.fatD, s.defModsA, s.defModsD, s.passA, s.passD, s.psychA, s.psychD, s.dynTraitsA, s.dynTraitsD);
  events.push(iniEvent);
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;
  const feintResult = runFeint(rng, att, def);
  events.push(...feintResult.events);
  const feintAttBonus = feintResult.feintBonus;
  const feintDefBonus = feintResult.feintFailed ? FEINT_FAILED_DEF_BONUS : 0;
  const attCommit = runCommit(att, aGoesFirst ? s.OE_A : s.OE_D);
  const defCommit = runCommit(def, aGoesFirst ? s.OE_D : s.OE_A);
  es.recoveryDebtToWriteA = aGoesFirst ? attCommit.debtToWrite : defCommit.debtToWrite;
  es.recoveryDebtToWriteD = aGoesFirst ? defCommit.debtToWrite : attCommit.debtToWrite;
  resolveCombatOffenseDefense(ctx, fA, fD, aGoesFirst, s.OE_A, s.AL_A, s.OE_D, s.AL_D, s.fatA, s.fatD, s.offModsA, s.offModsD, s.defModsA, s.defModsD, s.passA, s.passD, s.biasAttA, s.biasDefA, s.biasAttD, s.biasDefD, s.tactA, s.tactD, s.psychA, s.psychD, s.dynTraitsA, s.dynTraitsD, feintAttBonus, feintDefBonus, attCommit, defCommit, es, phaseKey, phase, events);
  const curAttOE = aGoesFirst ? s.OE_A : s.OE_D;
  const curAttAL = aGoesFirst ? s.AL_A : s.AL_D;
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;
  applyEnduranceCosts(events, ctx, fA, fD, aGoesFirst, curAttOE, curAttAL, curAttWepReq, curDefWepReq, s.OE_D, s.AL_D, s.OE_A, s.AL_A);
  runRecovery(fA, fD, es.recoveryDebtToWriteA, es.recoveryDebtToWriteD, events, ctx);
  const currTacticA = s.tactA.offTactic;
  const currTacticD = s.tactD.offTactic;
  ctx.tacticStreakA = currTacticA !== "none" && ctx.lastOffTacticA === currTacticA ? ctx.tacticStreakA + 1 : currTacticA !== "none" ? 1 : 0;
  ctx.tacticStreakD = currTacticD !== "none" && ctx.lastOffTacticD === currTacticD ? ctx.tacticStreakD + 1 : currTacticD !== "none" ? 1 : 0;
  ctx.lastOffTacticA = currTacticA;
  ctx.lastOffTacticD = currTacticD;
  for (const fighter of [fA, fD]) {
    const stacks = fighter.bleedStacks ?? 0;
    if (stacks > 0) {
      const { damage, next } = tickBleed(stacks);
      fighter.hp -= damage;
      fighter.bleedStacks = next;
      events.push({
        type: "HIT",
        actor: fighter.label === "A" ? "D" : "A",
        target: fighter.label,
        value: damage,
        location: "Bleed",
        metadata: { cause: "BLEED", stacks: next }
      });
    }
  }
  return events;
}
// src/data/narrative/gazette.json
var gazette_default = {
  gazette: {
    fights: {
      Kill: [
        "A brief, violent clash ended with {{loser}}'s life blood spilling onto the arena floor, courtesy of {{winner}}'s lethal precision.",
        "It was a massacre. {{winner}} gave absolutely no quarter, dismantling {{loser}} piece by piece until the sands were stained red.",
        "The crowd watched in awe and horror as {{winner}} systematically broke {{loser}} down, culminating in a gruesome execution.",
        "No quarter was asked and none given, as {{winner}} systematically dismantled {{loser}} before a {{adj}} execution.",
        "In a display of horrifying dominance, {{winner}} claimed {{loser}}'s head to the {{adj}} delight of the crowd.",
        "The crowd roared their approval when {{winner}} claimed {{loser}}'s life in a {{adj}} climax of violence.",
        "The sands drank deep today as {{winner}} unleashed a {{adj}} massacre, ending {{loser}}'s story forever.",
        "A chilling reminder of mortality as {{winner}} executed {{loser}} in a {{adj}} and calculated slaughter.",
        "{{winner}} delivered a masterclass in brutality, ending {{loser}} with a {{adj}} and decisive blow.",
        "The sands drank deep today as {{winner}} tore {{loser}} apart in a display of unmatched savagery.",
        "{{loser}} fought valiantly but was ultimately reduced to meat by {{winner}}'s {{adj}} final blow.",
        "A truly horrifying spectacle. {{winner}} eviscerated {{loser}}, leaving the crowd breathless.",
        "{{winner}} showed absolute dominance, executing {{loser}} with a terrifyingly precise strike.",
        "A grisly end for {{loser}}, who fell victim to {{winner}}'s {{adj}} and inescapable wrath.",
        "In a shocking display of brutality, {{winner}} executed {{loser}} before a roaring crowd.",
        "{{loser}} met a tragic end at the hands of {{winner}}'s unyielding {{styleW}} assault.",
        "The arena was painted in crimson after {{winner}}'s {{adj}} evisceration of {{loser}}.",
        "{{winner}} painted the sands red, butchering {{loser}} in a truly {{adj}} spectacle.",
        "{{loser}}'s blood stained the sands after a {{adj}} killing blow from {{winner}}.",
        "The arena witnessed an absolute slaughter as {{winner}} destroyed {{loser}}.",
        "In a {{adj}} display, {{winner}} struck down {{loser}} with a killing blow.",
        "The crowd gasped as {{winner}} ended {{loser}}'s life in a {{adj}} climax.",
        "With a {{adj}} final strike, {{winner}} executed {{loser}} without mercy.",
        "{{winner}} delivered a gruesome end to {{loser}}, painting the sands red.",
        "{{winner}}'s {{styleW}} proved fatal for the unfortunate {{loser}}."
      ],
      KO: [
        "A concussive impact from {{winner}} sent {{loser}} straight into the realm of shadows in a {{adj}} climax.",
        "In a shocking turn, {{winner}} found the perfect angle to knock {{loser}} senseless in a {{adj}} finish.",
        "{{winner}} walked away victorious, leaving {{loser}} unconscious and broken after a {{adj}} exchange.",
        "{{loser}} crumbled like a puppet with cut strings after enduring {{winner}}'s {{adj}} assault.",
        "{{loser}} will wake up with a hell of a headache, thanks to {{winner}}'s {{adj}} right hand.",
        "The crowd gasped as {{winner}} delivered a {{adj}} strike that knocked {{loser}} senseless.",
        "A deafening crack rang out as {{winner}} dropped {{loser}} with a {{adj}} final blow.",
        "{{winner}} delivered a {{adj}} blow that sent {{loser}} spiraling into darkness.",
        "{{winner}} battered {{loser}} into unconsciousness with {{adj}} efficiency.",
        "A {{adj}} masterclass from {{winner}} left {{loser}} twitching on the sand.",
        "{{winner}}'s sheer power overwhelmed {{loser}}, ending in a swift knockout.",
        "{{winner}} put {{loser}} to sleep with a {{adj}} and decisive final strike.",
        "A brutal concussion left {{loser}} unconscious at the feet of {{winner}}.",
        "The lights went out for {{loser}} after a masterful strike by {{winner}}.",
        "{{winner}} put {{loser}} to sleep, much to the crowd's {{adj}} delight.",
        "{{loser}} was battered into unconsciousness by a relentless {{winner}}.",
        "{{loser}}'s legs gave out after a {{adj}} assault by {{winner}}.",
        "{{winner}} put {{loser}} to sleep with a devastating blow."
      ],
      Stoppage: [
        "A merciful stoppage spared {{loser}} further humiliation against the {{adj}} might of {{winner}}.",
        "The Arenamaster interceded to save {{loser}} from {{winner}}'s {{adj}} and unrelenting fury.",
        "The white towel flew for {{loser}}, yielding the sands to {{winner}} in a {{adj}} display.",
        "The sheer {{adj}} pressure from {{winner}} forced the officials to save {{loser}}'s life.",
        "Mercy was shown to {{loser}}, as the Arenamaster halted {{winner}}'s {{adj}} onslaught.",
        "{{winner}} showed {{adj}} dominance, leaving the officials no choice but to call it.",
        "{{winner}} broke {{loser}}'s spirit with a {{adj}} display, prompting an early end.",
        "{{winner}} battered {{loser}} into submission, forcing a {{adj}} end to the bout.",
        "{{winner}} ground {{loser}} down. The Arenamaster called the stoppage.",
        "The officials intervened before a tragedy could occur.",
        "A mercy stoppage saved a life today.",
        "The referee waved it off as the punishment became too severe.",
        "Called off due to excessive bleeding.",
        "A necessary stoppage in a violently one-sided match.",
        "The medic called it before further damage was done."
      ],
      Exhaustion: [
        "A battle of attrition ended with {{loser}} unable to stand, handing {{winner}} the victory.",
        "Lungs burning and muscles failing, {{winner}} barely edged out {{loser}} at the limit.",
        "In a grueling test of wills, {{winner}} outlasted a completely spent {{loser}}.",
        "Both fighters pushed to total exhaustion. {{winner}} was awarded the bout.",
        "Collapsed from sheer fatigue.",
        "A battle where stamina gave out before spirit.",
        "They literally fought until they could no longer stand.",
        "A war of attrition ends with empty tanks.",
        "Exhaustion claims the final toll.",
        "Pushed past the absolute limit of human endurance."
      ],
      Draw: [
        "Neither warrior could claim the edge; a brutal stalemate was the only result.",
        "The bell saved them both from mutual destruction in an epic clash.",
        "The sands of time ran out before a victor could be declared.",
        "A mutual standstill.",
        "Neither could find the edge in a bitter stalemate.",
        "A rare, hard-fought draw.",
        "Both fighters leave with respect, but no victory.",
        "An inconclusive end to a fierce rivalry.",
        "They fought to a bloody standstill.",
        "A grueling stalemate ends with no clear victor.",
        "Both combatants exhausted, the match is declared a draw.",
        "An evenly matched contest results in a bloody draw.",
        "Neither warrior could break the other's resolve, ending in a mutual stalemate.",
        "A testament to equal skill and unyielding endurance, resulting in no true winner."
      ],
      Default: [
        "A grueling test between {{a}} and {{d}} saw {{winner}} raise their arms in victory.",
        "A hard-fought struggle between {{a}} and {{d}} ended in {{winner}}'s favor.",
        "{{winner}} emerged triumphant over {{loser}} in a hard-fought contest.",
        "A victory by default.",
        "The opponent failed to answer the call.",
        "A hollow win due to forfeit.",
        "Awarded the win as the challenger withdrew.",
        "Victory claimed without striking a blow.",
        "A disappointing anti-climax by default.",
        "A standard bout concludes with a predictable outcome.",
        "Another day, another victory in the blood-soaked sands.",
        "The expected result plays out as the crowd watches on.",
        "A typical day in the arena ends with a familiar victory.",
        "Routine combat yields the anticipated victor."
      ]
    },
    headlines: {
      LegendaryStreak: [
        "Week {{week}}: BLOOD GOD ASCENDANT! {{name}} Claims {{streak}} Wins Without Breaking a Sweat!",
        "Week {{week}}: THE ARENA WEEPS! {{name}}'s Blood-Soaked {{streak}}-Win Streak Continues!",
        "Week {{week}}: THE REAPER'S FAVORITE! {{name}} Reaches {{streak}} Consecutive Victories!",
        "Week {{week}}: UNRIVALED TITAN! {{name}} Ascends to Godhood with {{streak}} Wins!",
        "Week {{week}}: IMMORTAL PATH! {{name}}'s {{streak}}-Win Streak Defies the Gods!",
        "Week {{week}}: UNSTOPPABLE! {{name}} Extends Legendary {{streak}}-Win Streak!",
        "Week {{week}}: THE UNTOUCHABLE {{name}} Achieves {{streak}} Wins!"
      ],
      HotStreak: [
        "Week {{week}}: CAN ANYONE STOP THEM? {{name}} Smashes Their Way to {{streak}} Wins!",
        "Week {{week}}: BLOOD AND SAND! {{name}} Paints the Arena Red with {{streak}} Wins!",
        "Week {{week}}: THE CROWD'S DARLING! {{name}} is Undefeated in {{streak}} Matches!",
        "Week {{week}}: {{name}} Is On Fire \u2014 {{streak}} Consecutive Victories!",
        "Week {{week}}: THE CROWD GOES WILD FOR {{name}} \u2014 {{streak}} Wins!"
      ],
      Streak: [
        "Week {{week}}: {{name}} Continues to Climb With {{streak}} Consecutive Wins!",
        "Week {{week}}: {{name}} Rides a {{streak}}-Win Streak Into Glory!",
        "Week {{week}}: {{name}} Builds Momentum \u2014 {{streak}} Victories!"
      ],
      LegacyRivalry: [
        "Week {{week}}: BAD BLOOD BOILS OVER! {{a}} Meets {{b}} in Chapter {{count}} of Their Vicious Feud!",
        "Week {{week}}: THE ARENA DIVIDED! Fans Riot as {{a}} Faces {{b}} for the {{count}}{{suffix}} Time!",
        "Week {{week}}: ETERNAL FOES! {{a}} and {{b}} Clash in Chapter {{count}} of Their Saga!",
        "Week {{week}}: THE GRUDGE MATCH OF THE CENTURY! {{a}} vs {{b}} (Chapter {{count}})",
        "Week {{week}}: RIVALRY ERUPTS! {{a}} vs {{b}} \u2014 Chapter {{count}}!"
      ],
      Rivalry: [
        "Week {{week}}: BITTER ENEMIES MEET! {{a}} and {{b}} Trade Blows Again!",
        "Week {{week}}: BLOOD FEUD! {{a}} and {{b}} meet again in the pit!",
        "Week {{week}}: OLD SCORES SETTLED! {{a}} vs {{b}}"
      ],
      RisingStar: [
        "Week {{week}}: WATCH THEM RISE! {{name}} Proves Untouchable!",
        "Week {{week}}: NEW BLOOD! {{name}} Shows Champion Potential!",
        "Week {{week}}: A STAR IS BORN! {{name}} remains undefeated!"
      ],
      Upset: [
        "Week {{week}}: DOWN GOES THE TITAN! {{winner}} Pulls Off the Upset of the Century Over {{loser}}!",
        "Week {{week}}: SHOCKER IN THE SANDS! The Unknown {{winner}} Dismantles the Mighty {{loser}}!",
        "Week {{week}}: THE KING IS DEAD! {{winner}} Causes the Greatest Upset of the Season!",
        "Week {{week}}: THE SANDS SHIFT! Nobody expected {{winner}} to massacre {{loser}}!",
        "Week {{week}}: A MIRACLE IN BLOOD! {{winner}} Defies the Gods, Slaying {{loser}}!",
        "Week {{week}}: SHOCKER! Unknown {{winner}} Decimates The Great {{loser}}!",
        "Week {{week}}: DAVID SLAYS GOLIATH! {{winner}} Brings Down {{loser}}!",
        "The Mighty Fall! {{winner}} Shocks the Arena, Defeats {{loser}}!",
        "Week {{week}}: UPSET! {{winner}} Topples the Mighty {{loser}}!",
        "A New King is Crowned: {{winner}} Topples the Great {{loser}}",
        "Unthinkable! {{loser}}'s Reign Ended by Underdog {{winner}}"
      ],
      MultipleKills: [
        "Week {{week}}: SLAUGHTER IN THE SANDS! {{count}} Fatalities Recorded!",
        "Week {{week}}: A BLOODBATH! Multiple Warriors Perish in the Sands!",
        "Week {{week}}: THE REAPER'S HARVEST! {{count}} warriors fallen!",
        "Week {{week}}: A BLOODY WEEK! {{count}} Souls Sent to the Void!",
        "Week {{week}}: THE ARENA WEEPS RED! A Week of Brutal Massacres!",
        "Week {{week}}: CARNAGE! The Morticians Work Overtime This Week!"
      ],
      Kill: [
        "Week {{week}}: SLAUGHTER ON THE SANDS: {{killer}} EXECUTES {{loser}} IN BRUTAL SPECTACLE",
        "Week {{week}}: NO MERCY SHOWN: {{loser}} LEAVES ARENA IN PIECES AT HANDS OF {{killer}}",
        "Week {{week}}: THE BUTCHER OF THE SANDS! {{killer}} Eviscerates {{loser}}!",
        "Week {{week}}: A GORE-SOAKED SPECTACLE! {{killer}} Disassembles {{loser}}!",
        "Week {{week}}: NO QUARTER GIVEN! {{killer}}'s Brutal Slaying of {{loser}}!",
        "Week {{week}}: FATALITY! {{killer}} Slaughters {{loser}} in Cold Blood!",
        "Week {{week}}: THE RAVENS FEAST! {{killer}} leaves {{loser}} in pieces.",
        "Week {{week}}: A GRISLY END! {{killer}}'S FATAL BLOW SHATTERS {{loser}}",
        "A Grisly End: {{killer}} Dismembers {{loser}} in Front of Roaring Fans",
        "Week {{week}}: A TRAGIC DEMISE. {{loser}} Falls to {{killer}}'s Blade!",
        "Week {{week}}: FATAL BLOW! {{killer}} Sends an Opponent to the Grave!",
        "Week {{week}}: GRUESOME END! {{killer}} Claims the Head of {{loser}}!",
        "Week {{week}}: BLOOD SOAKED VICTORY! {{killer}} CLAIMS ANOTHER SOUL",
        "Week {{week}}: THE REAPER SMILES: {{killer}} MASSACRES {{loser}}",
        "Week {{week}}: BLOOD ON THE SANDS! A Brutal Kill By {{killer}}!",
        "No Mercy: {{killer}} executes {{loser}} with absolute brutality",
        "A Fatal Encounter: {{winner}} stands over {{loser}}'s corpse",
        "Week {{week}}: DEATH IN THE PIT! {{killer}} claims a life!",
        "Carnage in the Sands! {{killer}} Butchers {{loser}}",
        "A Gruesome End: The Life of {{loser}} Snuffed Out",
        "Death in the Dust: {{loser}} Falls to {{winner}}",
        "No Mercy: {{winner}} Claims Another Skull"
      ],
      MultipleKOs: [
        "Week {{week}}: {{adj}} DEVASTATION! The sands are littered with the fallen!",
        "Week {{week}}: {{adj}} CARNAGE! The Healers Will Work Late Tonight!",
        "Week {{week}}: BODIES EVERYWHERE! A Week of {{adj}} Knockouts!"
      ],
      Standard: [
        "Week {{week}}: {{adj}} CLASHES! The arena roars for its champions!",
        "Week {{week}}: ANOTHER WEEK OF {{adj}} WARFARE IN THE PIT!",
        "Week {{week}}: {{adj}} BOUTS KEEP THE CROWD ROARING!",
        "Bloodshed in the Arena: A New Challenger Emerges",
        "The Sand Drinks Again: Another Cycle Concludes",
        "Blades and Glory: The Latest Spectacle"
      ],
      Empty: [
        "Week {{week}}: NO BLOOD SHED TODAY. An eerie quiet settles over the sands.",
        "Week {{week}}: A quiet week in the arena. The peace won't last.",
        "Week {{week}}: SILENCE IN THE ARENA. The calm before the storm."
      ],
      Graveyard: [
        "A Moment of Silence for the {{count}} Warrior{{plural}} Lost This Week.",
        "The Hall of Warriors receives {{count}} new name{{plural}} this week.",
        "The Halls of the Dead Welcome {{count}} New Soul{{plural}}."
      ],
      major_upset: [
        "Week {{week}}: THE HEAVENS SHAKE! {{winner}} achieves an impossible victory over {{loser}}!",
        "Week {{week}}: STUNNING REVERSAL: {{winner}} SHATTERS EXPECTATIONS AGAINST {{loser}}!",
        "Week {{week}}: {{loser}} HUMILIATED! A stunning victory for the underdog {{winner}}!",
        "Week {{week}}: GODS BLEED! The mighty {{loser}} has been struck down by {{winner}}!",
        "Week {{week}}: DOWN GOES THE CHAMPION! {{winner}} causes the upset of the century!",
        "Week {{week}}: PANDEMONIUM! The Legendary {{loser}} falls to the lowly {{winner}}!",
        "Week {{week}}: CROWD IN DISBELIEF AS {{winner}} DISMANTLES THE FAVORITE {{loser}}",
        "Week {{week}}: THE UNTHINKABLE HAPPENS: {{loser}} TOPPLED BY UNDERDOG {{winner}}",
        "Week {{week}}: BOOKMAKERS WEEP! {{winner}} defies all odds against {{loser}}!",
        "Week {{week}}: THE UNTHINKABLE HAPPENS! {{winner}} SHOCKS THE WORLD!",
        "Week {{week}}: A MONUMENTAL UPSET! {{winner}} DEFIES THE ODDS"
      ],
      win_streak: [
        "Week {{week}}: THE JUGGERNAUT! {{name}} secures their {{streak}}th consecutive victory!",
        "Week {{week}}: THE STREAK LIVES ON: {{name}} REMAINS UNDEFEATED IN {{streak}} CLASHES",
        "Week {{week}}: UNSTOPPABLE! {{name}} CONTINUES THEIR BLOODY REIGN ({{streak}} WINS)",
        "Week {{week}}: NO END IN SIGHT FOR {{name}}'S REIGN OF TERROR ({{streak}} STRAIGHT)",
        "Week {{week}}: WHO CAN STOP THEM? {{name}} notches win number {{streak}}!",
        "Week {{week}}: A TRAIL OF BODIES! {{name}}'s win streak hits {{streak}}!",
        "Week {{week}}: FLAWLESS! {{name}} celebrates {{streak}} straight wins!",
        "Week {{week}}: {{name}}'S RAMPAGE CONTINUES! {{streak}} AND COUNTING!"
      ]
    },
    featured: {
      LegendaryStreak: [
        "Bards will sing of {{name}} for generations. A {{streak}}-win streak cements their immortal legacy.",
        "Few live to see such glory. {{name}} has achieved the impossible with {{streak}} straight wins.",
        "Whispers of the ancients surround {{name}}, whose {{streak}} victories have become legend."
      ],
      HotStreak: [
        "The crowd's favorite, {{name}}, leaves another broken body in the dust for win number {{streak}}.",
        "It seems no one can find a weakness in {{name}}'s armor. {{streak}} wins and counting.",
        "{{name}} is unstoppable, carving a path through the rankings with {{streak}} wins."
      ],
      Streak: [
        "Slowly but surely, {{name}} climbs the ranks. {{streak}} wins show great promise.",
        "A solid foundation is being built by {{name}} with their {{streak}}th win.",
        "The momentum stays with {{name}} as they secure their {{streak}}th win."
      ],
      LegacyRivalry: [
        "We thought we had seen it all, but the {{count}}{{suffix}} bout between {{a}} and {{b}} was a masterpiece of violence.",
        "The grand history between {{a}} and {{b}} continues. This was their {{count}}{{suffix}} meeting.",
        "The hatred between {{a}} and {{b}} transcends the sport. Chapter {{count}} did not disappoint."
      ],
      Rivalry: [
        "There is no love lost between {{a}} and {{b}}. The tension in the arena was palpable.",
        "Sparks flew as {{a}} and {{b}} collided in a highly anticipated grudge match.",
        "The bad blood between {{a}} and {{b}} was on full display today."
      ],
      RisingStar: [
        "Flawless execution. {{name}} is proving to be a dangerous new addition to the roster.",
        "The veterans are watching their backs. {{name}} looks to be the real deal.",
        "All eyes are on {{name}}, a rising star who refuses to taste defeat."
      ],
      Upset: [
        "A humbling moment for {{loser}} (fame: {{fameL}}) as they fall to the much lesser-known {{winner}} (fame: {{fameW}}).",
        "Nobody saw it coming! {{winner}} (fame: {{fameW}}) shattered the ego of the celebrated {{loser}} (fame: {{fameL}}).",
        "The impossible happened! {{winner}} (fame: {{fameW}}) overcame {{loser}} (fame: {{fameL}})."
      ],
      Graveyard: [
        "The sands drink deeply today. We remember the {{count}} soul{{plural}} claimed by the arena.",
        "Not all who enter the pit leave it. {{count}} fighter{{plural}} paid the ultimate price.",
        "We mourn the {{count}} warrior{{plural}} who gave everything to the sands this week."
      ]
    },
    season_summary: {
      headline: "{{season}} Season in Review: {{total}} Bouts, {{kills}} Deaths",
      body: [
        "The {{season}} season concludes with {{total}} bouts fought and a {{killRate}}% fatality rate.",
        "It was a particularly deadly season \u2014 many promising careers cut short.",
        "The arena turns its gaze to the next season. What legends will emerge?",
        "{{style}} dominated the meta with {{wins}} victories."
      ]
    }
  },
  ux_metadata: {
    version: "3.0.0",
    description: "Unified Bard 1.0 \u2014 Universal Narrative Archive",
    mood_tone: {
      Calm: {
        adjectives: [
          "measured",
          "technical",
          "efficient",
          "precise",
          "collected",
          "methodical",
          "unfazed",
          "serene",
          "calculating",
          "composed",
          "deliberate",
          "tranquil",
          "peaceful",
          "placid",
          "undisturbed"
        ],
        opener: [
          "The arena is quiet today, the air heavy with expectation.",
          "The arena breathes a slow, measured sigh as the combatants step forward.",
          "No roaring cheers, only the quiet tension of professional combat.",
          "A chilling stillness settles over the sands.",
          "The combatants circle with calculated grace, untouched by the crowd's fervor.",
          "A silent intensity heralds the beginning of a masterful bout.",
          "A moment of peace.",
          "The silence settles in.",
          "All is quiet.",
          "Tranquility reigns.",
          "A gentle breeze blows.",
          "The stillness is profound.",
          "Calm before the storm.",
          "A rare serene moment.",
          "Quiet expectation."
        ],
        closer: [
          "A professional display by the arena's finest.",
          "The bout concludes with surgical precision.",
          "A quiet nod of respect marks the end of the conflict.",
          "The silence returns, broken only by the sound of measured breathing.",
          "A cold, methodical victory is claimed.",
          "The arena accepts the outcome with a hushed reverence.",
          "And then it passes.",
          "The peace holds.",
          "Quiet remains.",
          "Stillness endures.",
          "A deep breath.",
          "The calm persists.",
          "Silence echoes.",
          "Tranquil fade.",
          "Serenity."
        ]
      },
      Bloodthirsty: {
        adjectives: [
          "savage",
          "vicious",
          "bloodthirsty",
          "blood-soaked",
          "gory",
          "macabre",
          "unforgiving",
          "brutal",
          "ruthless",
          "ferocious",
          "barbaric",
          "ravenous",
          "carnage-filled",
          "merciless",
          "cutthroat",
          "visceral",
          "murderous",
          "carnivorous"
        ],
        opener: [
          "They want blood, and the arena delivers!",
          "The crowd screams for slaughter as the gates violently swing open!",
          "Bloodlust thickens the air, a palpable frenzy waiting to erupt.",
          "The combatants bare their teeth, eager to paint the sands crimson.",
          "A primal roar shakes the stands\u2014the butcher's work begins now!",
          "The thirst for violence is undeniable today!",
          "Blood for the blood god.",
          "The scent of copper fills the air.",
          "A violent frenzy begins.",
          "No mercy here.",
          "The slaughter commences.",
          "Carnage awaits.",
          "A brutal display.",
          "Flesh and blood.",
          "The red mist descends."
        ],
        closer: [
          "No mercy was found today in the circle of truth.",
          "The sands are saturated, the crowd's hunger satiated for now.",
          "A brutal slaughter concludes, leaving nothing but carnage.",
          "The victorious roar echoes over the mangled remains of the defeated.",
          "The blood tax is paid in full.",
          "A savage end to a truly merciless encounter.",
          "The blood dries.",
          "A grisly end.",
          "No survivors.",
          "The slaughter is complete.",
          "A violent conclusion.",
          "The frenzy subsides.",
          "Carnage ends.",
          "Blood everywhere.",
          "A brutal finish."
        ]
      },
      Theatrical: {
        adjectives: [
          "showy",
          "spectacular",
          "grand",
          "epic",
          "cinematic",
          "operatic",
          "ostentatious",
          "bombastic",
          "flamboyant",
          "dazzling",
          "larger-than-life",
          "breathtaking",
          "exaggerated",
          "stunning",
          "magnificent",
          "theatrical",
          "dramatic"
        ],
        opener: [
          "A drama unfolds on the sands today!",
          "The curtain rises on today's grand spectacle of steel and blood!",
          "A breathtaking display of martial artistry is about to unfold!",
          "The combatants enter not as fighters, but as legends on a grand stage.",
          "Every eye is glued to the sands as the overture of battle begins.",
          "Prepare for a performance that will echo in eternity!",
          "The curtain rises.",
          "A grand performance.",
          "The stage is set.",
          "A show for the ages.",
          "All eyes on them.",
          "A dramatic entrance.",
          "The spotlight shines.",
          "A flamboyant display.",
          "A theatrical moment."
        ],
        closer: [
          "A performance for the ages, etched in the memories of all who watched.",
          "A stunning finale leaves the crowd roaring for an encore!",
          "The victorious gladiator takes a well-deserved bow.",
          "A masterclass in showmanship concludes with dramatic flair.",
          "The final act falls, closing a truly operatic display of violence.",
          "A performance worthy of the highest praise!",
          "The curtain falls.",
          "A grand finale.",
          "Applause echoes.",
          "A bow to the crowd.",
          "The show ends.",
          "A dramatic exit.",
          "The spotlight fades.",
          "A flamboyant finish.",
          "A theatrical conclusion."
        ]
      },
      Solemn: {
        adjectives: [
          "heavy",
          "shadowed",
          "somber",
          "mournful",
          "melancholy",
          "grim",
          "fateful",
          "resigned",
          "sorrowful",
          "stoic",
          "grave",
          "serious",
          "earnest",
          "dignified",
          "solemn"
        ],
        opener: [
          "A heavy silence hangs over the arena walls.",
          "A heavy, mournful wind blows across the empty sands.",
          "The fighters step forward, carrying the weight of inevitable tragedy.",
          "There is no joy in today's combat, only grim necessity.",
          "The arena feels more like a graveyard as the bout begins.",
          "A quiet sorrow hangs in the air, a prelude to loss.",
          "A grave moment.",
          "The mood is serious.",
          "A somber occasion.",
          "An earnest beginning.",
          "A dignified silence.",
          "A solemn moment.",
          "Grave tidings.",
          "A serious tone.",
          "A somber mood."
        ],
        closer: [
          "The games continue, though the air remains thick with memory.",
          "A tragic conclusion to a heavy burden.",
          "The survivor stands alone, victorious but unsmiling.",
          "The sands claim another soul in somber silence.",
          "A bitter victory won at a terrible cost.",
          "The echoes of the battle fade into a mournful quiet.",
          "A grave end.",
          "The serious tone fades.",
          "A somber conclusion.",
          "An earnest finish.",
          "A dignified departure.",
          "A solemn end.",
          "Grave silence.",
          "A serious close.",
          "A somber finale."
        ]
      },
      Festive: {
        adjectives: [
          "vibrant",
          "energetic",
          "celebratory",
          "boisterous",
          "jubilant",
          "riotous",
          "gleeful",
          "merry",
          "exuberant",
          "spirited",
          "joyous",
          "joyful",
          "cheerful",
          "jovial",
          "festive"
        ],
        opener: [
          "Music and laughter fill the air as the festive games begin!",
          "The arena is a carnival of color and noise today!",
          "Laughter and cheers cascade from the stands as the games commence!",
          "A joyous uproar greets the fighters as they take the field.",
          "Wine flows and songs are sung\u2014let the festive bout begin!",
          "The atmosphere is nothing short of a grand celebration!",
          "A joyous occasion.",
          "The mood is merry.",
          "A cheerful beginning.",
          "A jovial atmosphere.",
          "A festive moment.",
          "A celebratory tone.",
          "Joyful tidings.",
          "A merry mood.",
          "A cheerful start."
        ],
        closer: [
          "A day of celebration ends with hearts full and wine flowing.",
          "The crowd erupts in joyous celebration of a fantastic bout!",
          "The victorious fighter is showered in flowers and wine!",
          "A brilliant end to a day of glorious revelry.",
          "The festival continues, fueled by the excitement of the arena.",
          "Cheers ring out, capping off a spectacular and spirited contest.",
          "A joyous end.",
          "The merry mood fades.",
          "A cheerful conclusion.",
          "A jovial finish.",
          "A festive departure.",
          "A celebratory end.",
          "Joyful silence.",
          "A merry close.",
          "A cheerful finale."
        ]
      }
    }
  }
};
// src/data/narrative/recruitment.json
var recruitment_default = {
  recruitment: {
    names: [
      "ARAK",
      "BRIX",
      "CARN",
      "DRAV",
      "ESKA",
      "FAEL",
      "GRIX",
      "HASK",
      "IVOR",
      "JETT",
      "KAEL",
      "LYNX",
      "MORD",
      "NYX",
      "ORIN",
      "PYKE",
      "QUIL",
      "RASK",
      "SORN",
      "TAHL",
      "URSA",
      "VALK",
      "WREN",
      "XAEL",
      "YGOR",
      "ZETH",
      "BANE",
      "CROW",
      "DUSK",
      "EDGE",
      "FLUX",
      "GALE",
      "HAZE",
      "IRON",
      "JADE",
      "KNOT",
      "LASH",
      "MACE",
      "NAIL",
      "OMEN",
      "PYRE",
      "RAZE",
      "SCAR",
      "TUSK",
      "VICE",
      "WOLF",
      "AXEL",
      "BLITZ",
      "CRAG",
      "DIRK",
      "ECHO",
      "FLAK",
      "GRIM",
      "HAWK",
      "INK",
      "JINX",
      "KITE",
      "LURK",
      "MOSS",
      "NOCK",
      "OPUS",
      "PALE",
      "ROOK",
      "SLAG",
      "TORN",
      "ULRIC",
      "VEX",
      "WYRM",
      "XENO",
      "YOKE",
      "ZINC",
      "ASHE",
      "BOSK",
      "CHAR",
      "DALE",
      "ETCH",
      "FERN",
      "GHOL",
      "HELM",
      "ISLE",
      "JOLT",
      "KERN",
      "LOOM",
      "MIRK",
      "NARD",
      "OPAL",
      "PITH",
      "RIME",
      "SILT",
      "TARN",
      "VALE",
      "WOAD",
      "ZEAL",
      "BRAGG",
      "DREAD",
      "FORGE",
      "GLINT",
      "HAVOK",
      "KREEL",
      "LANCE",
      "MAUL",
      "RASP",
      "SCALD",
      "RYLIX",
      "Balen",
      "Quain",
      "Eryan",
      "Loren",
      "Maelar",
      "Rylic",
      "Quaix",
      "Galyr",
      "Balis",
      "Taeic",
      "Joryn",
      "Maelia",
      "Nymius",
      "Haeus",
      "Nymon",
      "Maelos",
      "Othyn",
      "Aelyn",
      "Corius",
      "Fenic",
      "Phain",
      "Sylad",
      "Eryox",
      "Ithan",
      "Sylyn",
      "Sylel",
      "Phayr",
      "Quayr",
      "Phaos",
      "Haeic",
      "Maelel",
      "Haeen",
      "Lorad",
      "Rylel",
      "Haeos",
      "Aelad",
      "Taeer",
      "Phaius",
      "Sylis",
      "Coren",
      "Aelyr",
      "Daean",
      "Othar",
      "Phael",
      "Rylad",
      "Fenis",
      "Rylar",
      "Ithin",
      "Phaia",
      "Sylix",
      "Daeyr",
      "Balan",
      "Coran",
      "Othor",
      "Joren",
      "Lorar",
      "Nymix",
      "Daeer",
      "Sylus",
      "Ithor",
      "Jorar",
      "Ithon",
      "Quaos",
      "Quaen",
      "Quais",
      "Balos",
      "Eryon",
      "Phaer",
      "Lorel",
      "Phaan",
      "Eryyn",
      "Quaia",
      "Maelin",
      "Sylar",
      "Ither",
      "Balyn",
      "Balox",
      "Joric",
      "Quaer",
      "Daeen",
      "Eryus",
      "Quaox",
      "Nymen",
      "Ithyn",
      "Loria",
      "Joros",
      "Maelix",
      "Corel",
      "Quaad",
      "Nyma",
      "Eryyr",
      "Othius",
      "Galyn",
      "Taeos",
      "Quaic",
      "Aelor",
      "Rylyr",
      "Loror",
      "Rylan",
      "Nymyr",
      "Maelen",
      "Nymic",
      "Daeia",
      "Ryler",
      "Maelon",
      "Corox",
      "Loryr",
      "Gala",
      "Haeyr",
      "Sylia",
      "Corer",
      "Haeox",
      "Maelus",
      "Eryix",
      "Rylin",
      "Haeer",
      "Phaix",
      "Eryar",
      "Taead",
      "Rylos",
      "Balyr",
      "Galox",
      "Balus",
      "Balar",
      "Galix",
      "Fenen",
      "Haeon",
      "Taeor",
      "Fenon",
      "Lorer",
      "Galic",
      "Haean",
      "Gardred",
      "Fenvir",
      "Kayson",
      "Kayion",
      "Dewold",
      "Rolriel",
      "Perien",
      "Braner",
      "Aelson",
      "Sylth",
      "Cadzak",
      "Thodred",
      "Draoy",
      "Tafwon",
      "Leifth",
      "Bjorir",
      "Rhysar",
      "Valrir",
      "Harson",
      "Grommar",
      "Zardar",
      "Thodon",
      "Knuulf",
      "Ywvan",
      "Gwynmar",
      "Tafild",
      "Ewagon",
      "Eriey",
      "Ywold",
      "Harald",
      "Finson",
      "Niakor",
      "Gawdor",
      "Kayay",
      "Garethton",
      "Dagien",
      "Gawvok",
      "Svenmon",
      "Gawion",
      "Rhysoy",
      "Rolvok",
      "Hrothvon",
      "Gromuy",
      "Beduy",
      "Baelmon",
      "Gawvan",
      "Bedulf",
      "Harmund",
      "Haralf",
      "Llyalf",
      "Ulfulf",
      "Llyy",
      "Olafur",
      "Rhyston",
      "Syldor",
      "Dewy",
      "Aelton",
      "Olafalf",
      "Halold",
      "Kordor",
      "Korion",
      "Tafmar",
      "Knumund",
      "Ewaey",
      "Niaion",
      "Gromxon",
      "Perth",
      "Valdon",
      "Sylron",
      "Korvir",
      "Ewavan",
      "Thour",
      "Baelriel",
      "Dagild",
      "Langosh",
      "Hrothalf",
      "Torir",
      "Lanson",
      "Fendred",
      "Lanulf",
      "Baelgosh",
      "Cadriel",
      "Niavok",
      "Leifdar",
      "Garmon",
      "Vorron",
      "Drason",
      "Lany",
      "Rolric",
      "Artild",
      "Roldar",
      "Cadmon",
      "Trisor",
      "Ewaien",
      "Leifwon",
      "Artur",
      "Dewgosh",
      "Draulf",
      "Gawson",
      "Valvir",
      "Garnir",
      "Dagur",
      "Huwmar",
      "Rhysvan",
      "Kayold",
      "Ewazon",
      "Olafron",
      "Trisdred",
      "Torion",
      "Perrir",
      "Bjory",
      "Svenien",
      "Valalf",
      "Cadian",
      "Garvok",
      "Llyien",
      "Huwson",
      "Hrothey",
      "Branold",
      "Halgosh",
      "Korvon",
      "Perzon",
      "Halgon",
      "Rolild",
      "Gwynton",
      "Knuth",
      "Tristh",
      "Leifrir",
      "Llydar",
      "Bedgath",
      "Svenuy",
      "Gawey",
      "Tafor",
      "Baelay",
      "Erinir",
      "Huwgath",
      "Kayoy",
      "Eririel",
      "Gwynwy",
      "Dagvan",
      "Svenold",
      "Halgar",
      "Baelold",
      "Gwynor",
      "Olafvir",
      "Ithoy",
      "Gawvir",
      "Ewamar",
      "Kayalf",
      "Leifalf",
      "Perzak",
      "Ywey",
      "Bednir",
      "Torild",
      "Gromdred",
      "Fingar",
      "Person",
      "Gawar",
      "Gromric",
      "Ithey",
      "Aelxon",
      "Garethwy",
      "Harzon",
      "Niaoun",
      "Haroun",
      "Garwy",
      "Artion",
      "Macric",
      "Dewdan",
      "Thorgar",
      "Thormash",
      "Thorrok",
      "Thorthos",
      "Thordor",
      "Thorgath",
      "Thormak",
      "Thorgosh",
      "Thorkan",
      "Thorgorn",
      "Thordran",
      "Grommash",
      "Gromrok",
      "Gromthos",
      "Gromdor",
      "Gromgath",
      "Gromgosh",
      "Gromkan",
      "Gromgorn",
      "Gromdran",
      "Baelgar",
      "Baelmash",
      "Baelrok",
      "Baelthos",
      "Baeldor",
      "Baelgath",
      "Baelmak",
      "Baelkan",
      "Baelgorn",
      "Baeldran",
      "Zargar",
      "Zarmash",
      "Zarrok",
      "Zarthos",
      "Zardor",
      "Zargath",
      "Zarmak",
      "Zarzor",
      "Zargosh",
      "Zarkan",
      "Zarkor",
      "Zartar",
      "Zarvar",
      "Zarrak",
      "Zarnok",
      "Zarmar",
      "Zarkar",
      "Zargorn",
      "Zardran",
      "Kaelzor",
      "Kaeltar",
      "Kaelrak",
      "Kaelnok",
      "Vorngar",
      "Vornmash",
      "Vornrok",
      "Vornthos",
      "Vorndor",
      "Vorngath",
      "Vornmak",
      "Vorngosh",
      "Vornkan",
      "Vorngorn",
      "Vorndran",
      "Rathgar",
      "Rathmash",
      "Rathrok",
      "Raththos",
      "Rathdor",
      "Rathgath",
      "Rathmak",
      "Rathgosh",
      "Rathkan",
      "Rathgorn",
      "Rathdran",
      "Drakgar",
      "Drakmash",
      "Drakrok",
      "Drakthos",
      "Drakdor",
      "Drakgath",
      "Drakmak",
      "Drakgosh",
      "Drakkan",
      "Drakgorn",
      "Drakdran",
      "Ulfgar",
      "Ulfmash",
      "Ulfrok",
      "Ulfthos",
      "Ulfdor",
      "Ulfgath",
      "Ulfmak",
      "Ulfzor",
      "Ulfgosh",
      "Ulfkan",
      "Ulfkor",
      "Ulftar",
      "Ulfvar",
      "Ulfrak",
      "Ulfnok",
      "Ulfdar",
      "Ulfmar",
      "Ulfkar",
      "Ulfgorn",
      "Ulfdran",
      "Grimgar",
      "Grimmak",
      "Grimzor",
      "Grimnok",
      "Malgar",
      "Malmash",
      "Malrok",
      "Malthos",
      "Maldor",
      "Malgath",
      "Malmak",
      "Malzor",
      "Malkan",
      "Malkor",
      "Maltar",
      "Malvar",
      "Malrak",
      "Malnok",
      "Maldar",
      "Malmar",
      "Malkar",
      "Malgorn",
      "Maldran",
      "Vorzor",
      "Vorkor",
      "Vortar",
      "Vorvar",
      "Vorrak",
      "Vordar",
      "Vormar",
      "Vorkar",
      "Tharzor",
      "Thartar",
      "Tharrak",
      "Tharnok",
      "Gorgar",
      "Gormash",
      "Gorrok",
      "Gorthos",
      "Gordor",
      "Gorgath",
      "Gormak",
      "Gorzor",
      "Gorgosh",
      "Gorkan",
      "Gorkor",
      "Gortar",
      "Gorvar",
      "Gorrak",
      "Gornok",
      "Gordar",
      "Gormar",
      "Gorkar",
      "Gorgorn",
      "Gordran",
      "Korgar",
      "Korrok",
      "Kormak",
      "Korzor",
      "Korkan",
      "Korkor",
      "Kortar",
      "Korvar",
      "Korrak",
      "Kornok",
      "Kordar",
      "Kormar",
      "Korkar",
      "Vargar",
      "Varrok",
      "Vardor",
      "Varmak",
      "Varzor",
      "Varkan",
      "Varkor",
      "Vartar",
      "Varvar",
      "Varrak",
      "Varnok",
      "Vardar",
      "Varmar",
      "Varkar",
      "Tarngar",
      "Tarnmash",
      "Tarnthos",
      "Tarndor",
      "Tarngath",
      "Tarnmak",
      "Tarngosh",
      "Tarnkan",
      "Tarngorn",
      "Tarndran",
      "Brangar",
      "Branmash",
      "Branrok",
      "Branthos",
      "Brandor",
      "Brangath",
      "Branmak",
      "Brangosh",
      "Brankan",
      "Brangorn",
      "Brandran",
      "Skargar",
      "Skarmash",
      "Skarrok",
      "Skarthos",
      "Skardor",
      "Skargath",
      "Skarmak",
      "Skargosh",
      "Skarkan",
      "Skargorn",
      "Skardran",
      "Fengar",
      "Fenmash",
      "Fenrok",
      "Fenthos",
      "Fendor",
      "Fengath",
      "Fenmak",
      "Fenzor",
      "Fengosh",
      "Fenkan",
      "Fenkor",
      "Fentar",
      "Fenvar",
      "Fenrak",
      "Fennok",
      "Fendar",
      "Fenmar",
      "Fenkar",
      "Fengorn",
      "Fendran",
      "Zhaiia",
      "Thephe",
      "Gleablae",
      "Austut",
      "Mojaicre",
      "Khoupheu",
      "Eahai",
      "Okeatrea",
      "Uikhswiesm",
      "Esacra",
      "Oekrjiz",
      "Oojuachau",
      "Creakloozh",
      "Maupeuhik",
      "Veuzoapsia",
      "Joakrepeu",
      "Noudrarswi",
      "Khovroosl",
      "Kraitoa",
      "Coifluzh",
      "Theaclcoeb",
      "Zhaukoa",
      "Oiau",
      "Ruasloa",
      "Fliosha",
      "Snorfrooia",
      "Braispe",
      "Grouhuapha",
      "Aecee",
      "Oodrdudroz",
      "Eeblai",
      "Uvoo",
      "Keukrsau",
      "Hoeeepluab",
      "Vraudrau",
      "Gluahicloi",
      "Duakrias",
      "Ueneiz",
      "Iothos",
      "Saekecruj",
      "Sneeplbua",
      "Naipleri",
      "Ieklsnui",
      "Wooflio",
      "Pliaja",
      "Eauglyvee",
      "Kriospoiie",
      "Laurkheewy",
      "Breiprua",
      "Ourbafryc",
      "Kriawougl",
      "Siekoi",
      "Aieasw",
      "Bieou",
      "Kleplykret",
      "Suecheasu",
      "Hukri",
      "Vogycrau",
      "Aeauvrauee",
      "Eifrsmoo",
      "Tuewijea",
      "Sythaijoom",
      "Eaukhza",
      "Aipiouepr",
      "Shuici",
      "Speagloatr",
      "Uidri",
      "Shaplkhui",
      "Phuide",
      "Ibruay",
      "Joulou",
      "Huadoefr",
      "Aiai",
      "Yokphoekl",
      "Broey",
      "Jauaeglea",
      "Ouzhaua",
      "Seibeizai",
      "Speeblia",
      "Oosruiboan",
      "Iaaeo",
      "Efluetea",
      "Eertheikr",
      "Shusto",
      "Tieyai",
      "Yokau",
      "Spuievrug",
      "Chuigromeu",
      "Bluiblkria",
      "Zoolstio",
      "Oivreuchai",
      "Uiliyai",
      "Eachaunyie",
      "Smeapoed",
      "Oocaebiot",
      "Spozhspaiu",
      "Preethi",
      "Poroaliov",
      "Phoephuiph",
      "Eakoostapl",
      "Vruibricl",
      "Ucheetr",
      "Ciagfee",
      "Yrousmoi",
      "Euekhduiz",
      "Gruieklnae",
      "Preakybl",
      "Stiafeh",
      "Bluea",
      "Cleiflgrai",
      "Eusmej",
      "Preiwmy",
      "Iebrtreile",
      "Uigaioe",
      "Groie",
      "Soepho",
      "Oukrekr",
      "Oitrstoo",
      "Kheutu",
      "Yoishaui",
      "Uivashuvr",
      "Zhoaniuisp",
      "Stouiekr",
      "Friuav",
      "Uijaublia",
      "Ukoa",
      "Thoglai",
      "Usmthuueia",
      "Freako",
      "Waviabr",
      "Eehtrouue",
      "Oaflihueea",
      "Eaphnaprei",
      "Eiswio",
      "Breduecr",
      "Zeayph",
      "Ciephuest",
      "Swoapluiie",
      "Traemoi",
      "Sooshgeu",
      "Spusoalua",
      "Ouwtuatoev",
      "Duieasmou",
      "Ueiekriol",
      "Claekuisp",
      "Oluab",
      "Sheiveecee",
      "Spauthio",
      "Iestuetree",
      "Naucliegl",
      "Fleoudeufr",
      "Croikliast",
      "Spiajeu",
      "Shoobru",
      "Snoivua",
      "Frioshau",
      "Airpealua",
      "Zheunkiod",
      "Ploie",
      "Thoasua",
      "Saedaiphie",
      "Kykhu",
      "Prysia",
      "Tretrua",
      "Snaiklei",
      "Treedrue",
      "Dreaklia",
      "Uephioy",
      "Loaoikl",
      "Khaubryu",
      "Eundroigl",
      "Plookrbue",
      "Eaclfoioa",
      "Boai",
      "Kiogoa",
      "Eeshau",
      "Braiae",
      "Oisougloaf",
      "Utneuha",
      "Glafro",
      "Toegloayoi",
      "Crepha",
      "Iaphloo",
      "Liagria",
      "Oroa",
      "Uiglgracl",
      "Afai",
      "Flueble",
      "Bloufui",
      "Poeci",
      "Smaisnou",
      "Moachuivr",
      "Slouclou",
      "Lesta",
      "Ciechoesmi",
      "Yauoe",
      "Traesoo",
      "Opkau",
      "Iagiocr",
      "Pijowbal",
      "ZORV",
      "VRAX",
      "THULL",
      "KORV",
      "JAXA",
      "VYL",
      "ZARN",
      "MYRK",
      "RYNUM",
      "CYRENT",
      "ELRYN",
      "BALATH",
      "FENUK",
      "AELOST",
      "GORITH",
      "GORANT",
      "QUIAK",
      "KOREN",
      "AERIM",
      "XENEK",
      "CYRUK",
      "YORONT",
      "LORUM",
      "QELAK",
      "YOROST",
      "ZELIC",
      "SEREK",
      "OZAUS",
      "XENIR",
      "MAEOTH",
      "ZARIM",
      "LORAS",
      "UROK",
      "CORAM",
      "MAEENT",
      "ULRYN",
      "FENAL",
      "LYRETH",
      "VEXUR",
      "WRAAR",
      "HALOK",
      "AELAL",
      "HAEOR",
      "WYNUST",
      "CYRON",
      "ORYAS",
      "COROST",
      "OZAIRC",
      "MOROTH",
      "GRYUST",
      "ZELOR",
      "MAEUK",
      "NEXOK",
      "DEXUK",
      "YRDAN",
      "LYRIST",
      "FENIM",
      "LYROS",
      "VEXUM",
      "WYNON",
      "QUIINT",
      "THOAN",
      "GRYAX",
      "EONURC",
      "HAEAX",
      "RAEYN",
      "LYRER",
      "KYRIK",
      "YRDATH",
      "SYLOD",
      "KORON",
      "XENAN",
      "NEXONT",
      "WYNOK",
      "AELEN",
      "LYROD",
      "FAEYN",
      "PYRIRC",
      "XYLINT",
      "GRYIK",
      "MAEUNT",
      "VEXOTH",
      "BALEL",
      "FENEX",
      "VORAR",
      "MORERC",
      "OZAAST",
      "FAEUK",
      "BALEX",
      "GRYOTH",
      "RAEAR",
      "XYLYN",
      "WYNEK",
      "SERUST",
      "WRAIS",
      "IGNUR",
      "THOAK",
      "KORAS",
      "EONEN",
      "MAEER",
      "VORUST",
      "TYROST",
      "URUK",
      "ITHAX",
      "ORYAN",
      "HALAX",
      "ELRARC",
      "LORERC",
      "ELRINT",
      "RYNYN",
      "RAEURC",
      "JAXEST",
      "OZAINT",
      "VORAS",
      "JOLERC",
      "HAEERC",
      "XENETH",
      "URUR",
      "XYLTH",
      "RAEEST",
      "GRYATH",
      "ORYTH",
      "WRAONT",
      "ZARIS",
      "FENUM",
      "KYRIA",
      "XENEST",
      "QUIORC",
      "FENOD",
      "IGNETH",
      "KYRIR",
      "WRAETH",
      "MAEIC",
      "CYRUS",
      "HALAN",
      "MORUNT",
      "NYXERC",
      "DRAEN",
      "NYXIR",
      "AELEX",
      "NYXOTH",
      "LYRIK",
      "OZAENT",
      "NYXEK",
      "GRYOK",
      "SYLIK",
      "AELUNT",
      "OZAAK",
      "AERIST",
      "BALANT",
      "LOROD",
      "XENAR",
      "DRAAN",
      "QELON",
      "PHOEK",
      "VORANT",
      "FAEEN",
      "MORONT",
      "OZAARC",
      "YRDER",
      "WRAAST",
      "SYLAST",
      "LYRENT",
      "CORETH",
      "MAEUST",
      "TYRON",
      "IGNOTH",
      "JOLYN",
      "WRAOS",
      "GORINT",
      "AELUK",
      "AERYN",
      "CORANT",
      "DRAUM",
      "BALAX",
      "JAXEK",
      "WYNITH",
      "RAEIK",
      "WRAOR",
      "BROMTH",
      "MAEEX",
      "QUION",
      "EONUK",
      "MORANT",
      "ITHOST",
      "PYRINT",
      "LYRIA",
      "PHOANT",
      "BALERC",
      "RAEEX",
      "PYRAN",
      "ZELUK",
      "FENONT",
      "GRYUR",
      "RYNOST",
      "CYRUM",
      "THOITH",
      "GORUK"
    ],
    rival_stable_names: [
      "Shadow Blades",
      "Crimson Guard",
      "Golden Lions",
      "Silent Storm",
      "Gilded Fang",
      "Onyx Shield",
      "Iron Crown",
      "Azure Rose",
      "Nightfall",
      "Ebon Hand",
      "Vanguard"
    ],
    tiers: {
      Common: {
        points: [66, 70],
        cost: 100,
        stars: 0
      },
      Promising: {
        points: [70, 74],
        cost: 150,
        stars: 1
      },
      Exceptional: {
        points: [74, 78],
        cost: 250,
        stars: 2
      },
      Prodigy: {
        points: [78, 82],
        cost: 400,
        stars: 3
      }
    },
    origin: [
      "Found fighting for scraps in the pit districts.",
      "A former soldier seeking glory."
    ],
    style_blurbs: {
      "Aimed Blow": ["Precise and calculating."],
      "Bashing Attack": ["Raw power incarnate."]
    }
  }
};
// src/data/narrative/offseason.json
var offseason_default = {
  offseason_events: {
    chaos_rift: {
      title: "The Chaos Rift",
      effectType: "chaos_rift",
      newsletter: [
        "A bizarre, swirling rift opened temporarily in the training yard. {{name}} bravely stepped inside and returned moments later, holding a glowing crystal and speaking in riddles. (+150 Gold, +25 XP, +15 Fame, Chaotic Insight)"
      ]
    },
    unexplained_monolith: {
      title: "The Unexplained Monolith",
      effectType: "unexplained_monolith",
      newsletter: [
        "A perfectly smooth black monolith appeared overnight in the training yard. {{name}} touched it, stared blankly for an hour, and now fights with unnatural focus but lingering fatigue. (+15 XP, +10 Fame, 'Precise' trait, Minor Fatigue)"
      ]
    },
    tavern_brawl_surprise: {
      title: "A Spontaneous Tavern Brawl",
      effectType: "tavern_brawl_surprise",
      newsletter: [
        "{{name}} got into a massive, unexpected brawl at the local tavern. They took some scrapes, but the patrons loved the show! (+{{fame}} Fame, Minor Injury)"
      ]
    },
    goblin_raid: {
      title: "Goblin Raid",
      effectType: "goblin_raid",
      newsletter: [
        "A sudden goblin raid on the stable! {{name}} fought them off but took a nasty scratch. The stable lost {{gold}} gold in the chaos. (-{{gold}} Gold, Minor Injury)"
      ]
    },
    loyal_stray_dog: {
      title: "A Loyal Stray",
      effectType: "loyal_stray_dog",
      newsletter: [
        "A scruffy stray dog wandered into the training yard and has taken a liking to {{name}}. The gladiator's spirits are lifted! (+10 XP)"
      ]
    },
    strange_dream: {
      title: "A Strange Dream",
      effectType: "strange_dream",
      newsletter: [
        "{{name}} woke up in a cold sweat after a bizarre dream about the arena. They feel oddly invigorated, though slightly unnerved. (+{{xp}} XP)"
      ]
    },
    festival_of_blades: {
      title: "Festival of Blades",
      effectType: "fame_boost",
      newsletter: [
        "During the annual Festival of Blades, {{name}} was paraded through the streets, greatly boosting their fame! (+{{fame}} Fame)"
      ]
    },
    harsh_winter: {
      title: "A Bitter Winter",
      effectType: "winter_chill",
      newsletter: [
        "A sudden, freezing wind swept through the stable grounds. We had to spend {{gold}} gold on extra heating and supplies."
      ]
    },
    merchant_blessing: {
      title: "Wandering Merchant's Favor",
      effectType: "merchant_blessing",
      newsletter: [
        "A wealthy traveling merchant, impressed by our past victories, has sponsored the stable with a generous gift of {{gold}} gold."
      ]
    },
    offseason_epiphany: {
      title: "Offseason Epiphany",
      effectType: "epiphany",
      newsletter: [
        "During the quiet months, {{name}} experienced a profound breakthrough in training! (+15 XP, +10 Fame, New Insight Discovered)"
      ]
    },
    tavern_brawl: {
      title: "Tavern Brawl",
      effectType: "tavern_brawl",
      newsletter: [
        "{{name}} got involved in a chaotic tavern brawl over the break! They broke a few noses (and maybe a chair), gaining notoriety, but took some bruises in the process. (+{{fame}} Fame, Minor Injury)"
      ]
    },
    bards_song: {
      title: "A Bard's Song",
      effectType: "bards_song",
      newsletter: [
        "A wandering bard composed a thrilling ballad about {{name}}'s recent victories! The song is spreading across the taverns. (+{{fame}} Fame)"
      ]
    },
    plague_outbreak: {
      title: "Plague Outbreak",
      effectType: "plague_outbreak",
      newsletter: [
        "A nasty fever has swept through the gladiator barracks. {{name}} caught the worst of it, suffering a minor injury and temporary weakness. (-{{fame}} Fame, Sickness)"
      ]
    },
    black_market_raid: {
      title: "Black Market Raid",
      effectType: "black_market_raid",
      newsletter: [
        "The city watch raided a black market {{name}} was frequenting! They escaped, but dropped {{gold}} gold in the chaos."
      ]
    },
    grand_feast: {
      title: "A Grand Feast",
      effectType: "grand_feast",
      newsletter: [
        "We hosted a grand feast for the stable! It cost {{gold}} gold, but spirits are high, and everyone feels invigorated. (+10 XP)"
      ]
    },
    wandering_healer: {
      title: "A Wandering Healer",
      effectType: "wandering_healer",
      newsletter: [
        "A wandering medicine man offered snake oil tonics to the stable. It cost us {{gold}} gold, but at least they tasted interesting.",
        "A peculiar wandering healer arrived and cured {{name}} of an injury! It cost us {{gold}} gold."
      ]
    },
    mystic_vision: {
      title: "A Mystic Vision",
      effectType: "mystic_vision",
      newsletter: [
        "A strange hermit visited the camp. {{name}} experienced a mystic vision, unlocking latent potential! (+{{xp}} XP, +{{fame}} Fame)"
      ]
    },
    wild_animal_attack: {
      title: "Wild Beast Encounter",
      effectType: "wild_animal_attack",
      newsletter: [
        "A wild beast wandered into the camp! {{name}} fended it off, gaining some fame (+{{fame}}) but taking a nasty bite in the process."
      ]
    },
    loyal_stray: {
      title: "A Loyal Stray",
      effectType: "loyal_stray",
      newsletter: [
        "A scruffy stray dog wandered into the training grounds and immediately bonded with {{name}}. The mood in the camp has lifted considerably! (+{{xp}} XP, +{{fame}} Fame, -{{gold}} Gold for treats)"
      ]
    },
    street_performance: {
      title: "Street Performance",
      effectType: "street_performance",
      newsletter: [
        "During the offseason, {{name}} took to the streets, performing mock battles for the local townsfolk. The crowd loved it! (+{{fame}} Fame, +{{gold}} Gold, 'Local Hero' Tag)"
      ]
    },
    chaotic_spells: {
      title: "Chaotic Spells",
      effectType: "chaotic_spells",
      newsletter: [
        "A rogue wizard's spell went awry near the barracks! {{name}} was caught in the blast and experienced strange side effects."
      ]
    },
    mysterious_patron: {
      title: "A Mysterious Patron!",
      effectType: "mysterious_patron",
      newsletter: [
        "A mysterious patron was impressed by your stable and anonymously donated {{gold}} gold!"
      ]
    },
    midnight_feast: {
      title: "Midnight Feast",
      effectType: "midnight_feast",
      newsletter: [
        "{{name}} snuck out for a legendary midnight feast! The resulting food coma lasted for days, but the stories are incredible. (+{{xp}} XP, +{{fame}} Fame, -{{gold}} Gold)"
      ]
    },
    shadow_training: {
      title: "Shadow Training",
      effectType: "shadow_training",
      newsletter: [
        "{{name}} was seen practicing bizarre, forbidden techniques in the dead of night. The locals are disturbed, but their skills are undoubtedly sharper. (+{{xp}} XP, -{{fame}} Fame)"
      ]
    },
    gladiator_olympics: {
      title: "Gladiator Olympics",
      effectType: "gladiator_olympics",
      newsletter: [
        "During the local Gladiator Olympics, {{name}} absolutely dominated the competition! The crowd loved the spectacle. (+{{xp}} XP, +{{fame}} Fame)"
      ]
    },
    meteor_shower: {
      title: "Meteor Shower",
      effectType: "meteor_shower",
      newsletter: [
        "A stunning meteor shower lit up the night sky! {{name}} watched in awe and feels inspired for the upcoming season. (+{{xp}} XP, +{{fame}} Fame)"
      ]
    },
    underground_pit_fight: {
      title: "Underground Pit Fight",
      effectType: "underground_pit_fight",
      newsletter: [
        "{{name}} snuck out to participate in an illegal underground pit fight. They earned some brutal notoriety, but the lack of rules came with a cost. (+{{fame}} Fame, Minor Injury)"
      ]
    },
    rogue_alchemist: {
      title: "Rogue Alchemist",
      effectType: "rogue_alchemist",
      newsletter: [
        "A strange rogue alchemist visited the stable, offering a glowing green potion to {{name}}. They drank it...",
        "{{name}} accepted a bubbling concoction from a wandering alchemist."
      ]
    },
    dreamweaver_visit: {
      title: "Dreamweaver's Visit",
      effectType: "dreamweaver_visit",
      newsletter: [
        "A mysterious dreamweaver visited {{name}} in their sleep. They awoke with profound new insights into combat. (+{{xp}} XP, +1 Insight Token)",
        "{{name}} experienced vivid, guiding visions from a passing dreamweaver, sharpening their mind. (+{{xp}} XP, +1 Insight Token)"
      ]
    },
    abyssal_bargain: {
      title: "Abyssal Bargain",
      effectType: "abyssal_bargain",
      newsletter: [
        "{{name}} was approached by a shadowed figure in the dead of night offering terrible power for a terrible price..."
      ]
    },
    shadow_tournament: {
      title: "Shadow Tournament",
      effectType: "shadow_tournament",
      newsletter: [
        "{{name}} participated in a secretive, brutal shadow tournament beneath the city streets. They emerged victorious, covered in strange bruises but carrying a hefty purse. (+{{xp}} XP, +{{fame}} Fame)",
        "{{name}} snuck out to fight in an underground shadow tournament. They lost horribly to a masked opponent and limped back in disgrace. (-{{fame}} Fame, Moderate Injury)"
      ]
    },
    wandering_fortune_teller: {
      title: "The Wandering Fortune Teller",
      effectType: "wandering_fortune_teller",
      newsletter: [
        "A mysterious fortune teller visited the camp. {{name}} parted with {{gold}} gold to have their fortune read, uncovering cryptic advice about their fighting style. (-{{gold}} Gold, +15 XP, Style Insight)"
      ]
    },
    chaos_weaver_visit: {
      title: "The Chaos Weaver's Visit",
      effectType: "chaos_weaver_visit",
      newsletter: [
        "A figure wreathed in swirling chaos energy appeared in the camp. {{name}} was touched by the Chaos Weaver and emerged fundamentally changed, gaining the {{trait}} trait."
      ]
    },
    traveling_circus: {
      title: "A Traveling Circus Arrives",
      effectType: "traveling_circus",
      newsletter: [
        "A traveling circus set up camp near the stable. {{name}} spent the week learning acrobatic tricks and mesmerizing the locals. (+{{fame}} Fame, +{{xp}} XP, Minor Treasury Cost)"
      ]
    },
    bounty_hunter_visit: {
      title: "Bounty Hunter Visit",
      effectType: "bounty_hunter_visit",
      newsletter: [
        "A wandering bounty hunter visited looking for someone who sounded a lot like {{name}}. They paid handsomely for information. (+{{gold}} Gold, +{{fame}} Fame)"
      ]
    },
    midnight_market: {
      title: "The Midnight Market",
      effectType: "midnight_market",
      newsletter: [
        "A hidden Midnight Market appeared behind the arena. {{name}} spent {{gold}} gold on strange elixirs and a whispered secret, gaining +20 XP and a new insight."
      ]
    },
    moonlight_duel: {
      title: "Moonlight Duel",
      effectType: "moonlight_duel",
      newsletter: [
        "{{name}} was challenged to an unsanctioned moonlight duel! They emerged victorious, proving their skill to a wealthy patron. (+{{gold}} Gold)"
      ]
    },
    shadow_market_run: {
      title: "Shadow Market Run",
      effectType: "shadow_market_run",
      newsletter: [
        "{{name}} took a risk and navigated the dangerous Shadow Market! They spent some gold but emerged with newfound knowledge and fame. (-{{gold}} Gold, +{{fame}} Fame)"
      ]
    },
    the_chaos_spores: {
      title: "Chaos Spores",
      effectType: "chaos_spores",
      newsletter: [
        "A cloud of glowing chaos spores drifted through the barracks. {{name}} inhaled them and feels profoundly changed! (+{{xp}} XP, new Trait: Spore Kissed)"
      ]
    },
    secret_fight_club: {
      title: "Secret Fight Club",
      effectType: "secret_fight_club",
      newsletter: [
        "{{name}} snuck out to a secret fight club! They earned respect and learned a few tricks, but took some hits. (+{{xp}} XP, +{{fame}} Fame, Minor Injury)"
      ]
    },
    chaos_weavers_game: {
      title: "The Chaos Weaver's Game",
      effectType: "chaos_weavers_game",
      newsletter: [
        "The Chaos Weaver appeared in the barracks, proposing a dangerous gamble. {{name}} accepted, gaining strange newfound power. (+25 XP)",
        "The Chaos Weaver offered a game of chance. {{name}} played and lost, returning battered. (Minor Injury)"
      ]
    },
    chaotic_weather_experiment: {
      title: "A Wild Weather Experiment",
      effectType: "chaotic_weather_experiment",
      newsletter: [
        "A wandering alchemist tested a bizarre weather machine in the courtyard. {{name}} got caught in a sudden, localized magic squall! They learned from the chaos but took some minor magic burns. (+{{xp}} XP, Minor Injury)"
      ]
    },
    chaos_weavers_gift: {
      title: "The Chaos Weaver's Gift",
      effectType: "chaos_weavers_gift",
      newsletter: [
        "The Chaos Weaver appeared in the barracks, dropping a small pouch. {{name}} found it contained exactly what they needed. (+{{xp}} XP, Insight Token)"
      ]
    },
    temporal_anomaly: {
      title: "A Temporal Anomaly",
      effectType: "temporal_anomaly",
      newsletter: [
        "A temporal anomaly ripped through the training grounds! {{name}} got caught in the distortion, rapidly gaining experience but losing a piece of their essence. (+35 XP, Insight Token, Lost Trait)"
      ]
    },
    wandering_mystic: {
      title: "Wandering Mystic",
      effectType: "wandering_mystic",
      newsletter: [
        "A wandering mystic sought shelter with {{name}} over the winter, teaching them strange truths. (+Chaos Touched trait)"
      ]
    },
    cursed_treasure_discovery: {
      title: "Cursed Treasure Discovery",
      effectType: "cursed_treasure_discovery",
      newsletter: [
        "While digging out a new training pit, {{name}} unearthed a cursed chest! The stable gained a hoard of gold, but the gladiator suffered a lingering magical affliction and public suspicion. (+{{gold}} Gold, -{{fame}} Fame, Moderate Injury)"
      ]
    },
    chaos_weavers_prophecy: {
      title: "The Chaos Weaver's Prophecy",
      effectType: "chaos_weavers_prophecy",
      newsletter: [
        "The Chaos Weaver whispered dark prophecies in {{name}}'s ear. They awoke forever changed. (+{{xp}} XP, Minor Injury)"
      ]
    },
    bountiful_harvest: {
      title: "A Bountiful Harvest",
      effectType: "bountiful_harvest",
      newsletter: [
        "A local village celebrated a surprisingly bountiful harvest and shared their excess crops with the stable. The gladiators enjoyed the feast! (+{{gold}} Gold)"
      ]
    },
    abyssal_tempest_ritual: {
      title: "Abyssal Tempest Ritual",
      effectType: "abyssal_tempest_ritual",
      newsletter: [
        "A swirling vortex of dark energy appeared in the stable during the off-season. {{name}} stared into it and emerged stronger, yet changed... (+25 XP, Minor Injury)"
      ]
    },
    offseason_training_camp: {
      title: "Offseason Training Camp",
      effectType: "offseason_training_camp",
      newsletter: [
        "A grueling but highly effective offseason training camp pushed your warriors to their absolute limits. {{name}} emerged stronger and wiser, earning significant XP! (+{{xp}} XP)"
      ]
    },
    shattered_skies_ritual: {
      title: "Shattered Skies Ritual",
      effectType: "shattered_skies_ritual",
      newsletter: [
        "A bizarre ritual in the training yard seemingly shattered the sky. {{name}} feels empowered but deeply exhausted. (+25 XP, +15 Fatigue)"
      ]
    },
    weeping_skies: {
      title: "Weeping Skies",
      effectType: "weeping_skies",
      newsletter: [
        "An unnatural rain fell, leaving the sand slick and cold. {{name}} spent the day reflecting in the downpour. (+20 XP)"
      ]
    },
    suspicious_mushroom_stew: {
      title: "Suspicious Mushroom Stew",
      effectType: "suspicious_mushroom_stew",
      newsletter: [
        "{{name}} ate a strange stew made from glowing mushrooms found in the cellar. They gained {{xp}} XP, but contracted a gnawing Stomach Ache!"
      ]
    },
    goblin_merchant: {
      title: "Goblin Merchant Visit",
      effectType: "goblin_merchant",
      newsletter: [
        "A sly goblin merchant offered suspicious tonic. {{name}} took a swig, feeling strange vigor! (+1 CN, +1 WL, -{{gold}} Gold)"
      ]
    },
    wandering_merchant_strange_brew: {
      title: "Wandering Merchant's Strange Brew",
      effectType: "wandering_merchant_strange_brew",
      newsletter: [
        "A wandering merchant offered {{name}} an exotic potion. Their senses sharpen dramatically! (+20 XP, +10 Fame)"
      ]
    },
    phantom_sparring: {
      title: "Phantom Sparring Partner",
      effectType: "phantom_sparring",
      newsletter: [
        "A translucent phantom gladiator sparred with {{name}} into the dead of night. (+40 XP, +10 Fatigue)"
      ]
    },
    dreamweavers_mist: {
      title: "Dreamweavers Mist Settles",
      effectType: "dreamweavers_mist",
      newsletter: [
        "A strange, hallucinogenic mist rolled through the camp. {{name}} breathed it deeply, discovering an uncanny new fighting rhythm but taking minor magic burns. (+15 XP, Minor Injury)"
      ]
    }
  },
  events: {
    tavern_brawl: {
      title: "Tavern Brawl!",
      newsletter: [
        "{{name}} got into a wild tavern brawl last night! They gained +{{fame}} Fame but suffered a minor injury."
      ],
      injury_name: "Black Eye",
      injury_desc: "Caught a nasty right hook in the tavern."
    },
    celestial_blessing: {
      title: "A Sign from the Gods!",
      newsletter: [
        "A shooting star was seen over the arena exactly as {{name}} was training. (+{{fame}} Fame, +{{xp}} XP)"
      ]
    },
    lost_relic: {
      title: "Lost Relic Discovery",
      newsletter: [
        "{{name}} discovered an ancient artifact while exploring the ruins! (+{{fame}} Fame, +{{xp}} XP)"
      ]
    },
    mysterious_patron: {
      title: "A Mysterious Patron!",
      newsletter: [
        "A mysterious patron was impressed by your stable and donated {{gold}} gold!"
      ]
    },
    goblin_merchant: {
      title: "Goblin Merchant",
      newsletter: [
        "A shady goblin merchant visited the stables! {{name}} traded some scrap for a curious trinket. (+{{xp}} XP, -20 Gold)"
      ]
    }
  }
};
// src/data/narrative/announcer.json
var announcer_default = {
  blurbs: {
    neutral: [
      "%A defeated %D%H in a hard-fought contest.",
      "%A emerged victorious over %D%H.",
      "%A bested %D%H.",
      "A gritty display of fundamental combat.",
      "Both fighters are giving it their all.",
      "A tactical stalemate unfolds in the arena.",
      "Neither side is willing to concede an inch.",
      "A methodical and calculated exchange.",
      "The combatants test each other's defenses.",
      "%A defeated %D%H.",
      "New unique template."
    ],
    hype: [
      "%A finishes %D%H with a spectacular display!",
      "%A DOMINATED %D%H! The crowd goes wild!",
      "What a performance! %A crushed %D%H!",
      "The crowd is going absolutely wild for this!",
      "An explosive exchange that shakes the very foundations of the arena!",
      "Pure adrenaline! This is what we came to see!",
      "A masterful display of violence and skill!",
      "The energy in the pit is off the charts!",
      "An unforgettable clash of titans!",
      "The crowd is absolutely electric today!",
      "Anticipation hangs heavy in the arena air.",
      "A battle that will be sung about for generations!",
      "The atmosphere is boiling over with excitement!",
      "Every spectator is on their feet, waiting for the first strike!"
    ],
    grim: [
      "%D fell to %A%H. The sands drink deep.",
      "%A ended %D%H in brutal fashion.",
      "%A cut down %D%H without mercy.",
      "A brutal, ugly affair.",
      "The sand drinks deeply today.",
      "A sickening display of raw butchery.",
      "There is no glory here, only survival.",
      "A harrowing reminder of the cost of the arena.",
      "The air is thick with desperation and copper.",
      "Only blood can settle the score today.",
      "The sands are thirsty, and death is patient.",
      "A heavy silence precedes the inevitable slaughter.",
      "The air is thick with the promise of violence.",
      "No mercy will be found in the pit today."
    ]
  },
  commentary: {
    KO: [
      "They're not getting up from that one. A clean, decisive knockout!",
      "The impact echoed all the way to the cheap seats. Goodnight!",
      "{{attacker}} lays out {{defender}} with a devastating blow!",
      "Lights out! What a devastating blow to end the match!",
      "What a knockout! The crowd erupts!",
      "And they are DOWN! A spectacular knockout!",
      "Lights out! What a devastating finish!",
      "That's it! They're not getting back up from that one.",
      "A crushing blow ends it right there!",
      "Absolutely folded! The referee waves it off!",
      "A beautiful knockout to seal the victory!"
    ],
    Kill: [
      "What a brutal finish!",
      "A fatal blow! The arena claims another soul.",
      "Brutal and final. There's no coming back from that.",
      "A horrifying end to a vicious bout.",
      "The ultimate price paid on the blood-soaked sands.",
      "A clean kill. The crowd roars for blood.",
      "An execution in the center of the pit.",
      "A gruesome end to a brutal contest.",
      "They won't be getting up from that one.",
      "A decisive, fatal strike ends the bout.",
      "The executioner's final blow, swift and merciless.",
      "A life extinguished on the bloody sands."
    ],
    Flashy: [
      "{{defender}} is breathing heavily, their stamina fading under the relentless assault of {{attacker}}.",
      "{{attacker}}'s footwork is utterly mesmerizing. They're dancing around {{defender}}!",
      "A brutal exchange! Both fighters are leaving everything on the sand.",
      "{{attacker}} is putting on a show!",
      "What a flashy display of skill!",
      "Incredible acrobatics!",
      "A display of absolute mastery!",
      "Such flair! Such style!",
      "They're not just fighting, they're performing!",
      "A beautiful combination that leaves the crowd breathless!",
      "What a showboat, but they have the skills to back it up!"
    ],
    Upset: [
      "The upset of the week! {{defender}} never saw it coming!",
      "What a shock! {{attacker}} defies the odds!",
      "Unbelievable! The underdog pulls it off!",
      "A shocking upset! No one saw this coming!",
      "Against all odds, they've claimed victory!",
      "The favorites fall today! What a match!",
      "A stunning reversal of expectations!",
      "They defied the odds and the prognosticators!",
      "The favorite falls! Unbelievable!",
      "Nobody saw that coming, what a turn of events!",
      "The underdog claims a shocking victory today.",
      "A monumental upset that defies all predictions!",
      "The crowd is stunned as the giant is slain!"
    ]
  },
  recap: [
    "{{attacker}} defeated {{defender}} in {{hits}} minutes.",
    "The bout concluded with a decisive victory.",
    "A grueling match that tested the limits of both fighters.",
    "A quick and brutal affair.",
    "A long, drawn-out battle of attrition.",
    "A technical masterpiece from the victor.",
    "A sloppy but entertaining brawl.",
    "A bloody affair that tested the limits of both combatants.",
    "A masterful display of martial prowess from start to finish.",
    "A chaotic struggle that left the arena soaked in blood.",
    "A grim reminder of the brutal reality of the arena.",
    "A legendary clash that will be recounted in taverns for years."
  ]
};
// src/data/narrative/uiMeta.json
var uiMeta_default = {
  fanfare: {
    resolution_title: "Cycle Resolution",
    gazette_empty: "A quiet week in the arena. No major headlines.",
    report_medical: "Medical & Mortality Report",
    report_combat: "Combat Results",
    report_combat_empty: "Your stable did not participate in any official bouts this week.",
    report_math: "Simulation Math & Metrics",
    memorial_title: "The Arena Remembers",
    memorial_default: "Fallen in combat.",
    btn_honor: "Honor the Fallen",
    btn_planning: "Acknowledge & Begin Planning",
    btn_next: "Next Report",
    armor_intro_verbs: [
      "steps forth in",
      "is armored in",
      "glimmers in",
      "is wearing"
    ],
    weapon_intro_verbs: [
      "prepares to fight with %W",
      "clutches their %W",
      "is armed with %W",
      "draws their %W"
    ]
  },
  meta: {
    flair: {
      Flashy: "Crowd favorite \u2014 earns +2 Popularity per flashy fight.",
      "Local Hero": "Loved by the locals. Their presence brings a touch more fame."
    },
    title: {
      Champion: "Arena title holder. Earns passive fame each week."
    },
    injury: {
      "Broken Arm": "Reduces Attack and Parry effectiveness until healed."
    },
    status: {
      Active: "Ready for combat.",
      Dead: "Fallen in the arena.",
      Retired: "Honorably withdrawn from combat."
    }
  },
  persona: {
    good: {
      initiative: {
        high: [
          {
            min: 33,
            text: "Summons a storm of steel that leaves no room to breathe"
          },
          {
            min: 31,
            text: "A terrifying maestro of battle tempo, dictating every bloody exchange"
          },
          {
            min: 29,
            text: "Bends the chaos of the pit to his will, forcing foes to fight on his terms"
          },
          {
            min: 27,
            text: "Drowns his opponent in a relentless tide of crushing aggression"
          },
          {
            min: 25,
            text: "Forces a suffocating, lethal rhythm onto the blood-soaked sands"
          },
          {
            min: 13,
            text: "Steals the center of the pit and refuses to yield a single step"
          },
          {
            min: 4,
            text: "Demonstrates impressive initiative (9)"
          },
          {
            min: 3,
            text: "Demonstrates impressive initiative (7)"
          },
          {
            min: 2,
            text: "Demonstrates impressive initiative (8)"
          },
          {
            min: 0,
            text: "Has learned how to keep his foe in trouble"
          }
        ],
        low: [
          {
            min: 25,
            text: "Lunges from the shadows before the opponent is ready"
          },
          {
            min: 24,
            text: "Fights with a hungry, restless aggression"
          },
          {
            min: 14,
            text: "With a very aggressive and clever fighting style"
          },
          {
            min: 4,
            text: "Has reasonable, if basic, initiative (4)"
          },
          {
            min: 3,
            text: "Has reasonable, if basic, initiative (5)"
          },
          {
            min: 3,
            text: "Has reasonable, if basic, initiative (6)"
          },
          {
            min: 3,
            text: "Has reasonable, if basic, initiative (8)"
          },
          {
            min: 1,
            text: "Has reasonable, if basic, initiative (7)"
          },
          {
            min: 1,
            text: "Has reasonable, if basic, initiative (9)"
          },
          {
            min: 0,
            text: "Has learned how to be decisive and quick"
          }
        ]
      },
      riposte: {
        high: [
          {
            min: 24,
            text: "Baits their opponent into a fatal trap of their own making"
          },
          {
            min: 23,
            text: "Turns the opponent's strength into their execution"
          },
          {
            min: 14,
            text: "Makes the most of his enemy's mistakes"
          },
          {
            min: 4,
            text: "Delivers devastating ripostes (9)"
          },
          {
            min: 2,
            text: "Delivers devastating ripostes (4)"
          },
          {
            min: 2,
            text: "Delivers devastating ripostes (5)"
          },
          {
            min: 0,
            text: "Makes good dueling decisions"
          },
          {
            min: 0,
            text: "Delivers devastating ripostes (6)"
          },
          {
            min: 0,
            text: "Delivers devastating ripostes (7)"
          },
          {
            min: 0,
            text: "Delivers devastating ripostes (8)"
          }
        ],
        low: [
          {
            min: 21,
            text: "Twists an enemy's assault into a sudden, bloody end"
          },
          {
            min: 14,
            text: "Does a lot of little things well"
          },
          {
            min: 4,
            text: "Shows competent riposte ability (9)"
          },
          {
            min: 3,
            text: "Shows competent riposte ability (4)"
          },
          {
            min: 2,
            text: "Shows competent riposte ability (7)"
          },
          {
            min: 1,
            text: "Shows competent riposte ability (8)"
          },
          {
            min: 0,
            text: "Cleverly controls his foe's actions"
          },
          {
            min: 0,
            text: "Shows competent riposte ability (3)"
          },
          {
            min: 0,
            text: "Shows competent riposte ability (5)"
          },
          {
            min: 0,
            text: "Shows competent riposte ability (6)"
          }
        ]
      },
      attack: {
        high: [
          {
            min: 35,
            text: "An executioner in the pit, delivering critical ruin with every swing"
          },
          {
            min: 28,
            text: "Obliterates opponents with god-like, merciless precision"
          },
          {
            min: 20,
            text: "Hunts for the vital organs with terrifying precision"
          },
          {
            min: 10,
            text: "Makes very clever attacks"
          },
          {
            min: 4,
            text: "Mounts a ferocious offense (6)"
          },
          {
            min: 4,
            text: "Mounts a ferocious offense (8)"
          },
          {
            min: 4,
            text: "Mounts a ferocious offense (9)"
          },
          {
            min: 3,
            text: "Mounts a ferocious offense (7)"
          },
          {
            min: 2,
            text: "Mounts a ferocious offense (5)"
          },
          {
            min: 0,
            text: "He lands blows on less protected areas"
          },
          {
            min: 40,
            text: "A dramatic maestro of destruction, leaving crowds in silent awe"
          }
        ],
        low: [
          {
            min: 24,
            text: "Transforms every meager opening into a harrowing bloodbath"
          },
          {
            min: 14,
            text: "Has an unusual fighting style that confuses many opponents"
          },
          {
            min: 4,
            text: "Provides a steady offensive front (3)"
          },
          {
            min: 4,
            text: "Provides a steady offensive front (9)"
          },
          {
            min: 3,
            text: "Provides a steady offensive front (5)"
          },
          {
            min: 3,
            text: "Provides a steady offensive front (6)"
          },
          {
            min: 2,
            text: "Provides a steady offensive front (4)"
          },
          {
            min: 1,
            text: "Provides a steady offensive front (8)"
          },
          {
            min: 0,
            text: "Makes clever attacks"
          },
          {
            min: 0,
            text: "Provides a steady offensive front (7)"
          }
        ]
      },
      parry: {
        high: [
          {
            min: 23,
            text: "An impenetrable wall of iron, turning aside the deadliest steel"
          },
          {
            min: 14,
            text: "Parrys very intelligently"
          },
          {
            min: 0,
            text: "Is gifted at parrying"
          }
        ],
        low: [
          {
            min: 21,
            text: "Denies the killing stroke with grim, practiced resolve"
          },
          {
            min: 14,
            text: "Rarely makes mistakes"
          },
          {
            min: 0,
            text: "Parrys intelligently"
          }
        ]
      },
      defense: {
        high: [
          {
            min: 30,
            text: "Displays a chilling level of situational dominance"
          },
          {
            min: 14,
            text: "Is always thinking ahead"
          },
          {
            min: 2,
            text: "Shows solid defense capabilities in the arena (4)"
          },
          {
            min: 2,
            text: "Shows solid defense capabilities in the arena (5)"
          },
          {
            min: 2,
            text: "Shows solid defense capabilities in the arena (6)"
          },
          {
            min: 2,
            text: "Shows solid defense capabilities in the arena (7)"
          },
          {
            min: 1,
            text: "Shows solid defense capabilities in the arena (8)"
          },
          {
            min: 1,
            text: "Shows solid defense capabilities in the arena (9)"
          },
          {
            min: 0,
            text: "Is gifted at avoiding a blow"
          },
          {
            min: 0,
            text: "Shows solid defense capabilities in the arena (3)"
          }
        ],
        low: [
          {
            min: 21,
            text: "Weaves through the carnage with grim efficiency"
          },
          {
            min: 14,
            text: "Avoids blows well"
          },
          {
            min: 4,
            text: "Shows solid defense capabilities in the arena (3)"
          },
          {
            min: 4,
            text: "Shows solid defense capabilities in the arena (7)"
          },
          {
            min: 4,
            text: "Shows solid defense capabilities in the arena (8)"
          },
          {
            min: 3,
            text: "Shows solid defense capabilities in the arena (5)"
          },
          {
            min: 3,
            text: "Shows solid defense capabilities in the arena (6)"
          },
          {
            min: 2,
            text: "Shows solid defense capabilities in the arena (9)"
          },
          {
            min: 1,
            text: "Shows solid defense capabilities in the arena (4)"
          },
          {
            min: 0,
            text: "Makes few mistakes"
          }
        ]
      },
      endurance: {
        high: [
          {
            min: 24,
            text: "A tireless engine of destruction, grinding foes to bloody paste"
          },
          {
            min: 14,
            text: "Rarely wastes his endurance needlessly"
          },
          {
            min: 3,
            text: "Shows solid endurance capabilities in the arena (6)"
          },
          {
            min: 3,
            text: "Shows solid endurance capabilities in the arena (9)"
          },
          {
            min: 2,
            text: "Shows solid endurance capabilities in the arena (8)"
          },
          {
            min: 1,
            text: "Shows solid endurance capabilities in the arena (3)"
          },
          {
            min: 1,
            text: "Shows solid endurance capabilities in the arena (4)"
          },
          {
            min: 0,
            text: "Can conserve his endurance past what might normally be expected"
          },
          {
            min: 0,
            text: "Shows solid endurance capabilities in the arena (5)"
          },
          {
            min: 0,
            text: "Shows solid endurance capabilities in the arena (7)"
          }
        ],
        low: [
          {
            min: 22,
            text: "Refuses to empty his lungs until the slaughter is completely finished"
          },
          {
            min: 14,
            text: "He plans out every move he makes, seldom wasting any effort"
          },
          {
            min: 4,
            text: "Shows solid endurance capabilities in the arena (5)"
          },
          {
            min: 3,
            text: "Shows solid endurance capabilities in the arena (4)"
          },
          {
            min: 3,
            text: "Shows solid endurance capabilities in the arena (7)"
          },
          {
            min: 2,
            text: "Shows solid endurance capabilities in the arena (6)"
          },
          {
            min: 0,
            text: "Seldom wastes his endurance needlessly"
          },
          {
            min: 0,
            text: "Shows solid endurance capabilities in the arena (3)"
          },
          {
            min: 0,
            text: "Shows solid endurance capabilities in the arena (8)"
          },
          {
            min: 0,
            text: "Shows solid endurance capabilities in the arena (9)"
          }
        ]
      }
    },
    bad: {
      initiative: {
        high: [
          {
            min: 17,
            text: "Surrenders the momentum to the butcher immediately, standing completely helpless"
          },
          {
            min: 4,
            text: "Struggles significantly with initiative (2)"
          },
          {
            min: 4,
            text: "Struggles significantly with initiative (5)"
          },
          {
            min: 3,
            text: "Struggles significantly with initiative (4)"
          },
          {
            min: 3,
            text: "Struggles significantly with initiative (6)"
          },
          {
            min: 3,
            text: "Struggles significantly with initiative (7)"
          },
          {
            min: 3,
            text: "Struggles significantly with initiative (8)"
          },
          {
            min: 2,
            text: "Struggles significantly with initiative (3)"
          },
          {
            min: 1,
            text: "Struggles significantly with initiative (9)"
          },
          {
            min: 0,
            text: "He needs time to think things through before he can act"
          }
        ],
        low: [
          {
            min: 24,
            text: "Moves with the urgency of a stone sinking in mud"
          },
          {
            min: 4,
            text: "Is woefully slow to react (3)"
          },
          {
            min: 4,
            text: "Is woefully slow to react (4)"
          },
          {
            min: 2,
            text: "Is woefully slow to react (2)"
          },
          {
            min: 2,
            text: "Is woefully slow to react (6)"
          },
          {
            min: 2,
            text: "Is woefully slow to react (9)"
          },
          {
            min: 1,
            text: "Is woefully slow to react (5)"
          },
          {
            min: 1,
            text: "Is woefully slow to react (7)"
          },
          {
            min: 1,
            text: "Is woefully slow to react (8)"
          },
          {
            min: 0,
            text: "He stands around slack-jawed"
          }
        ]
      },
      attack: {
        high: [
          {
            min: 25,
            text: "Strikes with the sloppy desperation of a drowning man"
          },
          {
            min: 17,
            text: "Telegraphs every swing so heavily it practically invites his own death"
          },
          {
            min: 4,
            text: "Struggles to mount a proper offensive (7)"
          },
          {
            min: 4,
            text: "Struggles to mount a proper offensive (8)"
          },
          {
            min: 4,
            text: "Struggles to mount a proper offensive (9)"
          },
          {
            min: 3,
            text: "Struggles to mount a proper offensive (5)"
          },
          {
            min: 3,
            text: "Struggles to mount a proper offensive (6)"
          },
          {
            min: 1,
            text: "Struggles to mount a proper offensive (4)"
          },
          {
            min: 0,
            text: "He makes a lot of mistakes"
          },
          {
            min: 0,
            text: "Struggles to mount a proper offensive (3)"
          }
        ],
        low: [
          {
            min: 26,
            text: "Telegraphs every swing like a lumbering ox"
          },
          {
            min: 3,
            text: "Struggles to mount a proper offensive (5)"
          },
          {
            min: 2,
            text: "Struggles to mount a proper offensive (3)"
          },
          {
            min: 2,
            text: "Struggles to mount a proper offensive (4)"
          },
          {
            min: 1,
            text: "Struggles to mount a proper offensive (2)"
          },
          {
            min: 1,
            text: "Struggles to mount a proper offensive (7)"
          },
          {
            min: 0,
            text: "He makes stupid feints that fool no one"
          },
          {
            min: 0,
            text: "Struggles to mount a proper offensive (6)"
          },
          {
            min: 0,
            text: "Struggles to mount a proper offensive (8)"
          },
          {
            min: 0,
            text: "Struggles to mount a proper offensive (9)"
          }
        ]
      },
      defense: {
        high: [
          {
            min: 25,
            text: "Stumbles backward, relying on blind luck rather than skill"
          },
          {
            min: 14,
            text: "Fails to anticipate even the most obvious strikes"
          },
          {
            min: 4,
            text: "Has terrible defensive instincts (3)"
          },
          {
            min: 2,
            text: "Has terrible defensive instincts (8)"
          },
          {
            min: 1,
            text: "Has terrible defensive instincts (4)"
          },
          {
            min: 1,
            text: "Has terrible defensive instincts (6)"
          },
          {
            min: 1,
            text: "Has terrible defensive instincts (7)"
          },
          {
            min: 0,
            text: "Leaves dangerous openings in their guard"
          },
          {
            min: 0,
            text: "Has terrible defensive instincts (5)"
          },
          {
            min: 0,
            text: "Has terrible defensive instincts (9)"
          }
        ],
        low: [
          {
            min: 25,
            text: "Seems utterly confused by basic defensive footwork"
          },
          {
            min: 4,
            text: "Has terrible defensive instincts (8)"
          },
          {
            min: 3,
            text: "Has terrible defensive instincts (2)"
          },
          {
            min: 3,
            text: "Has terrible defensive instincts (3)"
          },
          {
            min: 2,
            text: "Has terrible defensive instincts (5)"
          },
          {
            min: 2,
            text: "Has terrible defensive instincts (6)"
          },
          {
            min: 1,
            text: "Has terrible defensive instincts (4)"
          },
          {
            min: 1,
            text: "Has terrible defensive instincts (7)"
          },
          {
            min: 0,
            text: "Is easily outmaneuvered"
          },
          {
            min: 0,
            text: "Has terrible defensive instincts (9)"
          }
        ]
      }
    },
    descriptors: {
      coordination: {
        "Marvel of Fighting Coordination": "Is a marvel of fighting coordination",
        "Very Highly Coordinated": "Is very highly coordinated",
        "Highly Coordinated": "Is highly coordinated",
        Normal: "",
        "Slightly Uncoordinated": "Is slightly uncoordinated",
        Clumsy: "Is clumsy"
      },
      activity: {
        Normal: "Maintains a steady pace",
        Default: "Is {{rating}}"
      }
    }
  },
  memorials: {
    tributes: [
      "The arena grows colder with the loss of {{name}}.",
      "A legend has passed into the halls of iron."
    ]
  }
};

// src/data/narrative/index.ts
var combatCache = null;
var narrativeContent = {
  gazette: gazette_default.gazette,
  ux_metadata: gazette_default.ux_metadata,
  recruitment: recruitment_default.recruitment,
  offseason_events: offseason_default.offseason_events,
  events: offseason_default.events,
  blurbs: announcer_default.blurbs,
  commentary: announcer_default.commentary,
  recap: announcer_default.recap,
  fanfare: uiMeta_default.fanfare,
  meta: uiMeta_default.meta,
  persona: uiMeta_default.persona,
  memorials: uiMeta_default.memorials,
  pbp: undefined,
  strikes: undefined,
  conclusions: undefined,
  passives: undefined,
  kill_text: undefined,
  crowd_reactions: undefined
};
function loadCombatNarrative() {
  if (combatCache)
    return combatCache;
  combatCache = (async () => {
    const [pbpData, strikesData, killTextData, conclusionsData, passivesData] = await Promise.all([
      Promise.resolve().then(() => __toESM(require_combatPbp(), 1)),
      Promise.resolve().then(() => __toESM(require_combatStrikes(), 1)),
      Promise.resolve().then(() => __toESM(require_combatKillText(), 1)),
      Promise.resolve().then(() => __toESM(require_combatConclusions(), 1)),
      Promise.resolve().then(() => __toESM(require_combatPassives(), 1))
    ]);
    narrativeContent.pbp = pbpData.default.pbp;
    narrativeContent.crowd_reactions = pbpData.default.crowd_reactions;
    narrativeContent.strikes = strikesData.default.strikes;
    narrativeContent.kill_text = killTextData.default.kill_text;
    narrativeContent.conclusions = conclusionsData.default.conclusions;
    narrativeContent.passives = passivesData.default.passives;
  })();
  return combatCache;
}

// src/utils/escapeHtml.ts
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/engine/narrative/narrativePBPUtils.ts
function interpolateTemplate(template, ctx) {
  if (!template)
    return "No description available.";
  return template.replace(/%([A-Z]+)|\{\{\s*([^{}\s]+)\s*\}\}/g, (match, shortKey, longKey) => {
    if (shortKey) {
      switch (shortKey) {
        case "A":
          return escapeHtml(ctx.attacker || ctx.name || "The warrior");
        case "D":
          return escapeHtml(ctx.defender || "the opponent");
        case "W":
          return escapeHtml(ctx.weapon || "weapon");
        case "BP":
          return escapeHtml(ctx.bodyPart || "body");
        case "H":
          return escapeHtml(String(ctx.hits || ""));
        default:
          return match;
      }
    }
    if (longKey) {
      switch (longKey) {
        case "attacker":
          return escapeHtml(String(ctx.attacker ?? ctx.name ?? "The warrior"));
        case "name":
          return escapeHtml(String(ctx.name ?? ctx.attacker ?? "The warrior"));
        case "defender":
          return escapeHtml(String(ctx.defender ?? "the opponent"));
        case "weapon":
          return escapeHtml(String(ctx.weapon ?? "weapon"));
        case "bodyPart":
          return escapeHtml(String(ctx.bodyPart ?? "body"));
        case "winner":
          return escapeHtml(String(ctx.winner ?? "the winner"));
        case "loser":
          return escapeHtml(String(ctx.loser ?? "the loser"));
        case "possessive":
          return escapeHtml(String(ctx.possessive ?? "their"));
        case "pronoun":
          return escapeHtml(String(ctx.pronoun ?? "he"));
        case "reflexive":
          return escapeHtml(String(ctx.reflexive ?? "himself"));
        default: {
          const value = ctx[longKey];
          return value !== undefined && Object.hasOwn(ctx, longKey) ? escapeHtml(String(value)) : match;
        }
      }
    }
    return match;
  });
}
function getStrikeSeverity(damage, maxHp, isFatal, isCrit, isFavorite, fame) {
  if (isFatal)
    return "fatal";
  const ratio = damage / maxHp;
  if (isCrit || ratio >= 0.25) {
    return fame >= 100 ? "critical_supernatural" : "critical_human";
  }
  if (isFavorite)
    return "mastery";
  if (ratio >= 0.1)
    return "solid";
  return "glancing";
}
function peekArchive(path) {
  let current = narrativeContent;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  if (Array.isArray(current) && current.length > 0)
    return current;
  return null;
}
function getFromArchive(rng, path) {
  try {
    let current = narrativeContent;
    for (const key of path) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        throw new Error(`Invalid path: ${key}`);
      }
    }
    if (Array.isArray(current) && current.length > 0) {
      return rng.pick(current);
    }
  } catch {
    console.error(`Narrative Archive Error: Missing path ${path.join(".")}`);
  }
  return "A fierce exchange occurs.";
}
function richHitLocation(rng, location) {
  if (!narrativeContent.pbp)
    return location.toUpperCase();
  const hitLocations = narrativeContent.pbp.hit_locations;
  const key = location.toLowerCase();
  const variants = hitLocations[key];
  if (!variants)
    return location.toUpperCase();
  return rng.pick(variants);
}
// src/engine/narrative/narrativeUtils.ts
function szToHeight(sz) {
  const inches = 58 + Math.max(0, sz - 3) * 1.2;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return inch > 0 ? `${ft}' ${inch}"` : `${ft}'`;
}
function getWeaponDisplayName(equipId) {
  if (!equipId || equipId === "fists" || equipId === "none")
    return "OPEN HAND";
  const item = getItemById(equipId) ?? getItemByCode(equipId);
  return item?.name?.toUpperCase() ?? "WEAPON";
}
var HYBRID_WEAPONS = {
  halberd: ["slashing", "piercing"],
  short_sword: ["slashing", "piercing"],
  longsword: ["slashing", "piercing"]
};
var STYLE_TO_WEAPON_TYPE = {
  ["SLASHING ATTACK" /* SlashingAttack */]: "slashing",
  ["LUNGING ATTACK" /* LungingAttack */]: "piercing",
  ["PARRY-LUNGE" /* ParryLunge */]: "piercing",
  ["AIMED BLOW" /* AimedBlow */]: "piercing",
  ["STRIKING ATTACK" /* StrikingAttack */]: "slashing",
  ["PARRY-STRIKE" /* ParryStrike */]: "slashing",
  ["PARRY-RIPOSTE" /* ParryRiposte */]: "slashing",
  ["BASHING ATTACK" /* BashingAttack */]: "slashing",
  ["WALL OF STEEL" /* WallOfSteel */]: "slashing",
  ["TOTAL PARRY" /* TotalParry */]: "slashing"
};
function getWeaponType(weaponId, style) {
  if (!weaponId || weaponId === "fists" || weaponId === "none")
    return "fist";
  if (HYBRID_WEAPONS[weaponId]) {
    if (style) {
      const styleType = STYLE_TO_WEAPON_TYPE[style];
      if (styleType)
        return styleType;
    }
    return HYBRID_WEAPONS[weaponId][0] ?? "fist";
  }
  const slashing = ["scimitar", "broadsword", "greatsword", "hatchet", "battle_axe", "great_axe"];
  const bashing = [
    "mace",
    "morning_star",
    "maul",
    "war_flail",
    "war_hammer",
    "quarterstaff",
    "large_shield",
    "medium_shield",
    "small_shield"
  ];
  const piercing = ["epee", "dagger", "short_spear", "long_spear"];
  if (slashing.includes(weaponId))
    return "slashing";
  if (bashing.includes(weaponId))
    return "bashing";
  if (piercing.includes(weaponId))
    return "piercing";
  return "fist";
}

// src/engine/narrative/narrativeIntro.ts
function generateWarriorIntro(rng, data, sz) {
  const lines = [];
  const n = data.name;
  if (sz)
    lines.push(`${n} is ${szToHeight(sz)}.`);
  const hand = data.handedness ? data.handedness === "ambidextrous" ? "ambidextrous" : `${data.handedness} handed` : rng.next() < 0.85 ? "right handed" : rng.next() < 0.5 ? "left handed" : "ambidextrous";
  lines.push(`${n} is ${hand}.`);
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== "none_armor") {
    const verb = getFromArchive(rng, ["fanfare", "armor_intro_verbs"]) || "is wearing";
    lines.push(`${n} ${verb} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }
  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== "none_helm") {
    lines.push(`And will wear a ${helmItem.name.toUpperCase()}.`);
  }
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === "OPEN HAND") {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    const verb = getFromArchive(rng, ["fanfare", "weapon_intro_verbs"]) || "is armed with {{weapon}}";
    lines.push(interpolateTemplate(verb, { attacker: n, weapon: weaponName }));
  }
  lines.push(`${n} uses the ${STYLE_DISPLAY_NAMES[data.style]} style.`);
  const weaponItem = data.weaponId ? getItemById(data.weaponId) : undefined;
  if (data.attributes && weaponItem && weaponItem.id !== "fist") {
    const fit = checkWeaponRequirements(weaponItem.id, data.attributes);
    if (fit.attPenalty < 0) {
      lines.push(`${n} strains against the ${weaponItem.name} \u2014 ill-suited to its demands.`);
    } else {
      lines.push(`${n} is well suited to the ${weaponItem.name}.`);
    }
  } else {
    lines.push(`${n} is well suited to the weapons selected.`);
  }
  const backupItem = data.backupWeaponId ? getItemById(data.backupWeaponId) : undefined;
  if (backupItem && backupItem.id !== "none_backup" && backupItem.id !== "fist") {
    lines.push(`${n} carries a ${backupItem.name} as backup.`);
  }
  return lines;
}
function battleOpener(rng, attackerName, defenderName) {
  const template = getFromArchive(rng, ["pbp", "openers"]);
  return interpolateTemplate(template, { attacker: attackerName, defender: defenderName });
}
// scripts/stubs/howler.ts
class Howl {
  constructor(_opts) {}
  play() {
    return 0;
  }
  stop() {}
  pause() {}
  volume() {
    return 0;
  }
  unload() {}
}

// src/constants/core/storeKeys.ts
var STORE_KEYS = {
  SAVE_SLOTS: "stable-lords-save-slots",
  UI_PREFS: "sl.ui.prefs",
  AUDIO_MUTED: "sl_muted",
  WINDOW_BOUNDS: "windowBounds"
};

// src/lib/AudioManager.ts
class AudioManager {
  static instance;
  sfx = new Map;
  muted = false;
  ready;
  constructor() {
    this.loadSfx();
    this.ready = this.loadMuteState();
  }
  loadSfx() {
    const sfxFiles = {
      ui_click: "/audio/ui_click.mp3",
      hit: "/audio/hit.mp3",
      crit: "/audio/crit.mp3",
      clash: "/audio/clash.mp3",
      death: "/audio/death.mp3",
      recovery: "/audio/recovery.mp3",
      coin: "/audio/coin.mp3"
    };
    for (const [type, src] of Object.entries(sfxFiles)) {
      this.sfx.set(type, new Howl({ src: [src] }));
    }
  }
  async loadMuteState() {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const muted = await window.electronAPI.storeGet(STORE_KEYS.AUDIO_MUTED);
        this.muted = muted === "true";
      } catch {
        this.muted = false;
      }
    } else if (typeof localStorage !== "undefined") {
      this.muted = localStorage.getItem(STORE_KEYS.AUDIO_MUTED) === "true";
    }
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new AudioManager;
    }
    return this.instance;
  }
  async play(type) {
    await this.ready;
    if (this.muted)
      return;
    const sound = this.sfx.get(type);
    if (sound)
      sound.play();
  }
  async setMuted(muted) {
    this.muted = muted;
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        await window.electronAPI.storeSet(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        console.error("Failed to save mute state to electron-store", error);
      }
    } else if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        if (error?.name === "QuotaExceededError") {
          console.error("localStorage quota exceeded when saving mute state", error);
        } else {
          console.error("Failed to save mute state", error);
        }
      }
    }
  }
  isMuted() {
    return this.muted;
  }
  static resetForTesting() {
    AudioManager.instance = undefined;
  }
}
var audioManager = AudioManager.getInstance();

// src/engine/narrative/combatNarrators.ts
function narrateAttack(rng, attackerName, weaponId, _isMastery, defenderName, style) {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId, style);
  const template = getFromArchive(rng, ["pbp", "attacks", wType]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName
  });
}
function narratePassive(rng, style, actorName) {
  const template = getFromArchive(rng, ["passives", style]);
  return interpolateTemplate(template, { attacker: actorName });
}
function narrateParry(rng, defenderName, weaponId, attackerName) {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ["small_shield", "medium_shield", "large_shield"].includes(weaponId);
  const type = isShield ? "shield" : "parry";
  const template = getFromArchive(rng, ["pbp", "defenses", type, "success"]);
  return interpolateTemplate(template, {
    defender: defenderName,
    weapon: wName,
    attacker: attackerName
  });
}
function narrateDodge(rng, defenderName, speed, attackerName) {
  let tier;
  if (speed === undefined) {
    tier = "tier1_low";
  } else if (speed >= 26) {
    tier = "tier4_supernatural";
  } else if (speed >= 19) {
    tier = "tier3_high";
  } else if (speed >= 12) {
    tier = "tier2_medium";
  } else {
    tier = "tier1_low";
  }
  const template = getFromArchive(rng, ["pbp", "defenses", "dodge", tier]);
  return interpolateTemplate(template, { defender: defenderName, attacker: attackerName });
}
function narrateKnockdown(rng, name, speed) {
  let tier = null;
  if (speed !== undefined) {
    tier = speed >= 19 ? "fast" : "slow";
  }
  const pool = tier ? peekArchive(["pbp", "knockdown", "pacing", tier]) : null;
  const template = pool ? rng.pick(pool) : getFromArchive(rng, ["pbp", "knockdown", "fall"]);
  return interpolateTemplate(template, { name });
}
function narrateRecovery(rng, name, speed, opponentName) {
  let tier = null;
  if (speed !== undefined) {
    tier = speed >= 19 ? "recovery_fast" : "recovery_slow";
  }
  const pool = tier ? peekArchive(["pbp", "knockdown", "pacing", tier]) : null;
  const template = pool ? rng.pick(pool) : getFromArchive(rng, ["pbp", "knockdown", "recovery"]);
  return interpolateTemplate(template, { name, attacker: opponentName });
}
function getEpithet(rng, origin, race, style) {
  if (rng.next() > 0.3)
    return null;
  const available = [];
  if (origin)
    available.push({ key: "origin", value: origin });
  if (race)
    available.push({ key: "race", value: race });
  if (style)
    available.push({ key: "style", value: style });
  if (available.length === 0)
    return null;
  const selected = available[Math.floor(rng.next() * available.length)];
  if (!selected)
    return null;
  const template = getFromArchive(rng, ["pbp", "epithets", selected.key]);
  const context = {};
  context[selected.key] = selected.value;
  return interpolateTemplate(template, context);
}
function narrateCounterstrike(rng, defenderName, attackerName) {
  const template = getFromArchive(rng, ["pbp", "defenses", "counterstrike", "success"]) || "{{defender}} counters!";
  return interpolateTemplate(template, { defender: defenderName, attacker: attackerName });
}
function narrateHit(rng, defenderName, location, _isMastery, isSuperFlashy, attackerName, weaponId, damage, maxHp, isFatal, attackerFame, isFavorite, style) {
  const richLoc = richHitLocation(rng, location);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId, style);
  const severity = getStrikeSeverity(damage || 0, maxHp || 100, isFatal || false, isSuperFlashy || false, isFavorite || false, attackerFame || 0);
  if (severity === "critical_human" || severity === "critical_supernatural") {
    audioManager.play("crit");
  }
  let template = "";
  if (isFatal) {
    template = getFromArchive(rng, ["pbp", "executions"]);
  }
  if (!template || template === "A fierce exchange occurs.") {
    template = getFromArchive(rng, ["strikes", wType, severity]);
  }
  if (!template || template === "A fierce exchange occurs.") {
    template = getFromArchive(rng, ["strikes", "generic"]) || getFromArchive(rng, ["pbp", "hits", "generic"]);
  }
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
    bodyPart: richLoc
  });
}
function narrateInitiative(rng, winnerName, isFeint, defenderName) {
  const path = isFeint ? ["pbp", "feints"] : ["pbp", "initiative"];
  const template = getFromArchive(rng, path);
  return interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
}
// src/engine/narrative/narrativeStatus.ts
function damageSeverityLine(rng, damage, maxHp, defenderName) {
  const ratio = damage / maxHp;
  if (ratio >= 0.35)
    return interpolateTemplate(getFromArchive(rng, ["pbp", "damage_severity", "deadly"]), {
      defender: defenderName
    });
  if (ratio >= 0.25)
    return interpolateTemplate(getFromArchive(rng, ["pbp", "damage_severity", "terrific"]), {
      defender: defenderName
    });
  if (ratio >= 0.15)
    return interpolateTemplate(getFromArchive(rng, ["pbp", "damage_severity", "powerful"]), {
      defender: defenderName
    });
  if (ratio <= 0.05)
    return interpolateTemplate(getFromArchive(rng, ["pbp", "damage_severity", "glancing"]), {
      defender: defenderName
    });
  return null;
}
function stateChangeLine(rng, name, hpRatio, prevHpRatio) {
  let cat = "";
  if (hpRatio <= 0.2 && prevHpRatio > 0.2)
    cat = "severe";
  else if (hpRatio <= 0.4 && prevHpRatio > 0.4)
    cat = "desperate";
  else if (hpRatio <= 0.6 && prevHpRatio > 0.6)
    cat = "serious";
  if (cat) {
    const template = getFromArchive(rng, ["pbp", "status_changes", cat]);
    return interpolateTemplate(template, { name });
  }
  return null;
}
function fatigueLine(_rng, name, endRatio) {
  if (endRatio <= 0.15)
    return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3)
    return `${name} is breathing heavily.`;
  return null;
}
function crowdReaction(rng, loserName, winnerName, hpRatio, crowdMood) {
  if (rng.next() > 0.25)
    return null;
  if (crowdMood === "Bloodthirsty" || crowdMood === "Theatrical") {
    const moodLine = getFromArchive(rng, ["crowd_reactions", crowdMood]);
    if (moodLine && moodLine !== "A fierce exchange occurs.") {
      return interpolateTemplate(moodLine, { name: loserName, attacker: winnerName });
    }
  }
  const isDeadly = hpRatio <= 0.1;
  const mood = isDeadly ? "gasp" : hpRatio <= 0.3 ? "encourage" : rng.next() < 0.5 ? "boo" : "cheer";
  const template = getFromArchive(rng, ["pbp", "reactions", mood]) || getFromArchive(rng, [
    "pbp",
    "reactions",
    mood === "boo" ? "negative" : mood === "cheer" ? "positive" : "encourage"
  ]);
  return interpolateTemplate(template, { name: loserName, attacker: winnerName });
}
function minuteStatusLine(rng, _minute, nameA, nameD, hitsA, hitsD) {
  if (hitsA > hitsD + 3)
    return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3)
    return `${nameD} is beating his opponent!`;
  return getFromArchive(rng, ["pbp", "pacing", "stalemate"]);
}
// src/engine/narrative/narrativePostBout.ts
var CAUSE_ARCHIVE_PATH = {
  EXECUTION: "execution",
  CRITICAL_CHAIN: "critical_chain",
  ARMOR_FAILURE: "armor_failure",
  FATIGUE_COLLAPSE: "fatigue_collapse",
  RIVALRY_FINISH: "rivalry_finish",
  FATAL_DAMAGE: "fatal_damage"
};
function narrateBoutEnd(rng, by, winnerName, loserName, weaponId, ctx = {}) {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId, ctx.style);
  const categoryMap = {
    Kill: "Kill",
    KO: "KO",
    Stoppage: "Stoppage",
    Exhaustion: "Exhaustion",
    Decision: "Exhaustion",
    Yield: "Surrender"
  };
  const cat = categoryMap[by] || "KO";
  const conclusionTemplate = getFromArchive(rng, ["conclusions", cat]);
  const conclusion = interpolateTemplate(conclusionTemplate, {
    attacker: winnerName,
    defender: loserName,
    weapon: wName,
    name: loserName
  });
  if (cat === "Kill")
    audioManager.play("death");
  if (cat === "Kill") {
    const causeSlug = ctx.cause ? CAUSE_ARCHIVE_PATH[ctx.cause] : undefined;
    const styleSlug = ctx.style ? ctx.style.toLowerCase() : undefined;
    const moodSlug = ctx.mood ? ctx.mood.toLowerCase() : undefined;
    const candidatePaths = [];
    if (causeSlug && styleSlug && moodSlug)
      candidatePaths.push(["kill_text", causeSlug, styleSlug, moodSlug]);
    if (causeSlug && styleSlug)
      candidatePaths.push(["kill_text", causeSlug, styleSlug]);
    if (causeSlug)
      candidatePaths.push(["kill_text", causeSlug]);
    candidatePaths.push(["strikes", wType, "fatal"]);
    candidatePaths.push(["strikes", "generic"]);
    let fatalBlowTemplate = "";
    const fallbackMarker = "A fierce exchange occurs.";
    for (const path of candidatePaths) {
      const pool = peekArchive(path);
      if (pool && pool.length > 0) {
        fatalBlowTemplate = getFromArchive(rng, path);
        if (fatalBlowTemplate && fatalBlowTemplate !== fallbackMarker)
          break;
      }
    }
    if (!fatalBlowTemplate)
      fatalBlowTemplate = fallbackMarker;
    const fatalBlow = interpolateTemplate(fatalBlowTemplate, {
      attacker: winnerName,
      defender: loserName,
      weapon: wName,
      name: loserName
    });
    return [fatalBlow, conclusion];
  }
  return [conclusion];
}
function conservingLine(name) {
  return `${name} is conserving his energy.`;
}
// src/engine/narrative/narrativePositioning.ts
var RANGE_NAMES = {
  Grapple: "grappling range",
  Tight: "tight quarters",
  Striking: "striking range",
  Extended: "extended range"
};
function narrateRangeShift(rng, moverName, newRange) {
  const rangeName = RANGE_NAMES[newRange] ?? newRange.toLowerCase();
  const templates = [
    `%A forces the fight to ${rangeName}.`,
    `%A dictates the distance \u2014 shifting into ${rangeName}.`,
    `%A drives the gap, repositioning to ${rangeName}.`,
    `%A seizes the spacing advantage, pulling into ${rangeName}.`,
    `%A controls the range \u2014 the fight moves to ${rangeName}.`
  ];
  return interpolateTemplate(rng.pick(templates), { attacker: moverName });
}
function narrateFeint(rng, attackerName, succeeded, defenderName) {
  if (succeeded) {
    const template = getFromArchive(rng, ["pbp", "feints"]);
    return interpolateTemplate(template, { attacker: attackerName, defender: defenderName });
  } else {
    const templates = [
      `%A's feint is read \u2014 the deception falls flat.`,
      `%A attempts a feint, but the ruse is transparent.`,
      `%A tries to deceive, but their opponent sees through it instantly.`,
      `%A's misdirection fools no one \u2014 the opponent doesn't bite.`
    ];
    return interpolateTemplate(rng.pick(templates), { attacker: attackerName });
  }
}
function narrateZoneShift(rng, pushedName, zone) {
  if (zone === "Corner") {
    const templates = [
      `%A is backed into a corner \u2014 options shrinking fast.`,
      `%A finds the wall at their back, hemmed in with nowhere to go.`,
      `%A is driven into the corner \u2014 pressure becoming desperate.`
    ];
    return interpolateTemplate(rng.pick(templates), { attacker: pushedName });
  } else if (zone === "Edge") {
    const templates = [
      `%A gives ground, retreating to the edge of the arena.`,
      `%A is pushed to the boundary \u2014 the pressure is mounting.`,
      `%A cedes the center, falling back toward the perimeter.`
    ];
    return interpolateTemplate(rng.pick(templates), { attacker: pushedName });
  } else {
    const templates = [
      `%A recovers ground, reclaiming the center of the arena.`,
      `%A finds space to breathe \u2014 pushing away from the wall.`,
      `%A wrestles back to open ground.`
    ];
    return interpolateTemplate(rng.pick(templates), { attacker: pushedName });
  }
}
function arenaIntroLine(arenaConfig) {
  return `\u2694 ${arenaConfig.name.toUpperCase()} \u2014 ${arenaConfig.description}`;
}
function tacticStreakLine(name, tactic, streak) {
  if (streak === 3)
    return `${name} is leaning heavily on the ${tactic}.`;
  if (streak >= 5)
    return `${name}'s repeated ${tactic} is now obvious to everyone watching.`;
  return null;
}
function narrateInsightHint(rng, attribute, attackerName, defenderName) {
  const template = getFromArchive(rng, ["pbp", "insights", attribute]);
  if (!template || template === "A fierce exchange occurs.")
    return null;
  return interpolateTemplate(template, { attacker: attackerName, defender: defenderName });
}
// src/engine/combat/narrative/narrateEvents.ts
function narrateEvents(events, ctx, minute) {
  const { rng, nameA, nameD, weaponA, weaponD } = ctx;
  const log = [];
  const getName = (actor) => actor === "A" ? nameA : nameD;
  const getOpponentName = (actor) => actor === "A" ? nameD : nameA;
  const getWeapon = (actor) => actor === "A" ? weaponA : weaponD;
  const getStyle = (actor) => actor === "A" ? ctx.styleA : ctx.styleD;
  const getMaxHp = (actor) => actor === "A" ? ctx.maxHpA : ctx.maxHpD;
  const getFame = (actor) => actor === "A" ? ctx.fameA : ctx.fameD;
  const getIsFavorite = (actor) => actor === "A" ? ctx.isFavoriteA : ctx.isFavoriteD;
  const getSpeed = (actor) => actor === "A" ? ctx.spA : ctx.spD;
  const getOrigin = (actor) => actor === "A" ? ctx.originA : ctx.originD;
  const displayName = (actor) => {
    const base = getName(actor);
    const epithet = getEpithet(rng, getOrigin(actor));
    return epithet ?? base;
  };
  const getPostHitRatio = (target, event) => {
    if (target === "A" && ctx.postHpRatioA !== undefined)
      return ctx.postHpRatioA;
    if (target === "D" && ctx.postHpRatioD !== undefined)
      return ctx.postHpRatioD;
    const appliedDmg = event.metadata?.appliedDamage ?? event.value ?? 0;
    const prevRatio = target === "A" ? ctx.prevHpRatioA : ctx.prevHpRatioD;
    return Math.max(0, prevRatio - appliedDmg / getMaxHp(target));
  };
  for (const event of events) {
    const actorName = getName(event.actor);
    const opponentName = getOpponentName(event.actor);
    const weapon = getWeapon(event.actor);
    switch (event.type) {
      case "INITIATIVE":
        if (rng.next() < 0.3) {
          log.push({
            minute,
            text: narrateInitiative(rng, actorName, rng.next() < 0.3, opponentName)
          });
        }
        break;
      case "ATTACK":
        if (event.result === "WHIFF") {
          log.push({
            minute,
            text: narrateAttack(rng, displayName(event.actor), weapon, false, opponentName, getStyle(event.actor))
          });
          log.push({
            minute,
            text: narrateDodge(rng, opponentName, getSpeed(event.actor === "A" ? "D" : "A"), displayName(event.actor))
          });
        }
        break;
      case "KNOCKDOWN":
        log.push({ minute, text: narrateKnockdown(rng, actorName, getSpeed(event.actor)) });
        break;
      case "RECOVERY":
        log.push({
          minute,
          text: narrateRecovery(rng, actorName, getSpeed(event.actor), opponentName)
        });
        break;
      case "DEFENSE":
        if (event.result === "PARRY") {
          log.push({
            minute,
            text: narrateAttack(rng, getOpponentName(event.actor), getWeapon(event.actor === "A" ? "D" : "A"), false, actorName, getStyle(event.actor === "A" ? "D" : "A"))
          });
          log.push({ minute, text: narrateParry(rng, actorName, weapon, opponentName) });
        } else if (event.result === "DODGE") {
          log.push({
            minute,
            text: narrateDodge(rng, actorName, getSpeed(event.actor), opponentName)
          });
        } else if (event.result === "RIPOSTE") {
          log.push({ minute, text: narrateCounterstrike(rng, actorName, opponentName) });
        }
        break;
      case "HIT":
        if (event.location) {
          const isMastery = !!event.metadata?.isMastery;
          const isSuperFlashy = isMastery && (!!event.metadata?.crit || event.value && event.value > 5 || events.some((e) => e.type === "BOUT_END"));
          if (events.some((e) => e.type === "DEFENSE" && e.result === "RIPOSTE" && e.actor === event.actor)) {
            log.push({
              minute,
              text: narrateAttack(rng, displayName(event.actor), weapon, isMastery, opponentName, getStyle(event.actor))
            });
          } else if (!events.some((e) => e.type === "DEFENSE" && e.actor === event.target)) {
            log.push({
              minute,
              text: narrateAttack(rng, displayName(event.actor), weapon, isMastery, opponentName, getStyle(event.actor))
            });
          }
          const isFatal = !!event.metadata?.lethal;
          const isCrit = !!event.metadata?.crit;
          const isHeavyHit = isCrit || isFatal || !!event.value && event.value / getMaxHp(event.target) >= 0.15;
          log.push({
            minute,
            text: narrateHit(rng, opponentName, event.location, isMastery, isSuperFlashy, actorName, weapon, event.value, getMaxHp(event.target), isFatal, getFame(event.actor), getIsFavorite(event.actor), getStyle(event.actor)),
            emphasis: isHeavyHit
          });
          if (isCrit) {
            log.push({
              minute,
              text: `\uD83D\uDCA5 CRITICAL HIT! ${actorName} finds a vital weakness!`,
              emphasis: true
            });
          }
          if (event.value) {
            const sevLine = damageSeverityLine(rng, event.value, getMaxHp(event.target), opponentName);
            if (sevLine)
              log.push({ minute, text: sevLine });
            const target = event.target;
            const prevRatio = target === "A" ? ctx.prevHpRatioA : ctx.prevHpRatioD;
            const newHpRatio = getPostHitRatio(target, event);
            const sLine = stateChangeLine(rng, opponentName, newHpRatio, prevRatio);
            if (sLine)
              log.push({ minute, text: sLine });
            const crowd = crowdReaction(rng, opponentName, actorName, newHpRatio, ctx.crowdMood);
            if (crowd)
              log.push({ minute, text: crowd });
          }
        }
        break;
      case "FATIGUE":
        if (event.value !== undefined) {
          const fLine = fatigueLine(rng, actorName, event.value);
          if (fLine)
            log.push({ minute, text: fLine });
        }
        break;
      case "PASSIVE":
        if (event.result) {
          log.push({
            minute,
            text: narratePassive(rng, event.actor === "A" ? ctx.styleA : ctx.styleD, actorName)
          });
        }
        break;
      case "INSIGHT": {
        const attribute = event.metadata?.attribute || "ST";
        const hint = narrateInsightHint(rng, attribute, actorName, opponentName);
        if (hint)
          log.push({ minute, text: `\uD83D\uDD0D ${hint}` });
        break;
      }
      case "MOMENTUM_SHIFT": {
        const newMom = event.value ?? 0;
        const prevMom = event.metadata?.prev ?? 0;
        const swing = Math.abs(newMom - prevMom);
        if (swing >= 2 || Math.abs(newMom) >= 2) {
          let text = null;
          if (newMom >= 3) {
            text = `${actorName} is absolutely dominant \u2014 driving every exchange.`;
          } else if (newMom >= 2) {
            text = `${actorName} seizes the upper hand, dictating the tempo.`;
          } else if (newMom <= -2) {
            text = `${actorName} is on the back foot, struggling to find a rhythm.`;
          } else if (swing >= 2) {
            const reason = event.metadata?.reason;
            if (reason === "PARRY") {
              text = `${actorName} turns the tide with a iron-solid block.`;
            } else {
              text = `${actorName} turns the tide \u2014 a sharp counter reverses the momentum.`;
            }
          }
          if (text)
            log.push({ minute, text });
        }
        break;
      }
      case "STATE_CHANGE": {
        const result = event.result;
        if (result === "COMMIT") {
          log.push({
            minute,
            text: `${actorName} throws aside all caution \u2014 a desperate, all-or-nothing assault!`
          });
        } else if (result === "SURVIVAL_STRIKE") {
          log.push({
            minute,
            text: `${actorName} barely survives the onslaught \u2014 and answers with fury!`
          });
        } else if (result === "DESPERATE") {
          log.push({
            minute,
            text: `${actorName} is in dire straits \u2014 switching to survival mode.`
          });
        } else if (result?.startsWith("PSYCH_")) {
          const state2 = result.replace("PSYCH_", "");
          const psychLines = {
            INTHEZONE: `${actorName}'s movements become fluid and precise \u2014 completely locked in.`,
            RATTLED: `${actorName} can't find the rhythm. Something has broken their composure.`,
            DESPERATE: `${actorName} fights on pure instinct now, their mind fracturing under the pressure.`,
            CRUISING: `${actorName} looks almost comfortable \u2014 controlling this fight with ease.`
          };
          const line = psychLines[state2];
          if (line && rng.next() < 0.5)
            log.push({ minute, text: line });
        }
        break;
      }
      case "RANGE_SHIFT": {
        if (event.result) {
          log.push({ minute, text: narrateRangeShift(rng, actorName, event.result) });
        }
        break;
      }
      case "FEINT_SUCCESS":
        log.push({ minute, text: narrateFeint(rng, actorName, true, opponentName) });
        break;
      case "FEINT_FAIL":
        log.push({ minute, text: narrateFeint(rng, actorName, false, opponentName) });
        break;
      case "ZONE_SHIFT": {
        if (event.result && event.target) {
          const pushedName = getName(event.target);
          log.push({ minute, text: narrateZoneShift(rng, pushedName, event.result) });
        }
        break;
      }
    }
  }
  return { log };
}
// src/engine/combat/phase.ts
function getPhaseByExchange(exchange, maxExchanges) {
  if (maxExchanges <= 0)
    return "opening";
  if (exchange < 0)
    return "opening";
  const p = Math.floor(exchange / maxExchanges * 3);
  if (p <= 0)
    return "opening";
  if (p === 1)
    return "mid";
  return "late";
}

// src/engine/simulate/logging.ts
function buildExchangeLogEntry(exchangeIndex, minute, phase, events) {
  const entry = { exchangeIndex, minute, phase };
  const reasonCodes = [];
  for (const e of events) {
    switch (e.type) {
      case "INITIATIVE":
        entry.iniWinner = e.actor;
        break;
      case "ATTACK":
        if (e.result === "WHIFF")
          entry.attResult = "miss";
        else if (e.metadata?.crit)
          entry.attResult = "crit";
        else if (e.result === "FUMBLE")
          entry.attResult = "fumble";
        break;
      case "DEFENSE":
        if (e.result === "PARRY") {
          entry.parResult = "success";
          entry.attResult ??= "miss";
        } else if (e.result === "DODGE") {
          entry.defResult = "dodge";
          entry.attResult ??= "miss";
        } else if (e.result === "RIPOSTE")
          entry.ripResult = "hit";
        break;
      case "HIT":
        entry.attResult ??= e.metadata?.crit ? "crit" : "hit";
        if (typeof e.value === "number")
          entry.damage = (entry.damage ?? 0) + e.value;
        if (e.location)
          entry.hitLocation = e.location;
        break;
      case "BOUT_END":
        if (e.metadata?.cause)
          reasonCodes.push(`CAUSE_${String(e.metadata.cause)}`);
        entry.executionFlag = e.result === "Kill";
        entry.killWindow ??= e.result === "Kill";
        break;
      case "KNOCKDOWN":
        entry.knockdown ??= e.actor;
        break;
      case "RECOVERY":
        entry.recovery ??= e.actor;
        break;
      case "MOMENTUM_SHIFT":
        entry.momentumShift ??= {
          actor: e.actor,
          to: e.value ?? 0,
          from: e.metadata?.prev ?? 0
        };
        break;
    }
  }
  if (reasonCodes.length)
    entry.reasonCodes = reasonCodes;
  return entry;
}

// src/engine/simulate/simulationLoop.ts
function toPhase(key) {
  return key === "opening" ? "OPENING" : key === "mid" ? "MID" : "LATE";
}
function runSimulationLoop(fA, fD, resCtx, nameA, nameD, weaponA, weaponD, warriorA, warriorD, planA, planD, crowdMood, headless, narRng) {
  const flavorRng = narRng;
  const log = [];
  const exchangeLog = [];
  let prevHpRatioA = 1;
  let prevHpRatioD = 1;
  let winner = null;
  let by = null;
  let lastPhase = null;
  let lastMinuteMarker = 0;
  let currentMinute = 1;
  let causeBucket;
  let fatalHitLocation;
  let fatalExchangeIndex;
  for (let ex = 0;ex < MAX_EXCHANGES; ex++) {
    const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
    currentMinute = min;
    const phase = toPhase(getPhaseByExchange(ex, MAX_EXCHANGES));
    resCtx.phase = phase;
    resCtx.exchange = ex;
    if (phase !== lastPhase) {
      lastPhase = phase;
      if (!headless) {
        const phaseKey = phase.toLowerCase();
        const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
        const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);
        log.push({
          minute: min,
          text: `\u2014 ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase \u2014`,
          phase,
          offTacticA: tacticsA.offTactic !== "none" ? tacticsA.offTactic : undefined,
          defTacticA: tacticsA.defTactic !== "none" ? tacticsA.defTactic : undefined,
          offTacticD: tacticsD.offTactic !== "none" ? tacticsD.offTactic : undefined,
          defTacticD: tacticsD.defTactic !== "none" ? tacticsD.defTactic : undefined
        });
      }
    }
    if (min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      if (!headless) {
        log.push({ minute: min, text: `MINUTE ${min}.` });
        log.push({
          minute: min,
          text: minuteStatusLine(flavorRng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded)
        });
      }
    }
    const yieldThreshold = 0.15;
    if (planA?.fallbackCondition === "YIELD" && fA.hp < fA.maxHp * yieldThreshold && fA.endurance < fA.maxEndurance * yieldThreshold) {
      by = "Yield";
      winner = "D";
      if (!headless) {
        const boutEndLines = narrateBoutEnd(flavorRng, "Yield", nameD, nameA, weaponD, {
          mood: crowdMood
        });
        boutEndLines.forEach((line) => log.push({ minute: min, text: line, emphasis: true }));
      }
      break;
    }
    if (planD?.fallbackCondition === "YIELD" && fD.hp < fD.maxHp * yieldThreshold && fD.endurance < fD.maxEndurance * yieldThreshold) {
      by = "Yield";
      winner = "A";
      if (!headless) {
        const boutEndLines = narrateBoutEnd(flavorRng, "Yield", nameA, nameD, weaponA, {
          mood: crowdMood
        });
        boutEndLines.forEach((line) => log.push({ minute: min, text: line, emphasis: true }));
      }
      break;
    }
    const events = resolveExchange(resCtx, fA, fD);
    if (!headless) {
      exchangeLog.push(buildExchangeLogEntry(ex, min, phase, events));
    }
    if (!headless) {
      const postHpRatioA = Math.max(0, fA.hp / fA.maxHp);
      const postHpRatioD = Math.max(0, fD.hp / fD.maxHp);
      const narCtx = {
        rng: flavorRng,
        nameA,
        nameD,
        weaponA,
        weaponD,
        styleA: fA.style,
        styleD: fD.style,
        maxHpA: fA.maxHp,
        maxHpD: fD.maxHp,
        prevHpRatioA,
        prevHpRatioD,
        postHpRatioA,
        postHpRatioD,
        fameA: warriorA?.fame ?? 0,
        fameD: warriorD?.fame ?? 0,
        isFavoriteA: !!warriorA?.favorites?.discovered?.weapon,
        isFavoriteD: !!warriorD?.favorites?.discovered?.weapon,
        spA: warriorA?.attributes.SP,
        spD: warriorD?.attributes.SP,
        originA: warriorA?.origin,
        originD: warriorD?.origin,
        crowdMood
      };
      const { log: newLines } = narrateEvents(events, narCtx, min);
      log.push(...newLines);
      prevHpRatioA = postHpRatioA;
      prevHpRatioD = postHpRatioD;
      if ((resCtx.tacticStreakA === 3 || resCtx.tacticStreakA === 5) && resCtx.lastOffTacticA) {
        const streakLine = tacticStreakLine(nameA, resCtx.lastOffTacticA, resCtx.tacticStreakA);
        if (streakLine)
          log.push({ minute: min, text: streakLine });
      }
      if ((resCtx.tacticStreakD === 3 || resCtx.tacticStreakD === 5) && resCtx.lastOffTacticD) {
        const streakLine = tacticStreakLine(nameD, resCtx.lastOffTacticD, resCtx.tacticStreakD);
        if (streakLine)
          log.push({ minute: min, text: streakLine });
      }
    }
    const boutEnd = events.find((e) => e.type === "BOUT_END");
    if (boutEnd) {
      by = boutEnd.result;
      fatalHitLocation = boutEnd.metadata?.location;
      fatalExchangeIndex = ex;
      causeBucket = boutEnd.metadata?.cause;
      if (by === "Stoppage" || by === "Decision" || by === "Yield") {
        winner = boutEnd.actor === "A" ? "D" : "A";
      } else if (by === "Exhaustion") {
        winner = null;
      } else {
        winner = boutEnd.actor === "A" ? "A" : "D";
      }
      if (!headless) {
        const boutActorIsWinner = by !== "Stoppage" && by !== "Decision" && by !== "Yield";
        const narWinner = boutActorIsWinner ? boutEnd.actor === "A" ? nameA : nameD : boutEnd.actor === "A" ? nameD : nameA;
        const narLoser = boutActorIsWinner ? boutEnd.actor === "A" ? nameD : nameA : boutEnd.actor === "A" ? nameA : nameD;
        const winnerStyle = boutEnd.actor === "A" ? planA?.style : planD?.style;
        const winnerWeapon = boutActorIsWinner ? boutEnd.actor === "A" ? weaponA : weaponD : boutEnd.actor === "A" ? weaponD : weaponA;
        const boutEndLines = narrateBoutEnd(flavorRng, by, narWinner, narLoser, winnerWeapon, {
          cause: causeBucket,
          style: winnerStyle,
          mood: crowdMood
        });
        boutEndLines.forEach((line) => log.push({ minute: min, text: line, emphasis: true }));
      }
      break;
    }
  }
  return {
    log,
    exchangeLog,
    winner,
    by,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    fightMinutes: Math.max(1, currentMinute)
  };
}

// src/engine/simulate/narrative.ts
function generateIntroductions(rng, nameA, nameD, planA, planD, warriorA, warriorD, weather2 = "Clear", arenaId = "standard_arena", arenaConfig) {
  const log = [];
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;
  const introA = generateWarriorIntro(rng, {
    name: nameA,
    style: planA.style,
    weaponId: weaponA,
    armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor,
    helmId: (warriorA?.equipment ?? DEFAULT_LOADOUT).helm,
    attributes: warriorA?.attributes,
    backupWeaponId: warriorA?.equipment?.backup
  }, warriorA?.attributes?.SZ);
  const introD = generateWarriorIntro(rng, {
    name: nameD,
    style: planD.style,
    weaponId: weaponD,
    armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor,
    helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm,
    attributes: warriorD?.attributes,
    backupWeaponId: warriorD?.equipment?.backup
  }, warriorD?.attributes?.SZ);
  introA.forEach((line) => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: "" });
  introD.forEach((line) => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: "" });
  const weatherLine = weatherOpeningLine(weather2);
  if (weatherLine)
    log.push({ minute: 0, text: `\u2601 ${weather2.toUpperCase()} \u2014 ${weatherLine}` });
  if (arenaId !== "standard_arena" && arenaConfig) {
    log.push({ minute: 0, text: arenaIntroLine(arenaConfig) });
  }
  log.push({ minute: 1, text: battleOpener(rng, nameA, nameD) });
  if (planA.OE <= 3)
    log.push({ minute: 1, text: conservingLine(nameA) });
  if (planD.OE <= 3)
    log.push({ minute: 1, text: conservingLine(nameD) });
  return log;
}

// src/engine/bout/decisionLogic.ts
var JUDGE_SCORERS = {
  Crowd: (fA, fD) => ({
    scoreA: fA.hitsLanded * 1.5 + fA.ripostes * 0.5,
    scoreD: fD.hitsLanded * 1.5 + fD.ripostes * 0.5
  }),
  Technical: (fA, fD) => ({
    scoreA: fA.ripostes * 2 - fA.hitsTaken * 0.5,
    scoreD: fD.ripostes * 2 - fD.hitsTaken * 0.5
  }),
  Blood: (fA, fD) => ({
    scoreA: fD.maxHp - fD.hp,
    scoreD: fA.maxHp - fA.hp
  })
};
function judgeScore(archetype, fA, fD) {
  const { scoreA, scoreD } = JUDGE_SCORERS[archetype](fA, fD);
  if (scoreA > scoreD + 0.5)
    return "A";
  if (scoreD > scoreA + 0.5)
    return "D";
  return null;
}
function decisionNarrative(_winner, _loser, winName, loseName, fW, fL, voteType, dissenter) {
  const hitMargin = fW.hitsLanded - fL.hitsLanded;
  const domination = hitMargin >= 5;
  const close = hitMargin <= 2;
  const dmgDealt = fL.maxHp - fL.hp;
  const dmgTaken = fW.maxHp - fW.hp;
  const prefix = "Time! ";
  let result;
  if (voteType === "overtime") {
    return `${prefix}After a grinding overtime exchange, ${winName} edges out the win by the slimmest of margins.`;
  }
  if (domination) {
    const verb = voteType === "unanimous" ? "dominates" : "dominates";
    result = `${winName} ${verb} on points \u2014 landing ${hitMargin} more strikes than ${loseName}. All three judges are in agreement.`;
    if (voteType === "split") {
      result = `${winName} dominates on points, landing ${hitMargin} more strikes. The ${dissenter} judge dissented, but the scorecards tell the story.`;
    }
  } else if (close) {
    if (voteType === "unanimous") {
      result = `${winName} takes a narrow unanimous decision. The margin was razor-thin \u2014 ${dmgDealt} damage dealt to ${dmgTaken} taken.`;
    } else {
      result = `${winName} scrapes out a split decision. The ${dissenter} judge saw it for ${loseName}, but the majority sided with ${winName}.`;
    }
  } else {
    if (voteType === "unanimous") {
      result = `${winName} wins a clear unanimous decision on points, outworking ${loseName} over the distance.`;
    } else {
      result = `${winName} wins a split decision on points. The ${dissenter} judge sided with ${loseName}, but ${winName} controlled enough of the fight.`;
    }
  }
  return prefix + result;
}
function resolveOvertimeOrTiebreaker(fA, fD, nameA, nameD, aVotes, dVotes, rng) {
  if (rng) {
    const hpA = fA.hp / fA.maxHp;
    const hpD = fD.hp / fD.maxHp;
    const total = hpA + hpD;
    if (total > 0) {
      if (rng() < hpA / total) {
        return {
          winner: "A",
          by: "Decision",
          narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "overtime")
        };
      } else {
        return {
          winner: "D",
          by: "Decision",
          narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "overtime")
        };
      }
    }
  }
  if (aVotes === 1 && dVotes === 1) {
    return {
      winner: null,
      by: "Draw",
      narrative: `Time! The judges are divided. The Arenamaster rules a draw.`
    };
  }
  if (fA.hp > fD.hp) {
    return {
      winner: "A",
      by: "Decision",
      narrative: `Time! ${nameA} wins on the narrowest of margins \u2014 bleeding less than their opponent.`
    };
  }
  if (fD.hp > fA.hp) {
    return {
      winner: "D",
      by: "Decision",
      narrative: `Time! ${nameD} wins on the narrowest of margins \u2014 bleeding less than their opponent.`
    };
  }
  return { winner: null, by: "Draw", narrative: `Time! The Arenamaster declares a draw.` };
}
function resolveDecision(fA, fD, nameA, nameD, rng) {
  const archetypes = ["Crowd", "Technical", "Blood"];
  const votes = archetypes.map((a) => judgeScore(a, fA, fD));
  const { aVotes, dVotes } = votes.reduce((acc, v) => {
    if (v === "A")
      acc.aVotes++;
    if (v === "D")
      acc.dVotes++;
    return acc;
  }, { aVotes: 0, dVotes: 0 });
  if (aVotes === 3) {
    return {
      winner: "A",
      by: "Decision",
      narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "unanimous")
    };
  }
  if (dVotes === 3) {
    return {
      winner: "D",
      by: "Decision",
      narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "unanimous")
    };
  }
  if (aVotes === 2) {
    const dissentIdx = votes.indexOf("D") >= 0 ? votes.indexOf("D") : votes.indexOf(null);
    const dissenter = dissentIdx >= 0 ? archetypes[dissentIdx] : "Blood";
    return {
      winner: "A",
      by: "Decision",
      narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "split", dissenter)
    };
  }
  if (dVotes === 2) {
    const dissentIdx = votes.indexOf("A") >= 0 ? votes.indexOf("A") : votes.indexOf(null);
    const dissenter = dissentIdx >= 0 ? archetypes[dissentIdx] : "Blood";
    return {
      winner: "D",
      by: "Decision",
      narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "split", dissenter)
    };
  }
  return resolveOvertimeOrTiebreaker(fA, fD, nameA, nameD, aVotes, dVotes, rng);
}

// src/engine/simulate/postFight.ts
function generateOutcomeTags(winner, by, fA, fD, fightMinutes) {
  const tags = new Set;
  if (fightMinutes <= 3)
    tags.add("Quick");
  if (fightMinutes >= 8)
    tags.add("Epic");
  if (winner) {
    const w = winner === "A" ? fA : fD;
    const l = winner === "A" ? fD : fA;
    if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded)
      tags.add("Comeback");
    if (w.hitsLanded >= 5)
      tags.add("Dominance");
    if (by === "KO")
      tags.add("KO");
    if (by === "Kill")
      tags.add("Kill");
    if (w.ripostes >= 3)
      tags.add("RiposteChain");
    if (w.ripostes >= 2 || w.hitsLanded >= 6)
      tags.add("Flashy");
  }
  return Array.from(tags);
}
function buildPostFightStats(winner, by, fA, fD, tags, causeBucket, fatalHitLocation, fatalExchangeIndex) {
  return {
    xpA: winner === "A" ? WIN_XP : LOSS_XP,
    xpD: winner === "D" ? WIN_XP : LOSS_XP,
    hitsA: fA.hitsLanded,
    hitsD: fD.hitsLanded,
    gotKillA: winner === "A" && by === "Kill",
    gotKillD: winner === "D" && by === "Kill",
    tags,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex
  };
}
function handleTimeLimit(fA, fD, nameA, nameD, rng, log, headless) {
  const finalOutcome = resolveDecision(fA, fD, nameA, nameD, rng);
  if (!headless) {
    log.push({
      minute: Math.floor(MAX_EXCHANGES / EXCHANGES_PER_MINUTE),
      text: finalOutcome.narrative
    });
  }
  return { winner: finalOutcome.winner, by: finalOutcome.by };
}
function processPostFight(winner, by, fA, fD, nameA, nameD, rng, log, exchangeLog, headless, fightMinutes, causeBucket, fatalHitLocation, fatalExchangeIndex) {
  if (!winner) {
    const timeLimitResult = handleTimeLimit(fA, fD, nameA, nameD, rng, log, headless);
    const finalMinutes2 = fightMinutes;
    return {
      winner: timeLimitResult.winner,
      by: timeLimitResult.by,
      minutes: finalMinutes2,
      log,
      exchangeLog,
      post: buildPostFightStats(timeLimitResult.winner, timeLimitResult.by, fA, fD, generateOutcomeTags(timeLimitResult.winner, timeLimitResult.by, fA, fD, finalMinutes2))
    };
  }
  const finalMinutes = fightMinutes;
  const tags = generateOutcomeTags(winner, by, fA, fD, finalMinutes);
  return {
    winner,
    by,
    minutes: finalMinutes,
    log,
    exchangeLog,
    post: buildPostFightStats(winner, by, fA, fD, tags, causeBucket, fatalHitLocation, fatalExchangeIndex)
  };
}

// src/engine/simulate.ts
function simulateFight(planA, planD, warriorA, warriorD, providedRng, trainers, weather2 = "Clear", arenaId = "standard_arena", crowdMood, headless) {
  const { rng, seed: boutSeed } = initializeRng(providedRng);
  const narRngService = new SeededRNGService(boutSeed ^ 1597463007);
  const nameA = warriorA?.name ?? "Attacker";
  const nameD = warriorD?.name ?? "Defender";
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;
  const { fA, fD, effectiveWeather } = initializeFighters(planA, planD, warriorA, warriorD, trainers, weather2, arenaId);
  const resCtx = initializeResolutionContext(planA, planD, effectiveWeather, warriorA, warriorD, trainers, arenaId, crowdMood);
  resCtx.rng = rng;
  const arenaConfig = resCtx.arenaConfig;
  const introLog = headless ? [] : generateIntroductions(narRngService, nameA, nameD, planA, planD, warriorA, warriorD, effectiveWeather, arenaId, arenaConfig);
  const {
    log: loopLog,
    exchangeLog,
    winner,
    by,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    fightMinutes
  } = runSimulationLoop(fA, fD, resCtx, nameA, nameD, weaponA, weaponD, warriorA, warriorD, planA, planD, crowdMood, headless ?? false, narRngService);
  const log = headless ? [] : [...introLog, ...loopLog];
  return processPostFight(winner, by, fA, fD, nameA, nameD, rng, log, exchangeLog, headless ?? false, fightMinutes, causeBucket, fatalHitLocation, fatalExchangeIndex);
}

// src/test/engine/combat/_helpers.ts
function makeWarrior(name, style, attrs = {}, overrides = {}) {
  const full = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}`,
    name,
    style,
    attributes: full,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    ...overrides
  };
}

// scripts/run-fight.ts
await loadCombatNarrative();
var seed = Number(process.argv[2] ?? 42);
var styleArg = (v, fallback) => Object.values(FightingStyle).find((s) => s === v?.toUpperCase()) ?? fallback;
var styleA = styleArg(process.argv[3], "LUNGING ATTACK" /* LungingAttack */);
var styleD = styleArg(process.argv[4], "PARRY-RIPOSTE" /* ParryRiposte */);
var attrsA = { ST: 13, CN: 12, SZ: 9, WT: 15, WL: 15, SP: 17, DF: 15 };
var attrsD = { ST: 12, CN: 15, SZ: 11, WT: 16, WL: 14, SP: 11, DF: 17 };
var withEquipment = (w) => ({
  ...w,
  equipment: getStyleDefaultLoadout(w.style)
});
var warriorA = withEquipment(makeWarrior("Varrek the Quick", styleA, attrsA));
var warriorD = withEquipment(makeWarrior("Stonefist Maren", styleD, attrsD));
var outcome = simulateFight(defaultPlanForWarrior(warriorA), defaultPlanForWarrior(warriorD), warriorA, warriorD, seed, undefined, "Clear", "standard_arena", undefined, false);
console.log(`=== ${warriorA.name} (${styleA}) vs ${warriorD.name} (${styleD}) \u2014 seed ${seed} ===
`);
var lastMinute = 0;
for (const e of outcome.log) {
  if (e.minute !== lastMinute) {
    lastMinute = e.minute;
    console.log();
  }
  console.log(e.text);
}
var winnerName = outcome.winner === "A" ? warriorA.name : outcome.winner === "D" ? warriorD.name : "nobody";
console.log(`
=== Result: ${winnerName} wins by ${outcome.by} in ${outcome.minutes} minute(s) ===`);
console.log(`hits: A=${outcome.post?.hitsA ?? 0} D=${outcome.post?.hitsD ?? 0}` + (outcome.post?.tags?.length ? ` | tags: ${outcome.post.tags.join(", ")}` : ""));
