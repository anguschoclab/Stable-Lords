const fs = require('fs');
const content = fs.readFileSync('src/components/layout/TacticalBar.tsx', 'utf8');

let newContent = content.replace(
  /className=\{cn\([\s\S]*?'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white\/5 transition-colors',[\s\S]*?expanded && 'border-b border-white\/5'[\s\S]*?\)\}[\s\S]*?onClick=\{onToggle\}/m,
  `role="button"
      tabIndex={0}
      aria-expanded={expanded}
      className={cn(
        'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        expanded && 'border-b border-white/5'
      )}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}`
);

newContent = newContent.replace(
  /<Button\s*variant="ghost"\s*size="icon"\s*className="h-6 w-6"\s*title=\{expanded \? 'Collapse alerts' : 'Expand alerts'\}\s*aria-label=\{expanded \? 'Collapse alerts' : 'Expand alerts'\}\s*>\s*\{expanded \? <ChevronDown className="h-4 w-4" \/> : <ChevronUp className="h-4 w-4" \/>\}\s*<\/Button>/m,
  `<div
          className="h-6 w-6 flex items-center justify-center text-muted-foreground"
          aria-hidden="true"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>`
);

newContent = newContent.replace(
  /<Link to=\{alert.action.to\}>\s*<Button\s*size="sm"\s*variant="outline"\s*className=\{cn\(\s*'h-7 text-\[10px\] font-black uppercase tracking-wider',\s*alert.type === 'warning' && 'border-arena-gold\/30 hover:bg-arena-gold\/20',\s*alert.type === 'info' && 'border-border\/30 hover:bg-muted\/20',\s*alert.type === 'urgent' && 'border-destructive\/30 hover:bg-destructive\/20',\s*alert.type === 'success' && 'border-primary\/30 hover:bg-primary\/20'\s*\)\}\s*>\s*\{alert.action.label\}\s*<\/Button>\s*<\/Link>/m,
  `<Button
            asChild
            size="sm"
            variant="outline"
            className={cn(
              'h-7 text-[10px] font-black uppercase tracking-wider',
              alert.type === 'warning' && 'border-arena-gold/30 hover:bg-arena-gold/20',
              alert.type === 'info' && 'border-border/30 hover:bg-muted/20',
              alert.type === 'urgent' && 'border-destructive/30 hover:bg-destructive/20',
              alert.type === 'success' && 'border-primary/30 hover:bg-primary/20'
            )}
          >
            <Link to={alert.action.to}>{alert.action.label}</Link>
          </Button>`
);

fs.writeFileSync('src/components/layout/TacticalBar.tsx', newContent);
