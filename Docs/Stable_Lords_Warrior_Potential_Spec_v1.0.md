# Stable Lords — Warrior Potential System Specification v1.0

Generated: 2026-03-08

---

## 0) Design Philosophy

Every warrior in Stable Lords has **hidden per-attribute potential ceilings** — the maximum value each attribute can reach through training and XP progression. This creates strategic depth:

- Not all warriors are worth investing in equally
- Scouting and evaluation become meaningful decisions
- Higher-tier recruits are worth their premium price
- Training decisions carry real weight and trade-offs

Potential is **generated at warrior creation** and remains fixed for the warrior's lifetime.

---

## 1) Potential Generation

### 1.1 Headroom Model

Each attribute's potential = `current_value + random(headroom_min, headroom_max)`, clamped to `[8, 25]`.

Headroom ranges vary by recruitment tier:

| Tier        | Headroom Range | Typical Potential |
|-------------|----------------|-------------------|
| Common      | +2 to +5       | 12–18             |
| Promising   | +3 to +7       | 13–21             |
| Exceptional | +5 to +9       | 15–23             |
| Prodigy     | +7 to +12      | 17–25             |

### 1.2 Per-Attribute Independence

Each attribute rolls its headroom independently. A warrior may have exceptional Strength potential (22) but poor Wit potential (14). This creates interesting "specialist vs generalist" dynamics.

### 1.3 Absolute Bounds

- **Minimum potential**: 8 (no attribute's ceiling can be below 8)
- **Maximum potential**: 25 (matches ATTRIBUTE_MAX)
- **Total attribute cap**: 80 (unchanged; applies to sum of current values, not potentials)

---

## 2) Potential Visibility (Fog of War)

### 2.1 Hidden by Default

When a warrior is first recruited, **all potential values are hidden**. The player sees current attributes but not their ceilings.

### 2.2 Revelation Triggers

Potential is revealed one attribute at a time through:

| Trigger              | Chance per Event | Notes                                |
|----------------------|------------------|--------------------------------------|
| Fight participation  | 15% per fight    | Random unrevealed attribute          |
| Scouting (future)    | Guaranteed       | Player chooses which attribute       |
| Hitting ceiling      | 100%             | Auto-revealed when training fails    |

### 2.3 Reveal State

The `potentialRevealed` field on `Warrior` tracks which attributes have been revealed:

```typescript
potentialRevealed?: Partial<Record<keyof Attributes, boolean>>;
```

UI should show revealed potentials as "current / potential" and unrevealed as "current / ???".

---

## 3) Impact on Training

### 3.1 Hard Cap

Training **cannot** raise an attribute above its potential ceiling. If `current >= potential`, training in that attribute automatically fails (the warrior "has nothing more to learn" in that area).

### 3.2 Diminishing Returns

As an attribute approaches its potential ceiling, training success chance decreases:

| Distance from Ceiling | Multiplier on Base Chance |
|----------------------|---------------------------|
| 3+ points            | 1.0× (full chance)        |
| 2 points             | 0.5× (half chance)        |
| 1 point              | 0.25× (quarter chance)    |
| 0 (at ceiling)       | 0.0× (impossible)         |

With a base training chance of 55%, effective chances become:

| Gap | Effective Chance |
|-----|-----------------|
| 3+  | 55%             |
| 2   | 27.5%           |
| 1   | 13.75%          |
| 0   | 0%              |

### 3.3 Newsletter Feedback

When a warrior hits their ceiling during training, the newsletter reports:
> "KRAGOS improved ST to 18 through training. (reached potential ceiling)"

This serves as an indirect reveal of that attribute's potential.

---

## 4) Impact on XP Progression

### 4.1 Weighted Attribute Selection

When a warrior levels up (every 5 XP), the attribute improvement is **weighted by headroom**. Attributes far from their ceiling are more likely to be chosen than those near it.

### 4.2 Minimum Weight

Every improvable attribute retains a minimum weight of 0.1, so surprising improvements are possible even near the ceiling.

### 4.3 Fight-Based Potential Reveal

Each fight has a 15% chance to reveal one unrevealed attribute's potential. This incentivizes active fighting over passive training.

---

## 5) Potential Rating & Grades

### 5.1 Overall Rating

A numeric 0–100 score representing what percentage of maximum growth the warrior can achieve:

```
rating = sum(all_potential_values) / (7 × 25) × 100
```

### 5.2 Letter Grades

| Rating | Grade | Description           |
|--------|-------|-----------------------|
| 85+    | S     | Generational talent   |
| 70–84  | A     | Elite prospect        |
| 55–69  | B     | Solid warrior         |
| 40–54  | C     | Limited upside        |
| <40    | D     | Journeyman            |

### 5.3 Display Rules

- Grade is shown only after **all 7 attributes** are revealed
- Individual attribute potentials show as revealed
- Recruit pool in Orphanage does NOT show potential (buy blind)

---

## 6) Interaction with Other Systems

### 6.1 Aging

Aging penalties reduce **current** attributes, not potential. A warrior past their prime may still have high potential but can no longer reach it due to age-based decay.

### 6.2 Equipment

Equipment bonuses are applied on top of current attributes, not affected by potential.

### 6.3 AI Rival Stables

AI warriors also have per-attribute potentials, generated identically. AI training decisions do not "cheat" by knowing their own potential.

### 6.4 Scouting (Future)

A planned scouting system will allow players to pay to reveal specific attribute potentials on their own warriors or scout opponents' revealed potentials.

---

## 7) Data Model

### 7.1 Type Additions (game.ts)

```typescript
export type AttributePotential = Record<keyof Attributes, number>;

export interface Warrior {
  // ... existing fields ...
  potential?: AttributePotential;
  potentialRevealed?: Partial<Record<keyof Attributes, boolean>>;
}
```

### 7.2 Recruit Pool Extension (recruitment.ts)

```typescript
export interface PoolWarrior {
  // ... existing fields ...
  potential: AttributePotential;
}
```

### 7.3 Potential Module (potential.ts)

```typescript
generatePotential(attrs, tier, rng) → AttributePotential
canGrow(current, potential) → boolean
diminishingReturnsFactor(current, potential) → number  // 0.0–1.0
revealPotential(revealed, attr) → updated reveal map
potentialRating(potential) → number  // 0–100
potentialGrade(rating) → string     // S/A/B/C/D
```

---

## 8) Migration & Backward Compatibility

Warriors created before the potential system will have `potential: undefined`. All potential-aware code handles this gracefully:

- `canGrow(current, undefined)` → falls back to `current < ATTRIBUTE_MAX`
- `diminishingReturnsFactor(current, undefined)` → returns `1.0` (no diminishing)
- UI shows "—" for potential on legacy warriors

---

## 9) Canonical Reference

- Duelmasters pid 2, 8–16 (attribute system)
- Terrablood breakpoint tables (skill derivation)
- Stable_Lords_Training_Mechanics_Spec_v1.0 (training flow)
- Stable_Lords_Orphanage_Recruitment_Spec_v1.0 (tier system)

---

END OF DOCUMENT
