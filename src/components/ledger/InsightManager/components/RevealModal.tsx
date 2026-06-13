import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RevealModalProps {
  data: { name: string; type: string; result: string } | null;
  onClose: () => void;
}

export function RevealModal({ data, onClose }: RevealModalProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      >
        <div className="bg-neutral-950 border-2 border-primary/40 rounded-none p-10 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-none bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
            <Sparkles />
          </div>

          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
            Discovery Successful
          </h4>
          <h2>{data.name}</h2>

          <div className="bg-white/5 border border-white/10 rounded-none p-6 mb-8">
            <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              {data.type} AUTHENTICATED
            </span>
            <span className="block text-2xl font-mono font-black text-arena-gold uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
              {data.result}
            </span>
          </div>

          <Button onClick={onClose}>Close Sequence</Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
