import { FightingStyle } from "@/types/game";

/**
 * Stable Lords — Canonical Narrative Data
 */

export const HIT_LOC_VARIANTS: Record<string, string[]> = {
  "head":      ["HEAD", "JAW", "TEMPLE", "FOREHEAD", "SKULL", "FACE", "THROAT", "NECK", "side of the HEAD"],
  "chest":     ["CHEST", "RIBS", "RIGHT RIBCAGE", "LEFT RIBCAGE", "upper BODY", "BREAST"],
  "abdomen":   ["STOMACH", "ABDOMEN", "PELVIS", "KIDNEYS", "GROIN", "BELLY", "LOWER BODY"],
  "right arm": ["RIGHT ARM", "RIGHT FOREARM", "RIGHT BICEPS", "RIGHT ELBOW", "RIGHT HAND"],
  "left arm":  ["LEFT ARM", "LEFT FOREARM", "LEFT BICEPS", "LEFT ELBOW", "LEFT HAND"],
  "right leg": ["RIGHT LEG", "RIGHT THIGH", "RIGHT KNEE", "RIGHT SHIN", "RIGHT BUTTOCKS"],
  "left leg":  ["LEFT LEG", "LEFT THIGH", "LEFT KNEE", "LEFT SHIN"],
};

export const STYLE_PBP_DESC: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]:      "uses the AIMED BLOW discipline",
  [FightingStyle.BashingAttack]:  "fights using a BASHING attack",
  [FightingStyle.LungingAttack]:  "will fight using the attack style of LUNGING",
  [FightingStyle.ParryLunge]:     "is a devotee of the PARRY-LUNGE style",
  [FightingStyle.ParryRiposte]:   "is a devotee of the PARRY-RIPOSTE style",
  [FightingStyle.ParryStrike]:    "uses the PARRY-STRIKE style",
  [FightingStyle.SlashingAttack]: "uses the SLASHING attack for fighting",
  [FightingStyle.StrikingAttack]: "is dedicated to the STRIKING attack style",
  [FightingStyle.TotalParry]:     "uses the TOTAL PARRY style",
  [FightingStyle.WallOfSteel]:    "is a WALL OF STEEL fighter",
};

export const HELM_DESCS: Record<string, string[]> = {
  "leather_cap": ["LEATHER CAP"],
  "steel_cap":   ["STEEL CAP", "etched STEEL CAP"],
  "helm":        ["HELM", "spectacular HELM"],
  "full_helm":   ["FULL HELM", "fearsome FULL HELM"],
};

export type WeaponType = "slash" | "bash" | "thrust" | "fist" | "generic";

export const ATTACK_TEMPLATES: Record<WeaponType, string[]> = {
  slash: [
    "%N slashes with his %W!",
    "%N slashes an arcing attack with his %W!",
    "%N whips his %W blade back and forth as if to slash his foe to ribbons!",
    "%N makes a slashing attack wielding a %W!",
    "%N makes a slashing attack using his %W!",
    "%N ducks low, his %W slicing suddenly upwards!",
    "%N makes a brilliant twisting thrust with his %W!",
    "%N times a devilish cunning attack, %W leaping with deadly force!",
    "%N's %W lunges with awesome cutting power!",
    "%N strikes using his %W!",
    "%N lunges forward wielding a %W!",
    "%N lunges with his %W!",
    "%N whirls and strikes backhandedly with his %W!",
    "%N drives his %W in a forward slash!",
    "%N leaps into the air taking a furious slash with his %W!",
    "%N leaps forward, swinging his %W into a veritable wall of blades!",
    "%N's %W flashes as he takes a sudden vicious slash at his foe!",
  ],
  bash: [
    "%N bashes with his %W!",
    "%N smashes with his %W!",
    "%N smashes downward with his %W!",
    "%N takes a swipe with his %W!",
    "%N bats murderously at his foe with his %W!",
    "%N strikes using his %W!",
    "%N throws his full weight behind his %W in an all-out assault!",
    "%N attacks, whirling the %W with tremendous force!",
    "%N attempts to smash his opponent with his %W!",
    "%N cleverly tries to break his foe's defense with his %W!",
    "%N swings his %W with deadly intent at the target!",
    "%N whips his %W downward in a vicious power smash!",
  ],
  thrust: [
    "%N lunges wielding an %W!",
    "%N thrusts with his %W!",
    "%N lunges with his %W!",
    "%N lunges forward with his %W!",
    "%N stabs powerfully upward with his %W!",
    "%N uses his %W to make a deadly jab at his foe!",
    "%N unleashes his %W in a piercingly accurate thrust!",
    "%N strikes forward with his %W, all his weight behind the blow!",
    "%N thrusts his %W forward with an unbelievably deadly force!",
    "%N feints, then springs viciously forward with his %W!",
    "%N catapults forward, %W stabbing cruelly at his foe!",
    "%N leaps into an incredible flesh-splitting lunge with his %W!",
    "%N catapults forward, %W flashing in a deadly assault!",
    "%N lunges forward, %W thrusting with incredible speed and accuracy!",
    "%N dives forward, %W stabbing repeatedly with his charge!",
    "%N makes a lunging attack with his %W!",
  ],
  fist: [
    "%N PUNCHES from the waist with unbelievable quickness!",
    "%N throws a rock-fisted PUNCH of incredible felling power!",
    "%N hammers down with a ferocious FOREARM smash!",
    "%N focuses all of his power into a devastating KICK!",
    "%N's HANDS flash forward jabbing fiercely at his surprised foe!",
    "%N attacks, FISTS punching with piston-like horse felling power!",
    "%N throws a piston-like SIDE KICK at his opponent!",
    "%N dives forward, FISTS driving at his opponent with menacing fury!",
    "%N attacks his foe with a pinpoint-accurate ELBOW!",
  ],
  generic: [
    "%N strikes using his %W!",
    "%N makes an attack with his %W!",
    "%N strikes forward with his %W!",
    "%N lashes out with his %W!",
  ],
};

