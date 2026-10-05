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
      'Lungers seize the exchange before it forms — a single explosive entry that ends most bouts where they begin. They live and die by initiative: the lunge that lands first rarely gets an answer.',
    hallmarks: [
      'Explosive opening exchanges',
      'Initiative-dominant entries',
      'Ends bouts early or fades',
    ],
    counterplay:
      'Survive the burst. Defensive styles that weather the first exchanges watch the lunger spend stamina it cannot recover.',
  },
  [FightingStyle.ParryLunge]: {
    archetype: 'The Fencer',
    description:
      'The parry-lunge is patience weaponized: absorb the advance on a guard, then answer with a single committed thrust that exploits the opening it created. Balanced between defense and counteroffense.',
    hallmarks: [
      'Guard-then-thrust exchanges',
      'Balanced offense and defense',
      'Punishes overcommitment',
    ],
    counterplay:
      'Feint, never commit. Multi-angle flurries split the guard; a bash that never stops moving gives the thrust nothing to catch.',
  },
  [FightingStyle.ParryRiposte]: {
    archetype: 'The Duelist',
    description:
      'Parry-riposte masters treat every incoming strike as a loan to be repaid with interest. The parry redirects, the riposte executes — the cleanest answer to predictable offense ever taught on the sands.',
    hallmarks: [
      'Counter-striking after successful parries',
      'Punishes repeated attack patterns',
      'Surgical riposte accuracy',
    ],
    counterplay:
      'Vary the attack. The riposte reads repetition — a fighter who never strikes the same line twice starves the counter.',
  },
  [FightingStyle.ParryStrike]: {
    archetype: 'The Counterpunch',
    description:
      'Where the duelist deflects, the parry-striker intercepts — turning defense directly into a striking answer. The style trades elegance for reliability: the counter lands on strength as much as timing.',
    hallmarks: [
      'Strike-integrated parries',
      'Strong mid-range answers',
      'Reliable against linear attacks',
    ],
    counterplay:
      'Crowd the guard or go around it. Hooks and angles that come from off-line bypass the intercepting strike.',
  },
  [FightingStyle.SlashingAttack]: {
    archetype: 'The Reaper',
    description:
      'Slashers fight in arcs wide enough to carve through anything standing in them. Where aimers hit a spot, slashers take a limb — the bloodiest finishers in the arena and the crowd’s favorite horror.',
    hallmarks: ['Wide sweeping arcs', 'Highest limb and bleed threat', 'Crowd-favoring brutality'],
    counterplay:
      'Step inside the arc. The wide swing needs room — a fighter pressed against the slasher turns reach into a liability.',
  },
  [FightingStyle.StrikingAttack]: {
    archetype: 'The Hammer',
    description:
      'The striking attack is the arena’s honest style: close, punch, repeat. No tricks, no waiting — volume pressure that wins fights by making the opponent defend more often than they can.',
    hallmarks: ['High-volume pressure', 'Consistent mid-fight output', 'Few defensive weaknesses'],
    counterplay:
      'Volume cuts both ways. An accurate counter-style harvests the openings that constant striking inevitably leaves.',
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
      'Wall of Steel keeps the guard but never abandons the reply — defend in layers, strike in the seams. It is the veteran’s style: rarely spectacular, never easy to beat, and quietly lethal against the reckless.',
    hallmarks: [
      'Layered active defense',
      'Counters from inside the guard',
      'Strong late-fight performance',
    ],
    counterplay:
      'Do not feed the seams. Wild, unpredictable rhythm breaks the layer timing — patience and precision beat the bulwark from range.',
  },
};
