# Combat Balance Decoupling + Identity-Preserving Levers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the matchup matrix from doing two jobs at once. Move absolute-power tuning into the style-penalty layer, lock the matchup matrix to pure rock-paper-scissors with a regression-gated test loop, and add three identity-preserving balance levers (aging-shift, style-flavored favorites, trait-noise gating) — all validated against one shared harness.

**Architecture:** Stable Lords resolves combat through a layered pipeline. Absolute style power lives in `STYLE_PENALTIES` (`src/engine/skillCalc.ts`); relative style-vs-style advantage lives in `MATCHUP_MATRIX` (`src/constants/combat/combat.ts`). Today the matrix is hand-tuned to compensate for absolute-power problems that originate in the penalty/passive layer (its own comments admit this: "passives drag AB down ~20pp from its raw matrix expectation"). This plan adds guardrail tests that pin (a) each style's overall average near 50% — absolute power — and (b) the matrix to near-antisymmetry — pure matchup — then ratchets the two layers apart. The existing balance harness (`src/test/engine/economy/balance.test.ts`, 10k headless fights) is the validation substrate; every tuning change is gated by it.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run a single test file with `npx vitest run <path>`.

**Canon guardrails (do NOT touch):** The weapon-vs-style suitability matrix (CW/W/M/U) and mortality data are intentional Terrablood canon — leave them alone. All changes here live in _tunable_ layers: `STYLE_PENALTIES`, `MATCHUP_MATRIX`, aging compensation, favorite payoff-shape, trait generation weighting. See memory `combat-balance-canon` and `terrablood-weapon-tables`.

