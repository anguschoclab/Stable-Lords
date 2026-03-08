# Stable Lords — Warrior Design & Creation Specification (Granular, Implementable) v0.1
Generated: 2026-01-10

This document defines **how a warrior is designed** in *Stable Lords*—from concept and lore to **exact data fields**, **creation workflows**, **derived-stat math contracts**, **UI surfaces**, and **validation rules**.

It incorporates (and aligns to) Duel II / Duelmasters lineage using Terrablood reference material for:
- **Attribute-driven skill base deltas** (Terrablood Skill Chart)
- **WIT statement thresholds** (Intelligence / Good / Bad / Endurance WIT statements)
- **Coordination & Quickness statements**
- **Activity Ratings** (initiative base vs riposte bases)
- **Hit Points, Endurance, Encumbrance, Damage charts**
- **Skill base charts** (Terrablood / Bagman II / Ween)

**Non-goal:** This doc does *not* attempt to perfectly replicate Duel II's hidden math. Instead it defines an implementable system that:
1) preserves the *lineage mental model*, and  
2) is explicit, deterministic, and testable.

---

## 1) Warrior: Product Intent

### 1.1 What a Warrior Is (player promise)
A Warrior is:
- A **roster unit** (management)
- A **combat agent** (simulation)
- A **legend container** (history & narrative)
- A **stat puzzle** (optimization)
- A **meta participant** (styles rise/fall)

The player should feel:
- “I *built* this fighter.”
- “Their strengths and flaws were predictable.”
- “Their career is a story I can trace.”

### 1.2 What “Designed” Means in Stable Lords
“Designing a warrior” is the sum of:
1. **Identity**: name, origin, archetype, style fantasy
2. **Physicals**: core attributes (STR/WIT/WIL/SPD/DFT/CON/SIZ)
3. **Skill bases**: Attack/Parry/Defense/Initiative/Riposte/Decisiveness
4. **Derived combat stats**: HP, endurance, damage, encumbrance budget, fatigue
5. **Style & tactics**: the fighting style + strategy plan presets
6. **Equipment**: weapon, armor, helm, shield (with suitability)
7. **Flavor statements**: quickness/coordination/wit lines used by UI and Gazette
8. **Growth plan**: training specialization and trajectory
9. **Career container**: fight history, fame, rivalries, titles, death record

---

## 2) Data Model (Engineering Contract)

### 2.1 Canonical Warrior Record (minimum schema)
**All fields required unless marked optional.**

```ts
type UUID = string;

type WarriorId = UUID;
type StableId = UUID;
type TrainerId = UUID;

type FighterStatus = "ACTIVE" | "RETIRED" | "DEAD";
type Sex = "M" | "F" | "X";

type FightingStyleId =
  | "AIMED_BLOW"
  | "BASHER"
  | "LUNGER"
  | "PARRY_LUNGE"
  | "PARRY_RIPOSTE"
  | "PARRY_STRIKE"
  | "SLASHER"
  | "STRIKER"
  | "TOTAL_PARRY"
  | "WALL_OF_STEEL"; // names align to Duelmasters/Duel II lineage

type BodyTarget = "HEAD" | "CHEST" | "ABDOMEN" | "ARMS" | "LEGS" | "ANY";

type Attributes = { STR: number; WIT: number; WIL: number; SPD: number; DFT: number; CON: number; SIZ: number; };

type SkillBases = { ATT: number; PAR: number; DEF: number; INI: number; RIP: number; DEC: number; };

type Derived = {
  hitPoints: number;
  endurance: number;            // stamina pool / fatigue buffer
  encumbranceMax: number;       // max weight class budget before penalties
  damageRating: number;         // base damage modifier
  activityRating: string;       // e.g., "VSI", "RI", "A", etc. (see Activity Ratings)
  quicknessStatementId: string; // points to a statement template
  coordinationStatementId: string;
  witStatementId: string;
};

type EquipmentLoadout = {
  weaponId: string;
  offhandId?: string; // shield or offhand weapon
  armorId: string;
  helmId: string;
  totalWeight: number;
  encumbranceTier: "NONE" | "LIGHT" | "MEDIUM" | "HEAVY" | "OVER";
};

type Warrior = {
  id: WarriorId;
  stableId: StableId;
  createdAtISO: string;

  // Identity
  name: string;
  epithet?: string;
  origin: "ORPHANAGE" | "BOUGHT" | "CAPTURED" | "CUSTOM";
  sex: Sex;
  age: number;

  // Primary build
  styleId: FightingStyleId;
  attributes: Attributes;
  baseSkills: SkillBases;
  derived: Derived;

  // Combat planning
  preferredTarget: BodyTarget;
  strategyPresetId?: string; // links to minute-by-minute plan curve
  temperament: "CALM" | "BOLD" | "SAVAGE" | "TRICKY" | "DUTIFUL";

  // Gear
  equipment: EquipmentLoadout;

  // Career + meta
  status: FighterStatus;
  fame: number;        // 0..100
  notoriety: number;   // 0..100
  popularity: number;  // 0..100

  wins: number;
  losses: number;
  kills: number;

  titles: Array<{ seasonId: string; titleId: string; }>; // champion, medals, etc.
  injuries: Array<{ id: UUID; kind: string; severity: number; startISO: string; endISO?: string; }>;
  rivalries: Array<{ opponentId: WarriorId; heat: number; lastFightISO: string; }>;

  // Hidden discovery layer (optional, can be revealed over time)
  favoriteWeaponId?: string;
  rhythmProfileId?: string;

  // History pointers
  fightIds: string[];
  chronicleEntryIds: string[];
};
```

