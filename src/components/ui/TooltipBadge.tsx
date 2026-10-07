import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * TooltipBadge — compact bordered chip that reveals a tooltip on hover.
 * Shared shell for inline status markers (LiabilityBadge, PotentialBadge).
 */
interface TooltipBadgeProps {
  /** Border/text tone classes for the chip. */
  color: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Tooltip badge chip.
 * @param - { color, tooltip, children }.
 */
export function TooltipBadge({ color, tooltip, children }: TooltipBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-none bg-black border opacity-80 group-hover:opacity-100 transition-all motion-reduce:transition-none motion-reduce:transform-none',
            color
          )}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
