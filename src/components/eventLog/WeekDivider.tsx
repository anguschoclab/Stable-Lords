interface WeekDividerProps {
  week: number;
}

export function WeekDivider({ week }: WeekDividerProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-1.5 border-b border-border/50">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Week {week}
      </span>
    </div>
  );
}
