interface QuadrantPlotProps {
  children?: React.ReactNode;
}

export function QuadrantPlot({ children }: QuadrantPlotProps) {
  return (
    <div className="relative w-full aspect-square bg-white/[0.02] border border-white/5 rounded-none overflow-hidden">
      {/* Quadrant lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
      </div>

      {/* Axis labels */}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
        Fame →
      </span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 [writing-mode:vertical-rl] rotate-180">
        Notoriety →
      </span>

      {/* Quadrant labels */}
      <span className="absolute top-2 left-2 text-[7px] font-black uppercase tracking-widest text-destructive/30">
        Feared
      </span>
      <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest text-arena-gold/30">
        Legendary
      </span>
      <span className="absolute bottom-2 left-2 text-[7px] font-black uppercase tracking-widest text-muted-foreground/20">
        Unknown
      </span>
      <span className="absolute bottom-2 right-2 text-[7px] font-black uppercase tracking-widest text-primary/30">
        Celebrated
      </span>

      {children}
    </div>
  );
}
