# Documentation Linking Rules

## 1. Index files are navigation hubs
`00-index.md` files may contain clickable markdown links to children, sibling category indexes, and major authority docs.

## 2. Leaf files are source-of-truth content
Leaf files should not try to cross-link the whole doc graph. Prefer canonical path references in backticks.

Good:
See `docs/combat/signature-mechanics.md`.

Avoid:
See [signature-mechanics.md](../../combat/signature-mechanics.md).

## 3. Leaf files may use clickable links only for local navigation
Allowed:
- `[Parent index](00-index.md)`
- sibling files in the same directory, e.g. `[amulets.md](amulets.md)`

## 4. Cross-tree references in leaf files must use canonical paths in backticks
Good:
- `docs/combat/signature-mechanics.md`
- `docs/accessory-tiers.md`
- `docs/items/weapons/darts.md`

Avoid:
- `[signature-mechanics.md](../../combat/signature-mechanics.md)`
- `[accessory-tiers.md](../../accessory-tiers.md)`

## 5. No mandatory POC_SPEC link in every file
Only `docs/00-index.md` and high-level authority docs need to reference `POC_SPEC.md`.

## 6. Do not manually maintain grand totals
Indexes are navigation docs. Item family files and item tables are authoritative. Counts can be generated later.

## 7. Content translation conventions
When generating content JSON, follow `docs/content/00-index.md`:
- Use kebab-case IDs consistently (see `docs/content/canonical-id-registry.md`)
- Every content JSON must have a source doc reference in its manifest
- Schema gaps must be documented in `docs/content/schema-gap-analysis.md` before generating unsupported JSON
- Starter content must be listed in `docs/content/starter-content-manifest.md` before generation
