---
doc_type: authority
canonical_path: docs/activities/activity-rewards.md
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
- `docs/activities/activity-currencies.md`
- `docs/activities/activity-balance-rules.md`
- `docs/activities/activity-quest-hooks.md`
- `docs/guilds/guild-rewards.md`
- `docs/economy/reward-calibration.md`

# Activity Rewards

This document defines the reward identity for activities: what rewards are good, what rewards are banned, and what each activity offers. Activity rewards are narrow, local, and identity-based. They are never power upgrades that outclass open-world gear or skilling methods.

## Reward Philosophy

Activity rewards are narrow and local. They are cosmetic, convenience, or identity items. They are never power upgrades that outclass open-world gear. An activity reward says "I did this thing" rather than "I am stronger now." The best rewards make other players notice what you have done, not what you can kill.

Activities should reward one or more of the following:

- **XP:** Skill experience in the trained skills.
- **Activity currency:** Tokens specific to the activity.
- **Resource bundles:** Materials gathered or produced during the activity.
- **Narrow utility items:** Container upgrades, tool improvements, or shortcut access that only affects the activity's domain.
- **Cosmetics:** Outfits, trims, marks, and ribbons that show participation.
- **Storage or container upgrades:** Narrow storage improvements that only hold activity-specific items.
- **Shortcuts:** Access to faster routes or hidden passages within the activity's area.
- **Recipe unlock hooks:** Hints or partial recipes that lead to discoverable crafting knowledge.
- **Rare pets or trophies:** Later-game cosmetic companions or display items.

Activities should not reward any of the following:

- **Universal best-in-slot gear:** Weapons or armour stronger than anything in the open world.
- **Huge raw coin profit:** Activities are not primary income sources.
- **Mandatory XP rates:** No activity should be the only efficient way to train a skill.
- **Global combat buffs:** No activity reward should increase damage, health, or defence universally.
- **Daily-exclusive rewards:** No reward should be available only on the first completion of the day.
- **Activity-only skills or recipes:** Every skill and recipe must be trainable or discoverable in the open world.

## Good Rewards

| ID | Name | Type | Activity | What it does | Why it is good |
|----|------|------|----------|--------------|----------------|
| `bell_runner_ribbon` | Bell Runner Ribbon | cosmetic | Bell Run | A blue ribbon worn on the belt or cloak. | Shows you run the Bell Run. Pure identity, no stat change. |
| `soot_sweeper_apron` | Soot Sweeper Apron | cosmetic | Soot Sweep | A soot-stained apron with a broom motif. | Shows you keep the Sootcellar clean. Signals belonging without changing stats. |
| `counting_house_clerk` | Counting House Clerk Trim | cosmetic | Ledger Sort | A wax-seal pattern on the collar. | Shows you sort ledgers. Pure identity. |
| `market_runner_ribbon` | Market Runner Ribbon | cosmetic | Market Rush | A green ribbon with a basket weave pattern. | Shows you run the market. Pure identity. |
| `gravekeeper_ribbon` | Gravekeeper Ribbon | cosmetic | Graveflower Round | A grey ribbon with a small flower sigil. | Shows you tend the graves. Pure identity. |
| `foundry_shift_apron` | Foundry Shift Apron | cosmetic | Foundry Shift | A leather apron with furnace scorch marks. | Shows you work the Foundry Row shift. Pure identity. |
| `kilnwatch_ribbon` | Kilnwatch Ribbon | cosmetic | Kilnwatch Primer | A red ribbon with a bead motif. | Shows you fire beads at the Chalkhouse kiln. Pure identity. |
| `river_basket_ribbon` | River Basket Ribbon | cosmetic | River Basket | A blue ribbon with a fish scale pattern. | Shows you haul the River Basket. Pure identity. |
| `crowmile_road_ribbon` | Crowmile Road Ribbon | cosmetic | Crowmile Relay | A faded ribbon with a road marker sigil. | Shows you maintain the road. Signals Wayfaring belonging. |
| `bellwood_axe_mark` | Bellwood Axe Mark | cosmetic | Bellwood Replant | A brass inlay on the axe head. | Shows you replant the copse. Pure identity. |
| `quarry_worker_apron` | Quarry Worker Apron | cosmetic | Quarry Shift | A heavy leather apron with ore dust. | Shows you work the quarry. Pure identity. |
| `patchfield_hide_stamp` | Patchfield Hide Stamp | cosmetic | Patchfield Drive | A heated iron stamp for leather. | Shows you drive the Patchfield. Pure identity. |
| `wardenbrook_angler_pin` | Wardenbrook Angler Pin | cosmetic | Wardenbrook Tide | A tinfin-shaped pin for the cloak. | Shows you work the tide. Pure identity. |
| `lowgrave_candle_trim` | Lowgrave Candle Trim | cosmetic | Lowgrave Vigil | A wax-drip pattern on the cloak edge. | Shows you keep the vigil. Pure identity. |
| `kilnwatch_oath` | Kilnwatch Oath Mark | cosmetic | Old Kiln Watch | A scorch mark on the glove. | Shows you keep the kiln alive. Pure identity. |
| `blacksealed_cloak` | Blacksealed Cloak | cosmetic | Sootstairs Lockroom | A dark cloak with a lock sigil. | Shows you master the lockroom. Pure identity. |
| `fish_hamper_upgrade` | Fish Hamper Upgrade | utility | Wardenbrook Tide | A wicker hamper that holds more raw fish. | Narrow convenience. Not a universal bag upgrade. |
| `ashproof_gloves` | Ashproof Gloves | cosmetic | Old Kiln Watch | Fingerless gloves with ash-grey leather. | Fire-resistant appearance. Pure identity. |
| `false_bottom_pouch` | False-Bottom Pouch Parts | utility | Sootstairs Lockroom | Parts for a belt pouch with a hidden compartment. | Assembled over multiple runs. Adds a few extra slots for small items. Not a full inventory expansion. |

