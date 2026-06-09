import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import narrativeContent from '@/data/narrativeContent.json';
import type { GameState } from '@/types/state.types';

interface MathStepProps {
  lastSimulationReport: GameState['lastSimulationReport'];
} /**
   * Math step.
   * @param - { last simulation report }.
   * @returns The result.
   */

/**
 * Math step.
 * @param - { last simulation report }.
 * @returns The result.
 */
export function MathStep({ lastSimulationReport }: MathStepProps) {
  return (
    <motion.div
      key="math"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-muted-foreground" />
        <h3 className="text-xl font-semibold">{narrativeContent.fanfare.report_math}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary/10">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium">Weekly Treasury Delta</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div
              className={`text-2xl font-mono font-bold ${(lastSimulationReport?.treasuryChange ?? 0) >= 0 ? 'text-primary' : 'text-arena-gold'}`}
            >
              {lastSimulationReport?.treasuryChange && lastSimulationReport.treasuryChange > 0
                ? '+'
                : ''}
              {lastSimulationReport?.treasuryChange ?? 0} GC
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium">Training Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-mono font-bold text-primary">
              {lastSimulationReport?.trainingGains.length ?? 0} Improvements
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Granular Breakdown
        </h4>
        <ScrollArea className="h-[200px] border rounded-none p-4 bg-muted/30">
          <div className="space-y-4">
            {lastSimulationReport?.trainingGains.map(
              (g: { warriorName: string; gain: number; attr: string }, i: number) => (
                <div
                  key={`${g.warriorName}-${g.attr}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{g.warriorName}</span>
                  <div className="flex gap-2 font-mono">
                    <Badge variant="outline" className="text-primary">
                      +{g.gain} {g.attr}
                    </Badge>
                  </div>
                </div>
              )
            )}
            {lastSimulationReport?.agingEvents.map((e: string, i: number) => (
              <div key={`age-${i}`} className="text-sm text-arena-gold">
                <span className="font-bold mr-2">!</span> {e}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}