**Scope note — this is one of two plans.** The original spec had five changes. Four of them (#1 layer-split, #3 aging-shift, #4 favorites, #5 trait-noise) are tunable-knob changes that share the same harness and belong together — they are this plan (Tasks 1–6). The fifth (#2 per-style _win conditions_: AB called-shot, TP clock, LU/PL tempo decay) introduces brand-new combat mechanics with large design degrees of freedom and must go through `superpowers:brainstorming` first. It is deferred to **Phase 2** (documented at the end) rather than specified with invented code here.

---

## File Structure

- **Modify:** `src/test/engine/economy/balance.test.ts` — add the guardrail `describe` blocks (mirror-match drift, overall-average band, matrix antisymmetry). The harness already computes `styleWins`, `styleFights`, `matchupWins`; the new tests reuse those module-scoped maps.
- **Modify:** `src/constants/combat/combat.ts` — symmetrize `MATCHUP_MATRIX`; add `assertMatrixAntisymmetry` export consumed by the guardrail test.
- **Modify:** `src/engine/skillCalc.ts` — absorb the absolute-power residual into `STYLE_PENALTIES` during the decoupling ratchet.
- **Create:** `src/engine/aging/veteranCompensation.ts` — pure function turning age-driven SP/DF loss into a WL-scaled DEF bonus.
- **Modify:** `src/engine/bout/fighterState.ts` — apply veteran DEF compensation; replace the flat `+1 ATT` favorite bonus with the style-routed mastery bonus.
- **Create:** `src/engine/favorites/weaponMastery.ts` — pure function routing the favorite-weapon `+1` to the style-appropriate skill/axis.
- **Modify:** `src/engine/favorites.ts` — re-export / delegate `getFavoriteWeaponBonus` to the new router (back-compat).
- **Modify:** `src/engine/traits.ts` — tighten synergy/anti-synergy gating in `generateTraits`; gate high-variance OE/AL personality traits to synergistic archetypes.
- **Create:** `src/test/engine/balance/traitNoise.test.ts` — measures trait-induced win-rate spread (the harness is otherwise trait-free).

---

## Task 1: Capture the current balance baseline (measurement, no code change)

You cannot set a regression gate without knowing where the engine sits today. This task only runs the harness and records numbers used to seed the guardrail bands in Task 2.

**Files:**

- Read-only: `src/test/engine/economy/balance.test.ts`

- [ ] **Step 1: Run the existing balance suite and capture the per-style report**

Run: `npx vitest run src/test/engine/economy/balance.test.ts 2>&1 | tee /tmp/balance-baseline.txt`

The "should have no style with >75% overall win rate" test prints a `=== STYLE WIN RATES ===` block and a `=== MATCHUP MATRIX (A win% vs D) ===` block even on pass (it builds the report string regardless). If the suite passes, the report is in the test's error-message variable but not printed — temporarily force it by reading the matrix from a scratch run instead (next step).

- [ ] **Step 2: Print the maps directly with a scratch assertion**

Temporarily add this `it` at the end of the `Style Balance` describe in `balance.test.ts` (you will DELETE it before committing — it only dumps numbers):

```typescript
it('TEMP: dump baseline', () => {
  const rows = ALL_STYLES.map((s) => {
    const overall = ((styleWins[s]! / styleFights[s]!) * 100).toFixed(1);
    const mirror = ((matchupWins[s]![s]! / FIGHTS_PER_MATCHUP) * 100).toFixed(1);
    return `${s.padEnd(22)} overall=${overall}%  mirror(A)=${mirror}%`;
  });
  console.log('\n' + rows.join('\n'));
  expect(true).toBe(true);
});
```

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "dump baseline" 2>&1 | grep -E "overall=|mirror"`

Record the output. Expected shape (illustrative — use YOUR real numbers):

```
AimedBlow              overall=31.2%  mirror(A)=49.5%
BashingAttack          overall=63.8%  mirror(A)=50.6%
...
```

- [ ] **Step 3: Note the two spreads, then delete the TEMP test**

From the recorded numbers compute:

- **Overall-average spread** = max(overall) − min(overall) across styles. (Illustrative: 63.8 − 31.2 = 32.6pp.)
- **Mirror max deviation** = max over styles of |mirror − 50|. (Illustrative: 0.6pp — mirror should already be tight because both sides are identical fighters.)

Delete the `TEMP: dump baseline` test. These two numbers seed the starting guardrail bands in Task 2. Do NOT commit anything in this task.

---

## Task 2: Add the guardrail tests as a ratchet (regression gate)

Add three guardrails. Set their bands to **just contain today's measured reality** (from Task 1) so the suite stays green, then Task 3 tightens them as absolute power moves to the penalty layer. This is the "manual whack-a-mole → regression-gated loop" conversion.

**Files:**

- Modify: `src/test/engine/economy/balance.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Write the matrix-antisymmetry helper + its failing unit test**

Add to `src/constants/combat/combat.ts` (after `getMatchupBonus`):

```typescript
/**
 * Returns the matchup-matrix cells that violate near-antisymmetry, i.e. pairs
 * where M[i][j] + M[j][i] falls outside [-tolerance, +tolerance]. A pure
 * matchup matrix is antisymmetric (if A beats B by +x, B is -x vs A); a
 * nonzero pair-sum means absolute-power bias is smuggled into the matrix and
 * belongs in STYLE_PENALTIES instead.
 */
export function findAntisymmetryViolations(tolerance = 1): string[] {
  const out: string[] = [];
  for (let i = 0; i < STYLE_ORDER.length; i++) {
    for (let j = i + 1; j < STYLE_ORDER.length; j++) {
      const sum = (MATCHUP_MATRIX[i]?.[j] ?? 0) + (MATCHUP_MATRIX[j]?.[i] ?? 0);
      if (Math.abs(sum) > tolerance) {
        out.push(`${STYLE_ORDER[i]} vs ${STYLE_ORDER[j]}: sum=${sum}`);
      }
    }
  }
  return out;
}
```

Add a unit test `src/test/engine/economy/balance.test.ts` (new `describe` near the top, after the imports/setup):

```typescript
import { findAntisymmetryViolations } from '@/constants/combat/combat';

describe('Matchup matrix is pure rock-paper-scissors', () => {
  it('should be near-antisymmetric (tolerance 1) so it carries no absolute-power bias', () => {
    const violations = findAntisymmetryViolations(1);
    expect(
      violations.length,
      `\nMatrix pairs leaking absolute power (|M[i][j]+M[j][i]| > 1):\n  ${violations.join('\n  ')}`
    ).toBe(0);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL listing the leaking pairs**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: FAIL, with a list like `WallOfSteel vs AimedBlow: sum=-2` (WS row was "globally nerfed"). This documents exactly which cells encode absolute power. Do not fix the matrix yet — Task 3 does, as a measured loop.

- [ ] **Step 3: Symmetrize the matrix (mechanical), re-run to GREEN**

Replace `MATCHUP_MATRIX` with its antisymmetric component: for every pair set `M'[i][j] = round((M[i][j] - M[j][i]) / 2)` and `M'[j][i] = -M'[i][j]`, diagonal 0. Compute it once with this throwaway Bun snippet (run, paste the result into the file, then discard the snippet):

```bash
bunx tsx -e '
import { MATCHUP_MATRIX, STYLE_ORDER } from "./src/constants/combat/combat";
const n = STYLE_ORDER.length;
const A: number[][] = Array.from({length:n}, () => Array(n).fill(0));
for (let i=0;i<n;i++) for (let j=0;j<n;j++) {
  A[i][j] = Math.round(((MATCHUP_MATRIX[i][j] ?? 0) - (MATCHUP_MATRIX[j][i] ?? 0)) / 2);
}
console.log(A.map((r,i)=>"  ["+r.map(x=>String(x).padStart(2)).join(", ")+"], // "+STYLE_ORDER[i]).join("\n"));
'
```

Paste the printed rows over the existing `MATCHUP_MATRIX` body (keep the `//AB BA LU ...` header comment). Update the block comment to note: "Antisymmetric by construction — absolute power lives in STYLE_PENALTIES (skillCalc.ts). Guarded by findAntisymmetryViolations."

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS.

- [ ] **Step 4: Add the mirror-match drift guardrail**

The mirror cell `matchupWins[s][s] / FIGHTS_PER_MATCHUP` is the A-side win rate when a style fights an identical copy of itself — it should be ~50% and isolates engine first-mover/seed bias (a confound that otherwise pollutes matrix tuning). Add to `balance.test.ts`:

```typescript
describe('Mirror-match drift (engine A/D bias)', () => {
  it('every style mirror match should sit near 50% A-side wins', () => {
    const BAND = 0.1; // tighten toward 0.05 as A/D bias is reduced
    const problems: string[] = [];
    for (const s of ALL_STYLES) {
      const rate = matchupWins[s]![s]! / FIGHTS_PER_MATCHUP;
      if (Math.abs(rate - 0.5) > BAND) {
        problems.push(`${s}: ${(rate * 100).toFixed(1)}% (A-side)`);
      }
    }
    expect(
      problems.length,
      `\nMirror matches off 50% by >${BAND * 100}pp:\n  ${problems.join('\n  ')}`
    ).toBe(0);
  });
});
```

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "Mirror-match"`
Expected: PASS (mirror should already be tight per Task 1). If it FAILS, you have a real engine A/D asymmetry — record it; it is out of scope for this plan but worth a follow-up issue.

- [ ] **Step 5: Add the overall-average band guardrail, seeded to today's reality**

This is the absolute-power gate. Set `LOW`/`HIGH` to just contain the Task 1 spread so it passes NOW, with a comment recording the ratchet target (50% ± 10pp). Add to `balance.test.ts`:

```typescript
describe('Absolute-power band (overall win rate per style)', () => {
  // RATCHET: target is [0.40, 0.60] (50% ± 10pp). Seed these bounds to just
  // contain the current measured spread (Task 1), then tighten in Task 3 as
  // absolute power is moved from the matrix into STYLE_PENALTIES. Do NOT loosen.
  const LOW = 0.3; // ← replace with floor(min overall) from Task 1
  const HIGH = 0.66; // ← replace with ceil(max overall) from Task 1
  it(`every style overall win rate should be within [${LOW}, ${HIGH}] (ratcheting toward 0.40–0.60)`, () => {
    const problems: string[] = [];
    for (const s of ALL_STYLES) {
      const rate = styleWins[s]! / styleFights[s]!;
      if (rate < LOW || rate > HIGH) {
        problems.push(`${s}: ${(rate * 100).toFixed(1)}%`);
      }
    }
    expect(
      problems.length,
      `\nStyles outside absolute-power band:\n  ${problems.join('\n  ')}`
    ).toBe(0);
  });
});
```

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "Absolute-power band"`
Expected: PASS (because the band was seeded to contain reality).

- [ ] **Step 6: Run the whole balance file + typecheck**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: all green (existing tests + 3 new guardrails).
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 7: Commit**

```bash
git add "src/constants/combat/combat.ts" "src/test/engine/economy/balance.test.ts"
git commit -m "test(balance): add antisymmetry + mirror + abs-power guardrails; symmetrize matchup matrix"
```

---

## Task 3: Ratchet absolute power into STYLE_PENALTIES (measured tuning loop)

Symmetrizing the matrix (Task 2) removed the matrix's absolute-power compensation, so some styles now sit further from 50%. This task moves that correction to where it belongs — `STYLE_PENALTIES` — and tightens the band step by step. This is empirical: the tests define "done," not prescribed numbers.

**Files:**

- Modify: `src/engine/skillCalc.ts` (the `STYLE_PENALTIES` table, lines ~273–299)
- Modify: `src/test/engine/economy/balance.test.ts` (tighten `LOW`/`HIGH` only)

- [ ] **Step 1: Re-measure post-symmetrization**

Re-add the `TEMP: dump baseline` test from Task 1 Step 2, run it, record each style's overall %, delete the temp test. Identify the styles furthest from 50%.

- [ ] **Step 2: Adjust STYLE_PENALTIES for the worst offenders**

For each over-performing style, deepen its penalties (more negative across `[ATT,PAR,DEF,INI,RIP,DEC]`, weighted toward the skills that define its win condition so identity is preserved — e.g. nerf BA's ATT, not its INI). For each under-performing style, lighten penalties. Move in **small steps (±1–2 per skill)**; the table comments already document each style's identity (e.g. PR's RIP is "least penalised" — keep that relative ordering intact).

> Rule: never flip a style's relative skill profile. AB stays precision-shaped, ST stays ATT-heavy, TP stays PAR-heavy. You are shifting the _level_, not the _shape_.

- [ ] **Step 3: Re-run the harness after each adjustment**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "Absolute-power band"`
Iterate Steps 2–3 until every style is within **[0.40, 0.60]**.

- [ ] **Step 4: Tighten the band to the target and lock it**

In `balance.test.ts` set `LOW = 0.40` and `HIGH = 0.60`. Run the full balance file:
Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: all green, including `>75%` / `<22%` legacy tests (now strictly tighter) and the new band at 40–60%.

- [ ] **Step 5: Confirm the matrix never moved**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS — you only touched `STYLE_PENALTIES`, so the matrix is still pure matchup. If this fails you edited the wrong layer.

- [ ] **Step 6: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/engine/skillCalc.ts" "src/test/engine/economy/balance.test.ts"
git commit -m "balance: move absolute-power tuning from matrix into STYLE_PENALTIES; ratchet band to 40-60%"
```

---

## Task 4: Aging shifts identity (veteran DEF compensation)

Aging linearly drains SP/DF (`aging.ts:55`, `penalty = floor((age-28)/3)`), which disproportionately guts INI-dependent styles. Instead of soft-capping the loss, compensate it: a veteran trades lost speed for wisdom — WL-scaled DEF. The aged fighter stays viable as a _different_ (patient) fighter.

**Files:**

- Create: `src/engine/aging/veteranCompensation.ts`
- Test: `src/test/engine/aging/veteranCompensation.test.ts`
- Modify: `src/engine/bout/fighterState.ts`

- [ ] **Step 1: Write the failing unit test**

Create `src/test/engine/aging/veteranCompensation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getVeteranDefBonus } from '@/engine/aging/veteranCompensation';

describe('getVeteranDefBonus', () => {
  it('is zero before the aging penalty kicks in (age <= 28)', () => {
    expect(getVeteranDefBonus(25, 15)).toBe(0);
    expect(getVeteranDefBonus(28, 15)).toBe(0);
  });

  it('grows with age past 28 (more lost speed -> more compensating wisdom)', () => {
    const young = getVeteranDefBonus(30, 15); // penalty 0 still (floor(2/3)=0)
    const old = getVeteranDefBonus(34, 15); // penalty 2 (floor(6/3)=2)
    expect(old).toBeGreaterThan(young);
  });

  it('scales with WL (wise veterans convert decline better than dull ones)', () => {
    const wise = getVeteranDefBonus(34, 20);
    const dull = getVeteranDefBonus(34, 5);
    expect(wise).toBeGreaterThan(dull);
  });

  it('never exceeds the speed it compensates (no net buff)', () => {
    // At age 34, penalty = 2 SP + 2 DF lost = 4 attribute points lost.
    // DEF compensation must stay <= that, so aging is still a net decline.
    expect(getVeteranDefBonus(34, 25)).toBeLessThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/aging/veteranCompensation.test.ts`
Expected: FAIL, "Cannot find module '@/engine/aging/veteranCompensation'".

- [ ] **Step 3: Implement the pure function**

Create `src/engine/aging/veteranCompensation.ts`:

```typescript
/**
 * Veteran compensation — as a fighter ages past 28 they lose SP/DF (see
 * aging.ts), which guts initiative-dependent styles. Rather than soften the
 * loss (which flattens the lifecycle), we grant a partial, WL-scaled DEF bonus:
 * the veteran "learns to fight old" and drifts toward a patient, defensive
 * profile. The bonus is always strictly less than the speed lost, so aging
 * remains a net decline — the fighter changes identity, it does not get buffed.
 *
 * Magnitude (WISDOM_FACTOR) is a balance knob: tune it via the balance harness
 * so late-career INI styles (LU/PL/PR) stop cliff-diving without veterans
 * out-tanking their prime selves. Keep it < 1.0.
 */
const AGING_PENALTY_START = 28; // mirrors aging.ts
const WISDOM_FACTOR = 0.25; // DEF gained per (attribute-point-lost × WL/15)

/** SP+DF points lost to aging at a given age (matches aging.ts penalty). */
function agingAttributeLoss(age: number): number {
  const penalty = Math.max(0, Math.floor((age - AGING_PENALTY_START) / 3));
  return penalty * 2; // applied to both SP and DF
}

/** DEF skill bonus a veteran earns from accumulated age-driven decline. */
export function getVeteranDefBonus(age: number, will: number): number {
  const lost = agingAttributeLoss(age);
  if (lost === 0) return 0;
  const wlScale = will / 15; // 15 = STD attribute; wise > 1, dull < 1
  const bonus = lost * WISDOM_FACTOR * wlScale;
  return Math.min(bonus, lost); // never exceed the speed it compensates
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/aging/veteranCompensation.test.ts`
Expected: PASS (all 4).

- [ ] **Step 5: Wire it into fighterState DEF assembly**

In `src/engine/bout/fighterState.ts`, import the function and add the bonus to the fighter's DEF. Near the existing favorite/trainer mod assembly (around line 60):

```typescript
import { getVeteranDefBonus } from '@/engine/aging/veteranCompensation';
// ...
const veteranDef = warrior ? getVeteranDefBonus(warrior.age ?? 18, attrs.WL) : 0;
```

Find where `DEF` is summed for the fighter state and add `+ veteranDef` to it (follow the same pattern as `trainerMods` / shield DEF already applied in this file). Match the surrounding code's rounding/typing.

- [ ] **Step 6: Run the balance harness — confirm no absolute-power regression**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: still green. (The harness fighters are age 20, so `veteranDef` is 0 for them — this change is a no-op in the standard harness and only affects aged warriors in real play. That is correct: the guardrails protect the prime-age baseline; aging behavior is validated separately below.)

- [ ] **Step 7: Add an aging-aware harness check**

Add to `src/test/engine/aging/veteranCompensation.test.ts` an integration check that an aged INI-style warrior beats its un-compensated self less catastrophically. Use the existing `simulateFight` + `makeTestWarrior` pattern (import from the balance test's helpers is not exported — construct a minimal warrior inline, age 34, style LungingAttack, against a prime opponent), asserting the aged fighter's win rate is above a floor (e.g. > 0.25). Tune `WISDOM_FACTOR` until this holds without the aged fighter exceeding ~0.45.

```typescript
// (Append to the same test file.)
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import { FightingStyle, type Warrior } from '@/types/game';

function warrior(style: FightingStyle, age: number, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as import('@/types/shared.types').WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age,
    traits: [],
  };
}

describe('Aged INI-style fighter stays viable', () => {
  it('age-34 LU keeps a win rate above the cliff vs a prime PR', () => {
    const old = warrior(FightingStyle.LungingAttack, 34, 'old_LU');
    const prime = warrior(FightingStyle.ParryRiposte, 25, 'prime_PR');
    let wins = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(old),
        defaultPlanForWarrior(prime),
        old,
        prime,
        i * 5381 + 11
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    expect(rate, `aged LU win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.25);
    expect(rate, `aged LU should not out-fight its prime self`).toBeLessThan(0.45);
  });
});
```

Run: `npx vitest run src/test/engine/aging/veteranCompensation.test.ts`
Expected: PASS after tuning `WISDOM_FACTOR`.

- [ ] **Step 8: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/engine/aging/veteranCompensation.ts" "src/test/engine/aging/veteranCompensation.test.ts" "src/engine/bout/fighterState.ts"
git commit -m "feat(aging): veterans trade lost speed for WL-scaled DEF (aging shifts identity, not just drains)"
```

