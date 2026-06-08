import { ChevronUp, ChevronDown } from 'lucide-react';

interface MatchActionsProps {
  hasTranscript: boolean;
  isExpanded: boolean;
  boutKey: string;
  onToggleExpand: (key: string | null) => void;
}

export function MatchActions({
  hasTranscript,
  isExpanded,
  boutKey,
  onToggleExpand,
}: MatchActionsProps) {
  if (!hasTranscript) return null;

  return (
    <button
      aria-label={isExpanded ? 'Collapse Engagement Log' : 'Expand Engagement Log'}
      onClick={() => onToggleExpand(isExpanded ? null : boutKey)}
      className="w-full py-1.5 px-3 border-t border-border/10 flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors group"
    >
      <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary">
        Engagement Log
      </span>
      {isExpanded ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 text-primary animate-pulse" />
      )}
    </button>
  );
}
