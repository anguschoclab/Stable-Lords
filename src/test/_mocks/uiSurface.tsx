/** Shared stub for @/components/ui/Surface — props-spreading div. */
export const Surface = ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
  <div {...props}>{children}</div>
);