---

## Task 5: Style-flavored favorite-weapon mastery

`getFavoriteWeaponBonus` returns a flat `+1 ATT` for every style (`favorites.ts:161`), applied as `favWeapon`/`isMastered` in `fighterState.ts:60`. Same budget, but route the `+1` to the axis that reinforces each style's identity: brutal→damage, agile→initiative, tank→defense, cunning→riposte.

**Files:**

- Create: `src/engine/favorites/weaponMastery.ts`
- Test: `src/test/engine/favorites/weaponMastery.test.ts`
- Modify: `src/engine/bout/fighterState.ts`

- [ ] **Step 1: Write the failing unit test**

Create `src/test/engine/favorites/weaponMastery.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/game';
import { getMasteryBonus } from '@/engine/favorites/weaponMastery';

describe('getMasteryBonus', () => {
  it('returns all-zero when the favorite weapon is not mastered', () => {
    expect(getMasteryBonus(FightingStyle.BashingAttack, false)).toEqual({
      att: 0,
      dmg: 0,
      ini: 0,
      def: 0,
      rip: 0,
    });
  });

  it('routes brutal strikers to a damage edge', () => {
    expect(getMasteryBonus(FightingStyle.StrikingAttack, true).dmg).toBe(1);
    expect(getMasteryBonus(FightingStyle.StrikingAttack, true).att).toBe(0);
  });

  it('routes agile styles to an initiative edge', () => {
    expect(getMasteryBonus(FightingStyle.LungingAttack, true).ini).toBe(1);
  });

  it('routes tank styles to a defense edge', () => {
    expect(getMasteryBonus(FightingStyle.TotalParry, true).def).toBe(1);
  });

  it('routes cunning/parry styles to a riposte edge', () => {
    expect(getMasteryBonus(FightingStyle.ParryRiposte, true).rip).toBe(1);
  });

  it('always spends exactly one point of budget when mastered', () => {
    for (const style of Object.values(FightingStyle)) {
      const b = getMasteryBonus(style, true);
      const total = b.att + b.dmg + b.ini + b.def + b.rip;
      expect(total, `${style} mastery budget`).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/favorites/weaponMastery.test.ts`
