import type { SVGProps } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Target, Database, Binary, Search, Box, Lock, Unlock } from 'lucide-react';
import type { ElementType } from 'react';
import type { InsightToken } from '@/types/state.types';

// ─── Types & Config ─────────────────────────────────────────────────────────

type TokenSectionType = 'stat' | 'weapon' | 'rhythm';

interface TokenSectionConfig {
  type: TokenSectionType;
  title: string;
  icon: ElementType;
  pulseColor: string;
  textColor: string;
  emptyIcon: ElementType;
  emptyText: string;
  bgClass: string;
  borderClass: string;
  hoverBorderClass: string;
  dropShadowClass: string;
}

const TOKEN_SECTIONS: [TokenSectionConfig, TokenSectionConfig, TokenSectionConfig] = [
  {
    type: 'stat',
    title: 'Personnel Intel',
    icon: Shield,
    pulseColor: 'bg-primary',
    textColor: 'text-primary',
    emptyIcon: Lock,
    emptyText: 'Vulnerabilities Obscured',
    bgClass: 'bg-primary/5',
    borderClass: 'border-primary/20',
    hoverBorderClass: 'hover:border-primary/50',
    dropShadowClass: 'group-hover:drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.4)]',
  },
  {
    type: 'weapon',
    title: 'Armament Telemetry',
    icon: Target,
    pulseColor: 'bg-arena-gold',
    textColor: 'text-arena-gold',
    emptyIcon: Target,
    emptyText: 'Armature Encrypted',
    bgClass: 'bg-arena-gold/5',
    borderClass: 'border-arena-gold/20',
    hoverBorderClass: 'hover:border-arena-gold/50',
    dropShadowClass: 'group-hover:drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]',
  },
  {
    type: 'rhythm',
    title: 'Kinetic Patterns',
    icon: Zap,
    pulseColor: 'bg-arena-pop',
    textColor: 'text-arena-pop',
    emptyIcon: Zap,
    emptyText: 'Rhythms Obscured',
    bgClass: 'bg-arena-pop/5',
    borderClass: 'border-arena-pop/20',
    hoverBorderClass: 'hover:border-arena-pop/50',
    dropShadowClass: 'group-hover:drop-shadow-[0_0_5px_rgba(var(--arena-pop-rgb),0.4)]',
  },
];

// ─── Sub-Components ─────────────────────────────────────────────────────────

interface TokenCardProps {
  token: InsightToken;
  config: TokenSectionConfig;
}

