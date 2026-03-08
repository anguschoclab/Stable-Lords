# Stable Lords — Equipment, Armor, Shields, and Encumbrance Interaction Spec (Definitive) v0.1
Generated: 2026-02-07

This document defines the **equipment system** in Stable Lords as it affects dueling bout outcomes.
It is written to be *implementation-ready* and lineage-faithful to canonical Duelmasters sources (pid 39–48 in particular) and Terrablood Duel II charts (encumbrance, damage, endurance).

This document specifies:
- Equipment slots and item schemas
- Weapon families, handling classes, and requirements
- Armor/shield mitigation and tradeoffs
- Encumbrance computation and penalty application
- How equipment modifies exchange resolution (INI/ATT/PAR/DEF/RIP/DEC and endurance costs)
- Style × equipment suitability (recommendations, not hard locks unless specified)
- UI/UX contracts and validation rules
- Acceptance criteria and test cases

This document depends on:
- **Warrior Design & Creation Spec v0.3 (Definitive)**
- **Dueling Bout System & Style × Style Matchup Matrix v0.1**
- **Strategy Editor & OE/AL/DEC Curves v0.1**

---

## 1) Equipment Design Goals

1. **Lineage-correct feel**
   - Heavy gear makes you *harder to kill* but *easier to control* (tempo loss).
2. **Visible tradeoffs**
   - Every gear choice has a readable “why” in tooltips.
3. **Skill expression**
   - Light builds win by timing and avoidance; heavy builds win by denial and damage soak.
4. **Determinism**
   - Given the same warrior + gear, outcomes are reproducible (seeded randomness only).
5. **No trap items**
   - Poor matches are allowed but warned; true “garbage gear” should not exist.

---

## 2) Slots, Constraints, and Loadout Legality

### 2.1 Slots
A warrior loadout consists of:

- **Weapon (required)**
- **Offhand (optional)**: shield or offhand weapon
- **Armor (required)**
- **Helm (required)**
- (Optional future slots: boots, gloves, trinkets — not in scope unless added later)

### 2.2 Handedness legality
**Hard rules:**
- Two-handed weapon → offhand must be empty
- Shield equipped → weapon must be one-handed
- Dual wield (offhand weapon) is allowed **only** for styles that support it (content rule), otherwise warning

### 2.3 Category legality
- Armor and helm must be present (no naked builds) unless a house rule explicitly permits it.
- Encumbrance tier **OVER** is illegal unless an explicit “forced kit” narrative event overrides legality.

---

## 3) Canonical Item Schema (Engineering Contract)

```ts
type WeaponHandedness = "ONE_HANDED" | "TWO_HANDED";
type WeaponFamily =
  | "SWORD"
  | "AXE"
  | "MACE"
  | "SPEAR"
  | "POLEARM"
  | "DAGGER"
  | "EXOTIC";

type DamageType = "CUT" | "PIERCE" | "BLUNT";

type ArmorClass = "CLOTH" | "LEATHER" | "MAIL" | "PLATE";
type HelmClass = "NONE" | "LIGHT" | "HEAVY";

type ShieldClass = "BUCKLER" | "ROUND" | "TOWER";

type Weapon = {
  id: string;
  name: string;
  family: WeaponFamily;
  damageType: DamageType;
  handedness: WeaponHandedness;

  // Requirements
  reqSTR: number;
  reqDFT: number;
  reqSPD: number;

  // Profiles
  baseDamage: number;          // adds to damageRating
  accuracyMod: number;         // adds to ATT
  parryMod: number;            // adds to PAR
  riposteMod: number;          // adds to RIP
  initiativeMod: number;       // adds to INI (usually negative for big weapons)
  enduranceCostMod: number;    // multiplier or additive

  // Special rules (data-driven)
  reach: number;               // affects targeting and initiative edge in some matchups
  armorPenetration: number;    // affects mitigation bypass
  tags: string[];              // e.g., ["CRUSH", "HOOK", "DISARMABLE"]
  weight: number;
};

type Armor = {
  id: string;
  name: string;
  armorClass: ArmorClass;
  weight: number;

  mitigation: {
    cut: number;
    pierce: number;
    blunt: number;
  };

  // penalties/bonuses
  defenseMod: number;          // affects DEF
  initiativeMod: number;       // affects INI
  enduranceCostMod: number;    // affects endurance costs
  encumbranceBias: number;     // additional weight multiplier in tier calc
  tags: string[];
};

type Helm = {
  id: string;
  name: string;
  helmClass: HelmClass;
  weight: number;

  headMitigation: {
    cut: number;
    pierce: number;
    blunt: number;
  };

  visionPenalty: number;       // affects ATT and DEF slightly (data-driven)
  initiativeMod: number;
  enduranceCostMod: number;
  tags: string[];
};

type Shield = {
  id: string;
  name: string;
  shieldClass: ShieldClass;
  weight: number;

  parryBonus: number;          // affects PAR
  defenseBonus: number;        // affects DEF (positioning)
  ripostePenalty: number;      // shields reduce counter speed
  initiativeMod: number;
  enduranceCostMod: number;
  coverage: "LOW" | "MEDIUM" | "HIGH"; // influences head/chest protection
  tags: string[];
};
```

**Key contract:** every numeric effect must be explainable in UI tooltips.

---

