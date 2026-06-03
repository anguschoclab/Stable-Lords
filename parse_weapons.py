import re

matrix = """
FI        W   W   U?  U?  U?  W   W   U?  U?  U
DA        W   U   M   U   U   W   W   M   W   U
SH        W   U   W   W   W   W   W   W   W   U
HA        M   U   U   U   W   W   W   W   W   U
EP        W   U   W   W   W   W   W   W   W   U
SC        W   U   M   W   W   W   W   W   W   W
SS        W   U   W   W   W   W   W   U   M   U
LO        W   U   W   W   W   W   W   W   W   U
BS        M   M   U   M   U   W   W   W   W   W
QS        W   W   U   U   U   W   W   U   W   W
LS        W   U   W   W   W   W   W   U   W   U
WH        U   W   U   U   U   W   W   U   W   U
MA        U   W   U   U   U   M   W   U   M   U
WF        U   W   U   U   U   M   W   U   U   W
MS        U   W   U   U   U   M   W   U   U   W
GA        U   W   U   U   U   U   W   W   U   W
BA        U   M   U   U   U   U   W   W   U   W
GS        U   W   U   U   U   W   W   M   W   W
ML        U   W   U   U   U   U   W   U   U   U
HL        U   W   M   U   U   U   W   U   U   U
"""

styles = ["AimedBlow", "BashingAttack", "LungingAttack", "ParryLunge", "ParryRiposte", "ParryStrike", "StrikingAttack", "SlashingAttack", "TotalParry", "WallOfSteel"]

weapon_map = {
    "DA": "dagger",
    "SH": "short_sword",
    "HA": "hatchet",
    "EP": "epee",
    "SC": "scimitar",
    "SS": "short_spear",
    "LO": "longsword",
    "BS": "broadsword",
    "QS": "quarterstaff",
    "MA": "mace",
    "WF": "war_flail",
    "MS": "morning_star",
    "GA": "great_axe",
    "BA": "battle_axe",
    "GS": "greatsword",
    "ML": "maul",
    "HL": "halberd"
}

data = {}
for line in matrix.strip().split('\n'):
    parts = line.split()
    w = parts[0]
    if w in weapon_map:
        vals = parts[1:]
        pref = []
        rest = []
        for i, val in enumerate(vals):
            if val == 'W':
                pref.append(styles[i])
            elif val.startswith('U'):
                rest.append(styles[i])
        data[weapon_map[w]] = {"pref": set(pref), "rest": set(rest)}

import json

with open('src/data/equipment/weapons.ts', 'r') as f:
    content = f.read()

import ast

def extract_styles(weapon_id, key):
    # Quick hack to extract arrays
    pattern = r"id:\s*'" + weapon_id + r"'.*?" + key + r":\s*\[(.*?)\]"
    m = re.search(pattern, content, re.DOTALL)
    if m:
        items = re.findall(r"FightingStyle\.(\w+)", m.group(1))
        return set(items)
    return set()

for wid in weapon_map.values():
    pref = extract_styles(wid, "preferredStyles")
    rest = extract_styles(wid, "restrictedStyles")
    
    expected_pref = data[wid]["pref"]
    expected_rest = data[wid]["rest"]
    
    if pref != expected_pref:
        print(f"ERROR {wid} preferredStyles:\nExpected: {expected_pref}\nGot: {pref}")
    if rest != expected_rest:
        print(f"ERROR {wid} restrictedStyles:\nExpected: {expected_rest}\nGot: {rest}")

print("Validation complete.")
