import urllib.request
import re

url = "https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-styles-and-tactics/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Use re to strip tags
    text = re.sub(r'<[^>]+>', '\t', html)
    # compress multiple tabs/newlines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # print the lines that look like table data
    in_table = False
    for line in lines:
        if 'Aimed-Blow' in line or 'Basher' in line or 'WS' in line or 'S' in line or 'U' in line:
            print(line)
            
except Exception as e:
    print("Error:", e)
