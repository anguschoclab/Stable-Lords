# Stable Lords — Warrior Design & Creation Specification v0.3 (Definitive, Lineage‑Integrated)
Generated: 2026-01-10

This document is the **definitive, lineage-faithful specification** for how a Warrior is designed in *Stable Lords*.

It fully integrates **all canonical Duelmasters and Terrablood sources**:
- Duelmasters: pid 2, 8–16, 19, 39–53
- Terrablood Duel II reference charts and statements

---

## 0) Design Philosophy Lock
Stable Lords warriors must behave like Duelmasters fighters, explain themselves clearly, remain deterministic, and preserve imperfection and collapse.

---

## 1) Canonical Attribute Model (pid=2)
Attributes: STR, WIT, WIL, SPD, DFT, CON, SIZ  
Range: 3–25, standard total ≈70

---

## 2) Attributes → Base Skills (Terrablood)
Base Skills: ATT, PAR, DEF, INI, RIP, DEC  
Computed via:
1. Style seed
2. Attribute breakpoints
3. Style offsets
4. Controlled randomness
5. Clamp

---

## 3) Fighting Styles (pid=28–38)
Aimed Blow, Basher, Lunger, Parry‑Lunge, Parry‑Riposte, Parry‑Strike, Slasher, Striker, Total Parry, Wall of Steel

---

## 4) Combat Resolution Order (pid=49–53)
INI → ATT → PAR → DEF → RIP → Damage → DEC → Endurance

---

## 5) Activity Ratings (pid=13–14)
Derived from INI vs RIP; used for AI and UI chips.

---

## 6) Derived Physical Stats
HP (pid=39), Endurance (pid=40), Damage (pid=41), Encumbrance (pid=42–45)

---

## 7) Statements Layer (Terrablood)
WIT, Quickness, Coordination statements mapped deterministically.

---

## 8) Equipment Rules (pid=39–48)
Weapon requirements, loadout legality, encumbrance tiers.

---

## 9) Creation Contexts
Recruit, Custom Build, Narrative Acquisition

---

## 10) Validation
Deterministic, guarded, recomputed on change.

---

## 11) Canonical Reference Index
Duelmasters pid: 2, 8–16, 19, 39–53  
Terrablood Duel II references

---

END OF DOCUMENT
