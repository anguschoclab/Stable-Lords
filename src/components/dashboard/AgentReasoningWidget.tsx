import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BrainCircuit,
  Target,
  Zap,
  TrendingUp,
  Activity,
  ShieldAlert,
  Coins,
  Users,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RivalStableData, AIIntent } from '@/types/state.types';
import { ActionTimeline } from './ActionTimeline';

interface AgentReasoningWidgetProps {
  rival: RivalStableData;
}

const INTENT_METRICS: Record<
  AIIntent,
  { label: string; icon: LucideIcon; color: string; description: string }
> = {
  SURVIVAL: {
    label: 'Survival Protocol',
    icon: ShieldAlert,
    color: 'text-arena-gold',
    description: 'Prioritizing stable preservation and low-risk engagements.',
  },
  WEALTH_ACCUMULATION: {
    label: 'Treasury Hoarding',
    icon: Coins,
    color: 'text-arena-gold',
    description: 'Optimizing for maximum gold retention for future high-tier scouting.',
  },
  AGGRESSIVE_EXPANSION: {
    label: 'Market Dominance',
    icon: Target,
    color: 'text-arena-blood',
    description: 'Actively seeking to eliminate rivals and seize regional fame.',
  },
  ROSTER_DIVERSITY: {
    label: 'Talent Diversification',
    icon: Users,
    color: 'text-primary',
    description: 'Broadening style coverage to counter local tactical shifts.',
  },
  EXPANSION: {
    label: 'Strategic Expansion',
    icon: TrendingUp,
    color: 'text-arena-fame',
    description: 'Investing in new facilities and increased roster capacity.',
  },
  CONSOLIDATION: {
    label: 'Operational Consolidation',
    icon: Activity,
    color: 'text-arena-steel',
    description: 'Pruning underperforming assets to maintain a lean, elite roster.',
  },
  VENDETTA: {
    label: 'Owner Vendetta',
    icon: Zap,
    color: 'text-destructive',
    description: 'Directly targeting specific rivals regardless of short-term profit.',
  },
  RECOVERY: {
    label: 'System Recovery',
    icon: Activity,
    color: 'text-primary/60',
    description: 'Resting injured warriors and avoiding high-stakes bouts.',
  },
};

export function AgentReasoningWidget({ rival }: AgentReasoningWidgetProps) {
  const currentIntent = rival.agentMemory?.currentIntent || 'SURVIVAL';
  const metric = INTENT_METRICS[currentIntent];
  const Icon = metric.icon;

  return (
    <Card className="bg-[#0a0a0b] border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-none bg-black border border-white/5', metric.color)}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest">
              Strategic Reasoning
            </CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase tracking-tight opacity-40">
              Simulation_Layer_v4.1 // Realtime_Inference
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* Active Intent */}
        <div className="p-4 rounded-none bg-black/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', metric.color)} />
              <span className={cn('text-xs font-black uppercase tracking-[0.2em]', metric.color)}>
                {metric.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-primary animate-ping" />
              <span className="text-[8px] font-black uppercase text-primary/60">ACTIVE INTENT</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
            {metric.description}
          </p>
        </div>

        <ActionTimeline events={rival.actionHistory || []} />

        <div className="pt-2 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
          <span>Targeting: {rival.strategy?.targetStableId || 'Global_Meta'}</span>
          <span>Confidence: 94.8%</span>
        </div>
      </CardContent>
    </Card>
  );
}
