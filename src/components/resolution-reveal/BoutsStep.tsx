import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Swords } from 'lucide-react';
import BoutViewer from '@/components/BoutViewer';
import type { BoutResult } from '@/engine/boutProcessor';
import narrativeContent from '@/data/narrativeContent.json';

interface BoutsStepProps {
  bouts: BoutResult[];
} /**
 * Bouts step.
 * @param - { bouts }.
 * @returns The result.
 */

/**
 * Bouts step.
 * @param - { bouts }.
 * @returns The result.
 */
export function BoutsStep({ bouts }: BoutsStepProps) {
  return (
    <motion.div
      key="bouts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Swords className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">{narrativeContent.fanfare.report_combat}</h3>
      </div>
      <ScrollArea className="flex-1 pr-4">
        {bouts.length > 0 ? (
          <div className="space-y-6">
            {bouts.map((r: BoutResult, i: number) => (
              <div key={`${r.a.name}-${r.d.name}-${i}`} className="space-y-2">
                {r.isRivalry && (
                  <div className="text-xs text-destructive font-semibold uppercase tracking-wider">
                    Rivalry Bout
                  </div>
                )}
                <BoutViewer
                  nameA={r.a.name}
                  nameD={r.d.name}
                  styleA={r.a.style}
                  styleD={r.d.style}
                  log={r.outcome.log}
                  winner={r.outcome.winner}
                  by={r.outcome.by}
                  announcement={r.announcement}
                  isRivalry={r.isRivalry}
                />
                <Separator className="my-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {narrativeContent.fanfare.report_combat_empty}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
