# Stable Lords — Strategy Editor & OE / AL / DEC Curves (Definitive) v0.1
Generated: 2026-02-07

This document defines the **Strategy Editor system** in Stable Lords.
It specifies how **OE (Offensive Energy)**, **AL (Aggression Level)**, and **DEC (Decisiveness)**
are authored, visualized, validated, and consumed by the dueling bout engine.

---

## 1) Purpose of the Strategy Editor
The Strategy Editor defines how a warrior intends to fight over time.

---

## 2) Core Curves
OE controls attack frequency.
AL controls risk tolerance.
DEC controls execution.

---

## 3) Timeline Phases
Opening → Mid → Late

---

## 4) Strategy Data Model

```ts
type StrategyPhase = {
  oe: number;
  al: number;
  dec: number;
};
```

---

## 5) Style Presets (Examples)
Wall of Steel: 20 / 10 / 5 → 25 / 15 / 10 → 30 / 20 / 25
Parry-Strike: 35 / 25 / 10 → 45 / 35 / 20 → 40 / 30 / 30
Basher: 80 / 75 / 20 → 60 / 65 / 35 → 30 / 40 / 50

---

END OF DOCUMENT
