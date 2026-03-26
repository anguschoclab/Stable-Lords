# Daily Balance & Meta Report
Generated after simulating 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 128460
- **Average Gold (over time):** 55585.11
- *Observation:* Potential hyper-inflation detected. Consider adding more gold sinks.

## 2. Lethality & Injuries
- **Total Bouts:** 939
- **Total Deaths:** 79 (Kill Rate: 8.41%)
- **Total Injuries:** 142 (Injury Rate: 15.12%)
- *Observation:* Check against the `Stable_Lords_Kill_Death_and_Permadeath_Spec_v0.2.md`. Are these rates within expected bounds?

## 3. Meta-Drift (AI Adaptation & Style Dominance)
Current Meta Drift Window Analysis:
- **AIMED BLOW**: +1 drift
- **BASHING ATTACK**: +5 drift
- **LUNGING ATTACK**: +2 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: -10 drift
- **PARRY-STRIKE**: -1 drift
- **SLASHING ATTACK**: +3 drift
- **STRIKING ATTACK**: +6 drift
- **TOTAL PARRY**: -5 drift
- **WALL OF STEEL**: -3 drift

### Style Win Rates (Overall)
- **BASHING ATTACK**: 104 wins / 126 fights (82.54%)
- **STRIKING ATTACK**: 60 wins / 81 fights (74.07%)
- **SLASHING ATTACK**: 43 wins / 59 fights (72.88%)
- **LUNGING ATTACK**: 55 wins / 89 fights (61.80%)
- **PARRY-LUNGE**: 28 wins / 54 fights (51.85%)
- **AIMED BLOW**: 26 wins / 51 fights (50.98%)
- **PARRY-STRIKE**: 51 wins / 106 fights (48.11%)
- **WALL OF STEEL**: 67 wins / 172 fights (38.95%)
- **PARRY-RIPOSTE**: 19 wins / 65 fights (29.23%)
- **TOTAL PARRY**: 47 wins / 197 fights (23.86%)

## 4. Anomalies & Suggestions
- *Mathematical Anomalies:* Styles with >60% win rate: BASHING ATTACK, STRIKING ATTACK, SLASHING ATTACK, LUNGING ATTACK. Styles with <40% win rate: WALL OF STEEL, PARRY-RIPOSTE, TOTAL PARRY.
- *Suggested Tweaks:* Lethality (8.41%) is within the target 8-15% bound. Economy is inflating. Consider reducing `FIGHT_PURSE` or `WIN_BONUS` in `src/engine/economy.ts`, or adding more gold sinks.
