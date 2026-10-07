import { cn } from '@/lib/utils';
import { TACTIC_BANK } from './tacticBankData';
import { withPlanTactic, isPlanTactic, tacticButtonClasses } from './planTactics';
import type { FightPlan, OffensiveTactic, DefensiveTactic } from '@/types/game';
import {
  getOffensiveSuitability,
  getDefensiveSuitability,
  SUITABILITY_LABELS,
  SUITABILITY_COLORS,
} from '@/engine/strategy/tacticSuitability';

interface TacticBankProps {
  plan?: FightPlan;
  onPlanChange?: (plan: FightPlan) => void;
}

/**
 * Tactic bank.
 * @param - { plan, on plan change }.
 */
export default function TacticBank({ plan, onPlanChange }: TacticBankProps = {}) {
  const handleClick = (t: (typeof TACTIC_BANK)[number]) => {
    if (!plan || !onPlanChange) return;
    onPlanChange(withPlanTactic(plan, t));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-arena-gold mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest">Tactic Bank</span>
      </div>
      <div className="flex flex-col gap-2 p-2 bg-black/40 border border-white/5 rounded-none">
        {TACTIC_BANK.map((t) => {
          const rating = plan
            ? t.type === 'offensive'
              ? getOffensiveSuitability(plan.style, t.id as OffensiveTactic)
              : getDefensiveSuitability(plan.style, t.id as DefensiveTactic)
            : null;
          return (
            <button
              key={t.id}
              aria-label={`Select Tactic: ${t.id}`}
              onClick={() => handleClick(t)}
              className={tacticButtonClasses(isPlanTactic(plan, t), {
                gap: 'gap-3',
                inactiveExtra:
                  'hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(189,138,36,0.15)] active:scale-[0.98] active:shadow-none',
              })}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
              {rating && (
                <span
                  className={cn(
                    'ml-auto text-[8px] font-black uppercase tracking-widest',
                    SUITABILITY_COLORS[rating]
                  )}
                >
                  {SUITABILITY_LABELS[rating]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
