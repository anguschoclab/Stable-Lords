import { motion } from 'framer-motion';
import { Activity, Skull } from 'lucide-react';
import uiMeta from '@/data/narrative/uiMeta.json';
import { WarriorNameAvatar } from '@/components/avatar';
import type { WarriorRef } from '@/types/shared.types';

interface InjuriesStepProps {
  injuries: WarriorRef[];
  deaths: WarriorRef[];
}

/** Display name of a casualty entry — tolerates legacy plain-string records. */
const refName = (r: WarriorRef | string): string => (typeof r === 'string' ? r : r.name);
/** Warrior id of a casualty entry — undefined for legacy string records. */
const refId = (r: WarriorRef | string): string | undefined =>
  typeof r === 'string' ? undefined : r.id;

/**
 * Injuries step.
 * @param - { injuries, deaths }.
 */
export function InjuriesStep({ injuries, deaths }: InjuriesStepProps) {
  return (
    <motion.div
      key="injuries"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 flex flex-col gap-6"
    >
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-arena-gold" />
        <h3 className="text-xl font-semibold">{uiMeta.fanfare.report_medical}</h3>
      </div>

      {deaths.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-none p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-bold">
            <Skull className="h-5 w-5" />
            <h4>Fallen Warriors</h4>
          </div>
          <ul className="list-none space-y-2 text-sm text-destructive-foreground">
            {deaths.map((d, i) => (
              <li key={`${refId(d) ?? refName(d)}-${i}`} className="flex items-center gap-2">
                <WarriorNameAvatar
                  warriorId={refId(d)}
                  name={refName(d)}
                  size="xs"
                  className="border border-destructive/30 grayscale"
                />
                {refName(d)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {injuries.length > 0 && (
        <div className="bg-arena-gold/10 border border-arena-gold/20 rounded-none p-4 space-y-3">
          <div className="flex items-center gap-2 text-arena-gold font-bold">
            <Activity className="h-5 w-5" />
            <h4>Injured Roster</h4>
          </div>
          <ul className="list-none space-y-2 text-sm text-arena-gold">
            {injuries.map((r, i) => (
              <li key={`${refId(r) ?? refName(r)}-${i}`} className="flex items-center gap-2">
                <WarriorNameAvatar
                  warriorId={refId(r)}
                  name={refName(r)}
                  size="xs"
                  className="border border-arena-gold/30"
                />
                {refName(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
