import * as React from 'react';

import { cn } from '@/lib/utils';
import { badgeVariants, type BadgeVariants } from './badge-utils';

/**
 * Defines the shape of badge props.
 */
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariants {
  children?: React.ReactNode;
}

/**
 * Badge.
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { className, variant, ...props },
  ref
) {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});

export { Badge };
