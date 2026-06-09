import { Activity } from 'lucide-react';
import type { FightPlan } from '@/types/game';
import { getStyleAntiSynergy } from '@/engine/stylePassives';

interface AntiSynergySectionProps {
  plan: FightPlan;
}

/**
 *
 */
export default function AntiSynergySection({ plan }: AntiSynergySectionProps) {
  if (!plan.offensiveTactic && !plan.defensiveTactic) {
    return null;
  }

  const antiSynergy = getStyleAntiSynergy(plan.style, plan.offensiveTactic, plan.defensiveTactic);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Activity className="w-3 h-3" />
        <span>Anti-Synergy</span>
      </div>
      <div className="bg-white/5 p-3 text-[9px]">
        {antiSynergy.warning ? (
          <div className="flex items-start gap-2 text-destructive">
            <Activity className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{antiSynergy.warning}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/60">No anti-synergy conflicts detected.</span>
        )}
      </div>
    </div>
  );
}
