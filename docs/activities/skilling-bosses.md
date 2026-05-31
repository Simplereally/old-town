---
doc_type: authority
canonical_path: docs/activities/skilling-bosses.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/activity-categories.md`
- `docs/activities/first-ring-activities.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-currencies.md`
- `docs/activities/activity-balance-rules.md`
- `docs/activities/activity-quest-hooks.md`
- `docs/creatures/creature-taxonomy.md`
- `docs/skills/skill-system.md`

# Skilling Bosses

This document defines Old Town's skilling boss philosophy and three initial skilling boss encounters. A skilling boss is not a normal combat boss. It is a dangerous repeatable encounter where the primary actions are skill actions, not weapon attacks. The danger comes from environmental hazards, time pressure, resource management, and failure states — not from a health bar that must be depleted.

## Skilling Boss Philosophy

### What a Skilling Boss Is

- A dangerous, repeatable encounter where skill actions are the primary mechanic.
- A place where players use Hearthcraft, Beadwork, Fishing, Cooking, Favour, or Gardening under pressure.
- An encounter with a failure state that ends the run, not a victory screen that grants loot.
- A source of rare materials, tokens, and cosmetic rewards.
- A challenge that rewards mastery, not gear.

### What a Skilling Boss Is Not

- A combat boss. You do not attack it with a sword. You manage it with skill.
- A group raid. Solo players can complete it. Groups can participate but are not required.
- A time-limited event. It is always available.
- A daily challenge. There is no streak bonus or daily reset.
- A source of best-in-slot combat gear. Rewards are materials, tokens, and cosmetics.

### Skilling Boss vs Combat Boss

| Aspect | Combat Boss | Skilling Boss |
|--------|-------------|---------------|
| Primary action | Attack, block, heal | Shovel, fire, mend, plant, vent |
| Victory condition | Health bar reaches zero | Stability meter maintained above zero |
| Failure condition | Player dies | Stability meter reaches zero, or time runs out |
| Danger source | Creature attacks | Environmental hazards, time pressure, resource depletion |
| Rewards | Combat gear, drops | Materials, tokens, cosmetics, rare chance items |
| Group required | Usually yes | Never required |
| Skill trained | Arms, Guard, Wardenry | Hearthcraft, Beadwork, Fishing, Cooking, Favour, Gardening, Apothecary |

## Skilling Boss Structure

Every skilling boss follows the same structure:

1. **Entry:** The player arrives at the location and starts the encounter.
2. **Stability Meter:** A shared meter that decreases over time or when hazards are ignored. The player must take actions to maintain it.
3. **Skill Actions:** The primary loop. The player performs skill actions (shovel ash, fire beads, mend nets, plant flowers) that maintain the meter.
4. **Hazards:** Environmental threats that interrupt actions or drain the meter. Hazards are avoidable with skill.
5. **Failure State:** If the meter reaches zero, the encounter ends. The player receives partial rewards based on progress.
6. **Cash Out:** The player can choose to end the encounter early and receive rewards based on current progress.
7. **Rewards:** Tokens, materials, and a rare chance at a cosmetic or clue item.

## Skilling Boss Design Rules

1. **The stability meter must be visible.** The player always knows how close they are to failure.
2. **Skill actions must be meaningful.** Each action has a clear effect on the meter.
3. **Hazards must be avoidable.** The player can learn to predict and avoid them.
4. **Failure must be recoverable.** The player loses inputs and time, not gear or levels.
5. **Rewards must be narrow.** No combat gear, no universal buffs, no mandatory items.
6. **Solo must be viable.** Group participation improves efficiency but is never required.
7. **The encounter must be repeatable.** No cooldown, no daily limit, no entry fee.

## Skilling Boss: Old Kiln Watch

**boss_id:** `old_kiln_watch`

**player shorthand:** "the watch"

**location:** The Old Kiln House.

**skills trained:** Hearthcraft, Beadwork, Magic.

**entry requirement:** Hearthcraft 20 or Beadwork 20, and completion of the quest `Smoke Over Old Town`.

**danger classification:** Dangerous.

**fantasy:** Keep an unstable town kiln alive while firing beads and preventing drake smoke. The kiln is a dormant furnace that has become home to Ash Drake Whelps. The heat is irregular, the ash builds up, and the whelps try to nest in the warm piles. The player must manage the kiln, fire beads, and evict the whelps — all at the same time.

### Stability Meter

The kiln has a **stability meter** that starts at 100 and decreases over time. The rate of decrease increases as the encounter progresses. The player can increase the meter by taking actions:

- **Shovel ash:** +5 stability. Removes ash from the kiln floor.
- **Feed correct fuel:** +10 stability. Blackcoal for steady heat, tallow for quick bursts, ember shards for high-temperature firing.
- **Vent smoke:** +8 stability. Opens the vent to release drake smoke.
- **Fire bead batch:** +3 stability. Fires a batch of beads at the correct temperature.
- **Evict whelp:** +2 stability. Removes an Ash Drake Whelp from the ash pile.

### Hazards

- **Heat burst:** The kiln flares. If the player is standing at the kiln mouth, they take minor damage and their current action is interrupted. Avoidable by standing back when the vent is closed.
- **Ash Drake Whelp:** A whelp nests in the ash. If left alone, it reduces stability by 3 per tick. If it bites the player, the current action is interrupted and the player takes minor damage.
- **Smoke accumulation:** If smoke is not vented, visibility drops and the player cannot see the temperature gauge. This makes bead firing risky.
- **Fuel mismatch:** Feeding the wrong fuel reduces stability by 10 and causes a flare.

### Loop

1. Check the stability meter and the temperature gauge.
2. Shovel ash if the pile is high.
3. Feed the correct fuel based on the temperature.
4. Vent smoke if the vent indicator is red.
5. Fire bead batches when the temperature is in the correct zone.
6. Evict whelps if they appear.
7. Repeat until the player cashes out or the meter reaches zero.

### Cash Out

The player can choose to end the encounter at any time. The rewards are based on the number of successful bead batches fired:

- 1-5 batches: Hearthcraft XP, Beadwork XP, basic fired beads, 1 Kiln Token.
- 6-10 batches: Above plus ash materials, ember beads, 2 Kiln Tokens.
- 11-15 batches: Above plus 3-5 Kiln Tokens, ashproof gloves.
- 16+ batches: Above plus 4-6 Kiln Tokens, rare chance at Tallow Drake Scale.

### Failure State

If the stability meter reaches zero, the kiln erupts. The player is forced to retreat and all materials in the kiln are lost. The player receives partial XP based on progress.

### Rewards

| reward_id | name | type | source |
|-----------|------|------|--------|
| `kilnwatch_oath` | Kilnwatch Oath Mark | cosmetic | 11+ batches |
| `kiln_token` | Kiln Token | currency | 11+ batches |
| `fired_beads` | Fired beads | material | All successful runs |
| `ash_materials` | Ash materials | material | 6+ batches |
| `ember_beads` | Ember beads | material | 6+ batches |
| `ashproof_gloves` | Ashproof Gloves | cosmetic | 11+ batches |
| `tallow_drake_scale` | Tallow Drake Scale | rare material | 16+ batches, rare chance |

### What It Does Not Replace

- Normal beadwork at Chalkhouse Court or the bead kiln.
- Normal hearthcraft at the Shrine Hearth or the Market Hearth.
- Combat training. The whelps are environmental hazards, not combat targets.

---

## Skilling Boss: Wardenbrook Tide

**boss_id:** `wardenbrook_tide`

**player shorthand:** "the tide"

**location:** Wardenbrook ferry dock.

**skills trained:** Fishing, Cooking, Wayfaring.

**entry requirement:** Fishing 20 and route unlock to Wardenbrook.

**danger classification:** Dangerous.

**fantasy:** Work the ferry dock during a bad tide. The river is surging, the dock is slippery, and the fish are running. The player must mend nets, haul baskets, cook rations, secure ropes, and dodge waves — all while the tide rises. The surge meter increases over time, bringing more fish but more danger.

### Stability Meter

The dock has a **surge meter** that starts at 0 and increases over time. Higher surge means more fish but more danger. The player can control the surge by taking actions:

- **Mend net:** -2 surge. Repairs a torn net and slows the surge.
- **Haul basket:** +3 surge. Hauls a fish basket from the water. More surge means more fish.
- **Cook ration:** -1 surge. Cooks an emergency ration on the dock hearth. Feeds the crew and calms the tide.
- **Secure rope:** -4 surge. Ties a ferry rope to the bollard. Major surge reduction.
- **Scare snapper:** -1 surge. Drives a River Snapper away from the baskets.

### Hazards

- **Wave tile:** A wave sweeps the dock. If the player is standing on the wrong tile, they are washed downstream and the encounter ends. Avoidable by watching the water pattern.
- **River Snapper:** A fish that snaps at baskets. If left alone, it destroys a basket and reduces the haul. If it snaps the player, the player drops their current item and takes minor damage.
- **Slippery dock:** The dock surface becomes slippery as the surge increases. Movement speed drops, and the player may slide into wave tiles.
- **Rope snap:** If a ferry rope is not secured, it snaps and lashes the dock. The player must dodge the rope or take damage.

### Loop

1. Check the surge meter and the water pattern.
2. Mend nets if they are torn.
3. Haul baskets when the surge is manageable.
4. Cook rations to keep the crew fed and the surge down.
5. Secure ropes before they snap.
6. Scare snappers away from the baskets.
7. Repeat until the player cashes out or is washed away.

### Cash Out

The player can choose to end the encounter at any time. The rewards are based on the number of baskets hauled:

- 1-5 baskets: Fishing XP, Cooking XP, Wayfaring XP, basic fish, 1 Tide Token.
- 6-10 baskets: Above plus river bait, Wardenbrook fish, 2 Tide Tokens.
- 11-15 baskets: Above plus 3-5 Tide Tokens, fish hamper upgrade.
- 16+ baskets: Above plus 4-6 Tide Tokens, rare chance at Argent Ray clue.

### Failure State

If the player is washed off the dock by a wave, the encounter ends. All fish in the current basket are lost. The player receives partial XP based on progress.

### Rewards

| reward_id | name | type | source |
|-----------|------|------|--------|
| `wardenbrook_angler_pin` | Wardenbrook Angler Pin | cosmetic | 11+ baskets |
| `tide_token` | Tide Token | currency | 11+ baskets |
| `river_fish` | River fish | material | All successful runs |
| `river_bait` | River bait | material | 6+ baskets |
| `wardenbrook_fish` | Wardenbrook fish | material | 6+ baskets |
| `fish_hamper_upgrade` | Fish Hamper Upgrade | utility | 11+ baskets |
| `argent_ray_clue` | Argent Ray clue | rare quest item | 16+ baskets, rare chance |

### What It Does Not Replace

- Normal fishing at the River Stoop or Wardenbrook Fishery.
- Normal cooking at the Kitchen Range or Market Hearth.
- Combat training. The River Snappers are environmental hazards, not combat targets.

---

## Skilling Boss: Lowgrave Vigil

**boss_id:** `lowgrave_vigil`

**player shorthand:** "the vigil"

**location:** Lowgrave Chapel and surrounding graves.

**skills trained:** Favour, Gardening, Hearthcraft, Apothecary.

**entry requirement:** Favour 20 and completion of the quest `Gravegate Flowers`.

**danger classification:** Risky.

**fantasy:** Keep the graves polite through the night. The rot spreads from forgotten graves, the candles gutter in the wind, and the Grave Wisps grow restless. The player must plant flowers, light candles, clear rot, offer bone chips, brew washes, and keep the Wisps calm — all while the night deepens.

### Stability Meter

The chapel has a **reverence meter** that starts at 100 and decreases over time. The rate of decrease increases as the night deepens. The player can increase the meter by taking actions:

- **Plant grave flower:** +5 reverence. Plants a flower on a grave.
- **Light candle:** +3 reverence. Lights a shrine candle.
- **Clear rot:** +8 reverence. Removes a rot patch.
- **Offer bone chips:** +4 reverence. Offers bone chips at the shrine.
- **Brew wash:** +6 reverence. Brews a simple wash to cleanse a grave.
- **Calm Wisp:** +2 reverence. Soothes a restless Grave Wisp.

### Hazards

- **Rot spread:** Rot patches spread to adjacent graves if not cleared. Each infected grave reduces reverence by 5 per tick.
- **Grave Wisp:** A restless spirit. If left alone, it reduces reverence by 3 per tick. If it becomes hostile, it chases the player and interrupts actions.
- **Candle gutter:** Candles gutter in the wind. If not relit, the shrine darkens and the player cannot offer bone chips.
- **Night deepens:** The reverence meter decreases faster as time passes. The player must work faster to keep up.

### Loop

1. Check the reverence meter and the grave states.
2. Plant flowers on bare graves.
3. Light candles that have guttered.
4. Clear rot patches before they spread.
5. Offer bone chips at the shrine.
6. Brew washes for heavily rotted graves.
7. Calm Wisps before they become hostile.
8. Repeat until the player cashes out or the reverence meter reaches zero.

### Cash Out

The player can choose to end the encounter at any time. The rewards are based on the number of graves tended:

- 1-5 graves: Favour XP, Gardening XP, basic grave flowers, 1 Vigil Token.
- 6-10 graves: Above plus grave flower seeds, rot-resistant salves, 2 Vigil Tokens.
- 11-15 graves: Above plus 3-5 Vigil Tokens, candle trims.
- 16+ graves: Above plus 4-6 Vigil Tokens, rare chance at Gravekeeper's Tooth fragment.

### Failure State

If the reverence meter reaches zero, the chapel bells toll and the night ends. The player is forced to retreat to the chapel. All unclaimed rewards are lost. The player receives partial XP based on progress.

### Rewards

| reward_id | name | type | source |
|-----------|------|------|--------|
| `lowgrave_candle_trim` | Lowgrave Candle Trim | cosmetic | 11+ graves |
| `vigil_token` | Vigil Token | currency | 11+ graves |
| `grave_flowers` | Grave flowers | material | All successful runs |
| `grave_flower_seeds` | Grave flower seeds | material | 6+ graves |
| `rot_resistant_salve` | Rot-resistant salve | material | 6+ graves |
| `candle_trim` | Candle Trim | cosmetic | 11+ graves |
| `gravekeepers_tooth` | Gravekeeper's Tooth fragment | rare quest item | 16+ graves, rare chance |

### What It Does Not Replace

- Normal Favour training at the Shrine Hearth or Lowgrave Chapel.
- Normal gardening at the Gravegate or Patchfield.
- Combat training. The Grave Wisps are environmental hazards, not combat targets.

## Skilling Boss Comparison

| Boss | Primary Skills | Stability Meter | Key Hazard | Danger Level | Rare Reward |
|------|---------------|-----------------|------------|--------------|-------------|
| Old Kiln Watch | Hearthcraft, Beadwork, Magic | Kiln stability | Heat burst, whelps | Dangerous | Tallow Drake Scale |
| Wardenbrook Tide | Fishing, Cooking, Wayfaring | Surge meter | Wave tiles, snappers | Dangerous | Argent Ray clue |
| Lowgrave Vigil | Favour, Gardening, Hearthcraft, Apothecary | Reverence meter | Rot spread, Wisps | Risky | Gravekeeper's Tooth fragment |
