## 2025-05-19 - Replace multiple filter-length chains with a single loop in computeStableCouncilReport
**Learning:** Found multiple `.filter().length` array chains processing the same `cards` array which resulted in multiple O(N) loops. This occurs frequently in stats derivation functions.
**Action:** Always look for O(N*M) or redundant passes on arrays, especially in core game loop evaluation logic, and replace them with single O(N) passes.
