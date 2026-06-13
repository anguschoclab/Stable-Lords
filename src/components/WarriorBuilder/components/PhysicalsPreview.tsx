import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhysicalsPreviewProps {
  hp: number;
  endurance: number;
  damage: string | undefined;
  encumbrance: number;
}

export function PhysicalsPreview({ hp, endurance, damage, encumbrance }: PhysicalsPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Physicals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-none bg-secondary p-3 border border-border">
            <div className="text-xs text-muted-foreground">Hit Points</div>
            <div className="text-xl font-bold">{hp}</div>
          </div>
          <div className="rounded-none bg-secondary p-3 border border-border">
            <div className="text-xs text-muted-foreground">Endurance</div>
            <div className="text-xl font-bold">{endurance}</div>
          </div>
          <div className="rounded-none bg-secondary p-3 border border-border">
            <div className="text-xs text-muted-foreground">Damage</div>
            <div className="text-xl font-bold">{damage}</div>
          </div>
          <div className="rounded-none bg-secondary p-3 border border-border">
            <div className="text-xs text-muted-foreground">Carry Cap</div>
            <div className="text-xl font-bold">{encumbrance}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
