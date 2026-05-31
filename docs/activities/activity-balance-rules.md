---
doc_type: authority
canonical_path: docs/activities/activity-balance-rules.md
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
- `docs/skills/skill-system.md`
- `docs/skills/skill-training-rates.md`
- `docs/economy/reward-calibration.md`

# Activity Balance Rules

This document defines the balance rules for Old Town activities. Activities are calibrated to sit beside open-world skilling, not replace it. The goal is to create meaningful alternatives that reward different playstyles without making any single activity mandatory for efficient progression.

## Effort Bands

Activities are organised into four effort bands based on attention required and reward quality:

| Band | Attention | XP Rate | Reward Quality | Examples |
|------|-----------|---------|----------------|----------|
| **Casual** | Low | 60-75% of normal efficient XP | Modest materials, small tokens | Market Rush, Ledger Sort, Graveflower Round |
| **Active** | Medium | 85-100% of normal efficient XP | Useful materials, tokens, cosmetics | Bell Run, River Basket, Foundry Shift, Kilnwatch Primer |
| **Risky** | High | 100-115% of normal efficient XP | Rare materials, tokens, cosmetics, rare chance items | Quarry Shift, Lowgrave Vigil, Sootstairs Lockroom |
| **Mastery** | High skill | 100-115% XP, cosmetic/rare reward chance | Rare materials, cosmetics, unique utility, rare chance items | Old Kiln Watch, Wardenbrook Tide |

## XP Calibration

### Normal Efficient XP

"Normal efficient XP" is the rate a player achieves by training a skill in the open world with appropriate tools and methods. This is the baseline against which activities are calibrated.

For example, if a player can earn 10,000 Smithing XP per hour by smelting copper at the Foundry Row furnace, then:

- **Casual:** Foundry Shift earns 6,000-7,500 Smithing XP per hour.
- **Active:** Foundry Shift earns 8,500-10,000 Smithing XP per hour.
- **Risky:** Quarry Shift earns 10,000-11,500 Smithing XP per hour.
- **Mastery:** Old Kiln Watch earns 10,000-11,500 Hearthcraft XP per hour, plus rare rewards.

### XP Rate Rules

1. **No activity should be the only efficient way to train a skill.** Open-world skilling must remain viable.
2. **Risky and mastery activities can exceed normal XP rates.** The excess is compensation for risk, attention, and skill.
3. **Casual activities should not feel like a waste of time.** 60-75% of normal XP is still meaningful for players who prefer low-attention gameplay.
4. **XP is split across trained skills.** An activity that trains two skills splits the total XP between them. The split is documented in the activity's entry.
5. **XP is not multiplied by group size.** Groupable activities do not grant bonus XP for grouping. Each player earns their own XP based on their own actions.

## Reward Calibration

### Material Rewards

Activity material rewards are calibrated to be useful but not overpowered:

- **Starter activities:** Produce basic materials that are also available in the open world. The activity is a convenience, not a unique source.
- **First-ring activities:** Produce better materials or larger quantities. Some materials may be activity-preferred (e.g., river bait from Wardenbrook Tide) but not activity-exclusive.
- **Skilling bosses:** Produce rare materials and tokens. The rare materials are used in crafting or traded. The tokens are spent at reward shops.

### Token Rewards

Token earn rates are calibrated to make cosmetics achievable in a reasonable timeframe:

- **Casual activity:** 1-2 tokens per run. A cosmetic costs 50 tokens. 25-50 runs to earn.
- **Active activity:** 2-3 tokens per run. A cosmetic costs 50 tokens. 17-25 runs to earn.
- **Risky activity:** 3-5 tokens per run. A cosmetic costs 75 tokens. 15-25 runs to earn.
- **Mastery activity:** 4-6 tokens per run. A cosmetic costs 100 tokens. 17-25 runs to earn.

### Rare Rewards

