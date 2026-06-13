---
doc_type: authority
canonical_path: docs/activities/activity-quest-hooks.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/activity-categories.md`
- `docs/activities/starter-activities.md`
- `docs/activities/first-ring-activities.md`
- `docs/activities/skilling-bosses.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-currencies.md`
- `docs/trails/00-index.md`
- `docs/trails/trail-quest-hooks.md`
- `docs/quests/quest-system.md`
- `docs/quests/starter-quest-arc.md`
- `docs/guilds/guild-quest-hooks.md`

# Activity Quest Hooks

This document defines quest hooks that introduce players to activities and deepen their mastery within each. Activities and quests are separate systems that overlap. A quest can introduce an activity, and an activity can have quest hooks that unlock new loops or rewards.

## Hook Format

Every hook in this document follows the same structure:

| Field | Description |
|-------|-------------|
| **quest_name** | The player-facing name of the quest. |
| **giver** | The NPC who gives the quest. |
| **activity** | The activity the quest is tied to. |
| **premise** | One sentence that explains the quest. |
| **systems** | The skills or systems touched by the quest. |
| **reward** | What the player receives for completing the quest. |
| **hook_line** | A memorable line that the NPC says. |

## Starter Activity Hooks

### Hook 1: The Bell That Ran Ahead

- **quest_name:** The Bell That Ran Ahead
- **giver:** Mara Bellkeeper
- **activity:** Bell Run
- **premise:** The message arrived before the runner did. Mara asks the player to investigate why the Bell Run is getting faster.
- **systems:** Wayfaring, Cartography
- **reward:** Bell Token, route hint, Bell Runner ribbon
- **hook_line:** "If a bell rings before you touch it, either you're late or it's lying."

### Hook 2: The Sweep That Never Ends

- **quest_name:** The Sweep That Never Ends
- **giver:** Marn Lock
- **activity:** Soot Sweep
- **premise:** The Sootcellar is filling faster than anyone can sweep. Marn asks the player to find the source of the extra soot.
- **systems:** Arms, Guard, Sleight
- **reward:** Soot Sweeper apron, Soot Mark, small coins
- **hook_line:** "The soot don't come from nowhere. Something's burning down there that ain't supposed to burn."

### Hook 3: The Ledger That Would Not Balance

- **quest_name:** The Ledger That Would Not Balance
- **giver:** Clerk Penn
- **activity:** Ledger Sort
- **premise:** One ledger has a name that does not match any seal. Clerk Penn asks the player to find the missing entry.
- **systems:** Cartography, Sleight
- **reward:** Ledger Sort discount, Counting House Clerk Trim, small coins
- **hook_line:** "Every name has a seal. Every seal has a name. If one don't match, someone is lying."

### Hook 4: The Market That Moved

- **quest_name:** The Market That Moved
- **giver:** Pell Hookline
- **activity:** Market Rush
- **premise:** The market stalls have shifted overnight. Pell asks the player to remap the new layout.
- **systems:** Wayfaring, Cooking
- **reward:** Market Token, Market Runner ribbon, cooking ingredients
- **hook_line:** "The market don't move by itself. Someone's been shifting the stalls, and I want to know why."

### Hook 5: The Grave That Bloomed Twice

- **quest_name:** The Grave That Bloomed Twice
- **giver:** Sister Writ
- **activity:** Graveflower Round
- **premise:** One grave has produced two flowers in a single day. Sister Writ asks the player to investigate the blessing.
- **systems:** Favour, Gardening
- **reward:** Grave Token, Gravekeeper ribbon, grave flower seeds
- **hook_line:** "A grave that blooms twice is either blessed or cursed. Find out which before the next bell."

### Hook 6: The Shift That Would Not End

- **quest_name:** The Shift That Would Not End
- **giver:** Osric Penny
- **activity:** Foundry Shift
- **premise:** The furnace has been burning for three days straight. Osric asks the player to find out why it won't cool.
- **systems:** Smithing, Mining
- **reward:** Foundry Token, Foundry Shift apron, copper bars
- **hook_line:** "A furnace that won't cool is a furnace that knows something. Find out what it's trying to tell us."

### Hook 7: The Primer That Cracked

- **quest_name:** The Primer That Cracked
- **giver:** Pippa Hearth
- **activity:** Kilnwatch Primer
- **premise:** The primer beads are cracking even at the correct temperature. Pippa asks the player to find the source of the fault.
- **systems:** Hearthcraft, Beadwork
- **reward:** Kiln Token, Kilnwatch ribbon, fired beads
- **hook_line:** "A bead that cracks at the right heat is a bead that's telling you something. Listen to it."

### Hook 8: The Basket That Caught Nothing

- **quest_name:** The Basket That Caught Nothing
- **giver:** Pell Hookline
- **activity:** River Basket
- **premise:** The river basket has been empty for a week. Pell asks the player to find where the fish have gone.
- **systems:** Fishing, Cooking
- **reward:** River Token, River Basket ribbon, raw fish
- **hook_line:** "A basket that catches nothing is either in the wrong place or the wrong river. Find out which."

## First-Ring Activity Hooks

### Hook 9: The Relay That Broke

- **quest_name:** The Relay That Broke
- **giver:** Orven Roadcap
- **activity:** Crowmile Relay
- **premise:** A road marker has fallen and the route is broken. Orven asks the player to repair it and remap the bend.
- **systems:** Wayfaring, Cartography
- **reward:** Road Token, Crowmile Road Ribbon, route cosmetics
- **hook_line:** "A broken marker is a lost traveller. Fix it before someone walks into the wrong field."

### Hook 10: The Replant That Grew Backwards

- **quest_name:** The Replant That Grew Backwards
- **giver:** Aunt Bracken
- **activity:** Bellwood Replant
- **premise:** A replanted sapling has grown backwards into the ground. Aunt Bracken asks the player to investigate the soil.
- **systems:** Woodcutting, Gardening, Bowcraft
- **reward:** Replant Token, Bellwood Axe Mark, bow staves
- **hook_line:** "A tree that grows backwards is a tree that don't want to be here. Find out what it's running from."

### Hook 11: The Quarry That Whispered

- **quest_name:** The Quarry That Whispered
- **giver:** Sella Coalhand
- **activity:** Quarry Shift
- **premise:** The quarry workers report hearing whispers from the deep cut. Sella asks the player to investigate.
- **systems:** Mining, Smithing
- **reward:** Quarry Token, Quarry Worker Apron, ore bundles
- **hook_line:** "A quarry that whispers is a quarry that's remembering something. Go down and listen."

### Hook 12: The Drive That Lost the Fox

- **quest_name:** The Drive That Lost the Fox
- **giver:** Rowen Hidepeg
- **activity:** Patchfield Drive
- **premise:** A fox has been evading every trap for a week. Rowen asks the player to track it and set a better snare.
- **systems:** Trapping, Tailoring
- **reward:** Drive Token, Patchfield Hide Stamp, hide bundles
- **hook_line:** "A fox that knows the traps is a fox that's been watching us. Set a trap that watches back."

### Hook 13: The Tide That Came Early

- **quest_name:** The Tide That Came Early
- **giver:** Pell Hookline
- **activity:** Wardenbrook Tide
- **premise:** The tide has arrived three days early. Pell asks the player to help secure the dock before the surge.
- **systems:** Fishing, Cooking, Wayfaring
- **reward:** Tide Token, Wardenbrook Angler Pin, fish hamper upgrade
- **hook_line:** "A tide that comes early is a tide that wants to catch you out. Be ready before it arrives."

### Hook 14: The Vigil That Never Ended

- **quest_name:** The Vigil That Never Ended
- **giver:** Cress Lowgrave
- **activity:** Lowgrave Vigil
- **premise:** One vigil has lasted three nights without a break. Cress asks the player to relieve the watch and find out why the Wisps won't settle.
- **systems:** Favour, Gardening, Hearthcraft, Apothecary
- **reward:** Vigil Token, Lowgrave Candle Trim, candle trims
- **hook_line:** "A vigil that won't end is a vigil that's waiting for something. Find out what, or be the next one waiting."

### Hook 15: The Watch That Caught Fire

- **quest_name:** The Watch That Caught Fire
- **giver:** Noll Kilnwatch
- **activity:** Old Kiln Watch
- **premise:** The kiln has flared unexpectedly during a watch. Noll asks the player to investigate the cause and prevent a repeat.
- **systems:** Hearthcraft, Beadwork, Magic
- **reward:** Kiln Token, Kilnwatch Oath Mark, ashproof gloves
- **hook_line:** "A kiln that catches fire during the watch is a kiln that don't trust the watcher. Earn its trust back."

### Hook 16: The Lockroom That Opened Itself

- **quest_name:** The Lockroom That Opened Itself
- **giver:** Vey Falsewick
- **activity:** Sootstairs Lockroom
- **premise:** One of the lockroom doors has opened without a key. Vey asks the player to investigate what is inside.
- **systems:** Sleight, Cartography
- **reward:** Lockroom Token, Blacksealed Cloak, False-Bottom Pouch parts
- **hook_line:** "A door that opens without a key is either a gift or a trap. Find out which before you step through."

## Hook Summary Table

| # | Quest Name | Giver | Activity | Systems | Reward |
|---|------------|-------|----------|---------|--------|
| 1 | The Bell That Ran Ahead | Mara Bellkeeper | Bell Run | Wayfaring, Cartography | Bell Token, route hint, Bell Runner ribbon |
| 2 | The Sweep That Never Ends | Marn Lock | Soot Sweep | Arms, Guard, Sleight | Soot Sweeper apron, Soot Mark, small coins |
| 3 | The Ledger That Would Not Balance | Clerk Penn | Ledger Sort | Cartography, Sleight | Ledger Sort discount, Counting House Clerk Trim, small coins |
| 4 | The Market That Moved | Pell Hookline | Market Rush | Wayfaring, Cooking | Market Token, Market Runner ribbon, cooking ingredients |
| 5 | The Grave That Bloomed Twice | Sister Writ | Graveflower Round | Favour, Gardening | Grave Token, Gravekeeper ribbon, grave flower seeds |
| 6 | The Shift That Would Not End | Osric Penny | Foundry Shift | Smithing, Mining | Foundry Token, Foundry Shift apron, copper bars |
| 7 | The Primer That Cracked | Pippa Hearth | Kilnwatch Primer | Hearthcraft, Beadwork | Kiln Token, Kilnwatch ribbon, fired beads |
| 8 | The Basket That Caught Nothing | Pell Hookline | River Basket | Fishing, Cooking | River Token, River Basket ribbon, raw fish |
| 9 | The Relay That Broke | Orven Roadcap | Crowmile Relay | Wayfaring, Cartography | Road Token, Crowmile Road Ribbon, cosmetics |
| 10 | The Replant That Grew Backwards | Aunt Bracken | Bellwood Replant | Woodcutting, Gardening, Bowcraft | Replant Token, Bellwood Axe Mark, bow staves |
| 11 | The Quarry That Whispered | Sella Coalhand | Quarry Shift | Mining, Smithing | Quarry Token, Quarry Worker Apron, ore bundles |
| 12 | The Drive That Lost the Fox | Rowen Hidepeg | Patchfield Drive | Trapping, Tailoring | Drive Token, Patchfield Hide Stamp, hide bundles |
| 13 | The Tide That Came Early | Pell Hookline | Wardenbrook Tide | Fishing, Cooking, Wayfaring | Tide Token, Wardenbrook Angler Pin, fish hamper upgrade |
| 14 | The Vigil That Never Ended | Cress Lowgrave | Lowgrave Vigil | Favour, Gardening, Hearthcraft, Apothecary | Vigil Token, Lowgrave Candle Trim, candle trims |
| 15 | The Watch That Caught Fire | Noll Kilnwatch | Old Kiln Watch | Hearthcraft, Beadwork, Magic | Kiln Token, Kilnwatch Oath Mark, ashproof gloves |
| 16 | The Lockroom That Opened Itself | Vey Falsewick | Sootstairs Lockroom | Sleight, Cartography | Lockroom Token, Blacksealed Cloak, False-Bottom Pouch parts |

## Deferred to Implementation

The following elements are intentionally left out of this document and will be defined during quest implementation:

- Full quest scripts with step-by-step objectives
- Dialogue trees and NPC conversation branches
- Exact item requirements and reward quantities
- Experience point or favour values for completion
- Conditional branching based on player skills or choices
- Quest failure states and retry logic
- Integration with the quest journal UI

These details belong in the quest system's implementation layer, not in the design authority. This document provides the narrative and mechanical skeleton. The quest system fills in the bones.

---

*Last updated: 2026-05-31*
