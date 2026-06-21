---
doc_type: authority
canonical_path: docs/guilds/guild-quest-hooks.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

Parent: [Guilds Index](00-index.md)

# Guild Quest Hooks

This document defines the quest hooks that introduce players to first-ring guilds and deepen their mastery within each. Each first-ring guild receives two hooks: one intro hook that unlocks access, and one mastery hook that rewards advanced knowledge or resources.

## Authority references

- `docs/guilds/guild-system.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/guilds/second-ring-guild-seeds.md`
- `docs/guilds/entry-requirements.md`
- `docs/quests/quest-system.md`
- `docs/quests/starter-quest-arc.md`
- `docs/areas/area-quest-hooks.md`

---

## 1. Quest Hook Format

Every hook in this document follows the same structure:

| Field | Description |
|-------|-------------|
| quest_id | lowercase snake_case identifier |
| name | Player-facing quest title |
| premise | 1-2 sentences setting up the problem |
| systems | Skills, areas, or mechanics involved |
| reward | What the player receives for completion |
| guild_connection | Which guild this unlocks or deepens |

Hooks are not full quest scripts. They are narrative seeds that the quest system expands into complete tasks with dialogue trees, item requirements, and step sequences.

---

## 2. Foundry Hall Hooks

### Intro: The Shift Bell Rings Twice

- **quest_id:** `foundry_shift_bell`
- **name:** The Shift Bell Rings Twice
- **premise:** The quarry shift bell at Foundry Hall is ringing at the wrong hour. Someone outside the quarry is pulling the rope, and the forgemasters cannot start their work until the bell is silenced.
- **systems:** Mining, Smithing, Wardenry
- **reward:** Foundry Hall access
- **guild_connection:** Foundry Hall

### Mastery: Coal That Won't Burn

- **quest_id:** `foundry_blackcoal`
- **name:** Coal That Won't Burn
- **premise:** Blackcoal from the deep cut burns cold. The forgemasters need someone to investigate why the fuel has lost its heat, and whether the seam itself is tainted.
- **systems:** Mining, Hearthcraft, Beadwork
- **reward:** blackcoal processing recipe
- **guild_connection:** Foundry Hall

---

## 3. Bellwood Yard Hooks

### Intro: Staves in the Wrong Stack

- **quest_id:** `bellwood_staves_stack`
- **name:** Staves in the Wrong Stack
- **premise:** Bow staves are being sorted like firewood by a new yardhand. Aunt Bracken is furious because the grain alignment is being ruined, and she needs someone who understands wood to set things right.
- **systems:** Woodcutting, Bowcraft
- **reward:** Bellwood Yard access
- **guild_connection:** Bellwood Yard

### Mastery: The Bracken Mark

- **quest_id:** `bellwood_bracken_mark`
- **name:** The Bracken Mark
- **premise:** Aunt Bracken recruits the player to mark specific trees for the seasonal harvest. The marks must be hidden from casual observers but clear to the yard crews.
- **systems:** Woodcutting, Cartography
- **reward:** hidden grove with faster respawns
- **guild_connection:** Bellwood Yard

---

## 4. Patchfield Tannery Hooks

### Intro: Hide and Seek

- **quest_id:** `patchfield_hide_seek`
- **name:** Hide and Seek
- **premise:** Rowen needs a sample hide from a creature that has learned to avoid every trap in the field. The player must find an alternative way to secure the specimen.
- **systems:** Trapping, Tailoring
- **reward:** Patchfield Tannery access
- **guild_connection:** Patchfield Tannery

### Mastery: The Dye Master's Secret

- **quest_id:** `patchfield_dye_secret`
- **name:** The Dye Master's Secret
- **premise:** Rowen asks the player to find a lost shipment of rare dye ingredients that never reached the tannery. The trail leads through several first-ring areas.
- **systems:** Trapping, Tailoring, Wayfaring
- **reward:** new colour palette for the vat
- **guild_connection:** Patchfield Tannery

---

## 5. Wardenbrook Fishery Hooks

### Intro: Hookline's First Catch

- **quest_id:** `wardenbrook_first_catch`
- **name:** Hookline's First Catch
- **premise:** Pell challenges the player to land a specific fish using only basic bait. It is a test of patience and technique, not equipment.
- **systems:** Fishing, Cooking
- **reward:** Wardenbrook Fishery access
- **guild_connection:** Wardenbrook Fishery

### Mastery: The Net Menders

