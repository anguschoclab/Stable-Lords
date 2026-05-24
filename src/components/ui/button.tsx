import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { buttonVariants, type ButtonVariants } from './button-utils';

/**
 * Defines the shape of button props.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  asChild?: boolean;
  tooltip?: React.ReactNode;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Button.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tooltip, tooltipSide = 'top', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const title = props.title;

    // If tooltip is provided, or title is provided, we wrap in Tooltip
    // We suppress the native title if we're showing a custom tooltip
    const tooltipContent = tooltip || title;

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        title={tooltipContent ? undefined : title}
      />
    );

    if (!tooltipContent) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);
Button.displayName = 'Button';

export { Button };