function TokenCard({ token, config: { icon: Icon, textColor, dropShadowClass } }: TokenCardProps) {
  return (
    <Surface
      variant="paper"
      padding="sm"
      className={`${textColor.replace('text-', 'bg-').replace('/60', '/5')} border ${textColor.replace('text-', 'border-').replace('/60', '/20')} ${textColor.replace('text-', 'hover:border-').replace('/60', '/50')} transition-all group cursor-default`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-3 w-3 ${textColor} opacity-60`} />
          <span
            className={`text-[11px] font-display font-black uppercase ${textColor} tracking-tight ${dropShadowClass} transition-all`}
          >
            {token.warriorName}
          </span>
        </div>
        <span className="text-[8px] font-mono font-black text-muted-foreground/60 tracking-widest">
          SEQ {token.discoveredWeek.toString().padStart(2, '0')}
        </span>
      </div>
      <p className="text-[10px] text-foreground/70 font-medium leading-relaxed italic">
        {token.detail}
      </p>
    </Surface>
  );
}

interface EmptyTokenStateProps {
  config: TokenSectionConfig;
}

function EmptyTokenState({ config: { emptyIcon: EmptyIcon, emptyText } }: EmptyTokenStateProps) {
  return (
    <Surface variant="glass" className="py-12 text-center border-dashed border-white/5 opacity-40">
      <EmptyIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-[9px] font-black uppercase tracking-widest leading-none">{emptyText}</p>
    </Surface>
  );
}

interface TokenSectionProps {
  config: TokenSectionConfig;
  tokens: InsightToken[];
}

function TokenSection({ config, tokens }: TokenSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${config.pulseColor} animate-pulse`} />
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
            {config.title}
          </h4>
        </div>
        <span className={`font-mono text-[10px] font-black ${config.textColor}/60`}>
          {tokens.length} / --
        </span>
      </div>

      <div className="space-y-3">
        {tokens.length === 0 ? (
          <EmptyTokenState config={config} />
        ) : (
          tokens.map((t) => <TokenCard key={t.id} token={t} config={config} />)
        )}
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: ElementType;
  label: string;
  value: string;
  sublabel: string;
  variant: 'default' | 'gold' | 'pop';
}

function StatItem({ icon: Icon, label, value, sublabel, variant }: StatItemProps) {
  const variantClasses = {
    default: {
      bg: 'bg-secondary/20',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-primary/20',
      text: 'text-muted-foreground',
      hoverText: 'group-hover:text-primary',
      valueText: 'text-foreground',
    },
    gold: {
      bg: 'bg-arena-gold/10',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-arena-gold/30',
      text: 'text-arena-gold/60',
      hoverText: 'group-hover:text-arena-gold',
      valueText: 'text-arena-gold',
    },
    pop: {
      bg: 'bg-arena-pop/10',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-arena-pop/30',
      text: 'text-arena-pop/60',
      hoverText: 'group-hover:text-arena-pop',
      valueText: 'text-arena-pop',
    },
  };

  const v = variantClasses[variant];

  return (
    <div className="p-8 flex items-center gap-6 group hover:bg-white/2 transition-all">
      <div className={`p-3 rounded-none ${v.bg} ${v.border} ${v.hoverBorder} transition-all`}>
        <Icon className={`h-5 w-5 ${v.text} ${v.hoverText} transition-colors`} />
      </div>
      <div>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1 opacity-40">
          {label}
        </span>
        <span className={`text-xl font-mono font-black ${v.valueText}`}>{value}</span>
        <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mt-0.5">
          {sublabel}
        </span>
      </div>
    </div>
  );
}

// Minimal Unlocked shim
function Unlocked(props: SVGProps<SVGSVGElement>) {
  return <Unlock {...props} />;
}

/**
 * Insight vault component displaying discovered intelligence tokens.
 */
export function InsightVault() {
  // ⚡ Bolt: Narrowed state subscription to prevent re-renders on unrelated global state changes
  const insightTokens = useGameStore((s) => s.insightTokens);
  const tokens = insightTokens ?? [];
  const { weaponTokens, rhythmTokens, statTokens } = tokens.reduce(
    (acc, t) => {
      if (t.type === 'Weapon') acc.weaponTokens.push(t);
      if (t.type === 'Rhythm') acc.rhythmTokens.push(t);
      if (t.type === 'Attribute') acc.statTokens.push(t);
      return acc;
    },
    {
      weaponTokens: [] as typeof tokens,
      rhythmTokens: [] as typeof tokens,
      statTokens: [] as typeof tokens,
    }
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── The Insight Vault Header ─── */}
      <Surface
        variant="glass"
        className="border-arena-gold/30 bg-neutral-900/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="h-32 w-32 text-arena-gold" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
          <div className="p-4 rounded-none bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <Unlock className="h-8 w-8 text-arena-gold" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3>The Insight Vault</h3>
              <Badge className="bg-arena-gold/20 text-arena-gold border-arena-gold/30 font-mono font-black text-[10px] px-2">
                ENCRYPTED SYNC ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl font-medium">
              Insights are fragments of tactical truth discovered amidst the chaos of the sands.
              When a warrior exhibits their preferred weapon or innate rhythm, these secrets
              surface. Reveal enough fragments to unlock permanent martial superiority and strategic
              dominance over your rivals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 relative z-10">
          <TokenSection config={TOKEN_SECTIONS[0]} tokens={statTokens} />
          <TokenSection config={TOKEN_SECTIONS[1]} tokens={weaponTokens} />
          <TokenSection config={TOKEN_SECTIONS[2]} tokens={rhythmTokens} />
        </div>
      </Surface>

      {/* ─── Intel Synthesis Monitor ─── */}
      <Surface
        variant="glass"
        padding="none"
        className="border-border/10 bg-black/40 overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <StatItem
            icon={Search}
            label="System Indexing"
            value={`${tokens.length}G`}
            sublabel="Total Sync"
            variant="default"
          />
          <StatItem
            icon={Box}
            label="Armature Index"
            value={`${weaponTokens.length}S`}
            sublabel="Verified Intel"
            variant="gold"
          />
          <StatItem
            icon={Binary}
            label="Tactical Flow"
            value={`${rhythmTokens.length}K`}
            sublabel="Verified Intel"
            variant="pop"
          />
          <div className="p-8 bg-secondary/5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4 opacity-40">
              Intel Synthesis Status
            </span>
            <div className="flex items-center gap-3">
              <Unlocked className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-primary drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.3)]">
                SYNCHRONIZATION PENDING
              </span>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