Expected: FAIL, "Cannot find module '@/engine/favorites/weaponMastery'".

- [ ] **Step 3: Implement the router**

Create `src/engine/favorites/weaponMastery.ts`:

```typescript
import { FightingStyle } from '@/types/game';

/** One point of favorite-weapon mastery, routed to a single identity axis. */
export interface MasteryBonus {
  att: number;
  dmg: number;
  ini: number;
  def: number;
  rip: number;
}

const ZERO: MasteryBonus = { att: 0, dmg: 0, ini: 0, def: 0, rip: 0 };

/**
 * Which axis a style's mastery reinforces. Same +1 budget as the old flat
 * "+1 ATT", but spent where it deepens the style's win condition instead of
 * nudging every style toward generic attack. Grouped by Terrablood archetype.
 */
const MASTERY_AXIS: Record<FightingStyle, keyof MasteryBonus> = {
  // Brutal — damage
  [FightingStyle.BashingAttack]: 'dmg',
  [FightingStyle.StrikingAttack]: 'dmg',
  // Agile — tempo
  [FightingStyle.LungingAttack]: 'ini',
  [FightingStyle.SlashingAttack]: 'ini',
  // Tank — defense
  [FightingStyle.TotalParry]: 'def',
  [FightingStyle.WallOfSteel]: 'def',
  // Cunning / parry — riposte & precision
  [FightingStyle.ParryRiposte]: 'rip',
  [FightingStyle.ParryStrike]: 'rip',
  [FightingStyle.ParryLunge]: 'rip',
  [FightingStyle.AimedBlow]: 'att', // precision: keeps ATT until #2 gives it a called-shot edge
};

export function getMasteryBonus(style: FightingStyle, mastered: boolean): MasteryBonus {
  if (!mastered) return { ...ZERO };
  const axis = MASTERY_AXIS[style] ?? 'att';
  return { ...ZERO, [axis]: 1 };
}
```

