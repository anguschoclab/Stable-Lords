import { OFFENSIVE_TACTICS, DEFENSIVE_TACTICS } from '@/constants/planConditions';
import type { PlanCondition } from '@/types/game';

interface TacticSelectorsProps {
  cond: PlanCondition;
  idx: number;
  onTacticChange: (key: 'offensiveTactic' | 'defensiveTactic', val: string) => void;
}

/**
 *
 */
export function TacticSelectors({ cond, onTacticChange }: TacticSelectorsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Off. Tactic
        </div>
        <select
          value={cond.override.offensiveTactic ?? 'none'}
          onChange={(e) => onTacticChange('offensiveTactic', e.target.value)}
          className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-blood/40 appearance-none"
        >
          {OFFENSIVE_TACTICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Def. Tactic
        </div>
        <select
          value={cond.override.defensiveTactic ?? 'none'}
          onChange={(e) => onTacticChange('defensiveTactic', e.target.value)}
          className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
        >
          {DEFENSIVE_TACTICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
