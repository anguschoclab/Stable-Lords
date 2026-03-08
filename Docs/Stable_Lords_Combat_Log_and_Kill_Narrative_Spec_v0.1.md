# Stable Lords — Combat Log & Kill Narrative Specification (Definitive) v0.1
Generated: 2026-02-07

This document defines how dueling bouts are surfaced to the player through combat logs,
critical moments, kill explanations, Chronicle records, and Gazette narratives.

---

## 1) Design Goals
Clarity, drama, lineage fidelity, non-spoiler transparency, layered output.

---

## 2) Combat Log Layers

### Exchange Log (Debug)
One entry per exchange; never shown by default.

Fields:
- exchange index
- phase (OPENING/MID/LATE)
- attacker / defender
- initiative winner
- attack result
- riposte result
- damage + hit location
- endurance deltas
- kill window + execution flags

---

### Highlight Log (Player-Facing)
Curated moments only:
- initiative swings
- big hits
- armor/shield events
- fatigue collapse
- kill windows
- executions

---

### Bout Summary
Generated at bout end:
- outcome
- length
- key advantages
- turning point description

---

### Chronicle Record
Permanent, immutable history entry.

---

## 3) Kill Narrative System
Kills require a kill window, execution attempt, and fatal damage.
Causes are attributed to style, gear, fatigue, skill, or mistakes.

---

## 4) Kill Text Assembly
Data-driven text fragments assembled from style, damage type, fatigue, and crowd mood.

---

## 5) Equipment-Aware Narration
References shields, armor absorption, heavy weapons, and breakage.

---

## 6) Strategy & AI Callouts
Narration reflects OE / AL / DEC intent without exposing math.

---

## 7) Style-Specific Flavor
Each style defines verbs, phrasing, and signature moments.

---

## 8) Gazette Synthesis
Weekly narrative aggregation from Chronicle entries.

---

## 9) UI Rules
Live highlights, post-bout summaries, accessibility-first.

---

## 10) Acceptance Criteria
Players understand outcomes; logs are deterministic; deaths feel final.

---

END OF DOCUMENT
