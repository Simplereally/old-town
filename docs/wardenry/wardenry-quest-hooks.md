---
doc_type: authority
canonical_path: docs/wardenry/wardenry-quest-hooks.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: [Wardenry System](wardenry-system.md), [Wardens and Boards](wardens-and-boards.md), [Notorious Variants](notorious-variants.md), [Named Warrants and Boss Tasks](named-warrants-and-boss-tasks.md), [Warden Locker Rewards](warden-locker-rewards.md), [Quest System](../quests/quest-system.md), [Starter Quest Arc](../quests/starter-quest-arc.md), [Area Quest Hooks](../areas/area-quest-hooks.md)

# Wardenry Quest Hooks

Quest hooks that introduce and deepen Wardenry.

## Hook Format

| Field | Description |
| quest_name | Player-facing quest name |
| giver | NPC who gives the quest |
| contract_type | Type of Wardenry contract involved |
| premise | One sentence explaining the quest |
| systems | Skills or systems touched |
| reward | What the player receives |
| hook_line | Memorable NPC line |

## Starter Warden Holt Hooks

**Hook 1: The Contract That Signed Back**
- giver: Warden Holt
- contract_type: Notorious Variant
- premise: a rat contract returns with teeth marks
- systems: Wardenry, Sootcellar, combat
- reward: unlock Ledger-Gnaw Rat chance
- hook_line: "I don't mind rats biting paper. I mind them writing."

**Hook 2: The Holt That Couldn't Count**
- giver: Warden Holt
- contract_type: Cull
- premise: Warden Holt has lost count of his rat contracts
- systems: Wardenry, Sootcellar, Sleight
- reward: warden_whistle, small coins
- hook_line: "I used to count rats on my fingers. Now I need yours."

**Hook 3: The Board That Walked**
- giver: Warden Holt
- contract_type: Proof
- premise: the Warden Steps board has been moved by goblins
- systems: Wardenry, North Quarry Road, combat
- reward: proof_pouch, mudhook_charm
- hook_line: "My board walked off last night. Find it, and you find the goblin that carried it."

**Hook 4: The Chain That Wouldn't Break**
- giver: Warden Holt
- contract_type: Contract Chain
- premise: a player has a broken chain and Warden Holt teaches them how to rebuild it
- systems: Wardenry, combat, mentoring
- reward: chain bonus tutorial, small marks
- hook_line: "A chain that won't break is a chain that hasn't been tested. Break it, then build it better."

## First-Ring Warden Hooks

**Hook 5: The Road That Called the Crows**
- giver: Orven Roadcap
- contract_type: Patrol
- premise: crows are crow-calling along the road
- systems: Wardenry, Wayfaring, Cartography
- reward: crow_token, road_ribbon
- hook_line: "A road that calls crows is a road that's got a voice. Find the voice, and the road quiets."

**Hook 6: The Grave That Wouldn't Fill**
- giver: Cress Lowgrave
- contract_type: Grave Rite
- premise: a grave keeps refilling with mites
- systems: Wardenry, Favour, Gardening
- reward: grave_tongs, grave_dust_bundle
- hook_line: "A grave that won't fill is a grave that's either too hungry or too empty. Find out which."

**Hook 7: The Quarry That Ate the Bell**
- giver: Sella Coalhand
- contract_type: Named Warrant
- premise: the Cut Bell has eaten a quarry cart
- systems: Wardenry, Mining, Smithing
- reward: bell_metal, quarry_token
- hook_line: "A quarry that eats a bell is a quarry that's either very hungry or very angry. Feed it something else."

**Hook 8: The Ferry That Fished the Eel**
- giver: Pell Hookline
- contract_type: Named Warrant
- premise: the ferry has caught an eel in its ropes
- systems: Wardenry, Fishing, Cooking
- reward: ferry_eel_tooth, eel_meat
- hook_line: "A ferry that fishes an eel is a ferry that's either very lucky or very unlucky. Cut the line."

**Hook 9: The Door That Locked the Room**
- giver: Vey Falsewick
- contract_type: Named Warrant
- premise: a door has locked a room from the inside
- systems: Wardenry, Sleight, Cartography
- reward: door_hinge, lock_fragment
- hook_line: "A door that locks a room is a door that's either very safe or very dangerous. Open it, and find out."

## Notorious Variant Hooks

**Hook 10: The Rat That Ate the Ledger**
- giver: Warden Holt
- contract_type: Notorious Variant
- premise: a Ledger-Gnaw Rat has eaten a town ledger
- systems: Wardenry, Sootcellar, combat
- reward: ledger_tooth, ratcatcher_tail
- hook_line: "A rat that eats a ledger is a rat that knows what it's doing. Stop it before it learns accounting."

**Hook 11: The Bat That Rang the Bell**
- giver: Orven Roadcap
- contract_type: Notorious Variant
- premise: a Clapper Bat has rung the Crowmile bell
- systems: Wardenry, Bellwood Copse, combat
- reward: echo_dust, bellfeather_bundle
- hook_line: "A bat that rings a bell is a bat that's either very musical or very lost. Find out which."

**Hook 12: The Crow That Wore White**
- giver: Cress Lowgrave
- contract_type: Notorious Variant
- premise: a White-Eyed Crow has been seen at Gravegate
- systems: Wardenry, Lowgrave, combat
- reward: white_eyed_crow_trophy, crow_token
- hook_line: "A crow that wears white is a crow that's either very clean or very dead. Find out which."

## Named Warrant Hooks

