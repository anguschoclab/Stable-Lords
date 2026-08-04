import re

with open('src/engine/traits.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# I mistakenly added `enduranceMultLowHp: 0.85`. Let's change it to `enduranceMult: 0.85`
content = content.replace("enduranceMultLowHp: 0.85", "enduranceMult: 0.85")

with open('src/engine/traits.ts', 'w', encoding='utf-8') as f:
    f.write(content)
