import sys
import re

with open('src/engine/core/leaderboards.ts', 'r') as f:
    content = f.read()

# Fix the typescript error in `insertBounded`
search_func = """function insertBounded<T>(
  arr: T[],
  limit: number,
  item: T,
  cmp: (a: T, b: T) => number
) {"""
replace_func = """function insertBounded<T>(
  arr: T[],
  limit: number,
  item: T,
  cmp: (a: T, b: T) => number
) {"""

# Let's fix the undefined issue: arr[limit - 1] might be undefined.
# Actually, the error says:
# src/engine/core/leaderboards.ts(18,41): error TS2345: Argument of type 'T | undefined' is not assignable to parameter of type 'T'.
# src/engine/core/leaderboards.ts(22,30): error TS2345: Argument of type 'T | undefined' is not assignable to parameter of type 'T'.

# Line 18: `if (arr.length === limit && cmp(item, arr[limit - 1]) >= 0) {`
# Because `arr[limit - 1]` can be undefined in strict TypeScript.
# We can fix it by explicitly casting `arr[limit - 1] as T` or using `!` since we know length === limit.
search_line_18 = """if (arr.length === limit && cmp(item, arr[limit - 1]) >= 0) {"""
replace_line_18 = """if (arr.length === limit && cmp(item, arr[limit - 1] as T) >= 0) {"""

# Line 22: `while (i >= 0 && cmp(item, arr[i]) < 0) {`
search_line_22 = """while (i >= 0 && cmp(item, arr[i]) < 0) {"""
replace_line_22 = """while (i >= 0 && cmp(item, arr[i] as T) < 0) {"""

content = content.replace(search_line_18, replace_line_18)
content = content.replace(search_line_22, replace_line_22)

with open('src/engine/core/leaderboards.ts', 'w') as f:
    f.write(content)
