---
doc_type: authority
canonical_path: docs/guilds/guild-rewards.md
parent_index: docs/guilds/00-index.md
root_index: docs/00-index.md
---

# Guild Rewards

Parent: [Guilds Index](00-index.md)

This document defines the reward identity for guilds: what rewards are good, what rewards are banned, and what each guild offers.

## Authority references

- `docs/guilds/guild-system.md`
- `docs/guilds/first-ring-guilds.md`
- `docs/guilds/guild-quest-hooks.md`
- `docs/guilds/entry-requirements.md`
- `docs/items/accessories/00-index.md`
- `docs/items/misc/special.md`
- `docs/economy/reward-calibration.md`

## Reward Philosophy

Guild rewards are narrow and local. They are cosmetic, convenience, or identity items. They are never power upgrades that outclass open-world gear. A guild reward says "I belong here" rather than "I am stronger now." The best rewards make other players notice where you have been, not what you can kill.

## Good Rewards

| ID | Name | Type | What it does | Why it is good |
|---|---|---|---|---|
| foundry_apron | Foundry apron | cosmetic | A soot-stained leather apron worn over armour. Visible to other players. | Shows you smelt at Foundry Hall. Signals belonging without changing stats. |
| bellwood_axe_mark | Bellwood axe mark | cosmetic | A small brass inlay applied to any woodcutting axe head. | A tool trim that marks your axe as Bellwood-trained. Pure identity, zero stat change. |
| patchfield_hide_stamp | Patchfield hide stamp | cosmetic | A heated iron stamp that leaves a small leaf sigil on crafted leather items. | A tailoring mark that says "tanned at Patchfield." Other crafters recognize it. |
| wardenbrook_angler_pin | Wardenbrook angler pin | cosmetic | A small tinfin-shaped pin worn on a cloak or jerkin. | Shows you are a regular at Wardenbrook Fishery. Pure identity, no stat change. |
| wardenbrook_fish_hamper | Wardenbrook fish hamper | convenience | A wicker container that holds only raw fish, but holds more of them than a standard inventory slot. | Holds more fish per slot. Not a universal bag upgrade, just a narrow convenience for anglers. |
| lowgrave_candle_trim | Lowgrave candle trim | cosmetic | A wax-drip pattern dyed into cloak edges. | Shows Favour devotion. Visible in towns where players gather. Pure roleplay signal. |
| kiln_ashproof_gloves | Old Kiln ashproof gloves | cosmetic | Fingerless gloves with ash-grey leather and scorch marks. | Fire-resistant appearance, not actual fire resistance. Looks like you work the kiln. |
| sootstairs_false_pouch | Sootstairs false-bottom pouch upgrade | convenience | A belt pouch with a hidden compartment. Adds a few extra slots for small items only. | Slightly more storage, but restricted by item size. Not a full inventory expansion. |
| sootstairs_shadow_cloak | Sootstairs shadow cloak | cosmetic | A dark, hooded cloak with a faint soot-stain pattern. Pure identity. | Worn by players who trained in the undercity. Signals Sleight belonging without changing stats. |
| crowmile_road_ribbon | Crowmile road ribbon | cosmetic | A faded blue ribbon tied to a weapon haft or belt loop. | Shows travel mastery. Players who know Crowmile Road recognize it immediately. |

## Bad Rewards

| banned_reward | Why it is banned | Design damage |
|---|---|---|
| universal damage boost | Breaks combat calibration. A guild member would out-damage non-members through no skill difference. | Invalidates open-world gear progression. Makes guild membership feel mandatory for combat. |
| universal XP multiplier | Accelerates leveling for guild members only. Creates an obligation to join the "best" guild. | Punishes players who prefer solo or different content. Guild choice becomes optimization, not identity. |
| best-in-slot weapon | A guild-locked weapon stronger than anything in the open world makes the guild a gate to power. | Collapses the entire item hunt into one faction choice. Other content becomes irrelevant. |
| permanent global discount | 10% off everything, everywhere, forever. | Destroys merchant gameplay and player-driven economy. Guild membership becomes a tax on non-members. |
| mandatory teleport network | Free instant travel to guild hubs while non-members walk. | Shrinks the world for members and widens the gap with everyone else. Travel risk is part of the game. |
| guild-exclusive skill | A skill only trainable inside one guild. | Locks content behind a single choice. Players cannot experience the full game without joining every guild. |
| guild-exclusive recipe | A crafting recipe only available to guild members. | Same problem as exclusive skills. Forces guild-hopping or creates permanent FOMO. |

## Reward by Guild

| Guild | Reward 1 | Reward 2 | Reward 3 |
|---|---|---|---|
| Foundry Hall | foundry_apron | blackcoal_discount | ore_sack_access |
| Bellwood Yard | bellwood_axe_mark | woodpile_storage | string_bulk_discount |
| Patchfield Tannery | patchfield_hide_stamp | hide_roll_access | dye_palette_unlock |
| Wardenbrook Fishery | wardenbrook_angler_pin | wardenbrook_fish_hamper | bait_bulk_discount |
| Lowgrave Chapel | lowgrave_candle_trim | cleanse_discount | grave_herb_patch_access |
| Old Kiln House | kiln_ashproof_gloves | heat_safe_firing_access | tallow_bead_discount |
| Sootstairs Rooms | sootstairs_shadow_cloak | sootstairs_false_pouch | safe_route_access |
| Crowmile Road Camp | crowmile_road_ribbon | campfire_boost | survey_kit_discount |

Each guild offers three rewards: one primary cosmetic identity item, one convenience or access perk, and one minor economic discount tied to that guild's specialty. No guild offers combat power. No guild offers universal convenience. The rewards are local to the guild's domain.

## Cosmetic vs Functional

Most rewards are cosmetic. Aprons, trims, stamps, ribbons, and marks exist only to be seen. They do not change numbers. They change how other players read you.

A few rewards are functional. Containers hold more of a specific thing. Storage access opens a niche bank slot. Shortcuts skip a single local walk. These are convenience, not power. A fish hamper does not help you in a dungeon. A false-bottom pouch does not carry weapons. Functional rewards are deliberately narrow so they cannot become mandatory.

The split is roughly 60% cosmetic, 40% functional. Every guild has at least one cosmetic reward and at least one functional reward. No guild has more than two functional rewards.

## Repeat Value

Players return to guilds after earning the reward because the reward is not the end. The reward is the identity, and the convenience is the reason to keep using the guild space.

A player with the foundry_apron still smelts at Foundry Hall because the ore_sack_access makes that location slightly more efficient. A player with the wardenbrook_fish_hamper still fishes at Wardenbrook because the hamper only works there. The reward anchors the player to the place, not the other way around.

Guilds are not checklists to complete. They are places to belong. The rewards remind you where you belong every time another player notices your apron, your ribbon, or your mark.

## Deferred to Implementation

The following details are intentionally left for implementation stories:

- Exact item stats for cosmetic rewards (apron dye colour, ribbon length, stamp pattern resolution)
- Cosmetic item JSON schema and rendering flags
- Container capacity numbers for the fish hamper and false-bottom pouch
- Discount percentages for blackcoal_discount, bait_bulk_discount, cleanse_discount, tallow_bead_discount, string_bulk_discount, and survey_kit_discount
- Access rules for ore_sack_access, woodpile_storage, hide_roll_access, hidden_spot_access, grave_herb_patch_access, heat_safe_firing_access, safe_route_access, and lockpick_practice_board
- Dye palette contents for dye_palette_unlock
- Campfire boost duration and effect for campfire_boost

*Last updated: 2026-05-31*
