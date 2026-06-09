import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button variants.
 */
export const buttonVariants = cva(
  // Hard edges (rounded-none) — stone-cut aesthetic throughout
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary: deep blood crimson with warm glow on hover
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_rgba(135,34,40,0.3)] hover:shadow-[0_4px_16px_rgba(135,34,40,0.45)] active:shadow-none active:translate-y-px',
        // Destructive: brighter alarm red
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // Outline: warm dark edge, no fill
        outline:
          'border bg-transparent text-foreground/80 hover:text-foreground hover:bg-white/4 active:bg-white/3',
        // Secondary: dim warm surface
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // Ghost: no surface, accent on hover
        ghost: 'hover:bg-white/5 hover:text-foreground text-muted-foreground',
        // Link: crimson underline
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 *
 */
export type ButtonVariants = VariantProps<typeof buttonVariants>;
