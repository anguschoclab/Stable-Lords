import { StatBattery } from '@/components/ui/StatBattery';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TrainerTenureCellProps {
  weeksLeft: number;
}

/**
 *
 */
export function TrainerTenureCell({ weeksLeft }: TrainerTenureCellProps) {
  const pct = Math.min((weeksLeft / 52) * 100, 100);
  const isExpiring = weeksLeft <= 4;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col gap-1 mx-auto w-full max-w-40">
          <StatBattery
            label="TNR"
            value={pct}
            max={100}
            labelValue={`${weeksLeft}W`}
            colorClass={isExpiring ? 'bg-destructive animate-pulse' : 'bg-primary'}
          />
          {isExpiring && (
            <span className="text-[8px] font-black uppercase text-destructive tracking-[0.2em] animate-pulse text-center">
              Critical_End_Notice
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
        Tenure Remainder: {weeksLeft} Weeks
      </TooltipContent>
    </Tooltip>
  );
}
