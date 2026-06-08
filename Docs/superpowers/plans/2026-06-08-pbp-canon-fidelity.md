# PBP Canon-Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and harden the Duel-II-style play-by-play (PBP): fix two token-leak regressions, then wire up the already-written knockdown / dodge-tier / epithet narrators so they actually fire.

**Architecture:** Combat emits `CombatEvent`s → `src/engine/combat/narrative/narrator.ts` (`narrateEvents`) turns each event into a `MinuteEvent.text` line, pulling phrasing from `src/data/narrativeContent.json` via helper functions in `src/engine/narrative/*`. Templates carry tokens (`%A`/`{{attacker}}`/`{{defender}}`/`{{weapon}}`/`{{possessive}}`) resolved by `interpolateTemplate`. Two such functions exist with **separate** implementations: `narrativePBPUtils.ts` (combat path) and `narrativeTemplateEngine.ts` (intro/kill path) — both must stay in sync.

**Tech Stack:** TypeScript, Vitest. Run tests with `npx vitest run <path>`. Typecheck with `npx tsc --noEmit`. Canonical phrasing reference: memory `terrablood-pbp-format`.

**Verification reference (current bugs, from a seeded bout):**
- `m3 🔍 Your strength forces {{defender}} back on {{possessive}} heels!` ← leaks BOTH tokens.
- `{{possessive}}` appears in ~30 templates in `narrativeContent.json` but is handled by **neither** interpolation engine.
- `narrateKnockdown` / `narrateRecovery` / `getEpithet` exist in `combatNarrators.ts` but are **never called** from `narrator.ts` (dead code).
- `narrateDodge(rng, name, speed?)` supports SP-tiering but `narrator.ts` calls it without `speed`, so every dodge is `tier1_low`.

---

## File Structure

- `src/engine/narrative/narrativePBPUtils.ts` — combat-path `interpolateTemplate` (Task 1).
- `src/engine/narrative/narrativeTemplateEngine.ts` — intro/kill-path `interpolateTemplate` (Task 1).
- `src/engine/narrative/narrativePositioning.ts` — `narrateInsightHint` (Task 2).
- `src/engine/combat/narrative/narrator.ts` — the emit switch; ctx plumbing, INSIGHT/DODGE/KNOCKDOWN/RECOVERY cases (Tasks 2, 4, 5, 6).
- `src/engine/combat/narrative/types.ts` (or wherever the narrator ctx type lives) — extend ctx with per-fighter SP + origin (Task 4).
- `src/test/engine/narrative/pbpInterpolation.test.ts` — extend (Tasks 1, 3).

---

## Task 1: Resolve `{{possessive}}` (and any unknown standard token) instead of leaking it

