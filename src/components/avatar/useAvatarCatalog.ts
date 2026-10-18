import { useEffect, useState } from 'react';
import { getAvatarCatalog, loadAvatarCatalog } from '@/engine/avatar/avatarCatalog';

/**
 * Ensure the avatar asset catalog is loaded before rendering portraits.
 */
export function useAvatarCatalog(): boolean {
  const [ready, setReady] = useState(() => getAvatarCatalog() !== null);

  useEffect(() => {
    let cancelled = false;
    loadAvatarCatalog()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // If the manifest fails, still allow rendering (layers will 404).
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