## Bad Rewards

| banned_reward | Why it is banned | Design damage |
|---------------|------------------|---------------|
| universal damage boost | Breaks combat calibration. | Invalidates open-world gear progression. |
| universal XP multiplier | Accelerates leveling for activity players only. | Punishes players who prefer solo or different content. |
| best-in-slot weapon | A activity-locked weapon stronger than anything in the open world. | Collapses the entire item hunt into one activity choice. |
| permanent global discount | 10% off everything, everywhere, forever. | Destroys merchant gameplay and player-driven economy. |
| mandatory teleport network | Free instant travel to activity hubs. | Shrinks the world for activity players. |
| activity-exclusive skill | A skill only trainable inside one activity. | Locks content behind a single choice. |
| activity-exclusive recipe | A crafting recipe only available through one activity. | Forces activity grinding or creates permanent FOMO. |
| daily reward chest | A chest that resets daily with exclusive loot. | Creates obligation and FOMO. |
| leaderboard title | A title for the top player on a public leaderboard. | Encourages speedrunning over mastery. |
| activity-only pet | A pet that can only be obtained from one activity. | Forces grinding one activity for cosmetic content. |

## Reward by Activity

### Starter Activities

| Activity | Reward 1 | Reward 2 | Reward 3 |
|----------|----------|----------|----------|
| Bell Run | Bell Runner Ribbon | Bell Token | route hints |
| Soot Sweep | Soot Sweeper Apron | Soot Mark | small coins |
| Ledger Sort | Counting House Clerk Trim | Ledger Sort discount | small coins |
| Market Rush | Market Runner Ribbon | Market Token | cooking ingredients |
| Graveflower Round | Gravekeeper Ribbon | Grave Token | grave flower seeds |
| Foundry Shift | Foundry Shift Apron | Foundry Token | copper bars |
| Kilnwatch Primer | Kilnwatch Ribbon | Kiln Token | fired beads |
| River Basket | River Basket Ribbon | River Token | raw fish |

### First-Ring Activities

| Activity | Reward 1 | Reward 2 | Reward 3 |
|----------|----------|----------|----------|
| Crowmile Relay | Crowmile Road Ribbon | Road Token | route cosmetics |
| Bellwood Replant | Bellwood Axe Mark | Replant Token | bow staves |
| Quarry Shift | Quarry Worker Apron | Quarry Token | ore bundles |
| Patchfield Drive | Patchfield Hide Stamp | Drive Token | hide bundles |
| Wardenbrook Tide | Wardenbrook Angler Pin | Tide Token | fish hamper upgrade |
| Lowgrave Vigil | Lowgrave Candle Trim | Vigil Token | candle trims |
| Old Kiln Watch | Kilnwatch Oath Mark | Kiln Token | ashproof gloves |
| Sootstairs Lockroom | Blacksealed Cloak | Lockroom Token | False-Bottom Pouch parts |

### Skilling Bosses

| Boss | Primary Reward | Secondary Reward | Rare Reward |
|------|---------------|-------------------|-------------|
| Old Kiln Watch | Kilnwatch Oath Mark | Kiln Token, ashproof gloves | Tallow Drake Scale |
| Wardenbrook Tide | Wardenbrook Angler Pin | Tide Token, fish hamper upgrade | Argent Ray clue |
| Lowgrave Vigil | Lowgrave Candle Trim | Vigil Token, candle trims | Gravekeeper's Tooth fragment |

