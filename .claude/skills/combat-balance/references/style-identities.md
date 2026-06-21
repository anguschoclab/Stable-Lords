# The Ten Styles — identity, win condition, penalty shape

Each style wins on a _different axis_. When re-ratcheting after a change, move the
**level** (deepen/lighten penalties) but keep the **shape** — the relative
ordering of `[ATT,PAR,DEF,INI,RIP,DEC]` that encodes the style. The penalty rows
below are the reference shape (confirm current values in `STYLE_PENALTIES`,
`src/engine/skillCalc.ts` — they get tuned).

Archetypes (drive attribute generation + trait synergy): **Cunning** (AB/PR/PS/PL,
WT·DF·WL) · **Agile** (LU/SL, SP·DF·WT) · **Brutal** (BA/ST, ST·CN·SZ) · **Tank**
(TP/WS, CN·WL·SZ).

| Style                | Win axis            | Win condition (implemented)                                                                                  | Penalty shape to preserve `[ATT,PAR,DEF,INI,RIP,DEC]`                                                                                            |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AB** Aimed Blow    | precision           | Inherent **called shot**: DF-scaled armor-mitigation bypass + hit-location shift toward severity.            | `[-13,-6,-10,-7,-5,+1]` — low ATT is the _cost_ of precision; the bypass is the payoff.                                                          |
| **BA** Bashing       | guard erosion       | **Guard-break**: each landed hit adds `parDegrade` to the defender (cap −3), eroding parry+dodge.            | `[-4,-6,-10,0,-2,+2]` — lightest penalties, INI 0. Already strong: re-ratchet ATT after buffs.                                                   |
| **LU** Lunging       | aggressive tempo    | **Decaying first-strike damage** off `momentum` (negated by WS).                                             | `[-10,-12,-13,-7,-7,-2]` — INI is the identity; aging hits it hard (the speed cliff).                                                            |
| **PL** Parry-Lunge   | reactive tempo      | **Momentum-riposte** pressure (WS-gated) — distinct from LU's raw-damage tempo.                              | `[-11,-7,-13,-7,-6,-1]` — balanced; riposte-leaning.                                                                                             |
| **PR** Parry-Riposte | counter the brawler | **Counter-on-parry** (frequency) + **punish-commitment** (damage ∝ attacker commit level) + **light chain**. | `[-14,-8,-15,-2,-2,-2]` — RIP is the **least-penalised** skill. Never deepen RIP past the others.                                                |
| **PS** Parry-Strike  | defend → strike     | **Parry primes a counterstrike**: ATT bonus on the next attack, then clears.                                 | `[-12,-6,-12,-9,-4,-1]` — defensive; low ATT/INI. The counterstrike is a to-hit help, not damage.                                                |
| **SL** Slashing      | attrition / DoT     | **Bleed** stacks (flurry = multiple stacks per hit), tick + decay each exchange.                             | `[-12,-14,-15,-4,-7,-2]` — INI kept as identity; everything else heavy.                                                                          |
| **ST** Striking      | all-in burst        | **Front-load** (decays by exchange) + **crit specialist** + **execute** (vs <30% HP).                        | `[-7,-6,-9,-2,-2,+2]` — ATT-led damage dealer. High variance; re-ratchet ATT after buffs. Note: its lethality removes knockdowns vs low-HP foes. |
| **TP** Total Parry   | outlast → punish    | **Fatigue-exploit counter**: as the opponent tires, TP's riposte chance + damage rise.                       | `[-12,+1,-9,-4,-2,0]` — PAR **buff** is the identity. Crippled ATT is intended; do not "fix" it with ATT.                                        |
| **WS** Wall of Steel | anti-tempo brick    | **Immovable**: negates LU/PL momentum payoffs aimed at it + a small attrition floor.                         | `[-4,-2,-9,0,-2,0]` — slowest style (low INI); denies tempo rather than gaining it. Weak: re-ratchet usually _lightens_.                         |

## Cross-cutting notes

- **The matchup matrix** (`MATCHUP_MATRIX`) encodes the rock-paper-scissors between
  these axes (e.g. ST is prey to TP/WS who outlast/deny it; BA cracks defensive
  walls; WS breaks LU/PL snowballs). Keep it antisymmetric; it is _not_ where a
  style's overall strength is set.
- **Favorites / traits / aging** are additional identity-preserving levers (see the
  decoupling work): favorite-weapon mastery routes a `+1` to a style-flavored axis;
  trait generation is archetype-gated so traits amplify identity rather than adding
  matrix-invisible noise; aging trades lost SP/DF for WL-scaled DEF so veterans
  drift to a patient profile instead of just declining.
- **Re-ratchet target:** every style's overall win rate in **[0.40, 0.60]** with the
  spread ≤ ~20pp. After any mechanic change, all ten must still land in band — not
  just the one you touched.
