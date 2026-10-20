/** Shared flat mock for @/components/ui/badge — renders a plain span. */
export const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span data-testid="badge" className={className}>
    {children}
  </span>
);
