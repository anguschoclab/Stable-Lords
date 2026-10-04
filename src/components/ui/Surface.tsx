import * as React from 'react';
import { cn } from '@/lib/utils';

import { surfaceVariants, type SurfaceVariants } from './surface-utils';

/**
 * Defines the shape of surface props.
 */
export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement>, SurfaceVariants {
  asChild?: boolean;
  glow?: boolean;
}

/**
 * Surface.
 */
const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (_props, ref) => {
    const { className, variant, padding, rounded, glow } = _props;
    const { ...props } = _props;
    return (
      <div
        ref={ref}
        className={cn(
          surfaceVariants({ variant, padding, rounded }),
          glow && variant === 'gold' && 'glow-gold',
          glow && variant === 'blood' && 'glow-blood',
          glow && variant === 'glass' && 'glow-torch',
          className
        )}
        {...props}
      />
    );
  }
);

Surface.displayName = 'Surface';

export { Surface };
