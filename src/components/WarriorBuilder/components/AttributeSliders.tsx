import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Swords, Heart, Zap, Eye, Brain, Dumbbell, Shield } from 'lucide-react';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/game';

const ATTR_ICONS: Record<keyof Attributes, React.ReactNode> = {
  ST: <Dumbbell className="h-3.5 w-3.5" />,
  CN: <Heart className="h-3.5 w-3.5" />,
  SZ: <Shield className="h-3.5 w-3.5" />,
  WT: <Brain className="h-3.5 w-3.5" />,
  WL: <Zap className="h-3.5 w-3.5" />,
  SP: <Swords className="h-3.5 w-3.5" />,
  DF: <Eye className="h-3.5 w-3.5" />,
};

interface AttributeSlidersProps {
  attrs: Attributes;
  updateAttr: (key: keyof Attributes, value: number) => void;
  total: number;
  remaining: number;
}

export function AttributeSliders({ attrs, updateAttr, total, remaining }: AttributeSlidersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center justify-between">
          <span>Attributes</span>
          <Badge
            variant={remaining === 0 ? 'default' : remaining > 0 ? 'secondary' : 'destructive'}
            className="font-mono"
          >
            {remaining === 0
              ? '✓ 70/70'
              : `${total}/${ATTRIBUTE_TOTAL} (${remaining > 0 ? `+${remaining}` : remaining})`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ATTRIBUTE_KEYS.map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5">
                {ATTR_ICONS[key]}
                {ATTRIBUTE_LABELS[key]}
                <span className="text-xs text-muted-foreground">({key})</span>
              </Label>
              <Badge variant="outline" className="font-mono text-sm min-w-8 justify-center">
                {attrs[key]}
              </Badge>
            </div>
            <Slider
              value={[attrs[key]]}
              onValueChange={([v]) => updateAttr(key, v ?? ATTRIBUTE_MIN)}
              min={ATTRIBUTE_MIN}
              max={ATTRIBUTE_MAX}
              step={1}
            />
          </div>
        ))}
        <Progress value={(total / ATTRIBUTE_TOTAL) * 100} className="h-2" />
      </CardContent>
    </Card>
  );
}
