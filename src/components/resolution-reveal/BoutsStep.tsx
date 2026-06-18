import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Swords } from 'lucide-react';
import BoutViewer from '@/components/BoutViewer';
import type { BoutResult } from '@/engine/bout';
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
import narrativeContent from '@/data/narrativeContent.json';

interface BoutsStepProps {
  bouts: BoutResult[];
} /**
 * Bouts step.
 * @param - { bouts }.
 */

/**
 * Bouts step.
 * @param - { bouts }.
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
            {bouts.map((r: BoutResult, i: number) => {
              const zeroSkills = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 };
              const analysis = buildFightAnalysis(
                r.outcome,
                {
                  id: r.a.id,
                  name: r.a.name,
                  style: r.a.style,
                  attributes: r.a.attributes,
                  skills: r.a.baseSkills ?? zeroSkills,
                },
                {
                  id: r.d.id,
                  name: r.d.name,
                  style: r.d.style,
                  attributes: r.d.attributes,
                  skills: r.d.baseSkills ?? zeroSkills,
                }
              );
              return (
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
                    analysis={analysis}
                  />
                  <Separator className="my-4" />
                </div>
              );
            })}
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
