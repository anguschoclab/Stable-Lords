import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';

/**
 * SelectableCard — full-width selectable row shell used by list pickers.
 * Renders a glass Surface that switches to the paper/primary selected
 * treatment, with a bottom accent line and a side tooltip.
 */
interface SelectableCardProps {
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
  tooltip: React.ReactNode;
  tooltipClassName?: string;
  children: React.ReactNode;
}

export function SelectableCard({
  selected,
  onSelect,
  ariaLabel,
  tooltip,
  tooltipClassName,
  children,
}: SelectableCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={ariaLabel}
          className={cn(
            'w-full text-left group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
            selected ? 'z-10' : 'z-0'
          )}
          onClick={onSelect}
        >
          <Surface
            variant={selected ? 'paper' : 'glass'}
            padding="none"
            className={cn(
              'transition-all motion-reduce:transition-none motion-reduce:transform-none border bg-neutral-900/60 overflow-hidden',
              selected
                ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]'
                : 'border-white/5 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div className="p-4 flex items-center justify-between">{children}</div>
            {selected && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            )}
          </Surface>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className={tooltipClassName}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