> Note: AB routes to `att` for now (its precision payoff is Phase 2 — the AB called-shot mechanic). When #2 lands, switch AB's axis to its called-shot bonus. This is deliberate, not a placeholder: AB's flat +1 ATT is preserved exactly until the better mechanic exists.

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/favorites/weaponMastery.test.ts`
Expected: PASS (all 6).

- [ ] **Step 5: Wire into fighterState, replacing the flat favWeapon ATT**

In `src/engine/bout/fighterState.ts` (around line 60, where `favWeapon`/`isMastered` are computed):

```typescript
import { getMasteryBonus } from '@/engine/favorites/weaponMastery';
// ...
const isMastered = warrior ? getFavoriteWeaponBonus(warrior) > 0 : false;
const mastery = getMasteryBonus(plan.style, isMastered);
```

Then apply each component at its existing summation site in this file: add `mastery.att` where ATT is summed (this was the old `favWeapon`), `mastery.def` to DEF (alongside `veteranDef` from Task 4 and shield DEF), `mastery.ini` to INI, `mastery.rip` to RIP, and thread `mastery.dmg` into the damage-bonus field the file already exposes (search for where `dmgBonus`/trait `dmgBonus` is assembled). Remove the old standalone `+ favWeapon` from the ATT sum so the budget is not double-counted. Keep `isMastered` if other code reads it (e.g. UI mastery flag).

- [ ] **Step 6: Delegate the old API for back-compat**

`getFavoriteWeaponBonus` is still used by `fighterState` to detect mastery and may be referenced by UI. Leave it returning `0|1` (mastery detection) — it no longer needs to change. Confirm no other consumer treated its return as an ATT value:

Run: `grep -rn "getFavoriteWeaponBonus" src --include="*.ts" | grep -v test`
Expected: only `favorites.ts` (definition) and `fighterState.ts` (mastery detection). If any other site added it directly to ATT, replace that with the routed `mastery` bonus.

- [ ] **Step 7: Balance harness — confirm no regression**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: still green. The standard harness equips style-default loadouts and does not set `favorites.discovered.weapon`, so `isMastered` is false and mastery is all-zero — a no-op for the baseline. (Favorite effects are validated by the unit test; their in-fight balance impact is a follow-up once discovery is simulated.)

- [ ] **Step 8: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/engine/favorites/weaponMastery.ts" "src/test/engine/favorites/weaponMastery.test.ts" "src/engine/bout/fighterState.ts"
git commit -m "feat(favorites): route favorite-weapon mastery to a style-identity axis (same +1 budget)"
```

