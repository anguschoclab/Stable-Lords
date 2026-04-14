## 2026-04-13 - O(N log N) Sort Pattern for Minimum Value
**Learning:** Found a recurring anti-pattern across the codebase where `Array.prototype.sort()[0]` was used to find a single minimum/maximum value. This mutates the underlying array (which can cause subtle bugs if the array is reused) and runs in O(N log N) time, which is inefficient for simply finding an extremum.
**Action:** Replaced `.sort(...)[0]` with a single-pass `Array.prototype.reduce(...)` linear scan for O(N) performance and to avoid unintended mutation side-effects.
