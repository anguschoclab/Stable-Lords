import { Skull } from 'lucide-react';
import { VitalityRing } from '@/components/ui/VitalityRing';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WarriorLink } from '@/components/EntityLink';
import type { AtRiskWarrior } from '@/hooks/useAtRiskWarriors';

interface WarriorAuditCardProps {
  warrior: AtRiskWarrior;
}

/**
 *
 */
export function WarriorAuditCard({ warrior }: WarriorAuditCardProps) {
  const fatigue = warrior.fatigue ?? 0;
  const condition = Math.max(0, 100 - fatigue);
  const isInjured = warrior.injuries.length > 0;

  return (
    <div key={warrior.id} className="group/item relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <WarriorLink
            name={warrior.name}
            id={warrior.id}
            className="text-xs font-black uppercase tracking-tight text-foreground/80 hover:text-primary transition-colors"
          />
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
            ID: {warrior.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isInjured && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Skull className="h-3.5 w-3.5 text-destructive animate-pulse cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest text-destructive">
                Injured
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <VitalityRing value={condition} size={36} strokeWidth={3} />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
            Vitality
          </span>
          <span className="text-[10px] font-mono font-black text-foreground/80">{condition}%</span>
        </div>
      </div>

      {isInjured && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-1 border-l border-destructive/30 ml-0.5">
          {warrior.injuries.map((inj) => (
            <span
              key={typeof inj === 'string' ? inj : inj.name}
              className="text-[8px] font-black uppercase tracking-[0.1em] text-destructive py-0.5 px-1.5 bg-destructive/10 border border-destructive/20 rounded-none"
            >
              {typeof inj === 'string' ? inj : inj.name.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
