/**
 * Canon style doctrine + strategy-lab steering — post-assembly plan shaping.
 * Extracted from index.ts per the single-responsibility decomposition guard.
 */
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/game';
import { clamp } from '@/utils/math';
import { pickStrategyTarget, pickTacticProbe } from '@/engine/ai/plan/strategyLab';
import { getDefensiveSuitability } from '@/engine/strategy/tacticSuitability';
import { OFFENSIVE_TACTICS } from '@/types/enumSources';
import type { OffensiveTactic, DefensiveTactic } from '@/types/combat.types';
import {
  ARCHETYPE_DESIGN_BARS,
  classifyArchetype,
} from '@/data/warriorArchetypes';

/** Canon per-style plan doctrine — hard ceilings applied after all modifiers. */
function applyStyleCaps(plan: FightPlan, w: Warrior): void {
  if (w.style === FightingStyle.AimedBlow) {
    // Duel II canon (Raf/Assur/Trump/Manimal/Paradox): AB is an offensive —
    // OE below 4 makes it "stand around looking for an opening", so OE is
    // floored. KD is capped at 7: every doctrine agrees control/accuracy
    // degrade at high KD ("keep that KD low"). AL is the canonical free
    // knob (x-10 scouts, 1-2 counterpunchers, 5-6 hybrids are all canon).
    // All varieties share these bounds — the variety lives in loadout.
    plan.OE = Math.max(plan.OE, 4);
    plan.killDesire = Math.min(plan.killDesire ?? 5, 7);
    return;
  }
  if (w.style === FightingStyle.SlashingAttack) {
    // Arena 93 slasher canon: no graduate favorite ran OE below moderate —
    // a slasher who stops attacking is just a slow target.
    plan.OE = Math.max(plan.OE, 5);
    return;
  }
  if (w.style === FightingStyle.StrikingAttack) {
    // Arena 93 striker canon (Assur/Blind Man/Crimson/Talon/Tex): every
    // published sheet opens 6-10 OE — a passive striker isn't a striker.
    plan.OE = Math.max(plan.OE, 5);
    return;
  }
  if (w.style === FightingStyle.LungingAttack) {
    // Arena 93 lunger canon (Snorri/Boar/Assur): the style's signature is
    // constant movement — a lunger too slow to move is just a target, so AL
    // is floored at 4 (even Boar's defensive lunger runs Act 4-6). KD caps
    // at 8: Snorri runs the whole style inside the 5-8 band ("with exception
    // of some of my defensives, I always run a 5-8 KD") and Boar's plan
    // proper sits at 4 — only desperation goes 9. OE stays free: canon
    // sheets span Boar's 4 to Snorri's hi.
    plan.AL = Math.max(plan.AL, 4);
    plan.killDesire = Math.min(plan.killDesire ?? 5, 8);
    return;
  }
  if (w.style === FightingStyle.ParryLunge) {
    // Arena 93 PL canon (the Armor-Piercer article + Tripwire + Assur's
    // addendum): "keep the kill desire relatively low as to avoid sloppy
    // attacking." OE/AL stay free — canon favorites span VL–HI / LO–VH.
    plan.killDesire = Math.min(plan.killDesire ?? 5, 7);
    return;
  }
  if (w.style === FightingStyle.WallOfSteel) {
    // Arena 93 wall canon (Eli/She-Puppy/Dante/Assur): "run them offensively
    // while they are young" — young walls take the slasher-style opening, so
    // OE floors at 6 for the first ten fights (the suitability bias's OE
    // knockdown is already applied upstream). Veterans may free-run Dante's
    // defensive 6-4-6 sheets. Every article runs activity moderate-to-low
    // and keeps KD at 6 or under — 7+ belongs to desperation saves.
    const fights = (w.career?.wins ?? 0) + (w.career?.losses ?? 0);
    if (fights < 10) plan.OE = Math.max(plan.OE, 6);
    plan.AL = Math.min(plan.AL, 7);
    plan.killDesire = Math.min(plan.killDesire ?? 5, 7);
    return;
  }
  if (w.style !== FightingStyle.TotalParry) return;
  // Duel II canon recognizes TP varieties by build (Consortium/Blackstorm/
  // Buri/Stimpy): the Un-Scum needs WT 15+/DF 11+ — an active dodge-parry
  // fighter run at OE ~2-7, AL ~4-7, KD ≤7 (responsiveness is its signature
  // tactic vs strikers). Everything else is the Scum: OE never above 5
  // (produces "flailing" attacks), conservative AL, low KD — attrition wins.
  // Caps are ceilings (floors marked) — mods may run lower within doctrine.
  const { WT = 0, DF = 0 } = w.attributes;
  if (WT >= 15 && DF >= 11) {
    // Offensive TP (Un-Scum) — must stay ACTIVE; AL floored at 4.
    plan.OE = Math.min(plan.OE, 7);
    plan.AL = clamp(plan.AL, 4, 7);
    plan.killDesire = Math.min(plan.killDesire ?? 5, 7);
    return;
  }
  plan.OE = Math.min(plan.OE, 5);
  plan.AL = Math.min(plan.AL, 5);
  plan.killDesire = Math.min(plan.killDesire ?? 5, 5);
}

