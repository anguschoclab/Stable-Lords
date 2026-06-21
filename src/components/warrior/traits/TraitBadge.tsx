import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { traitBadgeMeta, traitTierColorClasses } from './traitDisplay';

interface TraitBadgeProps {
  traitId: string;
  className?: string;
}

/**
 *
 */
export function TraitBadge({ traitId, className }: TraitBadgeProps) {
  const meta = traitBadgeMeta(traitId);
  if (!meta) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          title={meta.description}
          className={`text-[9px] font-black uppercase tracking-widest rounded-none ${traitTierColorClasses(
            meta.tier
          )} ${className ?? ''}`}
        >
          {meta.name}
          {meta.classTag && <span className="ml-1 opacity-70">· {meta.classTag}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">
        <p className="text-xs font-semibold">
          {meta.name} <span className="opacity-60">— {meta.tier}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        {meta.classTag && (
          <p className="text-[10px] opacity-60 mt-1">Class trait: {meta.classTag}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
