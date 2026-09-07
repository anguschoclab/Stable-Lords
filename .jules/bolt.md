## 2023-10-27 - [Cached Custom Scorer Functions]
**Learning:** Calling a custom score function within `Array.prototype.reduce()` on the previously identified "best" object results in O(N²) function calls. This pattern is easily resolved with a single-pass `for` loop that caches the `bestScore`.
**Action:** When finding a max value using a scorer function, use a single-pass `for` loop and cache `bestScore` to avoid redundant O(N²) calculations.