---

## Task 6: Reduce trait noise without removing trait variety

The balance harness runs trait-free (`traits: []`), so the matrix is tuned against a world where traits don't exist — yet real fighters carry traits whose OE/AL swings the matrix never sees. Two parts: (a) _measure_ trait-induced spread, (b) tighten `generateTraits` gating so traits amplify identity instead of adding cross-style noise.

**Files:**

- Create: `src/test/engine/balance/traitNoise.test.ts`
- Modify: `src/engine/traits.ts`

- [ ] **Step 1: Write the trait-noise measurement test (characterization)**

Create `src/test/engine/balance/traitNoise.test.ts`. It generates many warriors of one archetype, fights them against a fixed opponent, and asserts the _share of anti-synergy traits_ stays low — the proxy for "traits that pull a fighter off its identity." Use the real generator:

```typescript
import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS } from '@/engine/traits';
import { RNGService } from '@/engine/services/rngService'; // confirm path: grep for IRNGService impl

describe('Trait generation amplifies identity (low cross-style noise)', () => {
  it('a brutal archetype rarely rolls anti-synergy traits', () => {
    const rng = new RNGService('trait-noise-seed');
    let total = 0;
    let antiSyn = 0;
    for (let i = 0; i < 2000; i++) {
      const ids = generateTraits(rng, 'brutal');
      for (const id of ids) {
        total++;
        if (TRAITS[id]?.antiSynergy?.includes('brutal')) antiSyn++;
      }
    }
    const share = total > 0 ? antiSyn / total : 0;
    // Target: anti-synergy traits make up < 8% of a brutal fighter's traits.
    expect(share, `anti-synergy share ${(share * 100).toFixed(1)}%`).toBeLessThan(0.08);
  });
});
```

