import json

def expand_list(d, path, new_items):
    curr = d
    for p in path[:-1]:
        if p not in curr:
            curr[p] = {}
        curr = curr[p]
    last = path[-1]
    if last not in curr:
        curr[last] = []
    if isinstance(curr[last], list):
        curr[last].extend(new_items)
    elif isinstance(curr[last], str):
        curr[last] = [curr[last]] + new_items

with open('src/data/narrativeContent.json', 'r') as f:
    data = json.load(f)

# PBP Openers
expand_list(data, ['pbp', 'openers'], [
    "The iron grates rise, and the air grows thick with the scent of impending violence.",
    "A heavy silence descends upon the arena as the combatants pace like caged beasts.",
    "The sun beats mercilessly on the hot sands, demanding a sacrifice of blood.",
    "With a thunderous drumbeat, the champions are called to the center of the pit.",
    "The jeers of the crowd blur into a fevered roar as steel is finally drawn.",
    "Banners snap in the wind, but all eyes are fixed on the warriors below.",
    "The arena master's nod is the only signal needed; the dance of death begins."
])

# PBP Whiffs
expand_list(data, ['pbp', 'whiffs'], [
    "{{attacker}} puts too much power into the swing, and the {{weapon}} meets only empty air.",
    "With a mocking grin, {{defender}} glides out of reach of {{attacker}}'s {{weapon}}.",
    "{{attacker}}'s aggressive lunge is easily read, and {{defender}} sidesteps without breaking a sweat.",
    "The crowd groans as {{attacker}}'s {{weapon}} swishes through the space {{defender}} just vacated.",
    "A cloud of sand is all {{attacker}} manages to hit with that clumsy {{weapon}} strike.",
    "{{defender}} bends backward like a reed in the wind, letting the {{weapon}} whistle past their nose."
])

# Defenses - Parry
expand_list(data, ['pbp', 'defenses', 'parry', 'success'], [
    "{{defender}} intercepts the {{weapon}} mid-swing with a jarring clash!",
    "{{attacker}}'s heavy blow is halted instantly by {{defender}}'s ironclad block.",
    "With a flick of the wrist, {{defender}} redirects the lethal force of the {{weapon}} away.",
    "The sound of grinding steel rings out as {{defender}} firmly answers {{attacker}}'s strike.",
    "{{defender}} stands firm, their guard an impenetrable fortress against the {{weapon}}."
])

# Defenses - Dodge
expand_list(data, ['pbp', 'defenses', 'dodge', 'success'], [
    "{{defender}} slips beneath the blow like a shadow.",
    "With cat-like agility, {{defender}} evades the attack completely.",
    "{{defender}} performs a breathtaking backstep, evading death by inches.",
    "The strike looks true, but {{defender}} is no longer there!"
])

# Reactions - Positive
expand_list(data, ['pbp', 'reactions', 'positive'], [
    "The onlookers stomp their feet in a rhythmic thunder!",
    "Cheers cascade from the stands, shaking the very foundations of the coliseum!",
    "The crowd howls for more, completely intoxicated by the violence."
])

# Reactions - Negative
expand_list(data, ['pbp', 'reactions', 'negative'], [
    "A wave of disgust ripples through the spectators.",
    "The crowd hisses, demanding a refund for this cowardly display.",
    "Shouts of 'FIGHT!' and 'COWARD!' echo from the angry masses."
])

# Taunts - Winner
expand_list(data, ['pbp', 'taunts', 'winner'], [
    "{{attacker}} beats their chest, roaring in triumph!",
    "{{attacker}} gestures to the crowd, soaking in their adulation.",
    "With a cruel smirk, {{attacker}} points their {{weapon}} at the dying {{defender}}."
])

# Taunts - Loser
expand_list(data, ['pbp', 'taunts', 'loser'], [
    "{{attacker}} manages a defiant, bloody smile.",
    "Even on their knees, {{attacker}} glares upwards with unbroken pride.",
    "{{attacker}} spits a glob of crimson onto the sand, refusing to beg."
])

# Strikes - Bashing - Fatal
expand_list(data, ['strikes', 'bashing', 'fatal'], [
    "With a sickening crunch, {{attacker}}'s {{weapon}} caves in {{defender}}'s {{bodyPart}}, ending the bout instantly.",
    "{{attacker}} brings the {{weapon}} down like a judge's gavel, obliterating {{defender}}'s {{bodyPart}}.",
    "The crowd gasps as {{attacker}} swings the {{weapon}} with titanic force, shattering {{defender}}'s {{bodyPart}} and their life.",
    "{{defender}} drops like a stone as {{attacker}}'s {{weapon}} crushes their {{bodyPart}} into ruin."
])

# Strikes - Piercing - Fatal
expand_list(data, ['strikes', 'piercing', 'fatal'], [
    "{{attacker}} lunges with terrifying speed, driving the {{weapon}} straight through {{defender}}'s {{bodyPart}}.",
    "The {{weapon}} bursts through {{defender}}'s back! {{attacker}} has skewered the {{bodyPart}} entirely.",
    "With surgical precision, {{attacker}} impales {{defender}}'s {{bodyPart}}, withdrawing the {{weapon}} as the lifeless body falls.",
    "{{attacker}} pins {{defender}} to the sand, the {{weapon}} driven deep through their {{bodyPart}}."
])

# Strikes - Slashing - Fatal
expand_list(data, ['strikes', 'slashing', 'fatal'], [
    "{{attacker}} spins like a dervish, the {{weapon}} carving an inescapable arc that separates {{defender}}'s {{bodyPart}} from their body.",
    "A spray of crimson mist erupts as {{attacker}}'s {{weapon}} flawlessly bisects {{defender}}'s {{bodyPart}}.",
    "{{defender}} stares in shock as their {{bodyPart}} is brutally sundered by {{attacker}}'s merciless {{weapon}}."
])

# Conclusions - Kill
expand_list(data, ['conclusions', 'Kill'], [
    "{{defender}} crumples to the blood-soaked sand, another sacrifice to the arena. {{attacker}} is the champion!",
    "The gods of war smile upon {{attacker}}, who stands over the broken corpse of {{defender}}.",
    "{{attacker}} kicks the lifeless body of {{defender}} aside. The bout is over, and death has claimed the loser."
])

# Conclusions - KO
expand_list(data, ['conclusions', 'KO'], [
    "{{defender}}'s eyes roll back, and they collapse. {{attacker}} claims a decisive knockout victory!",
    "The lights go out for {{defender}}. {{attacker}} stands tall amidst the cheering crowd."
])

# Gazette Headlines - Kill
expand_list(data, ['gazette', 'headlines', 'Kill'], [
    "Week {{week}}: A SOUL REAPED! {{killer}} Paints the Sands Red!",
    "Week {{week}}: WIDOWMAKER! {{killer}} Claims Another Victim!",
    "Week {{week}}: NO MERCY GIVEN! {{killer}} Ends a Life in the Pit!"
])

# Gazette Headlines - Standard
expand_list(data, ['gazette', 'headlines', 'Standard'], [
    "Week {{week}}: {{adj}} SHOWDOWN! The Arena Demands Entertainment!",
    "Week {{week}}: STEEL AND SWEAT! {{adj}} Bouts Keep the Masses Sated!",
    "Week {{week}}: THE GAMES CONTINUE! {{adj}} Spectacles in the Coliseum!"
])

with open('src/data/narrativeContent.json', 'w') as f:
    json.dump(data, f, indent=2)
