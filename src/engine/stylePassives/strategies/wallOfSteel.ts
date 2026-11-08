import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE, scale } from './shared';
import {
  WS_WALL_PAR,
  WS_PASSIVE_WALL_CAP_BASE,
  WS_PASSIVE_WALL_EXCHANGE_DIV,
  WS_PASSIVE_WALL_PAR_ADD,
  WS_KILL_BONUS,
  WS_KILL_WINDOW_HP_MULT,
} from '@/constants/combat';

export const wallOfSteel: StyleStrategy = {
  // Canon burn: "similar to lungers, they have a high endurance burn"
  // (Assur's Bash Bros) — the wall keeps the blade moving all fight.
  tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 1.02 },
  getPassive: (ctx, m) => {
    const wallBonus = Math.min(
      WS_PASSIVE_WALL_CAP_BASE + m.bonus,
      Math.floor(ctx.exchange / WS_PASSIVE_WALL_EXCHANGE_DIV)
    );
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      defBonus: scale(wallBonus, m),
      parBonus: WS_WALL_PAR + (wallBonus > 0 ? WS_PASSIVE_WALL_PAR_ADD : 0),
      iniBonus: scale(wallBonus, m),
      hasPassiveNarrative: wallBonus >= 1,
    };
  },
  getKillMechanic: () => ({
    killBonus: WS_KILL_BONUS,
    decBonus: 0,
    extendedKillWindow: false,
    killWindowHpMult: WS_KILL_WINDOW_HP_MULT,
    killNarrative: 'shifts their weight and drives through the defense!',
  }),
  getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
};