> Before running, confirm the RNG import path and `TRAITS` export name: `grep -n "export" src/engine/traits.ts | grep -iE "TRAITS|TRAIT_IDS"` and `grep -rn "class RNGService\|export.*RNGService" src`.

- [ ] **Step 2: Run it — record whether current gating passes**

Run: `npx vitest run src/test/engine/balance/traitNoise.test.ts`
Expected: likely FAIL at the 0.08 target (current anti-synergy multiplier 0.3× still lets anti-synergy traits through ~5–12%). Record the actual share.

- [ ] **Step 3: Tighten the gating in generateTraits**

In `src/engine/traits.ts` (`generateTraits`, ~line 424), strengthen identity bias:

```typescript
if (archetype) {
  if (t.synergy?.includes(archetype)) w *= 3.0; // was 2.0 — amplify identity
  if (t.antiSynergy?.includes(archetype)) w *= 0.1; // was 0.3 — suppress noise
}
```

Update the block comment above `generateTraits` (the `@param archetype` doc, ~line 400) to state the new multipliers and the intent: "traits amplify a fighter's identity and minimise cross-style swings that the balance matrix cannot see."

- [ ] **Step 4: Re-run — expect PASS**

Run: `npx vitest run src/test/engine/balance/traitNoise.test.ts`
Expected: PASS (anti-synergy share < 8%). If still above, lower the anti-synergy multiplier further (e.g. 0.05) — but do NOT set it to 0 (variety, not elimination: an off-identity trait should be rare, not impossible).

