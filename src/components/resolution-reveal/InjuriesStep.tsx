import { motion } from 'framer-motion';
import { Activity, Skull } from 'lucide-react';
import narrativeContent from '@/data/narrativeContent.json';

interface InjuriesStepProps {
  injuries: string[];
  deaths: string[];
} /**
   * Injuries step.
   * @param - { injuries, deaths }.
   */

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
        <h3 className="text-xl font-semibold">{narrativeContent.fanfare.report_medical}</h3>
      </div>

      {deaths.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-none p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-bold">
            <Skull className="h-5 w-5" />
            <h4>Fallen Warriors</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-destructive-foreground">
            {deaths.map((name: string) => (
              <li key={name}>{name}</li>
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
          <ul className="list-disc list-inside text-sm text-arena-gold">
            {injuries.map((name: string) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
