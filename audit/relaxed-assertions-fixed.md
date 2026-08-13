# Relaxed Assertions Fixed

## Summary

Three cases where test assertions were relaxed instead of fixing the underlying problem. Each relaxation followed the same pattern: the suite stayed green while the product drifted.

## The pattern: "suite stays green while product drifts"

Relaxing an assertion to make a test pass hides drift instead of forcing a fix. The test becomes a rubber stamp — it passes regardless of whether the code is correct. Each relaxation has a cost:

1. **Duplicate data** — multiple copies of the same constant can diverge silently. The test documents the duplication as a known condition rather than verifying a single source of truth.
2. **Exemption lists** — exempting files from terminology scanning means jargon accumulates unchecked. The exemption grows over time and is never revisited.
3. **Loose bounds** — a band of 0.16 allows 16pp deviation from 50% in mirror matches. The comment says "should be reduced toward 0.05" but nobody comes back to tighten it. A kill-rate lower bound of 4.5% when the description says 6% means the test doesn't even enforce its own stated contract.

## Fixes applied

### 1. Duplicate SHIELD_IDS in equipment.utils.ts

**Problem**: `getClassicWeaponBonus` used a private `const SHIELD_IDS = new Set(['small_shield', 'medium_shield', 'large_shield'])` — a hardcoded duplicate of the canonical `SHIELD_ITEM_IDS` array imported from `weapons.ts`. A third copy (`SHIELD_ID_SET`) was already derived from the same source in the same file.

**Fix**: Deleted the private set. Replaced usage with `SHIELD_ID_SET` (already in scope). Added a structural source-scan test in `weaponIdCoverage.test.ts` that fails if a private `SHIELD_IDS` set is reintroduced.

**Files**: `src/data/equipment/equipment.utils.ts`, `src/test/engine/combat/weaponIdCoverage.test.ts`

### 2. Sci-fi jargon in exempted UI files

**Problem**: `terminology.test.ts` exempted `AdminTools/`, `TelemetryDashboard` (stale — no file exists), and `ErrorBoundary` from banned-term scanning. These files contained sci-fi jargon: "System Failure", "Nodal link severed", "Protocol Dump", "Temporal Control", "Execute System Wipe", underscored labels like `Core_System`, `Temporal_Flux`, etc.

**Fix**: Replaced all jargon with arena-appropriate language across 7 files (`ErrorBoundary.tsx`, `AdminTools/index.tsx`, `TelemetryPanel.tsx`, `SystemPanel.tsx`, `WorldPanel.tsx`, `CategoryNav.tsx`, `MedicalAuditWidget.tsx`). Removed all three exemptions from the `EXEMPT` list. Updated `AdminTools.test.tsx` assertions to match new labels.

**Additional finding**: `MedicalAuditWidget.tsx` had sci-fi jargon ("Nodal Integrity Monitor", "Biological Audit") that was never caught because it wasn't in the banned-terms list — a gap in the banned-terms inventory, not an exemption. The jargon was replaced regardless.

**Files**: `src/components/ErrorBoundary.tsx`, `src/pages/AdminTools/index.tsx`, `src/pages/AdminTools/components/TelemetryPanel.tsx`, `src/pages/AdminTools/components/SystemPanel.tsx`, `src/pages/AdminTools/components/WorldPanel.tsx`, `src/pages/AdminTools/components/CategoryNav.tsx`, `src/components/dashboard/MedicalAuditWidget.tsx`, `src/test/terminology.test.ts`, `src/test/pages/AdminTools.test.tsx`

### 3. Balance band relaxations

**Problem**: Three relaxed assertions in the combat balance harness:
- `MIRROR_MATCH_BAND = 0.16` — comment said "should be reduced toward 0.05" but was never tightened
- 80/20 matchup test allowed up to 25 violations (`toBeLessThanOrEqual(25)`) instead of zero
- Kill-rate lower bound was 0.045 (4.5%) but the test description said "between 6% and 16%"

**Fix**:
- Tightened `MIRROR_MATCH_BAND` from 0.16 to 0.10 (intermediate step toward 0.05)
- Changed 80/20 test from `toBeLessThanOrEqual(25)` to `toBe(0)` — zero violations allowed
- Fixed kill-rate lower bound from 0.045 to 0.06 to match the stated description
- Tuned `STYLE_PENALTIES` for Aimed Blow (ATT -15 to -12) to bring mirror-match A-side win rate from 34% into the 40-60% band
- Adjusted matchup matrix: BA vs TP -1 (was 0), TP vs BA +1 (was 0), WS vs TP 0 (was +1) to eliminate 80/20 violations (BA vs TP was 81%, WS vs TP was 84%)

**Files**: `src/constants/combat/combat.ts`, `src/test/engine/economy/balance.test.ts`, `src/engine/skillBreakpoints.ts`

## Guidance for future contributors

**Never relax an assertion to make a test pass.** If a test fails, either:
1. Fix the underlying issue (preferred), or
2. Document the relaxation with a TODO comment, a deadline, and a named owner

A relaxed assertion is technical debt with interest. The longer it sits, the more drift accumulates behind it.
