import { FightingStyle } from '@/types/shared.types';
import type { TraitDef } from '@/engine/traits';

const S = FightingStyle;

export const CLASS_TRAITS: Record<string, TraitDef> = {
  // ── Aimed Blow (precision) ──
  steady_hand: { id: 'steady_hand', name: 'Steady Hand', description: '+1 decisiveness — never rushes the shot.', effect: { decMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.AimedBlow] },
  called_shot: { id: 'called_shot', name: 'Called Shot', description: '+1 damage — picks the gap and drives through it.', effect: { dmgBonus: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.AimedBlow] },
  armor_chink: { id: 'armor_chink', name: 'Armor Chink', description: '+1 damage — finds the seam in any plate.', effect: { dmgBonus: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.AimedBlow] },
  dead_aim: { id: 'dead_aim', name: 'Dead Aim', description: '+1 damage, +1 decisiveness — ruthless precision.', effect: { dmgBonus: 1, decMod: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.AimedBlow] },
  assassin: { id: 'assassin', name: 'Assassin', description: '+1 damage, +1 decisiveness, opens the kill window sooner.', effect: { dmgBonus: 1, decMod: 1, killWindowBonus: 0.01 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.AimedBlow] },

  // ── Bashing Attack ──
  heavy_swing: { id: 'heavy_swing', name: 'Heavy Swing', description: '+1 damage — every blow lands with weight.', effect: { dmgBonus: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.BashingAttack] },
  relentless: { id: 'relentless', name: 'Relentless', description: '+1 attack in the late rounds — never lets up.', effect: { attModLate: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.BashingAttack] },
  bonebreaker: { id: 'bonebreaker', name: 'Bonebreaker', description: '+2 damage, +1 late attack — wears the guard down.', effect: { dmgBonus: 2, attModLate: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.BashingAttack] },
  juggernaut: { id: 'juggernaut', name: 'Juggernaut', description: '+2 damage, tireless — an unstoppable advance.', effect: { dmgBonus: 2, enduranceMult: 0.95 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.BashingAttack] },
  demolisher: { id: 'demolisher', name: 'Demolisher', description: '+3 damage, +1 late attack — shatters any defense.', effect: { dmgBonus: 3, attModLate: 1 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.BashingAttack] },

  // ── Lunging Attack ──
  quickdraw: { id: 'quickdraw', name: 'Quickdraw', description: '+1 initiative — first to the strike.', effect: { iniMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.LungingAttack] },
  fleet_footed: { id: 'fleet_footed', name: 'Fleet-Footed', description: '+2 initiative while fresh — explosive early.', effect: { iniModFresh: 2 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.LungingAttack] },
  lightning_step: { id: 'lightning_step', name: 'Lightning Step', description: '+1 initiative, +1 more while fresh.', effect: { iniMod: 1, iniModFresh: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.LungingAttack] },
  blitz: { id: 'blitz', name: 'Blitz', description: '+1 initiative, +1 attack on a streak — overwhelms.', effect: { iniMod: 1, attModConsecutiveHits: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.LungingAttack] },
  untouchable: { id: 'untouchable', name: 'Untouchable', description: '+2 initiative, +1 defense — too fast to pin.', effect: { iniMod: 2, defMod: 1 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.LungingAttack] },

  // ── Parry-Lunge ──
  counterlunge: { id: 'counterlunge', name: 'Counterlunge', description: '+1 riposte — punishes the over-extension.', effect: { ripMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.ParryLunge] },
  fighting_rhythm: { id: 'fighting_rhythm', name: 'Fighting Rhythm', description: '+1 attack on a hit-streak — finds the beat.', effect: { attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryLunge] },
  riposte_flow: { id: 'riposte_flow', name: 'Riposte Flow', description: '+1 riposte, +1 streak attack.', effect: { ripMod: 1, attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryLunge] },
  duelist: { id: 'duelist', name: 'Duelist', description: '+1 riposte, +1 damage — a clinical counter-fighter.', effect: { ripMod: 1, dmgBonus: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.ParryLunge] },
  whirlwind: { id: 'whirlwind', name: 'Whirlwind', description: '+2 riposte, +1 streak attack — relentless counters.', effect: { ripMod: 2, attModConsecutiveHits: 1 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.ParryLunge] },

  // ── Parry-Riposte ──
  riposte_natural: { id: 'riposte_natural', name: 'Natural Riposte', description: '+1 riposte — counters come naturally.', effect: { ripMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.ParryRiposte] },
  vindicator: { id: 'vindicator', name: 'Vindicator', description: '+1 riposte, +1 damage — makes them pay.', effect: { ripMod: 1, dmgBonus: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryRiposte] },
  parry_master: { id: 'parry_master', name: 'Parry Master', description: '+1 parry, +1 riposte — a wall that bites back.', effect: { parMod: 1, ripMod: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryRiposte] },
  nemesis: { id: 'nemesis', name: 'Nemesis', description: '+2 riposte, +1 damage — the brawler\'s bane.', effect: { ripMod: 2, dmgBonus: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.ParryRiposte] },
  retribution: { id: 'retribution', name: 'Retribution', description: '+2 riposte, +1 damage, +1 decisiveness.', effect: { ripMod: 2, dmgBonus: 1, decMod: 1 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.ParryRiposte] },

  // ── Parry-Strike ──
  counterpuncher: { id: 'counterpuncher', name: 'Counterpuncher', description: '+1 attack on a hit-streak — builds off the counter.', effect: { attModConsecutiveHits: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.ParryStrike] },
  opportunist: { id: 'opportunist', name: 'Opportunist', description: '+1 parry while strong, +1 streak attack.', effect: { parModHighHp: 1, attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryStrike] },
  riposte_strike: { id: 'riposte_strike', name: 'Riposte Strike', description: '+1 riposte, +1 streak attack.', effect: { ripMod: 1, attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.ParryStrike] },
  counter_artist: { id: 'counter_artist', name: 'Counter Artist', description: '+1 parry, +2 streak attack — defend, then punish.', effect: { parMod: 1, attModConsecutiveHits: 2 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.ParryStrike] },
  perfect_counter: { id: 'perfect_counter', name: 'Perfect Counter', description: '+1 parry, +1 riposte, +2 streak attack.', effect: { parMod: 1, ripMod: 1, attModConsecutiveHits: 2 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.ParryStrike] },

  // ── Slashing Attack ──
  keen_edge: { id: 'keen_edge', name: 'Keen Edge', description: '+1 damage — a blade kept razor-sharp.', effect: { dmgBonus: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.SlashingAttack] },
  flurry: { id: 'flurry', name: 'Flurry', description: '+1 attack on a streak — a storm of cuts.', effect: { attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.SlashingAttack] },
  lacerate: { id: 'lacerate', name: 'Lacerate', description: '+1 damage, +1 streak attack — cuts that keep coming.', effect: { dmgBonus: 1, attModConsecutiveHits: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.SlashingAttack] },
  hemorrhage: { id: 'hemorrhage', name: 'Hemorrhage', description: '+1 damage, +2 streak attack — relentless bleeding.', effect: { dmgBonus: 1, attModConsecutiveHits: 2 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.SlashingAttack] },
  exsanguinate: { id: 'exsanguinate', name: 'Exsanguinate', description: '+2 damage, +1 streak attack — bleeds them dry.', effect: { dmgBonus: 2, attModConsecutiveHits: 1 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.SlashingAttack] },

  // ── Striking Attack ──
  crushing_blow: { id: 'crushing_blow', name: 'Crushing Blow', description: '+1 damage — explosive power behind each strike.', effect: { dmgBonus: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.StrikingAttack] },
  opener: { id: 'opener', name: 'Opener', description: '+1 attack — sets a ferocious early pace.', effect: { attMod: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.StrikingAttack] },
  executioner: { id: 'executioner', name: 'Executioner', description: '+2 attack against a wounded foe — smells blood.', effect: { attModLowHp: 2 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.StrikingAttack] },
  berserker_rush: { id: 'berserker_rush', name: 'Berserker Rush', description: '+2 attack when they bleed, +1 damage.', effect: { attModLowHp: 2, dmgBonus: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.StrikingAttack] },
  annihilator: { id: 'annihilator', name: 'Annihilator', description: '+3 attack vs the wounded, +1 damage, faster kills.', effect: { attModLowHp: 3, dmgBonus: 1, killWindowBonus: 0.01 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.StrikingAttack] },

  // ── Total Parry ──
  enduring: { id: 'enduring', name: 'Enduring', description: 'Tireless — outlasts the aggressor.', effect: { enduranceMult: 0.92 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.TotalParry] },
  stonewall: { id: 'stonewall', name: 'Stonewall', description: '+2 defense in the late rounds — the wall holds.', effect: { defModLate: 2 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.TotalParry] },
  war_of_attrition: { id: 'war_of_attrition', name: 'War of Attrition', description: '+2 late defense, tireless — wins the long fight.', effect: { defModLate: 2, enduranceMult: 0.95 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.TotalParry] },
  immovable_object: { id: 'immovable_object', name: 'Immovable Object', description: '+2 late defense, +1 late parry — cannot be moved.', effect: { defModLate: 2, parModLate: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.TotalParry] },
  unbreakable: { id: 'unbreakable', name: 'Unbreakable', description: '+2 late defense, +2 late parry, tireless.', effect: { defModLate: 2, parModLate: 2, enduranceMult: 0.95 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.TotalParry] },

  // ── Wall of Steel ──
  braced: { id: 'braced', name: 'Braced', description: '+1 parry — set and ready.', effect: { parMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.WallOfSteel] },
  bulwark: { id: 'bulwark', name: 'Bulwark', description: '+1 parry, +1 defense — a living barricade.', effect: { parMod: 1, defMod: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.WallOfSteel] },
  anchor: { id: 'anchor', name: 'Anchor', description: '+2 parry — rooted and unyielding.', effect: { parMod: 2 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.WallOfSteel] },
  fortress: { id: 'fortress', name: 'Fortress', description: '+2 parry, +1 defense — nothing gets through.', effect: { parMod: 2, defMod: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.WallOfSteel] },
  living_wall: { id: 'living_wall', name: 'Living Wall', description: '+2 parry, +2 defense — the wall that walks.', effect: { parMod: 2, defMod: 2 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.WallOfSteel] },
};
