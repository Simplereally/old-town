---
doc_type: index
canonical_path: docs/content/00-index.md
parent_index: docs/00-index.md
root_index: docs/00-index.md
---

Parent: [`Documentation Index`](../00-index.md)

Authority references:
- `docs/content/content-translation-system.md`
- `POC_SPEC.md`

# Content Translation Plan

> **Authoritative bridge between design docs and runtime content JSON.**
>
> This directory defines how world-building documentation becomes playable content. Every design doc must produce one of three things: runtime content JSON, a schema gap / future content kind, or pure design authority.

## Design Rule Summary

1. **Every design doc must produce runtime JSON, schema gap, or pure design authority.** No doc may exist without a defined output.
2. **Do not invent content JSON paths that the loader cannot validate.** No unsupported directories like `content/shops/` or `content/ledger/` unless explicitly marked as schema gaps.
3. **Do not generate actual JSON files in this directory.** This is planning documentation only. JSON generation happens in content stories.
4. **Use snake_case for all runtime content IDs.** The schema enforces `^[a-z][a-z0-9_]*$`. Design docs may use kebab-case for readability but must be translated to snake_case for JSON.
5. **Cross-reference liberally.** Every manifest must link to its source docs and to related manifests.

## Files in this Directory

| File | Purpose |
|------|---------|
| [`content-translation-system.md`](content-translation-system.md) | Core translation authority: workflow, vertical slice priority, dependency flow |
| [`content-kind-contracts.md`](content-kind-contracts.md) | Map each runtime content kind to its source docs and POC requirement |
| [`canonical-id-registry.md`](canonical-id-registry.md) | Stable ID naming rules and banned patterns |
| [`starter-content-manifest.md`](starter-content-manifest.md) | Minimum content set for the first playable vertical slice |
| [`schema-gap-analysis.md`](schema-gap-analysis.md) | Design systems without runtime schemas and their POC priority |
| [`seed-skills-manifest.md`](seed-skills-manifest.md) | 25 skills as runtime content candidates |
| [`seed-items-manifest.md`](seed-items-manifest.md) | Minimum item seed set for starter vertical slice |
| [`seed-materials-manifest.md`](seed-materials-manifest.md) | Bridge `docs/resources/` into `content/materials/` |
| [`seed-objects-and-stations-manifest.md`](seed-objects-and-stations-manifest.md) | Landmarks, shops, stations, quest objects |
| [`seed-resource-nodes-manifest.md`](seed-resource-nodes-manifest.md) | E09-critical resource nodes |
| [`seed-npcs-and-creatures-manifest.md`](seed-npcs-and-creatures-manifest.md) | Service NPCs and starter creatures |
| [`seed-map-and-spawns-manifest.md`](seed-map-and-spawns-manifest.md) | Bridge `docs/map/` and `docs/spatial/` into `content/maps/old-town-core.json` |
| [`seed-recipes-manifest.md`](seed-recipes-manifest.md) | E09/E08 starter recipes |
| [`seed-drops-and-contracts-manifest.md`](seed-drops-and-contracts-manifest.md) | Drop tables and Wardenry contracts |
| [`seed-quests-and-dialogue-manifest.md`](seed-quests-and-dialogue-manifest.md) | Starter quests and dialogue packs |
| [`seed-shops-services-ledger-manifest.md`](seed-shops-services-ledger-manifest.md) | Schema-gap planning for shops, services, ledger |
| [`validation-and-drift-control.md`](validation-and-drift-control.md) | 14 validation checks and drift prevention |

## Quick Navigation

| What you want | Go to |
|---------------|-------|
| Understand the translation workflow | [`content-translation-system.md`](content-translation-system.md) |
| Find which content kind maps to which docs | [`content-kind-contracts.md`](content-kind-contracts.md) |
| Check ID naming rules | [`canonical-id-registry.md`](canonical-id-registry.md) |
| See the minimum POC content set | [`starter-content-manifest.md`](starter-content-manifest.md) |
| Check if a system has schema support | [`schema-gap-analysis.md`](schema-gap-analysis.md) |
| Validate a content manifest | [`validation-and-drift-control.md`](validation-and-drift-control.md) |

## See also

- [`docs/00-index.md`](../00-index.md) — Parent documentation index
- [`docs/content/content-translation-system.md`](content-translation-system.md) — Translation workflow authority
- [`docs/content/validation-and-drift-control.md`](validation-and-drift-control.md) — Validation rules
- [`POC_SPEC.md`](../../POC_SPEC.md) — Engine spec

---

*Last updated: 2026-05-31*