- [ ] **Step 5: Confirm trait variety is preserved (not flattened)**

Add to the same file a guard that the generator still produces a spread of distinct traits (identity ≠ monoculture):

```typescript
it('still produces varied traits (amplified, not collapsed to one)', () => {
  const rng = new RNGService('variety-seed');
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    for (const id of generateTraits(rng, 'brutal')) seen.add(id);
  }
  // A brutal fighter should still draw from a healthy palette, not 1-2 traits.
  expect(seen.size, `distinct brutal traits seen: ${seen.size}`).toBeGreaterThanOrEqual(6);
});
```

Run: `npx vitest run src/test/engine/balance/traitNoise.test.ts`
Expected: PASS (both tests).

- [ ] **Step 6: Full suite + typecheck**

Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (no existing trait-generation test broke; if one asserted the old 2.0/0.3 weights, update it to the new values and note why in the commit).
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

- [ ] **Step 7: Commit**

```bash
git add "src/engine/traits.ts" "src/test/engine/balance/traitNoise.test.ts"
git commit -m "balance(traits): strengthen archetype gating so traits amplify identity, not matrix noise"
```

---

## Phase 2 (deferred — requires brainstorming, NOT in this plan)

**#2 — Per-style win conditions.** These introduce new combat mechanics with large design degrees of freedom and must go through `superpowers:brainstorming` before they can be planned with real (non-invented) code. Open design questions to resolve first:

- **AB called-shot / precision:** Does precision bypass armor, raise crit chance, or open the kill window faster? What triggers it (WT threshold, OE cost, a tactic toggle)? How does it interact with hit-location resolution in `src/engine/combat/resolution/`? Once defined, switch AB's favorite-mastery axis (Task 5) from `att` to the new precision bonus.
- **TP clock:** How many exchanges before the counter payoff escalates? Linear or stepped escalation? Payoff = riposte bonus, counter-damage, or DEF→ATT conversion? Where does the per-exchange counter accumulate (likely `exchangeSubPhases.ts` / `decisionLogic.ts`)?
- **LU/PL tempo:** Define an initiative-streak (consecutive exchanges won on INI), its decay rate, and the payoff per streak point. Reuse the existing `momentum` field or add a streak counter?

Each answer becomes a separate TDD plan, validated against the **same guardrail harness** built in Tasks 1–3 (overall-average band stays 40–60%, matrix stays antisymmetric). That is the point of doing #1 first: every win-condition experiment is now regression-gated automatically.

---

## Self-Review Notes (for the implementer)

- **The matrix and the penalty table are now orthogonal by test.** `findAntisymmetryViolations` fails if you ever put absolute power back in the matrix; the 40–60% band fails if a style is globally over/under-tuned. Tune _matchups_ in `MATCHUP_MATRIX`, _power_ in `STYLE_PENALTIES` — never cross them.
- **Identity is shape, not level.** Tasks 3–6 change levels and payoff axes; none flips a style's relative skill profile. Preserve the orderings documented in the `STYLE_PENALTIES` comments.
- **The standard harness is age-20, favorite-free, trait-free** — Tasks 4/5/6 are deliberately no-ops there and are validated by their own targeted tests. Do not "fix" the harness no-op; the prime-age baseline is what the guardrails protect.
- **Magnitudes are knobs, mechanisms are code.** `WISDOM_FACTOR`, the mastery axes, and the trait multipliers are tuned empirically; the _tests_ define done. Never hard-code a win rate.
- **Canon is off-limits:** weapon suitability (CW/W/M/U) and mortality data stay exactly as they are.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including: near-antisymmetric matrix, mirror within ±10pp, every style overall within [0.40, 0.60].
2. `grep -n "findAntisymmetryViolations" src/constants/combat/combat.ts` exists and is consumed by the test.
3. `STYLE_PENALTIES` skill-profile orderings unchanged in _shape_ (AB precision, ST ATT-heavy, TP PAR-heavy, PR RIP-least-penalised).
4. `npx vitest run src/test/engine/aging/veteranCompensation.test.ts src/test/engine/favorites/weaponMastery.test.ts src/test/engine/balance/traitNoise.test.ts` → all green.
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0 errors; full `npx vitest run` unchanged elsewhere.
6. No edits to weapon-suitability or mortality canon data.
