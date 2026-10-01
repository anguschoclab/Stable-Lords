import type { TraitDef } from '../types';

export const SIGNATURE_TRAITS: Record<string, TraitDef> = {
  beast_blood: {
    id: 'beast_blood',
    name: 'Beast Blood',
    description:
      '+1 attack when at low HP and +1 initiative while fresh — lashes out like a wounded animal but starts strong.',
    effect: { attModLowHp: 1, iniModFresh: 1 },
    weight: 0.7,
    tier: 'Signature',
    sign: 'positive',
  },
  rusted_resolve: {
    id: 'rusted_resolve',
    name: 'Rusted Resolve',
    description:
      '+1 defense when bloodied and +1 defense in LATE phase — pain only hardens them further.',
    effect: { defModLowHp: 1, defModLate: 1 },
    weight: 0.7,
    tier: 'Signature',
    sign: 'positive',
  },
  feral: {
    id: 'feral',
    name: 'Feral',
    description: 'Fights with a savage, unpredictable intensity.',
    effect: { fightPlanMod: { OE: 6, AL: -4, killDesire: 10 }, attrBonus: { ST: 1, SP: 1 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank', 'cunning'],
    tier: 'Signature',
    sign: 'positive',
  },
  merciless: {
    id: 'merciless',
    name: 'Merciless',
    // killDesire 12 stays the highest single-trait source (Feral=10, Aggressive=5);
    // pulled back from 15 to prevent Merciless+Bloodthirsty tripling base kill rate.
    description: 'Relentlessly pursues the kill, ignoring all distractions.',
    effect: { fightPlanMod: { killDesire: 12, OE: 2 }, attrBonus: { ST: 1, WL: 1 } },
    weight: 0.6,
    synergy: ['brutal'],
    tier: 'Signature',
    sign: 'positive',
  },
  evasive: {
    id: 'evasive',
    name: 'Evasive',
    description: 'A ghost on the sand, near-impossible to pin down.',
    effect: { fightPlanMod: { AL: 2, OE: -3, feintTendency: 5 }, attrBonus: { SP: 2 } },
    weight: 0.8,
    synergy: ['agile'],
    antiSynergy: ['brutal', 'tank'],
    tier: 'Signature',
    sign: 'positive',
  },
  brutal: {
    id: 'brutal',
    name: 'Brutal',
    description: 'Values raw power and crushing impact above all else.',
    effect: { fightPlanMod: { OE: 8, killDesire: 5, AL: -5 }, attrBonus: { ST: 2 } },
    weight: 0.8,
    synergy: ['brutal'],
    antiSynergy: ['cunning', 'tank'],
    tier: 'Signature',
    sign: 'positive',
  },
  blood_drunk: {
    id: 'blood_drunk',
    name: 'Blood Drunk',
    description:
      '+2 attack and −2 defense when bloodied (HP < 50%) — loses all sense of self-preservation once injured.',
    effect: { attModLowHp: 2, defModLowHp: -2, fightPlanMod: { killDesire: 3 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank'],
    tier: 'Signature',
    sign: 'positive',
  },
};
