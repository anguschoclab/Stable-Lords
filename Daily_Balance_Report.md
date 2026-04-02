# Daily Balance & Meta Report
Generated dynamically after autosimming 100 weeks.

## 1. Economy Metrics
- **Initial Gold:** 500
- **Final Gold:** 114934
- **Average Gold:** 49161.49
- *Observation:* Hyper-inflation detected (wealth increased by 229.9x).

## 2. Lethality & Injuries
- **Total Bouts Simulated:** 1657
- **Total Deaths:** 170 (Kill Rate: 10.26%)
- **Total Injuries:** 0 (Injury Rate: 0.00%)
- *Observation:* Kill rate is safely within the target 8-15% bounds.

## 3. Meta-Drift (AI Adaptation & Style Dominance)
- **AIMED BLOW**: +4 drift
- **BASHING ATTACK**: +6 drift
- **LUNGING ATTACK**: 0 drift
- **PARRY-LUNGE**: +3 drift
- **PARRY-RIPOSTE**: -1 drift
- **PARRY-STRIKE**: +4 drift
- **SLASHING ATTACK**: +6 drift
- **STRIKING ATTACK**: +6 drift
- **TOTAL PARRY**: -8 drift
- **WALL OF STEEL**: 0 drift

### Style Win Rates (Overall)
- **AIMED BLOW**: 2 wins / 2 fights (100.00%)
- **SLASHING ATTACK**: 1 wins / 1 fights (100.00%)
- **PARRY-LUNGE**: 1 wins / 1 fights (100.00%)
- **LUNGING ATTACK**: 2 wins / 2 fights (100.00%)
- **BASHING ATTACK**: 5 wins / 7 fights (71.43%)
- **WALL OF STEEL**: 5 wins / 8 fights (62.50%)
- **STRIKING ATTACK**: 10 wins / 16 fights (62.50%)
- **PARRY-STRIKE**: 8 wins / 15 fights (53.33%)
- **TOTAL PARRY**: 4 wins / 17 fights (23.53%)
- **PARRY-RIPOSTE**: 2 wins / 11 fights (18.18%)

## 4. Anomalies & Actionable Suggestions
- **Economy Issue:** High inflation. Consider lowering `WIN_BONUS` or `FIGHT_PURSE` in `src/engine/economy.ts`, or adding scaling gold sinks like trainer tier salaries.
- **Meta-Drift Issue:** Styles like AIMED BLOW, SLASHING ATTACK, PARRY-LUNGE, LUNGING ATTACK, BASHING ATTACK, WALL OF STEEL, STRIKING ATTACK are overperforming (>60% win rate). Review their attack modifiers or stamina drain formulas.
- **Meta-Drift Issue:** Styles like TOTAL PARRY, PARRY-RIPOSTE are heavily underperforming (<40% win rate). Review their base defensive bonuses, riposte chances, or fatigue costs.
