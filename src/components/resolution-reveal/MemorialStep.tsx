import { motion } from 'framer-motion';
import { Skull } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Warrior } from '@/types/warrior.types';
import narrativeContent from '@/data/narrativeContent.json';

interface MemorialStepProps {
  deadWarriors: (Warrior | undefined)[];
}/**
  * Memorial step.
  * @param - { dead warriors }.
  * @returns The result.
  */


/**
 * Memorial step.
 * @param - { dead warriors }.
 * @returns The result.
 */
export function MemorialStep({ deadWarriors }: MemorialStepProps) {
  return (
    <motion.div
      key="memorial"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full p-6 flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,0,0,0.05)_0,transparent_100%)] mix-blend-screen" />
      <div className="z-10 flex flex-col items-center max-w-full">
        <Skull className="h-16 w-16 mb-4 text-muted-foreground animate-pulse drop-shadow-[0_0_15px_rgba(200,0,0,0.3)]" />
        <h2 className="text-3xl font-display text-center mb-8 uppercase tracking-widest text-foreground">
          {narrativeContent.fanfare.memorial_title}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 max-w-[100%]">
          {deadWarriors.map((w) => {
            if (!w) return null;
            return (
              <div
                key={w.id}
                className="bg-muted/40 border border-border/60 p-6 rounded-none text-center min-w-72 shadow-2xl relative"
              >
                <h3 className="text-2xl font-display font-bold text-destructive mb-1 drop-shadow-md">
                  {w.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">
                  {w.deathCause || narrativeContent.fanfare.memorial_default}
                </p>
                <Separator className="bg-border mb-4" />
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground text-left">
                  <div className="bg-background/60 p-2 rounded-none">
                    Age:{' '}
                    <span className="text-foreground font-mono inline-block ml-1">{w.age}</span>
                  </div>
                  <div className="bg-background/60 p-2 rounded-none">
                    Fame:{' '}
                    <span className="text-foreground font-mono inline-block ml-1">{w.fame}</span>
                  </div>
                  <div className="bg-background/60 p-2 rounded-none">
                    Wins:{' '}
                    <span className="text-foreground font-mono inline-block ml-1">
                      {w.career?.wins || 0}
                    </span>
                  </div>
                  <div className="bg-background/60 p-2 rounded-none">
                    Kills:{' '}
                    <span className="text-destructive font-mono inline-block ml-1">
                      {w.career?.kills || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
