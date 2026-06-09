import { AlertTriangle } from 'lucide-react';
import type { WeaponReqResult } from '@/data/equipment';

interface WeaponRequirementDetailsProps {
  reqResult: WeaponReqResult;
}

/**
 *
 */
export function WeaponRequirementDetails({ reqResult }: WeaponRequirementDetailsProps) {
  return (
    <div className="pl-6 space-y-0.5">
      {reqResult.failures.map((f) => (
        <p key={f.stat} className="text-[11px] text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {f.label} {f.current}/{f.required} — −2 ATT, +10% END
        </p>
      ))}
    </div>
  );
}
