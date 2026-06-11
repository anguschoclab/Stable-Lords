#!/bin/bash
# Re-evaluate the review: The reviewer complained about "TraitId union type". I will grep for anything matching "type .*Trait.*="
grep -rn "type .*Trait.*=" src || echo "no match"
