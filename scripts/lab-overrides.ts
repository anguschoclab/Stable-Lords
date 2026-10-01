/**
 * Lab overrides — apply candidate balance parameters in-process so a tuning
 * idea can be measured (balance-lab.ts, style-probe.ts, world-diag.ts) before it is written into
 * the source constants. Driven by the LAB env var (JSON):
 *
 *   pen   { WS: [ATT,PAR,DEF,INI,RIP,DEC] }   absolute STYLE_PENALTIES row
 *   penD  { WS: [..6 deltas] }                added to the current row
 *   floor { WS: [ATT,PAR,DEF,INI,RIP,DEC] }   absolute STYLE_SKILL_FLOORS row
 *   pas   { WS: { att, par, def, rip, dmg, ini, crit } }  added to the passive
 *   kill  { CAP: 0.1, ... }                   KILL_WINDOW fields
 *   khp   { WS: 0.05, '*': 0.05 }             added to killWindowHpMult
 *   loc   { head: 4 }                         LOCATION_KILL_MULT entries
 *   obj   { WS_WHIRL: { ATT: 5 } }            fields of any exported constants object
 *
 * Style keys: AB BA LU PL PR PS SL ST TP WS.
 */
import { FightingStyle } from '@/types/shared.types';
import { STYLE_PENALTIES, STYLE_SKILL_FLOORS } from '@/engine/warrior/skillBreakpoints';
import { STYLES } from '@/engine/stylePassives/strategies';
import * as COMBAT from '@/constants/combat';
import { KILL_WINDOW } from '@/constants/combat';
import { LOCATION_KILL_MULT } from '@/engine/combat/mechanics/hitLocation';

export const STYLE_KEY: Record<string, FightingStyle> = {
  AB: FightingStyle.AimedBlow,
  BA: FightingStyle.BashingAttack,
  LU: FightingStyle.LungingAttack,
  PL: FightingStyle.ParryLunge,
  PR: FightingStyle.ParryRiposte,
  PS: FightingStyle.ParryStrike,
  SL: FightingStyle.SlashingAttack,
  ST: FightingStyle.StrikingAttack,
  TP: FightingStyle.TotalParry,
  WS: FightingStyle.WallOfSteel,
};
export const STYLE_CODE = Object.fromEntries(
  Object.entries(STYLE_KEY).map(([k, v]) => [v, k])
) as Record<FightingStyle, string>;

type Pas = Partial<Record<'att' | 'par' | 'def' | 'rip' | 'dmg' | 'ini' | 'crit', number>>;
interface Lab {
  pen?: Record<string, number[]>;
  penD?: Record<string, number[]>;
  floor?: Record<string, number[]>;
  pas?: Record<string, Pas>;
  kill?: Record<string, number>;
  khp?: Record<string, number>;
  loc?: Record<string, number>;
  obj?: Record<string, Record<string, number>>;
  /** plan { WS: { OE: 2, AL: -1, KD: 0 } } — deltas applied to AI plans (base + phases). */
  plan?: Record<string, { OE?: number; AL?: number; KD?: number }>;
}

export function applyLabOverrides(json = process.env.LAB): Lab | null {
  if (!json) return null;
  const lab = JSON.parse(json) as Lab;
  for (const [k, row] of Object.entries(lab.pen ?? {}))
    STYLE_PENALTIES[STYLE_KEY[k]!].splice(0, 6, ...row);
  for (const [k, row] of Object.entries(lab.floor ?? {}))
    STYLE_SKILL_FLOORS[STYLE_KEY[k]!].splice(0, 6, ...row);
  for (const [k, row] of Object.entries(lab.penD ?? {})) {
    const cur = STYLE_PENALTIES[STYLE_KEY[k]!];
    row.forEach((d, i) => (cur[i] = cur[i]! + d));
  }
  for (const [k, p] of Object.entries(lab.pas ?? {})) {
    const strat = STYLES[STYLE_KEY[k]!];
    const orig = strat.getPassive;
    strat.getPassive = (ctx, m) => {
      const r = orig(ctx, m);
      return {
        ...r,
        attBonus: r.attBonus + (p.att ?? 0),
        parBonus: r.parBonus + (p.par ?? 0),
        defBonus: r.defBonus + (p.def ?? 0),
        ripBonus: r.ripBonus + (p.rip ?? 0),
        dmgBonus: r.dmgBonus + (p.dmg ?? 0),
        iniBonus: r.iniBonus + (p.ini ?? 0),
        critChance: r.critChance + (p.crit ?? 0),
      };
    };
  }
  Object.assign(KILL_WINDOW, lab.kill ?? {});
  for (const [name, fields] of Object.entries(lab.obj ?? {}))
    Object.assign((COMBAT as unknown as Record<string, object>)[name]!, fields);
  Object.assign(LOCATION_KILL_MULT, lab.loc ?? {});
  for (const [k, d] of Object.entries(lab.khp ?? {})) {
    for (const style of k === '*' ? Object.values(STYLE_KEY) : [STYLE_KEY[k]!]) {
      const strat = STYLES[style];
      const orig = strat.getKillMechanic;
      strat.getKillMechanic = (ctx) => {
        const r = orig(ctx);
        return { ...r, killWindowHpMult: r.killWindowHpMult + d };
      };
    }
  }
  return lab;
}

/** Apply LAB.plan deltas to a generated fight plan (lab-only what-if for AI effort levels). */
export function tweakPlan<
  T extends {
    style: FightingStyle;
    OE: number;
    AL: number;
    killDesire?: number;
    phases?: Record<string, { OE: number; AL: number; killDesire?: number } | undefined>;
  },
>(plan: T): T {
  const lab = process.env.LAB ? (JSON.parse(process.env.LAB) as Lab) : null;
  const d = lab?.plan?.[STYLE_CODE[plan.style]];
  if (!d) return plan;
  const c = (v: number) => Math.max(1, Math.min(10, v));
  const next = {
    ...plan,
    OE: c(plan.OE + (d.OE ?? 0)),
    AL: c(plan.AL + (d.AL ?? 0)),
    killDesire: c((plan.killDesire ?? 5) + (d.KD ?? 0)),
  };
  if (plan.phases) {
    next.phases = Object.fromEntries(
      Object.entries(plan.phases).map(([k, ph]) => [
        k,
        ph && {
          ...ph,
          OE: c(ph.OE + (d.OE ?? 0)),
          AL: c(ph.AL + (d.AL ?? 0)),
          killDesire: c((ph.killDesire ?? 5) + (d.KD ?? 0)),
        },
      ])
    ) as T['phases'];
  }
  return next;
}
