import { ScrollText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ScoutReportData } from '@/types/game';
import { WarriorNameAvatar } from '@/components/avatar';

interface ReportHeaderProps {
  report: ScoutReportData;
}

/**
 *
 */
export function ReportHeader({ report }: ReportHeaderProps) {
  return (
    <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <WarriorNameAvatar
          name={report.warriorName}
          size="sm"
          className="border border-white/10 bg-neutral-950"
        />
        <div>
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-black uppercase text-base tracking-tight leading-none mb-1">
            {report.warriorName}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-primary/10 border border-primary/20">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary leading-none">
                {report.quality} Report
              </span>
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
              Filed Week {report.week}
            </span>
          </div>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label="More Info"
            className="p-2 rounded-none bg-neutral-900 border border-white/5 hover:border-primary/40 transition-colors motion-reduce:transition-none"
          >
            <Info className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-full max-w-60 text-[10px] font-medium leading-relaxed bg-neutral-950 border-white/10 uppercase tracking-widest">
          A {report.quality.toLowerCase()} scout report filed during week {report.week}.
          Intelligence degrades over time.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