Rare rewards (Tallow Drake Scale, Argent Ray clue, Gravekeeper's Tooth fragment) are calibrated to feel special without being obligatory:

- **Drop rate:** 1-5% per successful run at the highest tier.
- **No guaranteed drop:** Players cannot force a drop by grinding. The drop is genuinely random.
- **No trade value:** Rare rewards are bound to the player or are quest items. They cannot be sold for profit.
- **Alternative sources:** The quest clues or rare materials can also be obtained through other means (quests, open-world gathering, trade). The activity is one path, not the only path.

## Failure Cost Rules

### Safe Activities

Safe activities have no failure cost beyond lost time:

- **Bell Run:** If the message expires, the run fails. No penalty.
- **Ledger Sort:** If the bundle is incorrect, the clerk rejects it. No penalty.
- **Market Rush:** If the ingredients spoil, the delivery fails. No penalty.
- **Graveflower Round:** If flowers wilt, they must be replanted. Lost materials only.
- **Foundry Shift:** If the furnace overheats, the batch is ruined. Lost materials only.
- **Kilnwatch Primer:** If beads crack, the batch is ruined. Lost materials only.
- **River Basket:** If fish spoil, they are lost. No penalty.
- **Crowmile Relay:** If markers extinguish, retrace. No penalty.
- **Bellwood Replant:** If a sapling is cut, the forester pauses the run. No penalty.
- **Patchfield Drive:** If a creature escapes, the snare is lost. Lost materials only.

### Risky Activities

Risky activities have failure costs that include lost materials and time:

- **Quarry Shift:** Cave-ins ruin the batch and may damage tools. Lost materials and tool durability.
- **Lowgrave Vigil:** Rot forces retreat. Lost materials. Grave Wisps may interrupt actions.
- **Sootstairs Lockroom:** Wrong door resets progress. Lost time.
- **Soot Sweep:** Grave Mites force retreat. No death, but sweep is incomplete.

### Dangerous Activities

Dangerous activities have failure costs that include damage, death, and significant loss:

- **Old Kiln Watch:** Kiln eruption forces retreat. All materials in the kiln are lost. Player may take damage.
- **Wardenbrook Tide:** Washed off the dock. All fish in the current basket are lost. Player may take damage.

### Death Rules

- **Safe activities:** No death possible.
- **Risky activities:** No death possible. Failure is retreat or reset.
- **Dangerous activities:** Death is possible but rare. The player is more likely to be forced to retreat than to die. Death only occurs if the player ignores multiple warnings and stays in the danger zone.
- **Death penalty:** Standard Old Town death penalty applies (loss of carried materials, respawn at nearest safe point). No special activity death penalty.

## Group Activity Rules

### Groupable Activities

Some activities can be done by multiple players simultaneously:

- **Public Work:** Market Rush, Ledger Sort, Soot Sweep. Multiple players contribute independently.
- **Skilling Boss:** Old Kiln Watch, Wardenbrook Tide, Lowgrave Vigil. Multiple players can work the same encounter, but the stability meter is shared. Each player earns rewards based on their own actions.
- **Course:** Bell Run, Crowmile Relay. Multiple players can run the same route, but each earns their own rewards.

### Group Rules

1. **No group requirement.** A solo player can participate in any groupable activity and receive full rewards.
2. **No group size bonus.** Rewards do not scale with group size. Each player earns based on their own actions.
3. **No group-only content.** There is no content that requires a group to access. All activities are solo-viable.
4. **Group efficiency:** Groups may be more efficient because tasks can be divided (one player shovels ash while another fires beads), but efficiency is not mandatory.
5. **No group leader bonuses.** The player who starts the encounter does not receive extra rewards.

## Anti-Power-Creep Rules

1. **No activity should be the best at everything.** An activity can be best for fun, best for cosmetics, or best for materials — but not best XP, best profit, and best rewards simultaneously.
2. **Open-world skilling must remain viable.** If an activity is the only way to train a skill efficiently, the open-world method must be buffed or the activity must be nerfed.
3. **Reward shops must avoid power creep.** No combat gear, no global buffs, no best-in-slot items. Cosmetics and narrow utility only.
4. **New activities must not obsolete old ones.** A new activity can be better for a specific niche, but it cannot make an existing activity irrelevant.
5. **Rare rewards must not be mandatory.** The Tallow Drake Scale, Argent Ray clue, and Gravekeeper's Tooth fragment are cool but not required for progression.

## Activity Calibration Table

| Activity | Band | XP Rate | Token Rate | Failure Cost | Groupable |
|----------|------|---------|------------|--------------|-----------|
| Bell Run | Active | 85% | 1-3/run | None | Yes |
| Soot Sweep | Active | 85% | 1-2/run | Retreat | Yes |
| Ledger Sort | Casual | 65% | 0-1/run | None | Yes |
| Market Rush | Casual | 65% | 1-2/run | None | Yes |
| Graveflower Round | Casual | 65% | 1-2/run | Lost materials | No |
| Foundry Shift | Active | 90% | 1-2/run | Lost materials | No |
| Kilnwatch Primer | Active | 90% | 1-2/run | Lost materials | No |
| River Basket | Active | 85% | 1-2/run | Lost materials | No |
| Crowmile Relay | Active | 90% | 3-5/run | None | Yes |
| Bellwood Replant | Active | 90% | 2-3/run | Pause | No |
| Quarry Shift | Risky | 105% | 3-5/run | Lost materials + tool damage | No |
| Patchfield Drive | Active | 90% | 2-3/run | Lost materials | No |
| Wardenbrook Tide | Mastery | 110% | 2-5/run | Lost materials + damage | Yes |
| Lowgrave Vigil | Risky | 105% | 2-5/run | Lost materials + retreat | Yes |
| Old Kiln Watch | Mastery | 110% | 3-6/run | Lost materials + damage | Yes |
| Sootstairs Lockroom | Risky | 100% | 2-4/run | Lost progress | No |

## Balance Testing

Before an activity is released, it must be tested against the following questions:

1. **Is it fun without rewards?** A player should enjoy the loop even if they earn no tokens or cosmetics.
2. **Is it optional?** A player who ignores the activity should not feel behind in progression.
3. **Is it fair?** The failure cost should match the reward. Risky activities should not feel like cheap death traps.
4. **Is it social?** Groupable activities should not punish solo players or force grouping.
5. **Is it sustainable?** The activity should not deplete resources or create inflation.

## Related Systems

- [`docs/skills/skill-training-rates.md`](skill-training-rates.md) — how skill XP rates are calibrated
- [`docs/economy/reward-calibration.md`](reward-calibration.md) — how rewards are calibrated across the economy
- [`docs/activities/activity-rewards.md`](activity-rewards.md) — how rewards are structured and distributed
- [`docs/activities/activity-currencies.md`](activity-currencies.md) — how token earn rates map to effort bands
