---
doc_type: authority
canonical_path: docs/activities/activity-currencies.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-balance-rules.md`
- `docs/activities/starter-activities.md`
- `docs/activities/first-ring-activities.md`
- `docs/economy/currency-system.md`
- `docs/economy/reward-calibration.md`

# Activity Currencies

This document defines the activity currency system for Old Town. Currencies are local, narrow, and specific to their activity family. There is no universal activity currency. Tokens are earned by doing activities and spent at activity reward shops.

## Currency Philosophy

Activity currencies are local and narrow. Each currency belongs to a specific activity or activity family. A Bell Token is earned by running the Bell Run and spent at the Bell Shop. It cannot be used at the Tide Shop. It cannot be exchanged for raw coins at a bank. It is a local voucher, not a global currency.

This narrowness prevents inflation, preserves the identity of each activity, and prevents players from grinding one efficient activity to buy rewards from another.

## Currency Rules

1. **No universal activity currency.** Each activity has its own token or shares a token with a close sibling.
2. **No exchange to raw coin.** Tokens cannot be sold to vendors for gold. They are not a primary income source.
3. **Every token must have a sink.** Tokens must be spendable on something players want. A token with no sink creates inflation and frustration.
4. **Token costs must be reasonable.** A cosmetic should not require 1000 runs. A reasonable player should earn a cosmetic in 20-50 runs.
5. **Tokens do not expire.** There is no daily reset, no decay, and no cap. Players can accumulate tokens indefinitely.
6. **Tokens are not tradable.** Tokens are bound to the player who earned them. They cannot be traded, sold, or given to other players.
7. **Tokens are not droppable.** Tokens do not appear on the ground or in loot. They are added directly to the player's inventory or token purse.

## Allowed Currencies

| Currency ID | Name | Source Activity | Activity Family | Use |
|-------------|------|-----------------|-----------------|-----|
| `bell_token` | Bell Token | Bell Run | Course | Route hints, district maps, course cosmetics |
| `market_token` | Market Token | Market Rush | Public Work | Cooking ingredients, market cosmetics |
| `grave_token` | Grave Token | Graveflower Round | Skilling Activity | Grave flower seeds, grave cosmetics |
| `foundry_token` | Foundry Token | Foundry Shift | Production Activity | Smithing tools, foundry cosmetics |
| `kiln_token` | Kiln Token | Kilnwatch Primer, Old Kiln Watch | Production / Skilling Boss | Bead supplies, kiln materials, hearthcraft tools |
| `river_token` | River Token | River Basket | Skilling Activity | Bait, fishing hints, river cosmetics |
| `road_token` | Road Token | Crowmile Relay | Course | Route cosmetics, shortcut unlocks, Wayfaring tools |
| `replant_token` | Replant Token | Bellwood Replant | Skilling Activity | Bowcraft materials, replant cosmetics |
| `quarry_token` | Quarry Token | Quarry Shift | Risk Activity | Mining tools, quarry cosmetics |
| `drive_token` | Drive Token | Patchfield Drive | Skilling Activity | Tailoring materials, drive cosmetics |
| `tide_token` | Tide Token | Wardenbrook Tide | Skilling Boss | Fishing supplies, fish hamper upgrades, ferry cosmetics |
| `vigil_token` | Vigil Token | Lowgrave Vigil | Skilling Boss | Grave supplies, candle trims, Favour tools |
| `lockroom_token` | Lockroom Token | Sootstairs Lockroom | Puzzle Activity | Lockpick upgrades, lockroom cosmetics |
| `soot_mark` | Soot Mark | Soot Sweep | Public Work | Sleight tools, broom upgrades, undercity cosmetics |

## Currency Notes

### Bell Token

The Bell Token is earned by completing the Bell Run. It is the currency of the course family. Players spend Bell Tokens at the Bell Shop for route hints, district maps, and the Bell Runner ribbon.

- **Earn rate:** 1-3 tokens per run, depending on speed.
- **Sink:** Route hints (5 tokens), district maps (20 tokens), Bell Runner ribbon (50 tokens).

### Kiln Token

The Kiln Token is earned by completing the Kilnwatch Primer and the Old Kiln Watch. It is the currency of the kiln family. Players spend Kiln Tokens at the Kiln Shop for bead supplies, kiln materials, and the Kilnwatch ribbon.

- **Earn rate:** 1-2 tokens per primer run, 3-6 tokens per watch run.
- **Sink:** Bead supplies (2 tokens), kiln materials (10 tokens), Kilnwatch ribbon (50 tokens), ashproof gloves (100 tokens).
- **Related:** Old Kiln Watch earns more tokens but is more dangerous.

### Tide Token

The Tide Token is earned by completing the Wardenbrook Tide. It is the currency of the tide family. Players spend Tide Tokens at the Tide Shop for fishing supplies, fish hamper upgrades, and the Wardenbrook Angler Pin.

- **Earn rate:** 2-5 tokens per run, depending on baskets hauled.
- **Sink:** River bait (3 tokens), fish hamper upgrade (50 tokens), Wardenbrook Angler Pin (75 tokens), Argent Ray clue (200 tokens, rare).
- **Related:** Wardenbrook Tide is the only source of Tide Tokens.

### Vigil Token

The Vigil Token is earned by completing the Lowgrave Vigil. It is the currency of the vigil family. Players spend Vigil Tokens at the Vigil Shop for grave supplies, candle trims, and the Lowgrave Candle Trim.

- **Earn rate:** 2-5 tokens per run, depending on graves tended.
- **Sink:** Grave flower seeds (3 tokens), candle trims (10 tokens), Lowgrave Candle Trim (75 tokens), Gravekeeper's Tooth fragment (250 tokens, rare).
- **Related:** Lowgrave Vigil is the only source of Vigil Tokens.

### Road Token

The Road Token is earned by completing the Crowmile Relay. It is the currency of the road family. Players spend Road Tokens at the Crowmile Shop for route cosmetics, shortcut unlocks, and the Crowmile Road Ribbon.

- **Earn rate:** 3-5 tokens per run, depending on markers repaired.
- **Sink:** Route cosmetics (10 tokens), shortcut unlocks (50 tokens), Crowmile Road Ribbon (75 tokens).
- **Related:** Crowmile Relay earns Road Tokens as its primary currency. It also earns a small number of Bell Tokens (1-2 per run) as a secondary reward.

### Soot Mark

The Soot Mark is earned by completing the Soot Sweep. It is the currency of the undercity family. Players spend Soot Marks at the Soot Shop for Sleight tools, brooms, and soot-related cosmetics.

- **Earn rate:** 1-2 marks per sweep.
- **Sink:** Sleight tools (5 marks), broom upgrades (15 marks), Soot Sweeper apron (50 marks).
- **Related:** Sootstairs Lockroom uses Lockroom Tokens, not Soot Marks.

## Currency Exchange Rates

Tokens are not exchangeable for raw coin. They are not tradable between players.

Tokens are generally not convertible into other tokens. However, some NPCs may offer a limited barter service as a convenience for players who are close to a reward but lack the specific token:

- **Mara Bellkeeper** (Bell Shop) will trade 10 Bell Tokens for 1 Road Token, once per day. This is a convenience, not a primary exchange method.
- **Pell Hookline** (River Shop) will trade 10 River Tokens for 1 Tide Token, once per day. This is a convenience for players who prefer river fishing to tide work.

These barter exchanges are limited and expensive. They exist to prevent players from being completely locked out of a reward, but they do not create a token economy. The general rule is that tokens are not convertible.

## Currency Sinks

Every currency must have meaningful sinks. A sink is a way to spend tokens that players actually want. Without sinks, tokens accumulate and become meaningless.

| Currency | Primary Sink | Secondary Sink | Tertiary Sink |
|----------|-------------|----------------|---------------|
| Bell Token | Route hints | District maps | Bell Runner ribbon |
| Kiln Token | Bead supplies | Kiln materials | Ashproof gloves, Kilnwatch ribbon |
| Tide Token | River bait | Fish hamper upgrade | Wardenbrook Angler Pin |
| Vigil Token | Grave flower seeds | Candle trims | Lowgrave Candle Trim |
| Road Token | Route cosmetics | Shortcut unlocks | Crowmile Road Ribbon |
| Soot Mark | Sleight tools | Broom upgrades | Soot Sweeper apron |

## Currency Inflation Prevention

To prevent inflation, the following rules apply:

1. **No token generation from non-activity sources.** Tokens are only earned by doing the activity. Quests, guilds, and open-world gathering do not generate tokens.
2. **No token duplication.** Tokens are bound to the player. They cannot be traded, sold, or duplicated.
3. **Sinks are permanent.** Once a cosmetic is purchased, the tokens are consumed. They do not return to the economy.
4. **New activities introduce new tokens.** New activities do not use old tokens. Each activity has its own currency.
5. **No token cap.** Players can accumulate tokens indefinitely. This does not cause inflation because tokens are not tradable and sinks are permanent.

## Related Systems

- [`docs/economy/currency-system.md`](currency-system.md) — how the main currency system works
- [`docs/economy/reward-calibration.md`](reward-calibration.md) — how rewards are calibrated across the economy
- [`docs/economy/shop-system.md`](shop-system.md) — how shops are structured and restocked
- [`docs/activities/activity-rewards.md`](activity-rewards.md) — how rewards are structured and distributed
- [`docs/activities/activity-balance-rules.md`](activity-balance-rules.md) — how effort bands map to token earn rates