// ─── Mastery & Soul-Bond Templates ──────────────────────────────────────────

export const MASTERY_TEMPLATES: Record<string, string[]> = {
  slash: [
    "%N's blade moves with a soul-bonded precision, a perfect arc of steel!",
    "%N guides his edge with unnatural fluidity, the weapon an extension of his own spirit.",
    "A masterful stroke! %N's %W sings through the air in a perfect rhythmic dance.",
    "%N flows into a mastered slash, the steel flickering like a silver flame."
  ],
  bash: [
    "%N delivers a crushing blow with the perfect weight of his mastered %W!",
    "The impact is heavy and true—%N wields his %W with the absolute leverage of a master.",
    "%N's %W descends with the rhythmic thunder of a soul-bound strike!",
    "Force and technique collide as %N hammers home a flawless mastered strike."
  ],
  thrust: [
    "%N's %W flickers like a serpent's tongue, a mastered thrust of absolute lethality!",
    "With a master's intuition, %N drives the point of his %W through the smallest gap.",
    "%N's steel finds the rhythm of the soul, a piercing strike of lightning speed!",
    "The %W is a needle in %N's hands, guided by a bond beyond simple training."
  ],
  fist: [
    "%N's hands move in a mastered blur, the rhythm of a true brawler!",
    "A strike of pure intuition! %N's fists find the mark with soul-bound power.",
    "%N's movements are liquid and lethal, his very body a mastered weapon.",
    "The rhythm of the street and the soul—%N's fists are a blur of perfect technique."
  ]
};

export const SUPER_FLASHY_TEMPLATES: string[] = [
  "✨ A DIVINE STRIKE! %N's soul and steel are one—a golden flicker of absolute mastery! ✨",
  "✨ THE HEAVENS WATCH! %N delivers a legendary blow, his %W pulsing with a golden aura! ✨",
  "✨ UNSTOPPABLE ! %N's %W finds the soul-rhythm, a strike that will be sung of for ages! ✨",
  "✨ GOLDEN FURY! %N's mastery is absolute, his %W crushing all before it! ✨"
];

export const INI_FEINT_TEMPLATES = [
  "%N feints a high line, drawing his opponent out of position.",
  "%N shows the blade, but it's a clever ruse!",
  "A masterful feint by %N—his opponent bites on the fake!",
  "%N uses a rhythmic twitch to freeze his enemy for a split second."
];

export const EVEN_STATUS = [
  "The warriors appear equal in skill.",
  "The battle is too close to tell.",
  "The warriors appear evenly matched.",
  "There is no decisive victor here yet.",
];

