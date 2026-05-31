---
doc_type: authority
canonical_path: docs/content/schema-gap-analysis.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/content-translation-system.md`
- `docs/content/starter-content-manifest.md`
- `docs/economy/shop-system.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/favour/favour-system.md`

# Schema Gap Analysis

> **Document design systems without runtime schemas.** These systems are real in the world but cannot yet be expressed as validated JSON. This doc decides whether to defer, model with existing schemas, or add new schemas before JSON generation.

## Gap Table

| Design System | Existing Schema Fit? | Recommendation | POC Priority |
|---------------|---------------------|----------------|--------------|
| **Shops** | Partial via `object` and `npc`, no stock schema | Model with existing schema (shop as object with options) | High |
| **Services** | No clear schema | Defer to post-POC; document as pure design authority | Medium |
| **Ledger deeds** | No clear schema | Defer to post-POC; document as pure design authority | Low |
| **Oldroad Trails** | No clear schema | Defer to post-POC; document as pure design authority | Low |
| **Nooks** | Partial via `object` plus container items | Model with existing schema (nook as object with storage flag) | Medium |
| **Wardenry contracts** | Partial via `quest` and `dropTable` | Model with existing schema (contract as quest with kill objectives) | High |
| **Favour boons** | Partial via `spell` and status effects | Defer to post-POC; document as schema gap | Medium |
| **Shrine rites** | Partial via `object` and `processingRecipe` | Model with existing schema (rite as recipe with Favour XP output) | Medium |
| **Public Works** | Partial via `quest` and minigame logic | Defer to post-POC; document as pure design authority | Low |
| **Shop and service prices** | No clear schema | Defer to post-POC; prices live in economy docs | Medium |
| **Consumable effects** | Partial via `consumable` (heal only) | Schema only supports `heal` and `consumeTicks`. Non-healing consumables (tinctures, salves, cordials) need `heal: 0` or omitted consumable field | Medium |

## Recommendation Definitions

| Recommendation | Meaning |
|---------------|---------|
| **Defer** | No JSON needed for POC. Keep as design docs only. |
| **Model with existing schema** | Use `item`, `object`, `quest`, or `processingRecipe` to approximate the system. |
| **Add schema before JSON** | Write a new Zod schema in `packages/shared/src/content-schemas/` before creating JSON. |
| **Keep as docs** | The system is pure design authority and may never need a schema. |

## POC Priority Definitions

| Priority | Meaning |
|----------|---------|
| **High** | Blocks a starter loop or quest. Must be resolved before POC playtest. |
| **Medium** | Supports a secondary system. Can be mocked or deferred. |
| **Low** | Post-POC content. Document only. |
| **Defer** | Not needed for POC at all. |

## Schema Addition Priority

If time allows during POC implementation, add schemas in this order:

1. **Shop stock schema.** Shops are high priority because players expect to buy and sell. A minimal schema with `item_id`, `base_price`, `initial_stock`, `max_stock`, and `restock_ticks` is enough.
2. **Wardenry contract schema.** Contracts are high priority because they drive the Warden Steps loop. A minimal schema with `target_creature_id`, `target_count`, and `reward_items` is enough.
3. **Service fee schema.** Services are medium priority. A minimal schema with `service_type`, `fee_item_id`, and `fee_quantity` is enough.
4. **Shrine rite schema.** Rites are medium priority. A minimal schema with `required_offering_item_id`, `favour_xp`, and `boon_effect_id` is enough.
5. **Favour boon schema.** Boons are medium priority and may be modeled as spells with a `favour_school` tag.
6. **Nook schema.** Nooks are medium priority. A minimal schema with `storage_slots`, `build_materials`, and `location_tile` is enough.
7. **Ledger deed schema.** Deeds are low priority for POC. They are pure design authority until post-POC.
8. **Oldroad Trail schema.** Trails are low priority for POC. They are pure design authority until post-POC.
9. **Public Works schema.** Public works are low priority. They are pure design authority until post-POC.
10. **Price schema.** Prices may never need a dedicated schema if they live inside shop and service definitions.

## See also

- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC content set
- [`docs/content/seed-shops-services-ledger-manifest.md`](seed-shops-services-ledger-manifest.md) — Shop, service, and ledger candidates
- [`docs/economy/shop-system.md`](../economy/shop-system.md) — Shop details
- [`docs/ledger/civic-ledger-system.md`](../ledger/civic-ledger-system.md) — Ledger details
- [`docs/favour/favour-system.md`](../favour/favour-system.md) — Favour details

---

*Last updated: 2026-05-31*
