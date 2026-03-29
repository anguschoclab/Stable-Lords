# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 135678
- **Average Gold:** 60195.31
- *Observation:* Hyper-inflation detected (wealth increased by 271.4x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 500
- **Total Deaths:** 0 (Kill Rate: 0.00%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is below the 8% target bound.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: 0 drift
- **BASHING ATTACK**: +10 drift
- **LUNGING ATTACK**: +9 drift
- **PARRY-LUNGE**: 0 drift
- **PARRY-RIPOSTE**: +2 drift
- **PARRY-STRIKE**: +6 drift
- **SLASHING ATTACK**: 0 drift
- **STRIKING ATTACK**: 0 drift
- **TOTAL PARRY**: -9 drift
- **WALL OF STEEL**: -6 drift

### Style Win Rates (Overall)
- **BASHING ATTACK**: 127 wins / 127 fights (100.00%)
- **STRIKING ATTACK**: 23 wins / 26 fights (88.46%)
- **PARRY-STRIKE**: 92 wins / 120 fights (76.67%)
- **PARRY-RIPOSTE**: 162 wins / 287 fights (56.45%)
- **LUNGING ATTACK**: 72 wins / 143 fights (50.35%)
- **WALL OF STEEL**: 18 wins / 99 fights (18.18%)
- **TOTAL PARRY**: 6 wins / 198 fights (3.03%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider reviewing engine constants related to fight purses, win bonuses, or adding scaling gold sinks like trainer tier salaries.
- **Lethality Issue:** Kill rate (0.00%) is lower than the 8-15% target. Consider lowering the required thresholds in the combat resolution engine.
- **Meta-Drift Issue:** Styles like BASHING ATTACK, STRIKING ATTACK, PARRY-STRIKE are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like WALL OF STEEL, TOTAL PARRY are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