## Reward Tiers

Rewards are distributed across four tiers based on effort and success:

| Tier | Condition | Reward Quality |
|------|-----------|----------------|
| **Base** | Complete the activity regardless of score. | XP, basic materials, tokens. |
| **Standard** | Complete the activity with moderate success. | Above plus better materials, more tokens. |
| **Advanced** | Complete the activity with high success. | Above plus cosmetic reward, utility item. |
| **Rare** | Complete the activity with exceptional success or rare chance. | Above plus rare material, quest clue, or unique cosmetic. |

## Reward Calibration Rules

1. **No activity should be the best XP and the best profit at once.** An activity can be best for fun, best for cosmetics, or best for materials — but not all three.
2. **Cosmetic rewards are the primary long-term incentive.** Players should want to do an activity because the cosmetic is cool, not because the XP is mandatory.
3. **Utility rewards must be narrow.** A fish hamper upgrade only holds fish. A false-bottom pouch only holds small items. No universal inventory expansion.
4. **Rare rewards must be rare.** The Tallow Drake Scale, Argent Ray clue, and Gravekeeper's Tooth fragment should drop at rates that make them feel special, not obligatory.
5. **Tokens must have sinks.** Every token must be spendable on something that players want. Tokens with no sink create inflation and frustration.
6. **Reward shops must avoid power creep.** The shop should sell cosmetics, materials, and narrow utility. No combat gear, no global buffs, no best-in-slot items.

## Reward Shop Structure

Every activity with a token has a reward shop. The shop is located at the activity's central location and is run by an NPC who participates in the activity.

| Shop | NPC | Location | Token | Primary Stock |
|------|-----|----------|-------|---------------|
| Bell Shop | Mara Bellkeeper | Market Bell | Bell Token | route hints, district maps, Bell Runner ribbon |
| Soot Shop | Marn Lock | Sootcellar | Soot Mark | Sleight tools, broom upgrades, Soot Sweeper apron |
| Ledger Shop | Clerk Penn | Counting House | Ledger Sort discount | civic discounts, Counting House Clerk Trim |
| Market Shop | Pell Hookline | Market Bell | Market Token | cooking ingredients, Market Runner ribbon |
| Grave Shop | Sister Writ | Shrine Hearth | Grave Token | grave flower seeds, Gravekeeper ribbon |
| Foundry Shop | Osric Penny | Foundry Row | Foundry Token | smithing tools, Foundry Shift apron |
| Kiln Shop | Pippa Hearth | Chalkhouse Court | Kiln Token | bead supplies, kiln materials, Kilnwatch ribbon |
| River Shop | Pell Hookline | River Stoop | River Token | bait, fishing hints, River Basket ribbon |
| Crowmile Shop | Orven Roadcap | Crowmile Road Camp | Road Token | route cosmetics, shortcut unlocks, Crowmile Road Ribbon |
| Replant Shop | Aunt Bracken | Bellwood Yard | Replant Token | bowcraft materials, Bellwood Axe Mark |
| Quarry Shop | Sella Coalhand | Foundry Hall | Quarry Token | mining tools, Quarry Worker Apron |
| Drive Shop | Rowen Hidepeg | Patchfield Tannery | Drive Token | tailoring materials, Patchfield Hide Stamp |
| Tide Shop | Pell Hookline | Wardenbrook Fishery | Tide Token | river bait, fish hamper upgrade, Wardenbrook Angler Pin, Argent Ray clue |
| Vigil Shop | Cress Lowgrave | Lowgrave Chapel | Vigil Token | grave flower seeds, candle trims, Lowgrave Candle Trim, Gravekeeper's Tooth fragment |
| Watch Shop | Noll Kilnwatch | Old Kiln House | Kiln Token | ashproof gloves, Kilnwatch Oath Mark |
| Lockroom Shop | Vey Falsewick | Sootstairs Rooms | Lockroom Token | lockpick upgrades, Blacksealed Cloak |

## Related Systems

- [`docs/guilds/guild-rewards.md`](guild-rewards.md) — guild reward identity and banned patterns
- [`docs/economy/reward-calibration.md`](reward-calibration.md) — how rewards are calibrated across the economy
- [`docs/economy/shop-system.md`](shop-system.md) — how shops are structured and restocked
- [`docs/activities/activity-currencies.md`](activity-currencies.md) — activity currency rules and sinks
- [`docs/activities/activity-balance-rules.md`](activity-balance-rules.md) — how effort bands map to reward tiers
