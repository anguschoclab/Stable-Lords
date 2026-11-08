import { FightingStyle } from '@/types/shared.types';
import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE, scale } from './shared';
import {
  BA_PASSIVE_MOMENTUM_DMG_CAP,
  BA_PASSIVE_MOMENTUM_DMG_DIV,
  BA_PASSIVE_STREAK_ATT,
  BA_PASSIVE_STREAK_HITS,
  BA_PASSIVE_VS_TP_DMG,
  BA_PASSIVE_VS_TP_ATT,
  BA_PASSIVE_VS_TP_NARRATIVE_HITS,
  BA_KILL_MOMENTUM_CAP,
  BA_KILL_MOMENTUM_COEFF,
  BA_KILL_EXTENDED_HITS,
  BA_KILL_WINDOW_HP_MULT_EXTENDED,
  BA_KILL_WINDOW_HP_MULT,
  BA_ANTISYNERGY_LUNGE_MULT,
  BA_ANTISYNERGY_DODGE_MULT,
  BA_ANTISYNERGY_RIPOSTE_MULT,
} from '@/constants/combat';

export const bashingAttack: StyleStrategy = {
  tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.98 },
  getPassive: (ctx, m) => {
    const momentumDmg = Math.min(
      BA_PASSIVE_MOMENTUM_DMG_CAP + m.bonus,
      Math.floor(ctx.consecutiveHits / BA_PASSIVE_MOMENTUM_DMG_DIV)
    );
    const vsTP = ctx.opponentStyle === FightingStyle.TotalParry;
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      dmgBonus: scale(momentumDmg, m) + (vsTP ? BA_PASSIVE_VS_TP_DMG : 0),
      attBonus:
        scale(ctx.consecutiveHits >= BA_PASSIVE_STREAK_HITS ? BA_PASSIVE_STREAK_ATT : 0, m) +
        (vsTP ? BA_PASSIVE_VS_TP_ATT : 0),
      hasPassiveNarrative:
        (vsTP && ctx.consecutiveHits >= BA_PASSIVE_VS_TP_NARRATIVE_HITS) ||
        ctx.consecutiveHits >= BA_PASSIVE_STREAK_HITS,
    };
  },
  getKillMechanic: (ctx) => {
    const momentum = Math.min(BA_KILL_MOMENTUM_CAP, ctx.consecutiveHits);
    return {
      killBonus: momentum * BA_KILL_MOMENTUM_COEFF,
      decBonus: momentum,
      extendedKillWindow: ctx.consecutiveHits >= BA_KILL_EXTENDED_HITS,
      killWindowHpMult:
        ctx.consecutiveHits >= BA_KILL_EXTENDED_HITS
          ? BA_KILL_WINDOW_HP_MULT_EXTENDED
          : BA_KILL_WINDOW_HP_MULT,
      killNarrative: 'unleashes the full weight of their momentum in a crushing final blow!',
    };
  },
  getAntiSynergy: (off, def) => {
    let offMult = 1,
      defMult = 1,
      warning;
    if (off === 'Lunge') {
      offMult = BA_ANTISYNERGY_LUNGE_MULT;
      warning = 'Bashers are too heavy for effective lunging';
    }
    if (def === 'Dodge') {
      defMult = BA_ANTISYNERGY_DODGE_MULT;
      warning = (warning ? warning + '; ' : '') + 'Bashers cannot dodge effectively';
    }
    if (def === 'Riposte') {
      defMult = BA_ANTISYNERGY_RIPOSTE_MULT;
    }
    return { offMult, defMult, warning };
  },
};
