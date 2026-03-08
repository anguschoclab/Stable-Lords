# Stable Lords — AI Dueling Behavior Specification (Definitive) v0.1
Generated: 2026-02-07

This document defines how AI-controlled warriors behave during dueling bouts in Stable Lords.

It consumes:
- Warrior Design & Creation Spec v0.3
- Dueling Bout System & Style × Style Matchup Matrix
- Strategy Editor (OE / AL / DEC Curves)
- Equipment & Encumbrance Spec
- Duelmasters combat intent (pid 49–53)

---

## 1) AI Design Principles
AI favors intent over optimization, is lineage-faithful, readable, deterministic with variance, and allowed to collapse.

---

## 2) Ownership Context

### Owner Personality
Conservative, Bloodthirsty, Traditionalist, Experimental, Opportunist.

Affects risk tolerance, aggression bias, and kill commitment.

### Trainer Bias
Soft nudges to OE, AL, DEC based on specialization.

---

## 3) Pre-Bout Decisions
- Evaluate style matchup
- Evaluate gear matchup
- Select strategy preset
- Apply personality bias

---

## 4) In-Bout Evaluation Loop
Per exchange:
- Detect phase (Opening/Mid/Late)
- Read OE/AL/DEC
- Check endurance & injuries
- Observe opponent fatigue
- Select intent

---

## 5) AI Intent States
Press, Probe, Hold, Recover, Finish, Survive.

---

## 6) Kill Window Behavior
DEC-gated commitment, influenced by style and owner personality.

---

## 7) Fatigue Response
Lower endurance increases errors, panic behavior below 10%.

---

## 8) Limited Adaptation
Bounded adjustments only; no re-optimization mid-bout.

---

## 9) Style Tendencies
Each style has preferred intent patterns (data-driven).

---

## 10) AI Mistakes
Mistakes increase with fatigue and low WIT/WIL.

---

## 11) Telemetry
Emit intent, OE/AL/DEC, and reason codes per exchange.

---

## 12) Player Feedback
Readable explanations without exposing math.

---

## 13) Acceptance Criteria
Distinct styles, reproducible behavior, visible collapse.

---

END OF DOCUMENT
