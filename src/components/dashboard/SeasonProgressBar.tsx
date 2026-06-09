import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface SeasonProgressBarProps {
  progress: number;
}

/**
 *
 */
export function SeasonProgressBar({ progress }: SeasonProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          <span>Seasonal Completion</span>
        </div>
        <span className="font-mono text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] relative"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
        </motion.div>
      </div>
    </div>
  );
}
