import { vi } from 'vitest';

/** Shared flat mock for @tanstack/react-router's Link — renders a plain anchor. */
export const Link = ({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={to} className={className}>
    {children}
  </a>
);

export const useNavigate = (): ReturnType<typeof vi.fn> => vi.fn();

export const useParams = () => ({});
