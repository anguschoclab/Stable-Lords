// Shared test mocks intentionally export hook stubs alongside Link.
/* eslint-disable react-refresh/only-export-components */
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

/** Shared useNavigate stub — returns a vi.fn so tests can assert calls. */
export const useNavigate = (): ReturnType<typeof vi.fn> => vi.fn();

/** Shared useParams stub — tests override post-spread for param'd routes. */
export const useParams = () => ({});
