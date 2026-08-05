import os

filepath = ".jules/bolt.md"
entry = """## 2025-02-23 - Optimize Array.find by caching variables
**Learning:** Found an O(N) array lookup `.find()` that was re-evaluated even though the variable was previously calculated.
**Action:** Always re-use variables rather than recalculating them."""

if not os.path.exists(".jules"):
    os.makedirs(".jules")

with open(filepath, "a") as f:
    f.write(entry + "\n")
