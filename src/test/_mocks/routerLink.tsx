/** Shared flat mock for @tanstack/react-router's Link — renders a plain anchor. */
export const Link = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <a href={to}>{children}</a>
);
