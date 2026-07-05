import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { STYLE_DISPLAY_NAMES, type Warrior } from '@/types/game';

interface TrainingCardHeaderProps {
  warrior: Warrior;
  total: number;
  hasInjury: boolean;
}

export function TrainingCardHeader({ warrior, total, hasInjury }: TrainingCardHeaderProps) {
  return (
    <div className="p-4 bg-white/5 border-b border-white/5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <WarriorNameTag id={warrior.id} name={warrior.name} isChampion={warrior.champion} />
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {STYLE_DISPLAY_NAMES[warrior.style]}
            </span>
            <div className="h-2 w-px bg-white/20" />
            <span className="text-[10px] font-mono tracking-wider">Age {warrior.age}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {hasInjury && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-destructive/20 text-destructive px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-destructive/20 animate-pulse cursor-help">
                  <AlertTriangle className="h-2.5 w-2.5" /> INJURED
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="text-[10px] font-mono bg-neutral-900 border-white/10 uppercase tracking-widest"
              >
                {warrior.injuries.map((i) => (typeof i === 'string' ? i : i.name)).join(' | ')}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[10px] font-mono opacity-40 cursor-help">Sum {total}/80</div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={6}
              className="bg-neutral-950 border-white/10 text-[10px] font-black uppercase tracking-widest"
            >
              Total attribute points: {total} of 80 cap
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
