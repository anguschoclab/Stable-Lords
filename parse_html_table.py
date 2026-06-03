import re

html = open("content.html", "r").read() if False else ""

import urllib.request
url = "https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-styles-and-tactics/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
except Exception as e:
    print("Error:", e)
    exit(1)

# extremely naive table parsing
import xml.etree.ElementTree as ET

# find all <table>...</table>
tables = re.findall(r'<table[^>]*>.*?</table>', html, re.DOTALL | re.IGNORECASE)
for i, table_html in enumerate(tables):
    # remove attributes from tags to make it cleaner
    clean_html = re.sub(r'<([a-zA-Z0-9]+)[^>]*>', r'<\1>', table_html)
    # find all tr
    trs = re.findall(r'<tr>(.*?)</tr>', clean_html, re.DOTALL | re.IGNORECASE)
    print(f"--- TABLE {i+1} ---")
    for tr in trs:
        # find all td or th
        tds = re.findall(r'<t[dh]>(.*?)</t[dh]>', tr, re.DOTALL | re.IGNORECASE)
        # strip tags inside tds
        row = [re.sub(r'<[^>]+>', '', td).strip() for td in tds]
        print("\t".join(row))

