/** Shared stub for @/components/ui/scroll-area. */
export const ScrollArea = ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
  <div {...props}>{children}</div>
);