export const KILL_TEMPLATES = [
  "%D is gravely injured!\n%A delivers the killing blow!",
  "%D crumples to the ground, lifeless.\n%A's strike was unerring and final.",
  "%D falls to the arena floor. The wound is mortal.\nSilence grips the crowd.",
  "%D stumbles to the ground!!!\n%D is slain!",
  "%D's armor fails entirely beneath %A's merciless execution!",
  "The arena holds its breath as %A violently ends %D's life in the crimson sand!",
  "%D is severed from the mortal coil by a perfectly placed killing stroke from %A!",
  "%A turns the bout into a slaughter, claiming a gruesome and total victory over %D!",
  "With a terrifying display of lethal force, %A leaves %D lifeless and broken!"
];

export const STOPPAGE_TEMPLATES = [
  "%D motions to the other LORD PROTECTORS that he cannot continue!\n%A is the victor of the match!",
  "%D is stopped by an outcry from the LORD PROTECTORS!\n%A has won the duel!",
  "%D accepts his loss, jaw clenched to keep from admitting his pain!\n%A is the victor of the match!",
  "%D compliments his victorious foe on a good fight.\n%A has won the duel!",
  "%D surrenders, and offers his hand to his foe.\n%A is the victor of the match!",
];

export const EXHAUSTION_TEMPLATES = [
  "%D can no longer keep fighting. Both warriors are spent.\n%A is awarded the bout on points.",
  "Neither warrior can continue! The Arenamaster awards the bout to %A.",
];

export const POPULARITY_TEMPLATES = {
  great:    "%N's popularity has greatly increased!",
  normal:   "%N's popularity has increased.",
  marginal: "%N's popularity has marginally increased.",
};

export const SKILL_LEARNS = [
  "%N learned an ATTACK skill.",
  "%N learned a PARRY skill.",
  "%N learned a DEFENSIVE action.",
  "%N learned an INITIATIVE routine.",
  "%N learned a RIPOSTE technique.",
  "%N learned a DECISIVENESS concept.",
];

export const TRADING_BLOWS = [
  "The two warriors fiercely trade attacks and parry.",
  "The two warriors fiercely trade attacks and parrys.",
  "Both attack, weapons strike and rebound, strike and rebound.",
  "Both attack; weapons strike and rebound, strike and rebound.",
  "The warriors attack together, almost grappling with each other.",
  "The weapons lock together in a struggle for supremacy.",
  "The weapons lock together in a test of strength.",
];

export const STALEMATE_LINES = [
  "The fighters slowly circle each other, looking for a weakness.",
  "The fighters step back from each other for a moment.",
  "The action comes to a halt as the warriors reorient themselves.",
  "The warriors stand quietly and study each other.",
];

export const WINNER_TAUNTS = [
  "%N says, 'Another blow and I'll send you to Ahringol!'",
  "%N says, 'And that is how a real warrior fights. Pay attention next time.'",
  "%N says, 'That was a well fought, and honorable fight.'",
  "%N laughs, 'Oh, this is PRICELESS! Did someone actually tell you you could FIGHT?'",
  "%N growls, 'Are you even human?'",
  "%N grates, 'Try that again, dog!'",
  "%N salutes the audience, then offers a hand to his fallen foe.",
];

export const LOSER_TAUNTS = [
  "%N spits 'May maggots partake of your corpse as they have with your ancestors!'",
  "%N exclaims, 'Give it up now, wimp, before I rip your face off!'",
  "%N bellows his frustration.",
  "%N mutters a desperate prayer!",
  "%N reels with the fury of combat!",
  "%N howls like a maddened beast!",
];

export const PRESSING_TEMPLATES = [
  "Our brawny gladiator is pressing his foe to the limit!",
  "%N can't believe that this guy has not surrendered!",
  "%N fights with the cunning of desperation!",
];

export const INSIGHT_ST_HINTS = [
  "His parry shatters under your monstrous strength!",
  "Your blade meets staggering resistance, his strength is undeniable.",
  "He carelessly bats away your strike with raw power.",
];

export const INSIGHT_SP_HINTS = [
  "His sluggish movements fail to catch your swift strike.",
  "He moves with blinding speed, leaving you swinging at shadows.",
  "Your reflexes seem barely enough to keep up with his pace.",
];

export const INSIGHT_DF_HINTS = [
  "He clumsily overextends, leaving himself wide open.",
  "His flawless footwork and deft parry leave you bewildered.",
  "His clumsy defense makes him an easy target.",
];

export const INSIGHT_WL_HINTS = [
  "Despite the punishment, his iron will keeps him standing.",
  "He seems to waver, his resolve breaking under your assault.",
];