**Files:**
- Modify: `src/engine/narrative/narrativePBPUtils.ts` (the `interpolateTemplate` `longKey` switch)
- Modify: `src/engine/narrative/narrativeTemplateEngine.ts` (the `interpolateTemplate` `longKey` switch)
- Test: `src/test/engine/narrative/pbpInterpolation.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside the `describe('interpolateTemplate fallbacks', ...)` block in `src/test/engine/narrative/pbpInterpolation.test.ts`:

```typescript
it('resolves {{possessive}} (defaults to "their", honors context)', () => {
  expect(interpolateTemplate('{{attacker}} raises {{possessive}} blade', { attacker: 'A' })).toBe(
    'A raises their blade'
  );
  expect(interpolateTemplate('forced back on {{possessive}} heels', { possessive: 'her' })).toBe(
    'forced back on her heels'
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/test/engine/narrative/pbpInterpolation.test.ts -t "possessive"`
Expected: FAIL — output still contains the raw `{{possessive}}`.

- [ ] **Step 3: Add a `possessive` case to BOTH engines**

In `src/engine/narrative/narrativePBPUtils.ts`, inside the `if (longKey) { switch (longKey) { ... } }`, add a case alongside the existing ones:

```typescript
        case 'possessive':
          return String(ctx.possessive ?? 'their');
```

In `src/engine/narrative/narrativeTemplateEngine.ts`, add the same `case 'possessive':` to its `longKey` switch (keep the two switches identical).

Then add `possessive?: string;` to the `CombatContext` type (find it via `grep -rn "interface CombatContext" src`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/test/engine/narrative/pbpInterpolation.test.ts -t "possessive"`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/engine/narrative/narrativePBPUtils.ts src/engine/narrative/narrativeTemplateEngine.ts src/test/engine/narrative/pbpInterpolation.test.ts src/types
git commit -m "fix(pbp): resolve {{possessive}} token (default 'their') in both interpolation engines"
```

---

## Task 2: Interpolate insight-hint lines (fixes the `{{defender}}` leak in `pbp.insights.ST`)

The leak `🔍 Your strength forces {{defender}} back on {{possessive}} heels!` comes from
`narrateInsightHint` in `src/engine/narrative/narrativePositioning.ts`, which returns the archive
template **without** interpolation. The `pbp.insights.ST` array mixes 2nd-person ("your") and
3rd-person (`{{defender}}`) lines.

**Files:**
- Modify: `src/engine/narrative/narrativePositioning.ts` (`narrateInsightHint`)
- Modify: `src/engine/combat/narrative/narrator.ts` (the `case 'INSIGHT'` ~line 226)
- Test: `src/test/engine/narrative/pbpInterpolation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { narrateInsightHint } from '@/engine/narrative/narrativePositioning';
// ...
it('narrateInsightHint never leaks raw tokens', () => {
  for (let seed = 1; seed <= 60; seed++) {
    for (const attr of ['ST', 'SP', 'DF', 'WT']) {
      const line = narrateInsightHint(new SeededRNGService(seed), attr, 'Garath', 'Vellis');
      if (line) expect(noRawTokens(line), `${attr}/${seed}: ${line}`).toBe(true);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/test/engine/narrative/pbpInterpolation.test.ts -t "insightHint"`
Expected: FAIL — `{{defender}}` / `{{possessive}}` leak on the ST attribute.

- [ ] **Step 3: Interpolate inside `narrateInsightHint`**

Replace the body of `narrateInsightHint` in `src/engine/narrative/narrativePositioning.ts` with:

```typescript
export function narrateInsightHint(
  rng: RNG,
  attribute: string,
  attackerName?: string,
  defenderName?: string
): string | null {
  const template = getFromArchive(rng, ['pbp', 'insights', attribute]);
  if (!template || template === 'A fierce exchange occurs.') return null;
  return interpolateTemplate(template, { attacker: attackerName, defender: defenderName });
}
```

(Task 1 makes `{{possessive}}` resolve to "their" automatically; no extra arg needed.)

- [ ] **Step 4: Pass names from the narrator**

In `src/engine/combat/narrative/narrator.ts`, the `case 'INSIGHT'` currently calls
`narrateInsightHint(rng, attribute)`. Change it to pass the two names already in scope:

```typescript
const hint = narrateInsightHint(rng, attribute, actorName, opponentName);
```

- [ ] **Step 5: Run tests + verify a full bout is clean**

Run: `npx vitest run src/test/engine/narrative/pbpInterpolation.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/narrative/narrativePositioning.ts src/engine/combat/narrative/narrator.ts src/test/engine/narrative/pbpInterpolation.test.ts
git commit -m "fix(pbp): interpolate insight-hint lines so {{defender}}/{{possessive}} resolve"
```

---

## Task 3: Whole-bout regression guard (would have caught both regressions)

The existing tests check individual functions; nothing scans a *full simulated bout*. Add that.

**Files:**
- Test: `src/test/engine/narrative/pbpFullBout.test.ts` (create)

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';

const STYLES = Object.values(FightingStyle);

describe('PBP full-bout output is clean', () => {
  it('never emits raw {{tokens}} or "a [vowel]" article errors across many bouts', () => {
    const leaks: string[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const A = makeWarrior(undefined, 'Aragor', STYLES[seed % STYLES.length],
        { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }, undefined, new SeededRNGService(seed));
      const D = makeWarrior(undefined, 'Belisar', STYLES[(seed + 3) % STYLES.length],
        { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }, undefined, new SeededRNGService(seed + 500));
      const out = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed * 31 + 7);
      for (const e of out.log) {
        if (/\{\{|\}\}|\b a [AEIOUaeiou]/.test(e.text)) leaks.push(`seed ${seed}: ${e.text}`);
      }
    }
    expect(leaks, leaks.slice(0, 10).join('\n')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/test/engine/narrative/pbpFullBout.test.ts`
Expected: PASS once Tasks 1–2 are merged. If it fails, the failure message lists the leaking lines — fix the offending template/emitter before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/test/engine/narrative/pbpFullBout.test.ts
git commit -m "test(pbp): full-bout scan for raw tokens / article errors"
```

---

## Task 4: Give the narrator per-fighter SP + origin (foundation for Tasks 5–6)

`narrateEvents`'s ctx (`src/engine/combat/narrative/narrator.ts`, destructured ~line 27 as
`{ rng, nameA, nameD, weaponA, weaponD }`) has no fighter SP or origin — that's why dodge-tiering
and epithets can't fire.

**Files:**
- Modify: the narrator-ctx type (find via `grep -rn "nameA" src/engine/combat/narrative/`; likely `narrator.ts` params or a `NarrationContext` interface)
- Modify: `src/engine/combat/narrative/narrator.ts`
- Modify: the caller that builds the ctx (find via `grep -rn "narrateEvents(" src/engine | grep -v test`)

- [ ] **Step 1: Extend the ctx type**

Add to the narrator context interface:

```typescript
  spA?: number;       // fighter A Speed attribute (for dodge quickness tiering)
  spD?: number;
  originA?: string;   // for epithets ("The Kaltosan", "This Convincian fighter")
  originD?: string;
```

- [ ] **Step 2: Populate them at the call site**

In the function that calls `narrateEvents` (the simulate/narrative builder), pass
`spA: warriorA?.attributes.SP`, `spD: warriorD?.attributes.SP`,
`originA: warriorA?.origin`, `originD: warriorD?.origin`.

- [ ] **Step 3: Add accessors in `narrateEvents`**

Next to the existing `getName`/`getWeapon`, add:

```typescript
  const getSpeed = (actor: 'A' | 'D') => (actor === 'A' ? ctx.spA : ctx.spD);
  const getOrigin = (actor: 'A' | 'D') => (actor === 'A' ? ctx.originA : ctx.originD);
```

- [ ] **Step 4: Typecheck + commit (no behavior change yet)**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(pbp): thread fighter SP + origin into the narration context"
```

---

## Task 5: Wire SP-tiered dodges

`narrateDodge(rng, defenderName, speed?)` already tiers on SP (≥12 medium, ≥19 high, ≥26
supernatural). `narrator.ts` calls it without `speed`.

**Files:**
- Modify: `src/engine/combat/narrative/narrator.ts` (the two `narrateDodge(...)` calls, ~lines 99, 117)
- Test: `src/test/engine/narrative/combatNarrator.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { narrateDodge } from '@/engine/narrative/combatNarrators';
// high SP should be able to produce the "supernatural" tier wording at least once
it('narrateDodge escalates wording with Speed', () => {
  const lines = new Set<string>();
  for (let s = 0; s < 50; s++) lines.add(narrateDodge(new SeededRNGService(s), 'Nim', 28));
  // tier4 lines mention amazing/impossible/inhuman quickness per the archive
  expect([...lines].some((l) => /impossibl|inhuman|amaz|supernatural/i.test(l))).toBe(true);
});
```

- [ ] **Step 2: Run it to verify it fails or passes against the archive**

Run: `npx vitest run -t "escalates wording with Speed"`
Expected: PASS if `pbp.defenses.dodge.tier4_supernatural` exists with such wording; if FAIL because the archive lacks tier4 lines, add 3–4 to `narrativeContent.json` under `pbp.defenses.dodge.tier4_supernatural` (see canon phrasing in memory `terrablood-pbp-format`: "contorts his body inhumanly as he unbelievably dodges the blow!").

- [ ] **Step 3: Pass Speed from the narrator**

In `narrator.ts`, the dodge is narrated for the **defender** (the one avoiding). Change both calls to pass that fighter's Speed. For the `DEFENSE`/dodge cases, the dodging fighter is the event actor → use `getSpeed(event.actor)`:

```typescript
log.push({ minute, text: narrateDodge(rng, actorName, getSpeed(event.actor)) });
```

For the line at ~99 where the dodger is the opponent, use `getSpeed(event.actor === 'A' ? 'D' : 'A')` and `opponentName` consistently (match whichever name that call already uses).

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run src/test/engine/narrative/combatNarrator.test.ts
git add -A && git commit -m "feat(pbp): SP-tiered dodge narration (quickness statements)"
```

---

## Task 6: Wire knockdown + recovery narration

`CombatEvent.type` already includes `'KNOCKDOWN'` and `'RECOVERY'`
(`src/types/combat.types.ts:113-114`), and `narrateKnockdown` / `narrateRecovery` exist
(`combatNarrators.ts:112,121`). `narrator.ts` has no cases for them.

**Files:**
- Modify: `src/engine/combat/narrative/narrator.ts` (add two `case`s to the event switch)
- Verify: that resolution actually emits these events — `grep -rn "'KNOCKDOWN'\|KNOCKDOWN" src/engine/combat/resolution`. If nothing emits them, that is a separate engine task (out of scope here); note it and skip wiring until events exist.
- Test: `src/test/engine/narrative/combatNarrator.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { narrateKnockdown, narrateRecovery } from '@/engine/narrative/combatNarrators';
it('knockdown/recovery lines name the fighter and leak nothing', () => {
  const k = narrateKnockdown(new SeededRNGService(1), 'Garath');
  const r = narrateRecovery(new SeededRNGService(1), 'Garath');
  expect(k).toContain('Garath');
  expect(/\{\{|\}\}/.test(k + r)).toBe(false);
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run -t "knockdown/recovery"`
Expected: PASS (requires `pbp.knockdown.fall` / `pbp.knockdown.recovery` arrays in `narrativeContent.json`; add canon lines if missing — "loses his footing and falls!!!" / "is standing once more!").

- [ ] **Step 3: Add the narrator cases**

In `narrator.ts`'s event switch, alongside the other cases:

```typescript
      case 'KNOCKDOWN':
        log.push({ minute, text: narrateKnockdown(rng, actorName) });
        break;
      case 'RECOVERY':
        log.push({ minute, text: narrateRecovery(rng, actorName) });
        break;
```

Add `narrateKnockdown, narrateRecovery` to the imports from `combatNarrators`.

- [ ] **Step 4: Run the full-bout test + commit**

```bash
npx vitest run src/test/engine/narrative/pbpFullBout.test.ts
git add -A && git commit -m "feat(pbp): narrate KNOCKDOWN/RECOVERY events"
```

---

## Task 7: Wire epithets to cut name repetition

`getEpithet(rng, origin?, race?, style?)` (`combatNarrators.ts:130`) returns an alternate name
~30% of the time. Use it so lines read "The Kaltosan parries…" instead of the warrior's full name
every single line.

**Files:**
- Modify: `src/engine/combat/narrative/narrator.ts` — replace the raw `getName(actor)` used in
  attack/hit lines with an epithet-aware helper.
- Test: `src/test/engine/narrative/combatNarrator.test.ts`

- [ ] **Step 1: Add an epithet-aware name helper in `narrateEvents`**

```typescript
const displayName = (actor: 'A' | 'D') => {
  const base = getName(actor);
  const epithet = getEpithet(rng, getOrigin(actor), undefined, undefined);
  return epithet ?? base;
};
```

Import `getEpithet` from `combatNarrators`. Then in the ATTACK/HIT narration calls, use
`displayName(event.actor)` instead of `actorName` for the *attacker subject* (keep the literal
`getName` for places that must be unambiguous, e.g. the hit-location target, to avoid confusion).

- [ ] **Step 2: Write the test**

```typescript
import { getEpithet } from '@/engine/narrative/combatNarrators';
it('getEpithet uses origin when it fires', () => {
  // force the 30% branch by scanning seeds
  const hits = Array.from({ length: 50 }, (_, s) => getEpithet(new SeededRNGService(s), 'Kolact'))
    .filter(Boolean);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every((h) => typeof h === 'string')).toBe(true);
});
```

- [ ] **Step 3: Run tests + a manual eyeball**

Run: `npx vitest run src/test/engine/narrative/combatNarrator.test.ts`
Then run the demo snippet from the plan header and confirm names vary (epithets appear) and the
full-bout test still passes.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(pbp): epithet-aware naming to reduce repetition"
```

---

## Task 8 (polish): hit-line variety + verb possessive

Two cosmetic canon gaps from the sample bout:
- The main hit sentence repeats verbatim (~5×/bout): "X drops his center and drives a blinding lunge with his EPÉE into the LOC!". Widen that template pool.
- Weapon-verb lines dropped the possessive: "whips EPÉE in a deceptive thrust!" should read "whips his EPÉE…".

**Files:**
- Modify: `src/data/narrativeContent.json` (the hit-line array — find via
  `grep -n "drops his center and drives a blinding lunge" src/data/narrativeContent.json`; and the
  weapon-verb arrays — find via `grep -n "whips %W\|whips {{weapon}}" src/data/narrativeContent.json`)

- [ ] **Step 1:** In the weapon-verb arrays, ensure every `%W`/`{{weapon}}` is preceded by a
  possessive or article: change `"whips %W in a deceptive thrust!"` → `"whips {{possessive}} %W in a deceptive thrust!"` (and similar). `{{possessive}}` now resolves (Task 1).
- [ ] **Step 2:** Add 4–6 alternate hit sentences to the main hit-line array using canon phrasing
  from memory `terrablood-pbp-format` (e.g. "%A's %W bites deep into the %BP!", "%A drives the %W home — %D is struck on the %BP!").
- [ ] **Step 3:** Run `npx vitest run src/test/engine/narrative/pbpFullBout.test.ts` (article guard
  catches any new "a EPÉE") and commit.

```bash
git add src/data/narrativeContent.json
git commit -m "polish(pbp): hit-line variety + possessive on weapon verbs"
```

---

## Self-Review notes
- **Spec coverage:** P0 leaks (Tasks 1–2) + guard (Task 3); the "engineers' dead code" (dodge SP-tier, knockdown, epithet) wired in Tasks 4–7; remaining canon polish in Task 8. The canon gap list lives in memory `terrablood-pbp-format`.
- **Two interpolation engines:** Task 1 deliberately edits BOTH `narrativePBPUtils.ts` and `narrativeTemplateEngine.ts` — keep their `longKey` switches identical or the leak recurs on the other path.
- **Knockdown caveat:** Task 6 only narrates events; if `resolution.ts` doesn't emit `KNOCKDOWN`/`RECOVERY`, that engine work is a prerequisite (flagged in the task).
