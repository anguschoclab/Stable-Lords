import { Star, Swords } from 'lucide-react';
import { IconMedallion } from '@/components/ui/IconMedallion'; /**
 * Title screen hero.
 */

/**
 * Title screen hero.
 */
export default function TitleScreenHero() {
  return (
    <div className="text-center space-y-5">
      <IconMedallion icon={<Swords className="h-6 w-6 text-[#F2D5B8]" strokeWidth={1.5} />} />

      <div className="space-y-2">
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-[0.06em] uppercase text-[#E7D3AF] [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_1px_0_rgba(0,0,0,0.95),0_0_30px_rgba(201,151,42,0.15)]">
          Stable Lords
        </h1>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-xs mx-auto opacity-70">
          Build a stable. Train warriors. Fight for glory. Forge legends in the arena.
        </p>
      </div>

      <div className="flex items-center gap-3 px-4">
        <div className="flex-1 h-px bg-[linear-gradient(90deg,transparent,rgba(201,151,42,0.3))]" />
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-[rgba(201,151,42,0.5)]" />
          <Star className="h-2.5 w-2.5 text-[rgba(201,151,42,0.5)]" />
          <div className="w-1 h-1 bg-[rgba(201,151,42,0.5)]" />
        </div>
        <div className="flex-1 h-px bg-[linear-gradient(90deg,rgba(201,151,42,0.3),transparent)]" />
      </div>
    </div>
  );
}
