import json
import difflib
import re

def parse_ts_array(filepath, array_name):
    with open(filepath, 'r') as f:
        content = f.read()

    match = re.search(f'const {array_name} = \\[(.*?)\\];', content, re.DOTALL)
    if not match:
        return []

    items = match.group(1).split(',')
    clean_items = []
    for item in items:
        item = item.strip()
        if item.startswith("'") and item.endswith("'"):
            clean_items.append(item[1:-1])
        elif item.startswith('"') and item.endswith('"'):
            clean_items.append(item[1:-1])

    return clean_items

origins = parse_ts_array('src/engine/narrative/loreGenerator.ts', 'ORIGINS')
childhood_traits = parse_ts_array('src/engine/narrative/loreGenerator.ts', 'CHILDHOOD_TRAITS')
defining_moments = parse_ts_array('src/engine/narrative/loreGenerator.ts', 'DEFINING_MOMENTS')

def find_duplicates(items, threshold=0.8):
    duplicates = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            sim = difflib.SequenceMatcher(None, items[i], items[j]).ratio()
            if sim > threshold:
                duplicates.append((items[i], items[j], sim))
    return duplicates

print("CHILDHOOD_TRAITS DUPLICATES:")
for dup in find_duplicates(childhood_traits):
    print(dup)
