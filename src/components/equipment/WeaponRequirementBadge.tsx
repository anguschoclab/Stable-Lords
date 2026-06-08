import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { XCircle, CheckCircle2 } from 'lucide-react';
import type { WeaponReqResult } from '@/data/equipment';

interface WeaponRequirementBadgeProps {
  reqResult: WeaponReqResult;
}

export function WeaponRequirementBadge({ reqResult }: WeaponRequirementBadgeProps) {
  if (reqResult.met) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1 border-primary/30 text-primary gap-0.5"
            >
              <CheckCircle2 className="h-2.5 w-2.5" /> Reqs met
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            All stat requirements satisfied — no penalties.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="text-[10px] py-0 px-1 gap-0.5 animate-pulse">
            <XCircle className="h-2.5 w-2.5" /> {reqResult.failures.length} req
            {reqResult.failures.length > 1 ? 's' : ''} failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="space-y-1.5 max-w-64">
          <p className="font-semibold text-destructive text-xs">Weapon Requirement Failures</p>
          {reqResult.failures.map((f) => (
            <div key={f.stat} className="flex items-center gap-2 text-xs">
              <span className="text-destructive font-mono font-bold">{f.stat}</span>
              <span>
                {f.label}: need {f.required}, have{' '}
                <span className="text-destructive font-semibold">{f.current}</span>
              </span>
              <span className="text-muted-foreground">(−{f.deficit})</span>
            </div>
          ))}
          <div className="border-t border-border pt-1 mt-1 space-y-0.5">
            <p className="text-[10px] text-destructive">Penalties: {reqResult.attPenalty} ATT</p>
            <p className="text-[10px] text-destructive">
              Endurance cost ×{reqResult.endurancePenalty.toFixed(2)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