### 2.2 Normalization Rules
- **Warrior is the source of truth** for attributes, base skills, and derived stats at creation.
- Derived stats are **recomputed** whenever: attributes change, equipment changes, or a major progression event occurs (promotion, trainer conversion).
- Fight logs never mutate the creation record; they reference snapshots.

---

## 3) Warrior Creation Pipeline (Player Workflow)

There are two creation contexts:

### 3.1 Creation Context A — “Recruit” (most common)
The player selects from a pool of generated recruits.
- Each recruit is a fully generated Warrior record with:
  - name + origin + age
  - styleId
  - attributes
  - baseSkills (computed)
  - derived stats (computed)
  - starter gear (computed)

**Player actions:**
1. Compare recruit cards
2. Open detail drawer (shows statements, suitability, curves)
3. Purchase/Sign
4. Optionally rename

### 3.2 Creation Context B — “Custom Build” (designer mode / sandbox)
The player can design a warrior by:
1. Choosing styleId
2. Allocating attributes (with constraints)
3. Picking equipment (with warnings)
4. Selecting strategy preset
5. Final validation + confirm

**Use cases:**
- Single-player sandbox
- Dev harness / demo builds
- Tutorial “build your first gladiator”

### 3.3 Creation Context C — “Narrative Acquisition”
Warriors enter your stable via events:
- captured rival
- bought from a dying stable
- tournament prize fighter
- orphanage rescue

These can override normal constraints (rare “oddities”), but must still compute baseSkills and derived stats from attributes + style + equipment.

---

## 4) Core Attributes (Physicals) — Definitions, Ranges, and Effects

Stable Lords uses the classic 7-stat set as the **creation foundation**:

- STR (Strength)
- WIT (Wit / Intelligence)
- WIL (Willpower)
- SPD (Speed)
- DFT (Deftness / Dexterity)
- CON (Constitution)
- SIZ (Size)

### 4.1 Range Contract
- Each stat: **3..25**
- Total points budget for “standard” recruits: configurable (default 70)
- At least **2 dump stats** should exist in most recruits (to preserve “flawed hero” fantasy).

### 4.2 Attribute → Skill Delta Contract (Terrablood Skill Chart lineage)
At creation, each attribute contributes **skill deltas** (bonuses/penalties) to base skills.
Stable Lords implements this using **breakpoints** inspired by the Terrablood Skill Chart.

---

## 5) Skill Bases: ATT / PAR / DEF / INI / RIP / DEC

### 5.1 Skill Definitions (player-facing)
- **ATT (Attack):** chance to land a hit; also influences hit quality.
- **PAR (Parry):** blocks with weapon/shield.
- **DEF (Defense):** avoids getting hit via footwork, positioning.
- **INI (Initiative):** who acts first; tempo advantage.
- **RIP (Riposte):** counter-attack after defense/parry events.
- **DEC (Decisiveness):** willingness to commit; influences kill windows and “finish” behavior.

### 5.2 Base Skill Computation (creation-time algorithm)
Creation computes baseSkills in 5 layers:
1) Start values by style (style seed)  
2) Add attribute deltas (breakpoints)  
3) Add style modification offsets (style mod table)  
4) Apply controlled randomness  
5) Clamp to legal ranges  

---

## 6) Derived Stats (HP, Endurance, Damage, Encumbrance)
Derived stats exist to make “build” meaningfully translate into match behavior.

- HP: from CON + SIZ (hit point chart lineage)
- Endurance: stamina pool (warrior endurance chart lineage)
- Damage: from STR + weapon + style (warrior damage chart lineage)
- Encumbrance: from STR + SIZ + loadout weight (encumbrance chart lineage)

---

## 7) Statements Layer (UI Flavor + Diagnostics)
Statements are deterministic descriptors derived from numeric values.

- WIT intelligence thresholds (Intelligence WIT statements)
- Good/Bad/Endurance phrasing packs
- Quickness statements from DEF + PAR (with WIT gate)
- Coordination statements from SPD/DFT/DEF composite

---

## 8) Activity Ratings (Tempo Personality)
Activity ratings summarize INI base vs RIP base to a short label (initiative vs riposte grid).

---

## 9) Equipment Suitability (Creation + Progression)
- Weapon stat requirements enforce minimum STR/DFT/SPD, else penalties.
- Weapons-for-each-style provides recommendations + warnings.
- Encumbrance tier applies penalties to INI/DEF and endurance cost.

---

## 10) UI Design: Recruit Cards + Builder
- Recruit card shows: style chip, headline statements, derived bars, activity rating.
- Recruit drawer shows: full computation breakdown (how each value formed).
- Custom builder is step-based with precise validation messaging.

---

## 11) Testing & Acceptance Criteria
- Deterministic recruit generation
- Derived stats auto-update on attribute/gear changes
- No illegal builds without explicit override
- Telemetry event for creation emitted

---

## 12) Reference Index (Canonical External Sources)
The following Terrablood reference pages are canonical for future Stable Lords warrior design work:
- Intelligence WIT statements
- Terrablood Skill Chart
- Bagman II Skill Chart
- Ween Skill Chart
- Good / Bad / Endurance WIT statements
- Warrior activity ratings
- Coordination statements
- Warrior endurance chart
- Hit point chart
- Encumbrance chart
- Warrior quickness statements
- Warrior damage chart

---
END OF DOCUMENT
