/**
 * Style Strategies - Strategy pattern for style-specific combat behaviors
 */
import { FightingStyle } from '@/types/shared.types';
import type { StyleStrategy, MasteryInfo, StylePassiveResult } from './types';

const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0,
  parBonus: 0,
  defBonus: 0,
  ripBonus: 0,
  dmgBonus: 0,
  critChance: 0,
  iniBonus: 0,
  mastery: 'Novice',
};

function scale(val: number, m: MasteryInfo): number {
  return Math.round(val * m.mult);
}

export const STYLES: Record<FightingStyle, StyleStrategy> = {
  [FightingStyle.AimedBlow]: {
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.94 },
    getPassive: (ctx, m) => {
      const targeted = ctx.targetedLocation && ctx.targetedLocation !== 'Any';
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(targeted ? 4 : 3, m),
        parBonus: 2,
        critChance: targeted ? 0.12 + (ctx.exchange > 8 ? 0.05 : 0) : 0.06,
        hasPassiveNarrative: !!(targeted && ctx.exchange > 5),
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitLocation === 'head' ? 0.15 : ctx.targetedLocation !== 'Any' ? 0.05 : 0,
      decBonus: ctx.targetedLocation !== 'Any' ? 3 : 0,
      extendedKillWindow: ctx.hitLocation === 'head',
      killWindowHpMult: 0.8,
      killNarrative: 'delivers a precise, clinical strike to a vital point!',
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
  },

  [FightingStyle.BashingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.98 },
    getPassive: (ctx, m) => {
      const momentumDmg = Math.min(2 + m.bonus, Math.floor(ctx.consecutiveHits / 2));
      const vsTP = ctx.opponentStyle === FightingStyle.TotalParry;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        dmgBonus: scale(momentumDmg, m) + (vsTP ? 1 : 0),
        attBonus: scale(ctx.consecutiveHits >= 4 ? 2 : 0, m) + (vsTP ? 1 : 0),
        hasPassiveNarrative: (vsTP && ctx.consecutiveHits >= 2) || ctx.consecutiveHits >= 4,
      };
    },
    getKillMechanic: (ctx) => {
      const momentum = Math.min(3, ctx.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        extendedKillWindow: ctx.consecutiveHits >= 3,
        killWindowHpMult: ctx.consecutiveHits >= 3 ? 0.5 : 0.4,
        killNarrative: 'unleashes the full weight of their momentum in a crushing final blow!',
      };
    },
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Lunge') {
        offMult = 0.7;
        warning = 'Bashers are too heavy for effective lunging';
      }
      if (def === 'Dodge') {
        defMult = 0.7;
        warning = (warning ? warning + '; ' : '') + 'Bashers cannot dodge effectively';
      }
      if (def === 'Riposte') {
        defMult = 0.7;
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.LungingAttack]: {
    tempo: { opening: 1, mid: 0, late: -1, enduranceMult: 1.02 },
    getPassive: (ctx, m) => {
      const isFirst = ctx.exchange === 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: isFirst ? m.bonus : 0,
        attBonus: isFirst ? 0 : ctx.phase === 'LATE' ? -2 : -1,
        hasPassiveNarrative: isFirst,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === 'OPENING' ? 0.08 : 0,
      decBonus: ctx.phase === 'OPENING' ? 2 : 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: 'springs forward with a sudden, lethal thrust!',
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Bash') {
        offMult = 0.5;
        warning = 'Lungers lack the weight for effective bashing';
      }
      if (def === 'Parry') {
        defMult = 0.6;
        warning = (warning ? warning + '; ' : '') + 'Lungers are overextended for strong parries';
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.ParryLunge]: {
    tempo: { opening: 0, mid: 2, late: 0, enduranceMult: 1.0 },
    getPassive: (ctx, m) => {
      const counterReady = ctx.hitsTaken > ctx.hitsLanded;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(counterReady ? 2 : 1, m),
        parBonus: 2 + m.bonus,
        iniBonus: counterReady ? 2 : 0,
        hasPassiveNarrative: counterReady,
      };
    },
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: 'exploits a gap in the defense to strike home!',
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
  },

  [FightingStyle.ParryRiposte]: {
    tempo: { opening: 0, mid: 1, late: 0, enduranceMult: 1.04 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.phase === 'OPENING' ? -1 : 0,
      parBonus: 4,
      ripBonus: 2 + (ctx.ripostes >= 2 ? 1 : 0),
      hasPassiveNarrative: ctx.ripostes >= 3,
    }),
    getKillMechanic: () => ({
      killBonus: 0.03,
      decBonus: 2,
      extendedKillWindow: false,
      killWindowHpMult: 0.4,
      killNarrative: 'pivots around the attack and delivers a stinging riposte!',
    }),
    getAntiSynergy: (_off) => {
      let offMult = 1,
        warning;
      const defMult = 1;
      if (_off === 'Bash') {
        offMult = 0.5;
        warning = 'Riposte specialists lack bashing power';
      }
      if (_off === 'Decisiveness') {
        offMult = 0.7;
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.ParryStrike]: {
    tempo: { opening: 0, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      parBonus: 3,
      attBonus: 1 + (ctx.hitsTaken > ctx.hitsLanded ? 2 : 0),
    }),
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: 'blocks and strikes in a single fluid motion!',
    }),
    getAntiSynergy: (_off) => ({ offMult: _off === 'Bash' ? 0.6 : 1, defMult: 1 }),
  },

  [FightingStyle.SlashingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => {
      const flurryDmg = ctx.hitsLanded >= 4 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: ctx.phase !== 'LATE' ? 1 + m.bonus : 0,
        parBonus: 1,
        dmgBonus: flurryDmg,
        hasPassiveNarrative: ctx.hitsLanded >= 4,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitsLanded >= 4 ? 0.06 : 0,
      decBonus: 0,
      extendedKillWindow: ctx.hitsLanded >= 5,
      killWindowHpMult: ctx.hitsLanded >= 5 ? 0.5 : 0.4,
      killNarrative: 'overwhelms their foe with a flurry of precise cuts!',
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Bash') {
        offMult = 0.5;
        warning = 'Slashers rely on blade edge, not blunt force';
      }
      if (def === 'Parry') {
        defMult = 0.6;
        warning = (warning ? warning + '; ' : '') + 'Slashers struggle with disciplined parries';
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.StrikingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.hitsLanded >= 1 ? 1 + m.bonus : 0,
      dmgBonus: 1,
      hasPassiveNarrative: ctx.hitsLanded >= 1,
    }),
    getKillMechanic: (ctx) => ({
      killBonus: 0.07,
      decBonus: 2,
      extendedKillWindow: ctx.hitsLanded >= 2,
      killWindowHpMult: 0.4,
      killNarrative: 'lands a devastating, direct strike!',
    }),
    getAntiSynergy: (_off, def) => ({ offMult: 1, defMult: def === 'Riposte' ? 0.6 : 1 }),
  },

  [FightingStyle.TotalParry]: {
    tempo: { opening: -1, mid: 1, late: 1, enduranceMult: 0.9 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -1,
      parBonus: 1 + (ctx.phase === 'LATE' ? m.bonus : 0),
      iniBonus: 1,
      hasPassiveNarrative: ctx.phase === 'LATE' && ctx.endRatio > 0.5,
    }),
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === 'LATE' ? 0 : ctx.phase === 'MID' ? -0.02 : -0.05,
      decBonus: ctx.phase === 'LATE' ? 1 : -1,
      extendedKillWindow: false,
      killWindowHpMult: 0.35,
      killNarrative: 'finds a momentary opening in their own defensive shell!',
    }),
    getAntiSynergy: (off) => {
      let offMult = 1,
        warning;
      if (['Lunge', 'Bash', 'Slash'].includes(off || '')) {
        offMult = off === 'Slash' ? 0.5 : 0.4;
        warning = `Total Parry fighters are not built for ${off?.toLowerCase()}`;
      }
      return { offMult, defMult: 1, warning };
    },
  },

  [FightingStyle.WallOfSteel]: {
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.92 },
    getPassive: (ctx, m) => {
      const wallBonus = Math.min(1 + m.bonus, Math.floor(ctx.exchange / 10));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        defBonus: scale(wallBonus, m),
        parBonus: wallBonus > 0 ? 1 : 0,
        iniBonus: scale(wallBonus, m),
        hasPassiveNarrative: wallBonus >= 1,
      };
    },
    getKillMechanic: () => ({
      killBonus: -0.03,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.4,
      killNarrative: 'shifts their weight and drives through the defense!',
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
  },
};
