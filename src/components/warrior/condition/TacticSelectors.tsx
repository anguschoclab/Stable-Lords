import { useId } from 'react';
import { OFFENSIVE_TACTICS, DEFENSIVE_TACTICS } from '@/constants/combat/planConditions';
import type { PlanCondition } from '@/types/game';

interface TacticSelectorsProps {
  cond: PlanCondition;
  onTacticChange: (key: 'offensiveTactic' | 'defensiveTactic', val: string) => void;
}

/**
 *
 */
export function TacticSelectors({ cond, onTacticChange }: TacticSelectorsProps) {
  const offId = useId();
  const defId = useId();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label
          htmlFor={offId}
          className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground/40"
        >
          Off. Tactic
        </label>
        <select
          id={offId}
          value={cond.override.offensiveTactic ?? 'none'}
          onChange={(e) => onTacticChange('offensiveTactic', e.target.value)}
          aria-label="Offensive Tactic"
          className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset appearance-none"
        >
          {OFFENSIVE_TACTICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={defId}
          className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground/40"
        >
          Def. Tactic
        </label>
        <select
          id={defId}
          value={cond.override.defensiveTactic ?? 'none'}
          onChange={(e) => onTacticChange('defensiveTactic', e.target.value)}
          aria-label="Defensive Tactic"
          className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset appearance-none"
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
