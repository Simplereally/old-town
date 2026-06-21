---
doc_type: authority
canonical_path: docs/trails/nooks-and-trail-storage.md
parent_index: docs/trails/00-index.md
root_index: docs/00-index.md
---

Parent: [`Trails Index`](00-index.md)

Authority references:
- `docs/trails/gesture-dress-and-item-steps.md`
- `docs/trails/trail-system.md`
- `docs/ledger/nooks-and-stash-spots.md`
- `docs/skills/utility-skills.md`
- `docs/tools-and-intermediates/stations.md`

# Nooks and Trail Storage

Nooks are Old Town's STASH equivalent. They are buildable local storage spots that hold narrow Trail Gear sets. Nooks reduce bank trips for Dress and Item Steps.

## Nook Types

| Nook | Location Style | Skill Link | Item Set |
|------|--------------|------------|----------|
| Crate Nook | Market corners, shop corners | Carpentry | Food, raw fish, cooking tools, basic Trail Gear |
| Wall Nook | Alleys, old stone walls | Carpentry, Cartography | Maps, trail scraps, survey kits, chalk gear |
| Grave Nook | Grave markers, crypt walls | Favour, Carpentry | Bones, grave beads, burial items, grave gear |
| Bell Nook | Civic landmarks, town hall | Ledger, Cartography | Tokens, stamps, charter scrolls, bell gear |
| Road Nook | Road markers, signposts | Wayfaring, Cartography | Travel items, ferry passes, rope, road gear |
| Blacksealed Nook | Shady alleys, hidden corners | Sleight | Lockpicks, forged permits, dark items, blacksealed gear |

## Build Rules

1. **Built, not bought.** A player must carry materials to the location and build the nook. No shop sells a pre-built nook.
2. **Narrow item sets.** A Crate Nook only holds food, fish, and basic Trail Gear. It will not accept a sword or a bead.
3. **Require skill levels.** Most nooks need a minimum Carpentry level. Some require additional skills.
4. **Look ordinary before built.** An unbuilt nook location looks like a pile of crates, a loose brick, or a hollow tree. After building, it becomes a usable storage spot.
5. **One per player per type.** A player can build one of each nook type in the world. Building a second Crate Nook destroys the first.
6. **Not safe storage.** Nooks are local storage, not bank storage. They do not protect items on death. They are convenience, not security.

## Nook Locations (Starter and First-Ring)

| nook_id | Location | Nook Type | District | Skill |
|---------|----------|-----------|----------|-------|
| market_bell_crate | Market Bell crate nook | Crate Nook | Market Bell | Carpentry 10 |
| counting_house_wall | Counting House wall nook | Wall Nook | Market Bell | Carpentry 15, Cartography 10 |
| foundry_row_coal_crate | Foundry Row coal crate nook | Crate Nook | Foundry Row | Carpentry 10 |
| lath_yard_bow_rack | Lath Yard bow rack nook | Wall Nook | Lath Yard | Carpentry 15 |
| patch_lane_hide_frame | Patch Lane hide frame nook | Crate Nook | Patch Lane | Carpentry 10 |
| chalkhouse_chalk_crack | Chalkhouse chalk crack nook | Wall Nook | Chalkhouse Court | Carpentry 20, Cartography 15 |
| shrine_hearth_candle | Shrine Hearth candle nook | Bell Nook | Shrine Hearth | Carpentry 15 |
| gravegate_grave | Gravegate grave nook | Grave Nook | Gravegate | Carpentry 20, Favour 15 |
| oldroad_signpost | Oldroad signpost nook | Road Nook | Oldroad Gate | Carpentry 15, Wayfaring 10 |
| river_stoop_barrel | River Stoop barrel nook | Crate Nook | River Stoop | Carpentry 10 |
| sootcellar_wall | Sootcellar wall nook | Blacksealed Nook | Sootcellar | Carpentry 20, Sleight 15 |
| crowmile_road_post | Crowmile road post nook | Road Nook | Crowmile Road | Carpentry 15, Wayfaring 15 |
| bellwood_stump | Bellwood stump nook | Wall Nook | Bellwood Copse | Carpentry 20, Cartography 15 |
| wardenbrook_ferry_rope | Wardenbrook ferry rope nook | Road Nook | Wardenbrook | Carpentry 20, Wayfaring 20 |
| lowgrave_flowerbed | Lowgrave flowerbed nook | Grave Nook | Lowgrave | Carpentry 25, Favour 20 |
| old_kiln_ash_crate | Old Kiln ash crate nook | Crate Nook | Old Kiln | Carpentry 15 |
| warden_steps_bell | Warden Steps bell nook | Bell Nook | Warden Steps | Carpentry 15, Ledger 10 |
| penny_and_sons_forge | Penny and Sons forge nook | Wall Nook | Foundry Row | Carpentry 20 |
| lath_and_twine_back_wall | Lath and Twine back wall nook | Wall Nook | Lath Yard | Carpentry 15 |
| patch_and_awl_tanning | Patch and Awl tanning nook | Crate Nook | Patch Lane | Carpentry 10 |
| mother_tallows_kiln | Mother Tallow's kiln nook | Bell Nook | Chalkhouse Court | Carpentry 20, Ledger 15 |
| river_stoop_dock | River Stoop dock nook | Road Nook | River Stoop | Carpentry 15, Wayfaring 10 |
| gravekeeper_solls_crypt | Gravekeeper Soll's crypt nook | Grave Nook | Gravegate | Carpentry 25, Favour 20 |
| oldroad_oak_hollow | Oldroad Oak hollow nook | Wall Nook | Oldroad Gate | Carpentry 20, Cartography 15 |
| sootcellar_drudge_nest | Sootcellar drudge nest nook | Blacksealed Nook | Sootcellar | Carpentry 25, Sleight 20 |
| bellwood_deep_stump | Bellwood deep stump nook | Wall Nook | Bellwood Copse | Carpentry 20, Cartography 20 |
| warden_steps_boundary | Warden Steps boundary nook | Road Nook | Warden Steps | Carpentry 20, Wayfaring 15 |
| crowmile_road_sign | Crowmile Road sign nook | Road Nook | Crowmile Road | Carpentry 15, Wayfaring 15 |
| market_bell_bakery | Market Bell bakery nook | Crate Nook | Market Bell | Carpentry 10 |
| chalkhouse_court_quarry | Chalkhouse Court quarry nook | Wall Nook | Chalkhouse Court | Carpentry 20, Cartography 15 |

## Material Costs

| Material | Source | Typical Cost |
|----------|--------|--------------|
| Planks | Woodcutting or sawmill | 2 per nook |
| Iron fitting | Smithing or Foundry Row shop | 1 per nook |
| Bronze fitting | Smithing or Foundry Row shop | 1 per nook |
| Brass fitting | Smithing or higher-tier shop | 1 per nook |
| Grave fitting | Grave bead drop or Gravekeeper Soll | 1 per nook |
| Blacksealed fitting | Marn Lock or Sleight drop | 1 per nook |
| Map scrap | Cartography survey or Finch Quill | 1 per nook |
| Route scrap | Cartography survey or route completion | 1 per nook |
| Bell token | Civic Ledger deed reward | 1 per nook |
| Lockpick | Sleight or Marn Lock | 1 per nook |

## Nook World Attachment

Nooks should create long-term world attachment:

- A player who builds a Nook in a district feels ownership of that spot.
- Nooks are permanent local unlocks. They remain after logout.
- Nooks are visible to other players but only usable by the builder.
- Nooks create a reason to return to districts that are otherwise forgotten.
- Nooks are a long-term goal for completionist players.

---

*Last updated: 2026-06-01*
