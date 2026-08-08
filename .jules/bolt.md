## 2024-05-18 - [Optimize Map Initialization from Arrays]
 **Learning:** Initializing Maps from arrays using `new Map(array.map(item => [key, value]))` creates unnecessary intermediate tuple arrays, leading to memory allocation overhead and increased garbage collection pressure. This is a common anti-pattern, especially within `useMemo` blocks where performance is critical.
 **Action:** Always use a `for...of` loop and `map.set()` to populate a Map directly from an array instead of using `.map()` to create an intermediate array of tuples.
