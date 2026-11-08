// ─── Wall of Steel (WS) — per-style balance knobs ───────────────────────────
/** Flat attrition damage on a Wall of Steel landed hit so the immovable brick still closes fights. */
export const WS_ATTRITION_FLOOR = 0.5;
/** Wall of Steel standing guard: parry bonus from the first exchange (the wall is up before it thickens). Balance knob. */
export const WS_WALL_PAR = 2;
/** Wall of Steel harmony: parry bonus while the phase-resolved OE equals kill
 *  desire — the She-Puppy rumor (Arena 93): "a wall of steel gets a bonus if
 *  his OE equals his KD." The wall hums behind a steadier guard when effort
 *  matches intent. Balance knob. */
export const WS_HARMONY_PAR = 2;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Wall of Steel passive: the wall thickens — cap base (+mastery bonus) and the exchange divisor. */
export const WS_PASSIVE_WALL_CAP_BASE = 1;
export const WS_PASSIVE_WALL_EXCHANGE_DIV = 10;
/** Wall of Steel passive: extra parry once the wall has thickened. */
export const WS_PASSIVE_WALL_PAR_ADD = 1;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Wall of Steel kill mechanic: negative kill bonus — the wall is not a killer. */
export const WS_KILL_BONUS = -0.03;
/** Wall of Steel kill mechanic: kill-window HP multiplier. */
export const WS_KILL_WINDOW_HP_MULT = 0.4;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Wall of Steel tempo: phase bonuses — the wall is a late-fight closer. */
export const WS_TEMPO_OPENING = 0;
export const WS_TEMPO_MID = 0;
export const WS_TEMPO_LATE = 1;
/** Canon burn: "similar to lungers, they have a high endurance burn"
 *  (Assur's Bash Bros) — the wall keeps the blade moving all fight. */
export const WS_ENDURANCE_MULT = 1.02;
