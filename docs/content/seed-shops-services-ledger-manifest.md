---
doc_type: manifest
canonical_path: docs/content/seed-shops-services-ledger-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/content/schema-gap-analysis.md`
- `docs/economy/shop-system.md`
- `docs/economy/services-and-fees.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/ledger/district-deeds.md`

# Seed Shops, Services, and Ledger Manifest

> **Schema-gap planning for shops, services, and ledger.** These systems are real in the world but may not have dedicated runtime schemas yet. This manifest tracks their status and recommends how to model them.

## Shop Candidates

| Shop Candidate | runtime_support | recommended_content_kind | required_schema_fields | source_doc | poc_priority |
|----------------|-----------------|--------------------------|------------------------|------------|--------------|
| Counting House | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| General Stall | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Penny and Sons Forge | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Lath and Twine Bowyer | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Patch and Awl | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Chalkhouse | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Warden Board | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Shrine Hearth | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | Medium |
| River Stoop | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | High |
| Sootcellar Blacksealed Shop | schema_gap | `object` with shop flag | stock, prices, restock | [`docs/economy/shop-system.md`](../economy/shop-system.md) | Medium |

## Services

| Service | runtime_support | recommended_content_kind | required_schema_fields | source_doc | poc_priority |
|---------|-----------------|--------------------------|------------------------|------------|--------------|
| Bank | existing | `object` with bank flag | storage_slots, fee_table | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | High |
| Reclaim | existing | `object` with reclaim flag | reclaim_rules, fee_table | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | High |
| Repair | schema_gap | `object` with repair flag | repair_cost_formula, degrade_table | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Medium |
| Tan Hide | schema_gap | `processingRecipe` | input_hide, output_leather, fee | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Medium |
| Smelt Public Furnace | schema_gap | `processingRecipe` | input_ore, output_bar, fee | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Medium |
| Bead Firing | schema_gap | `processingRecipe` | input_blank, output_bead, fee | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Medium |
| Bless Item | schema_gap | `object` with bless flag | favour_cost, effect_id | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Low |
| Cleanse Status | schema_gap | `object` with cleanse flag | status_id, fee | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Low |
| Contract Reroll | schema_gap | `object` with reroll flag | wardenry_cost, cooldown | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Medium |
| Map Copy | schema_gap | `object` with copy flag | cartography_cost, map_id | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Low |
| Ferry | schema_gap | `object` with ferry flag | route_id, fee, cooldown | [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) | Low |

## Ledger Candidates

| Ledger Candidate | runtime_support | recommended_content_kind | required_schema_fields | source_doc | poc_priority |
|--------------------|-----------------|--------------------------|------------------------|------------|--------------|
| Market Bell Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Foundry Row Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Lath Yard Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Patch Lane Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Chalkhouse Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| River Stoop Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Oldroad Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Sootcellar Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Gravegate Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Warden Steps Deeds | defer | `quest` or pure docs | deed_tasks, tier_rewards | [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) | Low |
| Scrap Trail | defer | pure docs | trail_steps, reward | [`docs/ledger/oldroad-trails.md`](../ledger/oldroad-trails.md) | Low |
| Chalk Trail | defer | pure docs | trail_steps, reward | [`docs/ledger/oldroad-trails.md`](../ledger/oldroad-trails.md) | Low |
| First Crate Nook | defer | `object` with storage flag | build_materials, storage_slots | [`docs/ledger/nooks-and-stash-spots.md`](../ledger/nooks-and-stash-spots.md) | Low |
| First Road Nook | defer | `object` with storage flag | build_materials, storage_slots | [`docs/ledger/nooks-and-stash-spots.md`](../ledger/nooks-and-stash-spots.md) | Low |
| First Grave Nook | defer | `object` with storage flag | build_materials, storage_slots | [`docs/ledger/nooks-and-stash-spots.md`](../ledger/nooks-and-stash-spots.md) | Low |

## Summary Table

| Category | Existing | Schema Gap | Defer | Total |
|----------|----------|------------|-------|-------|
| Shops | 0 | 10 | 0 | 10 |
| Services | 2 | 9 | 0 | 11 |
| Ledger | 0 | 0 | 15 | 15 |
| **Total** | **2** | **19** | **15** | **36** |

## See also

- [`docs/content/schema-gap-analysis.md`](schema-gap-analysis.md) — Schema support details
- [`docs/economy/shop-system.md`](../economy/shop-system.md) — Shop details
- [`docs/economy/services-and-fees.md`](../economy/services-and-fees.md) — Service details
- [`docs/ledger/civic-ledger-system.md`](../ledger/civic-ledger-system.md) — Ledger details
- [`docs/ledger/district-deeds.md`](../ledger/district-deeds.md) — Deed details
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC requirements

---

*Last updated: 2026-05-31*
