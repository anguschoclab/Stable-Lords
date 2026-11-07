import { FightingStyle } from '@/types/shared.types';

/**
 * Style Archives compendium — authored lore entries for the ten canonical
 * fighting styles. Keyed by the enum (not display name) so a new style fails
 * typecheck until its entry is written.
 */
interface StyleCompendiumEntry {
  /** Short archetype label, e.g. "The Surgeon". */
  archetype: string;
  /** Lore-grade description of the style's philosophy. */
  description: string;
  /** Hallmark behaviors the style is known for in the arena. */
  hallmarks: string[];
  /** Canonical counter-advice shown in the archives. */
  counterplay: string;
}

/** Compendium entries for every FightingStyle — the archives' source of truth. */
export const STYLE_COMPENDIUM: Record<FightingStyle, StyleCompendiumEntry> = {
  [FightingStyle.AimedBlow]: {
    archetype: 'The Surgeon',
    description:
      'Aimed-Blow warriors do not exchange — they select. Every strike is aimed at a specific body location, traded against initiative, and delivered with clinical precision. Masters of the style end careers by targeting what the armor leaves open.',
    hallmarks: [
      'Called shots to vital locations',
      'Superior critical accuracy',
      'Ends bouts with a single precise strike',
    ],
    counterplay:
      'Deny the window: high-activity styles crowd the aim, and layered armor dulls the called shot. Force the surgeon to fight at your tempo, not theirs.',
  },
  [FightingStyle.BashingAttack]: {
    archetype: 'The Avalanche',
    description:
      'Bashers fight forward. Each hit is fuel for the next — consecutive blows build momentum until the defense collapses under sheer weight of offense. Against turtles they are an executioner; against counters, a liability.',
    hallmarks: [
      'Momentum stacking on consecutive hits',
      'Devastating against passive defenses',
      'Early-round aggression',
    ],
    counterplay:
      'Break the chain. Riposte the first blow, parry the second, and the avalanche never forms. A wall of steel only feeds it.',
  },
  [FightingStyle.LungingAttack]: {
    archetype: 'The Spear',
    description:
      'Lungers seize the exchange before it forms — a single explosive entry that ends most bouts where they begin. They live and die by initiative: the lunge that lands first rarely gets an answer. Evenly-built frames behind the longsword and spear outlast the fragile stereotypes.',
    hallmarks: [
      'Explosive opening exchanges',
      'Initiative-dominant entries',
      'Highest endurance burn in the game',
      'Ends bouts early or fades',
    ],
    counterplay:
      'Survive the burst. Defensive styles that weather the first exchanges watch the lunger spend stamina it cannot recover — pure scum in plate armor is the worst out a lunger can draw.',
  },
  [FightingStyle.ParryLunge]: {
    archetype: 'The Fencer',
    description:
      'The parry-lunge is the arena\'s quietest attack god — a versatile duelist who guards behind dodge or parry, then answers with a pinpoint thrust. The best-built ones open defensively to waste an opponent\'s first charge, then hunt the head until the job is done. Fragile frames are common: the deadliest versions are built on wit and deftness, not constitution, and they live their early careers one bad exchange from the infirmary.',
    hallmarks: [
      'Guard-then-thrust exchanges',
      'Precision attacks aimed at the head',
      'Flexible defense — dodge leads, parry supports',
      'Wins by accuracy, not attrition',
      'Demanding to manage — rewards close attention',
    ],
    counterplay:
      'Overwhelm the opening. Bashers and lungers who land early never let the fencer\'s counterattack form — a fragile frame cannot trade blows. Defensive styles starve it differently: outlast the thrust, and the fencer\'s thin endurance burns itself out.',
  },
  [FightingStyle.ParryRiposte]: {
    archetype: 'The Duelist',
    description:
      'Parry-riposte masters treat every incoming strike as a loan to be repaid with interest. The parry redirects, the riposte executes — the cleanest answer to predictable offense ever taught on the sands.',
    hallmarks: [
      'Counter-striking after successful parries',
      'Punishes repeated attack patterns',
      'Surgical riposte accuracy',
      'Low endurance burn outlasts pressure styles',
      'Natural striker-killer and scum-hunter',
    ],
    counterplay:
      'Vary the attack. The riposte reads repetition — a fighter who never strikes the same line twice starves the counter. Aimed blows are the classic answer: precision beats parry, and a ripper who never gets to counter offers nothing.',
  },
  [FightingStyle.ParryStrike]: {
    archetype: 'The Counterpunch',
    description:
      'Where the duelist deflects, the parry-striker intercepts — turning defense directly into a striking answer. The style trades elegance for reliability: the counter lands on strength as much as timing. Veteran managers call it the hardest style to win with and the most flexible — a piker fights above its skill sheet, conserves endurance well, and pivots between offense and defense mid-bout.',
    hallmarks: [
      'Strike-integrated parries',
      'Most flexible style — wins by adaptation',
      'Fights above its skill sheet',
      'Conserves endurance unusually well',
      'Luck swings wider — bonused and cursed more often',
    ],
    counterplay:
      'Crowd the guard or go around it. Hooks and angles that come from off-line bypass the intercepting strike.',
  },
  [FightingStyle.SlashingAttack]: {
    archetype: 'The Reaper',
    description:
      'Slashers fight in arcs wide enough to carve through anything standing in them. Where aimers hit a spot, slashers take a limb — the bloodiest finishers in the arena and the crowd’s favorite horror.',
    hallmarks: [
      'Wide sweeping arcs',
      'Highest limb and bleed threat',
      'Crowd-favoring brutality',
      'Endurance burns fast — win early or fade',
      'Scimitar is the cornerstone blade',
    ],
    counterplay:
      'Step inside the arc. The wide swing needs room — a fighter pressed against the slasher turns reach into a liability. And make it last: the flurry fades fast, so outlast it.',
  },
  [FightingStyle.StrikingAttack]: {
    archetype: 'The Hammer',
    description:
      'The striker is the arena’s pure offensive: wind him up and let him go. The whole style is the first blow — a decisive opener thrown before the other fighter has finished turning, backed by whatever endurance the design could buy. A striker who cannot end it early is just a slow sword arm.',
    hallmarks: [
      'Decisive first-strike — the bout is won in the opening exchange',
      'Pure offensive: never a tank, rarely a dodger',
      'The 10-10 opener, then the tempo falls fast',
      'Hunts offensives and out-endures scum',
      'Armor stays light — ALE or nothing',
    ],
    counterplay:
      'Weather the first blow. A shell or a riposte makes the opener the only card the striker holds — the wall and the ripper are the canonical answers, and the responsive fighter can steal his jump.',
  },
  [FightingStyle.TotalParry]: {
    archetype: 'The Tortoise',
    description:
      'Total parry abandons offense entirely — the shield is the weapon, the fight a waiting game. Nobody wins pretty against a tortoise; most simply run out of stamina beating on the shell.',
    hallmarks: [
      'Near-total defensive commitment',
      'Stamina attrition strategy',
      'Most durable style in the game',
    ],
    counterplay:
      'Momentum and flurries. Bashers build on unbroken defense, and aimed shots find the seams the shell leaves. Patience loses to inevitability.',
  },
  [FightingStyle.WallOfSteel]: {
    archetype: 'The Bulwark',
    description:
      'Wall of Steel — "the Waste" to the managers who swear by it — keeps the guard but never abandons the reply: defend in layers, strike in the seams. It burns endurance like a lunging style, so will does the heavy lifting; run it hot while young, then settle into the high-low pace. Rarely spectacular, never easy to beat, and quietly lethal against the reckless.',
    hallmarks: [
      'Layered active defense',
      'Counters from inside the guard',
      'Strong late-fight performance',
    ],
    counterplay:
      'Do not feed the seams. Wild, unpredictable rhythm breaks the layer timing — patience and precision beat the bulwark from range.',
  },
};
