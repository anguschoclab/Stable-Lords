import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { ImperialRing } from '@/components/ui/ImperialRing';

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  icon?: React.ElementType;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, eyebrow, actions, icon: Icon, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative space-y-6 pb-6', className)} {...props}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-5">
            {Icon && (
              <ImperialRing variant="bronze" size="md" className="mt-1">
                <Icon className="h-5 w-5 text-accent" />
              </ImperialRing>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col"
                >
                  {eyebrow && (
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/50 mb-1">
                      {eyebrow}
                    </span>
                  )}
                  <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight uppercase text-foreground leading-none text-carved">
                    {title}
                  </h1>
                </motion.div>
              </div>
              {subtitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-[0.25em] opacity-40 italic"
                >
                  {subtitle}
                </motion.div>
              )}
            </div>
          </div>

          {actions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="flex items-center gap-3"
            >
              {actions}
            </motion.div>
          )}
        </div>

        {/* Ornamental separator — gradient from accent gold to transparent */}
        <div className="relative h-px">
          {/* Primary line */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--primary) / 0.5) 0%, hsl(var(--accent) / 0.3) 30%, hsl(var(--border)) 70%, transparent 100%)',
            }}
          />
          {/* Secondary inset line for depth */}
          <div
            className="absolute top-[2px] left-4 right-0"
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, hsl(var(--accent) / 0.12) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export { PageHeader };
