import { motion } from 'framer-motion';
import { Skull } from 'lucide-react';

/**
 * Death modal header section with animated skull icon and title.
 */
export function DeathModalHeader() {
  return (
    <header className="text-center space-y-4">
      <motion.div
        initial={{ rotate: -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-arena-blood/10 border border-arena-blood/20 text-arena-blood mb-2"
      >
        <Skull className="w-8 h-8" />
      </motion.div>
      <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-arena-blood uppercase">
        THE SANDS CLAIM ANOTHER
      </h1>
      <p className="text-[10px] tracking-[0.4em] font-black uppercase text-muted-foreground/60">
        Chronicle. Archive. Remembrance.
      </p>
    </header>
  );
}