/**
 * V25 — Assur's winning-archetype shaping, applied after the per-style
 * caps: the build's top archetype fit steers the plan inside whatever
 * bounds the style doctrine already set.
 *
 * - Tank/low-will-tank fits: OE floors at the articles' 5+ ("tanks
 *   generally run high offensive effort") — a floor, never a raise above
 *   an existing style cap's ceiling.
 * - Pure-defensive fits: conservative ceilings (OE/AL/KD ≤ 5) — the
 *   scum doctrine generalized to defensive builds on other styles.
 * - Riposting-hybrid fits: the Riposte tactic is suggested where the
 *   style is well-suited to it ("riposte is easy to fake") — only fills
 *   an empty tactic slot, never overrides a chosen tactic.
 */
function applyArchetypeShaping(plan: FightPlan, w: Warrior): void {
  const top = classifyArchetype(w.attributes, w.style)[0];
  if (!top) return;
  switch (top.archetype) {
    case 'tankHybrid':
    case 'lowWillTankHybrid':
      // TP is exempt: its own scum/un-scum doctrine is the canon OE source —
      // the un-scum variety legitimately runs 2-7, below the tank floor.
      if (w.style !== FightingStyle.TotalParry) {
        plan.OE = Math.max(plan.OE, ARCHETYPE_DESIGN_BARS.TANK_OE_FLOOR);
      }
      return;
    case 'pureDefensive':
      plan.OE = Math.min(plan.OE, 5);
      plan.AL = Math.min(plan.AL, 5);
      plan.killDesire = Math.min(plan.killDesire ?? 5, 5);
      return;
    case 'ripostingHybrid':
      if (
        !plan.defensiveTactic &&
        getDefensiveSuitability(w.style, 'Riposte') === 'WS'
      ) {
        plan.defensiveTactic = 'Riposte';
      }
      return;
    default:
      return;
  }
}

/** Canon plan doctrine — per-style caps, then archetype-fit shaping. */
export function applyStyleDoctrine(plan: FightPlan, w: Warrior): void {
  applyStyleCaps(plan, w);
  applyArchetypeShaping(plan, w);
}

/** Strategy Lab: blend the assembled plan toward the week's ε-greedy
 *  target — exploit the ledger's best cell, or probe an untried one.
 *  60% pull keeps personality/matchup modifiers meaningful; doctrine
 *  caps still bound the result downstream. */
export function applyStrategyLabSteering(plan: FightPlan, w: Warrior, week: number): void {
  const target = pickStrategyTarget(w.strategyMemory, String(w.id), week);
  if (!target) return;
  plan.OE = clamp(Math.round(plan.OE + (target.oe - plan.OE) * 0.6), 1, 10);
  plan.AL = clamp(Math.round(plan.AL + (target.al - plan.AL) * 0.6), 1, 10);
  // Explore probes tinker with tactics too (V26): the week's seeded pick
  // from the style's possible-favorite pool fills the matching slot, so a
  // losing stable can organically earn the tactic discovery a tinkering
  // player earns.
  if (target.exploring) {
    const probe = pickTacticProbe(w.style, String(w.id), week);
    if (probe) {
      if ((OFFENSIVE_TACTICS as readonly string[]).includes(probe)) {
        plan.offensiveTactic = probe as OffensiveTactic;
      } else {
        plan.defensiveTactic = probe as DefensiveTactic;
      }
    }
  }
}
