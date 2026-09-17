## 2026-09-17 - Avoid converting declarative arrays into unmeasured imperative loops
**Learning:** Replacing `.reduce()` and `.filter()` operations with `for` loops in React components without a measured bottleneck is considered an unimpactful micro-optimization that degrades code readability.
**Action:** Always target real bottlenecks like large array iterations doing nested work, or `.map().filter()` chains during expensive recalculations. Keep code declarative unless a loop offers a significant, proven performance gain. Avoid junk files in the root.