- **quest_id:** `wardenbrook_net_menders`
- **name:** The Net Menders
- **premise:** Pell asks the player to help repair a damaged net in a risky part of the brook where the current is strong and the banks are unstable.
- **systems:** Fishing, Tailoring
- **reward:** hidden spot with better catches
- **guild_connection:** Wardenbrook Fishery

---

## 6. Lowgrave Chapel Hooks

### Intro: Gravegate Flowers

- **quest_id:** `lowgrave_gravegate_flowers`
- **name:** Gravegate Flowers
- **premise:** Cress asks the player to plant and tend a flower on a forgotten grave. The grave has no marker, and the location must be found using old chapel records.
- **systems:** Favour, Gardening
- **reward:** Lowgrave Chapel access
- **guild_connection:** Lowgrave Chapel

### Mastery: The Unnamed Dead

- **quest_id:** `lowgrave_unnamed_dead`
- **name:** The Unnamed Dead
- **premise:** Cress asks the player to identify unmarked graves using old records. Some of the dead have no names, only descriptions of how they died.
- **systems:** Favour, Cartography
- **reward:** hidden patch with rare herbs
- **guild_connection:** Lowgrave Chapel

---

## 7. Old Kiln House Hooks

### Intro: Smoke Over Old Town

- **quest_id:** `old_kiln_smoke`
- **name:** Smoke Over Old Town
- **premise:** Noll notices smoke rising from the old kiln and asks the player to investigate. The kiln was supposed to be cold, and an uncontrolled fire could threaten the district.
- **systems:** Hearthcraft, Beadwork
- **reward:** Old Kiln House access
- **guild_connection:** Old Kiln House

### Mastery: The Kilnwatch Oath

- **quest_id:** `old_kiln_kilnwatch_oath`
- **name:** The Kilnwatch Oath
- **premise:** Noll asks the player to rekindle a sealed chamber in the kiln's base. The chamber has not been fired in generations, and the process requires precise temperature control.
- **systems:** Hearthcraft, Beadwork, Magic
- **reward:** hidden firing table with reduced failure chance
- **guild_connection:** Old Kiln House

---

## 8. Sootstairs Rooms Hooks

### Intro: Keys That Open Nothing

- **quest_id:** `sootstairs_keys_nothing`
- **name:** Keys That Open Nothing
- **premise:** Marn Lock sells keys that only work on doors that are not there. The player must figure out whether this is a scam, a code, or something stranger.
- **systems:** Sleight
- **reward:** Sootstairs Rooms access
- **guild_connection:** Sootstairs Rooms

### Mastery: Falsewick's Ledger

- **quest_id:** `sootstairs_falsewick_ledger`
- **name:** Falsewick's Ledger
- **premise:** Vey asks the player to plant a forged ledger in a guardhouse. The ledger must be convincing enough to redirect patrol routes without raising suspicion.
- **systems:** Sleight, Cartography, Wardenry
- **reward:** permanent safe route through Sootstairs
- **guild_connection:** Sootstairs Rooms

---

## 9. Crowmile Road Camp Hooks

### Intro: Roadcap's Marker

- **quest_id:** `crowmile_roadcap_marker`
- **name:** Roadcap's Marker
- **premise:** Orven asks the player to place a survey marker at a dangerous crossroads. The marker must survive the elements and remain visible to travellers.
- **systems:** Wayfaring, Cartography
- **reward:** Crowmile Road Camp access
- **guild_connection:** Crowmile Road Camp

### Mastery: The Lost Mile

- **quest_id:** `crowmile_lost_mile`
- **name:** The Lost Mile
- **premise:** Orven asks the player to verify a rumoured shortcut that would shave a full mile off the road between two first-ring areas. The shortcut may not exist.
- **systems:** Wayfaring, Cartography
- **reward:** permanent fast route between two first-ring areas
- **guild_connection:** Crowmile Road Camp

---

## 10. Starter Hub Quest Hooks

Three starter hub quests serve as bridges from Old Town to first-ring guilds. These are simpler than full guild hooks and appear during the starter quest arc.

| quest_id | name | Leads to |
|----------|------|----------|
| `starter_penny_forge` | A Penny for the Forge | Foundry Hall |
| `starter_string_sing` | String Enough to Sing | Bellwood Yard |
| `starter_missing_clapper` | The Missing Bell-Clapper | Sootstairs Rooms |

These hooks do not grant immediate guild access. They introduce the guild's NPCs, locations, and problems so that the full intro hook feels like a natural next step rather than a cold start.

---

## 11. Deferred to Implementation

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