## 4) Weapon Requirements and Failure Penalties

### 4.1 Requirement check
A weapon’s requirements must be satisfied by the warrior’s attributes:
- STR ≥ reqSTR
- DFT ≥ reqDFT
- SPD ≥ reqSPD

### 4.2 Failure penalties (hard design)
If requirements are not met, apply *stacking* penalties:
- **ATT penalty**: `-2` per missing requirement band (or table-driven)
- **Endurance cost increase**: +10% per failed requirement
- **DEC penalty (late bout only)**: unwilling to commit with unfamiliar weapon

Failure is allowed (no hard block) but must be loudly warned unless house rules ban it.

---

## 5) Encumbrance: Computation and Penalty Application

### 5.1 Encumbrance max
Compute `encumbranceMax` from STR and SIZ (Terrablood lineage):
- Prefer table lookup (encode the chart)
- Fallback: piecewise approximation to the chart

### 5.2 Loadout weight
`totalWeight = weapon.weight + armor.weight + helm.weight + (offhand.weight if any)`

### 5.3 Tiering (locked)
Compute ratio `r = totalWeight / encumbranceMax`

| Tier | Ratio r | Legality | Intent |
|------|---------|----------|--------|
| NONE | ≤ 0.60 | legal | agile |
| LIGHT | 0.60–0.80 | legal | balanced |
| MEDIUM | 0.80–1.00 | legal | committed |
| HEAVY | 1.00–1.20 | legal but warned | slow grinder |
| OVER | > 1.20 | illegal by default | forced kits only |

### 5.4 Tier penalties (applied every exchange)
Encumbrance tier modifies:
- **INI** (initiative bias)
- **DEF** and **PAR** (reaction quality)
- **endurance cost** (fatigue acceleration)

Recommended baseline (tunable):

| Tier | INI | DEF | PAR | Endurance cost |
|------|-----|-----|-----|----------------|
| NONE | +0 | +0 | +0 | ×1.00 |
| LIGHT | -1 | -1 | 0 | ×1.05 |
| MEDIUM | -2 | -2 | -1 | ×1.10 |
| HEAVY | -4 | -4 | -2 | ×1.20 |
| OVER | -6 | -6 | -3 | ×1.35 |

---

## 6) Armor & Helm: Mitigation Model

### 6.1 Damage pipeline (per landed hit)
1. Compute attacker raw damage: (damageRating + weapon baseDamage + situational)
2. Determine damage type: CUT/PIERCE/BLUNT
3. Apply mitigation:
   - armor mitigation by type
   - helm mitigation if hit location is head
4. Apply armor penetration: `effectiveMitigation = max(0, mitigation - penetration)`
5. Final: `finalDamage = max(1, rawDamage - effectiveMitigation)`
6. Apply injury thresholds (data-driven)

### 6.2 Armor class identity
- Cloth/Leather: low mitigation, low penalties
- Mail: balanced; strong vs CUT
- Plate: high mitigation; heavy penalties and endurance drain

---

## 7) Shields: Parry/Defense Amplifier

- Shields add PAR directly and improve DEF positioning.
- Shields reduce RIP speed (ripostePenalty).
- Coverage reduces head/chest critical exposure.

---

## 8) Where Gear Hooks Into Exchange Resolution

Using canonical order: INI → ATT → PAR/DEF → RIP → Damage → DEC → Endurance

- **INI**: weapon/armor/helm/shield initiativeMod + encumbrance tier penalty
- **ATT**: weapon accuracyMod + helm visionPenalty + requirement penalties
- **PAR**: weapon parryMod + shield parryBonus + encumbrance penalties
- **DEF**: armor defenseMod + shield defenseBonus + encumbrance penalties
- **RIP**: weapon riposteMod - shield ripostePenalty
- **DEC**: optional weapon familiarity + late kill-window boosts for big weapons (content driven)
- **Endurance**: multiplied by weapon/armor/shield cost mods + encumbrance tier multiplier + Strategy (OE/AL)

---

## 9) Style × Equipment Suitability (Content Tables)

Suitability bands:
- Preferred / Viable / Suboptimal / Not Recommended

Minimum required tables:
1. style → preferred weapon families
2. style → armor class preference
3. style → shield preference
4. style → “anti-synergy warnings” list (for tooltips)

These tables power:
- optimizer pruning
- matchup previews
- “why” tooltips in UI

---

## 10) UI/UX Contracts

### 10.1 Loadout panel (required)
- slot cards (weapon/offhand/armor/helm)
- totalWeight, encumbranceMax, encumbranceTier pill
- penalties tooltip table
- weapon requirement checklist
- “simulate loadout” quick action

### 10.2 Warnings must be specific
Examples:
- “HEAVY kit: -4 INI, -4 DEF, -2 PAR; endurance ×1.20.”
- “Weapon req DFT 12; current DFT 8: -4 ATT; endurance +20%.”

---

## 11) Acceptance Criteria & Tests

Unit tests:
- Tier boundaries (0.60/0.80/1.00/1.20)
- handedness legality
- requirement penalty stacking

Simulation tests:
- plate increases survival but accelerates fatigue collapse
- shields increase parry events but reduce riposte frequency
- two-handed increases late kill conversion

UX acceptance:
- no silent penalties; everything tooltipped

---

END OF DOCUMENT
