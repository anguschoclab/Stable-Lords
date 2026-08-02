import json
import difflib

def get_duplicates(entries, threshold=0.85):
    dups = []
    to_remove = set()

    seen = set()
    for i, e1 in enumerate(entries):
        if not isinstance(e1, str): continue
        if e1 in seen:
            to_remove.add(i)
        seen.add(e1)

    for i, e1 in enumerate(entries):
        if i in to_remove: continue
        for j, e2 in enumerate(entries[i+1:]):
            j = j + i + 1
            if j in to_remove: continue
            if isinstance(e1, str) and isinstance(e2, str):
                ratio = difflib.SequenceMatcher(None, e1.lower(), e2.lower()).ratio()
                if ratio > threshold:
                    dups.append((e1, e2, ratio))
                    to_remove.add(j)
    return dups, to_remove

with open('src/data/narrativeContent.json') as f:
    data = json.load(f)

for cat_name, cat in [('attacks', data['pbp']['attacks']), ('defenses', data['pbp']['defenses']), ('knockdown', data['pbp']['knockdown'])]:
    def check_dict(d, prefix):
        for k, v in d.items():
            if isinstance(v, list):
                dups, to_remove = get_duplicates(v)
                for d1, d2, r in dups:
                    print(f"{prefix}.{k}: {r:.2f}\n  1: {d1}\n  2: {d2}")
            elif isinstance(v, dict):
                check_dict(v, f"{prefix}.{k}")
    check_dict(cat, f"pbp.{cat_name}")
