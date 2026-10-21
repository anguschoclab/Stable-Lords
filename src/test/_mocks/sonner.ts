import { vi, type Mock } from 'vitest';

/**
 * Shared flat mock for `sonner` — toast is callable (bare `toast(...)` sites)
 * and carries the method surface (`toast.success` / `toast.error` / ...).
 */
export const toast: Mock & Record<'success' | 'error' | 'warning' | 'info' | 'message' | 'default', Mock> =
  Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
  default: vi.fn(),
});
