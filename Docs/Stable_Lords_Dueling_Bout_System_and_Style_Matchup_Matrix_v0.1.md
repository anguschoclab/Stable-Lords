# Stable Lords — Dueling Bout System & Style × Style Matchup Matrix v0.1
Generated: 2026-01-10

This document defines the **dueling bout system** in *Stable Lords*, building directly on:
- **Warrior Design & Creation Spec v0.3 (Definitive)**
- Canonical Duelmasters sources (pid 2, 8–16, 19, 39–53)
- Terrablood Duel II combat lineage

It specifies:
1. The structure of a single duel (bout lifecycle)
2. Exchange-by-exchange resolution model
3. Endurance, fatigue, and collapse behavior
4. Kill windows and finishing logic
5. The **canonical Style × Style Matchup Matrix**, used by AI, UI explainers, and optimizers

Nothing here supersedes the warrior spec; this document **consumes it**.

---

## 1) What a Dueling Bout Is

A **dueling bout** is a sequence of combat exchanges between two warriors, ending in:
- Death (kill)
- Stoppage (incapacitation)
- Yield (rare, honor-driven)
- Time expiration (draw / decision)

A bout is not continuous damage-over-time.
It is a **series of discrete exchanges**, each governed by initiative, reaction, commitment, and fatigue.

---

## 2) Bout Lifecycle (High Level)

1. **Pre-Bout State**
   - Validate both warriors (status, injuries, gear, encumbrance)
   - Snapshot stats (attributes, base skills, derived stats)
   - Apply temporary modifiers (crowd mood, tournament pressure)

2. **Opening Phase**
   - High influence of INI, SPD, style opener bias
   - Aggressive styles attempt early control

3. **Mid-Bout Phase**
   - Endurance becomes dominant
   - Encumbrance penalties accumulate
   - Styles interact most strongly here

4. **Late-Bout Phase**
   - Fatigue thresholds crossed
   - Kill windows widen
   - DEC (decisiveness) becomes critical

5. **Resolution**
   - Kill / stoppage / yield / decision
   - Chronicle + Gazette events emitted

---

## 3) Exchange-Level Resolution (Canonical Order)

Each exchange resolves in the following **locked order** (pid 49–53):

1. **Initiative Contest (INI)**
2. **Attack Attempt (ATT)**
3. **Defense Resolution**
   - Parry (PAR) first
   - Defense (DEF) second
4. **Riposte Check (RIP)**
5. **Damage Application**
6. **Decisiveness Check (DEC)**
7. **Endurance & Fatigue Update**

No step may be skipped except by explicit failure.

---

## 4) Kill Windows & Finishing Logic

A **kill window** opens when:
- Target HP below threshold (HP chart based)
- AND endurance below fatigue breakpoint
- AND defender fails PAR/DEF
- AND attacker passes DEC check

Style modifiers strongly affect:
- How often kill windows appear
- How reliably they are exploited

---

## 5) Endurance, Fatigue, and Collapse

Endurance governs:
- How many high-cost actions can be taken
- How penalties stack late

Rules:
- Each attack/defense consumes endurance
- Encumbrance increases endurance cost
- At 0 endurance:
  - INI collapses
  - DEF/PAR penalties spike
  - Kill window chance increases sharply

---

## 6) Style × Style Matchup Matrix (Canonical)

This matrix represents **relative pressure**, not guaranteed outcomes.
Values are applied as **small modifiers** to:
- Initiative contests
- Defense failure chance
- Kill window probability

Scale:
- **+2** Strong advantage
- **+1** Mild advantage
- **0** Neutral
- **-1** Mild disadvantage
- **-2** Strong disadvantage

### Canonical Styles
AB = Aimed Blow  
BA = Basher  
LU = Lunger  
PL = Parry-Lunge  
PR = Parry-Riposte  
PS = Parry-Strike  
SL = Slasher  
ST = Striker  
TP = Total Parry  
WS = Wall of Steel  

### Matchup Matrix

| Att \ Def | AB | BA | LU | PL | PR | PS | SL | ST | TP | WS |
|-----------|----|----|----|----|----|----|----|----|----|----|
| **AB** | 0 | +1 | 0 | -1 | -2 | -2 | +1 | 0 | -2 | -2 |
| **BA** | -1 | 0 | +1 | 0 | -1 | -1 | +2 | +1 | -2 | -2 |
| **LU** | 0 | -1 | 0 | +1 | 0 | -1 | +1 | +1 | -1 | -2 |
| **PL** | +1 | 0 | -1 | 0 | +1 | 0 | 0 | -1 | -1 | -2 |
| **PR** | +2 | +1 | 0 | -1 | 0 | +1 | -1 | -2 | -1 | -2 |
| **PS** | +2 | +1 | +1 | 0 | -1 | 0 | -1 | -2 | -1 | -2 |
| **SL** | -1 | -2 | -1 | 0 | +1 | +1 | 0 | +1 | -1 | -2 |
| **ST** | 0 | -1 | -1 | +1 | +2 | +2 | -1 | 0 | -1 | -2 |
| **TP** | +2 | +2 | +1 | +1 | +1 | +1 | +1 | +1 | 0 | -1 |
| **WS** | +2 | +2 | +2 | +2 | +2 | +2 | +2 | +2 | +1 | 0 |

---

## 7) How the Matrix Is Used

The matchup value is applied to:
- Initiative roll bias
- Defender PAR/DEF success chance
- Attacker DEC success chance (late bout)

It is **never** applied directly to damage.

---

## 8) AI Usage

AI uses the matrix to:
- Prefer favorable matchups
- Adjust aggression level mid-bout
- Decide whether to push or stall

---

## 9) UI & Player Transparency

The player should see:
- A matchup indicator (Advantage / Even / Disadvantage)
- Tooltip explanation: “Parry-Strike struggles vs Wall of Steel due to denied kill windows.”

Exact numbers remain hidden.

---

## 10) Acceptance Criteria

- Matrix is symmetric in intent but not numerically mirrored
- No style is dominant across all matchups
- Late-bout collapse feels inevitable, not random
- Kill windows feel earned

---

END OF DOCUMENT
