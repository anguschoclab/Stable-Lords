import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  ST_PASSIVE_ATT,
  ST_PASSIVE_DMG,
  ST_PASSIVE_HITS,
  ST_KILL_BONUS,
  ST_KILL_DEC,
  ST_KILL_EXTENDED_HITS,
  ST_KILL_WINDOW_HP_MULT,
  ST_ANTISYNERGY_RIPOSTE_MULT,
} from '@/constants/combat';

export const strikingAttack: StyleStrategy = {
  tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
  getPassive: (ctx, m) => ({
    ...EMPTY_PASSIVE,
    mastery: m.tier,
    attBonus: ctx.hitsLanded >= ST_PASSIVE_HITS ? ST_PASSIVE_ATT + m.bonus : 0,
    dmgBonus: ST_PASSIVE_DMG,
    hasPassiveNarrative: ctx.hitsLanded >= ST_PASSIVE_HITS,
  }),
  getKillMechanic: (ctx) => ({
    killBonus: ST_KILL_BONUS,
    decBonus: ST_KILL_DEC,
    extendedKillWindow: ctx.hitsLanded >= ST_KILL_EXTENDED_HITS,
    killWindowHpMult: ST_KILL_WINDOW_HP_MULT,
    killNarrative: 'lands a devastating, direct strike!',
  }),
  getAntiSynergy: (_off, def) => ({
    offMult: 1,
    defMult: def === 'Riposte' ? ST_ANTISYNERGY_RIPOSTE_MULT : 1,
  }),
};