**Hook 13: The King That Ate the Counting House**
- giver: Warden Holt
- contract_type: Named Warrant
- premise: the Cellar King has chewed through a floorboard
- systems: Wardenry, Sootcellar, combat
- reward: cellar_king_whisker, bent_nail_ring
- hook_line: "A king that eats a counting house is a king that's either very hungry or very thorough. Find out which."

**Hook 14: The Grib That Blocked the Road**
- giver: Sella Coalhand
- contract_type: Named Warrant
- premise: Mudhook Grib has blocked the North Quarry Road
- systems: Wardenry, North Quarry Road, combat
- reward: mudhook_jaw, quarry_token
- hook_line: "A Grib that blocks a road is a Grib that's either very brave or very stupid. Move it, either way."

**Hook 15: The Eel That Ate the Dock**
- giver: Pell Hookline
- contract_type: Named Warrant
- premise: the Ferry Eel has wrapped around the dock
- systems: Wardenry, Wardenbrook, combat
- reward: eel_spine, ferry_eel_tooth
- hook_line: "An eel that eats a dock is an eel that's either very strong or very confused. Cut it loose."

## Warden Locker Reward Hooks

**Hook 16: The Whistle That Wouldn't Blow**
- giver: Warden Holt
- contract_type: Utility
- premise: a Warden Whistle is broken and the player must fix it
- systems: Wardenry, Smithing, Sleight
- reward: warden_whistle, small marks
- hook_line: "A whistle that won't blow is a whistle that's either very broken or very quiet. Fix it, and it will sing."

**Hook 17: The Pouch That Ate the Proof**
- giver: Warden Holt
- contract_type: Storage
- premise: a Proof Pouch has eaten the player's proof drops
- systems: Wardenry, Sootcellar, combat
- reward: proof_pouch, contract_book_upgrade
- hook_line: "A pouch that eats proof is a pouch that's either very hungry or very magical. Feed it, or it will starve."

**Hook 18: The Mask That Saw the Soot**
- giver: Vey Falsewick
- contract_type: Protective gear
- premise: a Soot Mask has been found in the Sootstairs
- systems: Wardenry, Sootstairs, combat
- reward: soot_mask, ash_scarf
- hook_line: "A mask that sees soot is a mask that's either very useful or very cursed. Wear it, and find out."

## Hook Summary Table

| quest_name | giver | contract_type | systems | reward |
| The Contract That Signed Back | Warden Holt | Notorious Variant | Wardenry, Sootcellar, combat | unlock Ledger-Gnaw Rat chance |
| The Holt That Couldn't Count | Warden Holt | Cull | Wardenry, Sootcellar, Sleight | warden_whistle, small coins |
| The Board That Walked | Warden Holt | Proof | Wardenry, North Quarry Road, combat | proof_pouch, mudhook_charm |
| The Chain That Wouldn't Break | Warden Holt | Contract Chain | Wardenry, combat, mentoring | chain bonus tutorial, small marks |
| The Road That Called the Crows | Orven Roadcap | Patrol | Wardenry, Wayfaring, Cartography | crow_token, road_ribbon |
| The Grave That Wouldn't Fill | Cress Lowgrave | Grave Rite | Wardenry, Favour, Gardening | grave_tongs, grave_dust_bundle |
| The Quarry That Ate the Bell | Sella Coalhand | Named Warrant | Wardenry, Mining, Smithing | bell_metal, quarry_token |
| The Ferry That Fished the Eel | Pell Hookline | Named Warrant | Wardenry, Fishing, Cooking | ferry_eel_tooth, eel_meat |
| The Door That Locked the Room | Vey Falsewick | Named Warrant | Wardenry, Sleight, Cartography | door_hinge, lock_fragment |
| The Rat That Ate the Ledger | Warden Holt | Notorious Variant | Wardenry, Sootcellar, combat | ledger_tooth, ratcatcher_tail |
| The Bat That Rang the Bell | Orven Roadcap | Notorious Variant | Wardenry, Bellwood Copse, combat | echo_dust, bellfeather_bundle |
| The Crow That Wore White | Cress Lowgrave | Notorious Variant | Wardenry, Lowgrave, combat | white_eyed_crow_trophy, crow_token |
| The King That Ate the Counting House | Warden Holt | Named Warrant | Wardenry, Sootcellar, combat | cellar_king_whisker, bent_nail_ring |
| The Grib That Blocked the Road | Sella Coalhand | Named Warrant | Wardenry, North Quarry Road, combat | mudhook_jaw, quarry_token |
| The Eel That Ate the Dock | Pell Hookline | Named Warrant | Wardenry, Wardenbrook, combat | eel_spine, ferry_eel_tooth |
| The Whistle That Wouldn't Blow | Warden Holt | Utility | Wardenry, Smithing, Sleight | warden_whistle, small marks |
| The Pouch That Ate the Proof | Warden Holt | Storage | Wardenry, Sootcellar, combat | proof_pouch, contract_book_upgrade |
| The Mask That Saw the Soot | Vey Falsewick | Protective gear | Wardenry, Sootstairs, combat | soot_mask, ash_scarf |

## Related Systems

- [Wardenry System](wardenry-system.md)
- [Wardens and Boards](wardens-and-boards.md)
- [Notorious Variants](notorious-variants.md)
- [Named Warrants and Boss Tasks](named-warrants-and-boss-tasks.md)
- [Warden Locker Rewards](warden-locker-rewards.md)
- [Quest System](../quests/quest-system.md)
- [Starter Quest Arc](../quests/starter-quest-arc.md)
- [Area Quest Hooks](../areas/area-quest-hooks.md)
