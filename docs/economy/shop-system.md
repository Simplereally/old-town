---
doc_type: authority
canonical_path: docs/economy/shop-system.md
parent_index: docs/economy/00-index.md
root_index: docs/00-index.md
---

Parent: [`Economy Index`](00-index.md)

Authority references:
- `docs/economy/starter-shop-stocks.md`
- `docs/world/shops-and-services.md`
- `docs/content/schema-gap-analysis.md`
- `docs/content/seed-shops-services-ledger-manifest.md`

# Shop System

Shop content should define stock, prices, restock cadence, buy policy, sell policy, and unlocks.

## Shop Item Fields

| Field | Meaning |
|-------|---------|
| item_id | Item sold or bought |
| base_price | Provisional base coin price |
| initial_stock | Stock at server/world start |
| max_stock | Maximum shop stock |
| restock_ticks | Tick cadence for restocking |
| buy_policy | Whether player can buy it |
| sell_policy | Whether shop buys it from players |
| unlock_condition | Quest, skill, reputation, or default unlock |

## Buy Policies

| Policy | Meaning |
|--------|---------|
| Always | Normal stock |
| Quest-gated | Appears after quest |
| Skill-gated | Appears after level |
| Reputation-gated | Appears after Warden/Favour/town rep |
| Rotating | Limited rotating stock |
| Never | Service-only, not sold |

## Sell Policies

| Policy | Meaning |
|--------|---------|
| Buys category | Shop buys relevant items |
| Buys exact list | Shop buys only listed items |
| Buys junk | General low-value buying |
| Refuses stolen | Lawful shops reject flagged items |
| Fences stolen | Black market buys flagged items |
| Does not buy | Service-only |

## Restocking

| Stock Type | Restock |
|------------|---------|
| Common consumables | Fast |
| Tools | Medium |
| Gear | Slow |
| Rare/quest items | No normal restock |

