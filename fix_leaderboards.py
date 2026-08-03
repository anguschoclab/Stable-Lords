import re

with open('src/engine/core/leaderboards.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace arr[limit - 1] with arr[limit - 1]!
content = content.replace("arr[limit - 1]", "arr[limit - 1]!")
# Replace arr[i] with arr[i]!
content = content.replace("arr[i]", "arr[i]!")

with open('src/engine/core/leaderboards.ts', 'w', encoding='utf-8') as f:
    f.write(content)
