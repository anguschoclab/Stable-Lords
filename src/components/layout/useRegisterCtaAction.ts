import { useEffect } from 'react';
import { useCtaRegistry, type CtaAction } from './primaryCta';

/**
 * Registers a page-provided primary-CTA action for a registry route key.
 * The header CTA invokes `run` while the registering page is mounted;
 * `enabled` controls the disabled state (e.g. "disabled until selection").
 */
export function useRegisterCtaAction(routeKey: string, action: CtaAction) {
  const register = useCtaRegistry((s) => s.register);
  const unregister = useCtaRegistry((s) => s.unregister);

  useEffect(() => {
    register(routeKey, action);
    return () => unregister(routeKey);
    // action identity changes every render; re-registering is cheap and keeps
    // enabled/run fresh against latest page state.
  });
}
