import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import type { WarriorId } from '@/types/shared.types';
import { motion } from 'framer-motion';
import {
  DeathModalHeader,
  DeathModalWarriorInfo,
  DeathModalPaperDoll,
  DeathModalFooter,
} from './death-modal';

/**
 * Death modal.
 * @returns The result.
 */
export function DeathModal() {
  const { unacknowledgedDeaths, graveyard, acknowledgeDeathAction } = useGameStore(
    useShallow((s) => ({
      unacknowledgedDeaths: s.unacknowledgedDeaths,
      graveyard: s.graveyard,
      acknowledgeDeathAction: s.acknowledgeDeath,
    }))
  );
  const acknowledgeDeath = (id: WarriorId) => acknowledgeDeathAction(id);

  const safeDeaths = unacknowledgedDeaths ?? [];
  const safeGraveyard = graveyard ?? [];
  const currentDeathId = safeDeaths[0];
  const warrior = useMemo(
    () => safeGraveyard.find((w) => w.id === currentDeathId),
    [safeGraveyard, currentDeathId]
  );

  if (!warrior) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0b] border-2 border-arena-blood/30 rounded-none shadow-[0_0_50px_rgba(var(--arena-blood-rgb),0.2)] overflow-hidden relative"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-blood to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-blood to-transparent" />

        <div className="p-8 space-y-8">
          <DeathModalHeader />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <DeathModalWarriorInfo warrior={warrior} />
            <DeathModalPaperDoll />
          </div>

          <DeathModalFooter onAcknowledge={() => acknowledgeDeath(warrior.id)} />
        </div>
      </motion.div>
    </div>
  );
}
