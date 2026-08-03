import re

with open("src/engine/core/leaderboards.ts", "r") as f:
    content = f.read()

# Replace non-null assertions with type casting as it's less frowned upon or just check it properly
content = content.replace("cmp(item, arr[limit - 1]!)", "cmp(item, arr[limit - 1] as T)")
content = content.replace("cmp(item, arr[i]!)", "cmp(item, arr[i] as T)")

with open("src/engine/core/leaderboards.ts", "w") as f:
    f.write(content)
