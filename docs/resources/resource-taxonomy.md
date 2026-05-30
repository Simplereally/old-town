---
doc_type: authority
canonical_path: docs/resources/resource-taxonomy.md
parent_index: docs/resources/00-index.md
system_index: docs/resources/00-index.md
root_index: docs/00-index.md
---

Parent: [`Resources Index`](00-index.md)

Authority references:
- `docs/skills/skill-system.md`
- `docs/skills/gathering-skills.md`
- `docs/skills/production-skills.md`
- `docs/skills/skill-interlocks.md`
- `docs/items/00-index.md`

# Resource Taxonomy

> **The canonical source of truth for all resource names in Old Town.** Every material, ingredient, and commodity in the world flows through this document. Skill docs, item docs, and content JSON must all reference the names defined here.
>
> **Rule:** No resource name may be introduced outside this taxonomy without a documented exception. This prevents the "two competing canons" problem where skill docs say one thing and item docs say another.

---

## The Taxonomy Principle

Resources in Old Town are not just renamed versions of generic fantasy materials. Each resource has:

1. **A canonical name** — the unique identifier used in all docs and JSON
2. **A source skill** — which gathering skill produces it
3. **A source node** — the specific in-world source (vein, tree, creature, patch)
4. **Production consumers** — which skills use it as input
5. **Tier position** — where it sits on the 1–99 level ladder
6. **Visual identity** — what it looks like
7. **Economy role** — whether it is starter, midgame, or endgame
8. **Cultural framing** — how it connects to Old Town's world

---

## The 13-Tier Resource Ladder

Old Town resources follow the same 13-tier cultural naming system as equipment. This creates coherence across the world: a `graveiron_pickaxe` mines `blackbar_seam` ore to smelt into `graveiron_bars`.

| Tier | Cultural Name | Level | General Role |
|------|---------------|-------|--------------|
| 0 | Cobbled | 1 | Tutorial, broken, or improvised |
| 1 | Pennywrought | 1 | Starter materials |
| 2 | Pig Iron | 5 | Early tools |
| 3 | Bellmetal | 15 | First alloy tier |
| 4 | Blackbar | 25 | Mid-early materials |
| 5 | Wardensteel | 35 | Midgame inflection |
| 6 | Greenwold | 45 | Midgame advanced |
| 7 | Graveiron | 50 | Elite tier threshold |
| 8 | Blueglass | 65 | High-tier glass/mineral |
| 9 | Carmine Steel | 75 | Advanced alloy |
| 10 | Argent | 85 | Near-mastery precious |
| 11 | Crownsteel | 90 | Penultimate |
| 12 | Starfall | 99 | Endgame mythic |

**Important:** Not every resource ladder uses all 13 tiers. Some ladders (like herbs) have fewer tiers. The tier system is a shared vocabulary, not a strict requirement.

---

## Resource Categories

### 1. Ores and Stone

Source: Mining. The mineral backbone of the world.

Canonical ladder:
- **Penny Copper** (tier 1) — abundant surface deposits
- **Tinstone** (tier 1) — alloy partner to copper
- **Pig Iron Ore** (tier 2) — first significant ore
- **Blackcoal** (tier 4) — essential fuel for smelting
- **Wardenstone** (tier 5) — the midgame workhorse ore
- **Blackbar Seam** (tier 6) — high-tier ore for elite alloys
- **Blueglass Ore** (tier 8) — magical mineral, not a metal
- **Starfall Ore** (tier 12) — endgame mythic material

See [`ores-and-stone.md`](ores-and-stone.md) for full definitions.

### 2. Woods and Timber

Source: Woodcutting. The organic backbone of construction and craft.

Canonical ladder:
- **Oldroad Oak** (tier 2) — basic construction and bow wood
- **Riverwillow** (tier 3) — fast-growing, softwood
- **Bellmaple** (tier 4) — balanced hardwood
- **Warden Yew** (tier 5) — premium bow wood
- **Witchwood** (tier 8) — magical timber for elite bows
- **Crownheart** (tier 11) — ancient hardwood for master carpentry
- **Starfall Ash** (tier 12) — endgame mythic timber

See [`woods-and-timber.md`](woods-and-timber.md) for full definitions.

### 3. Fish and Cooking

Source: Fishing. The primary food source and healing commodity.

Canonical ladder:
- **Ditch Shrimp** (tier 1) — starting catch
- **Tinfin** (tier 2) — small coastal fish
- **Bell Herring** (tier 3) — common market fish
- **Brook Trout** (tier 4) — first river fish
- **Redback Salmon** (tier 6) — mid-tier river fish
- **Rockclaw** (tier 8) — first profitable ocean catch
- **Deepwater Eel** (tier 9) — mid-tier ocean staple
- **Glass Eel** (tier 10) — high-tier translucent eel
- **Argent Ray** (tier 11) — near-mastery flatfish
- **Crown Turtle** (tier 12) — rare, slow, valuable
- **Starfall Crab** (tier 12) — endgame deep-sea catch

See [`fish-and-cooking.md`](fish-and-cooking.md) for full definitions.

### 4. Hides, Bones, and Trophies

Source: Trapping. The material base for tailoring and handicraft.

Canonical ladder:
- **Rabbit Hide** (tier 1) — starting material
- **Bird Feathers** (tier 1) — arrow fletching
- **Fox Hide** (tier 3) — soft leather
- **Wolf Pelt** (tier 5) — tough midgame hide
- **Bear Hide** (tier 7) — thick durable leather
- **Drakebone** (tier 10) — elite bone for Blueglass firing
- **Drakeskin** (tier 10) — elite hide for top-tier gear
- **Starfall Trophy** (tier 12) — endgame trophy for mastery keepsakes

See [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) for full definitions.

### 5. Herbs, Roots, and Fungi

Source: Gardening. The material base for apothecary and cooking.

Canonical ladder:
- **Graveyard Moss** (tier 1) — starter herb
- **Warden Herb** (tier 5) — midgame herb
- **Blueglass Cap** (tier 8) — magical mushroom
- **Crownroot** (tier 11) — rare root
- **Starfall Petal** (tier 12) — endgame flower

See [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) for full definitions.

### 6. Bead Materials

Source: Mining + Hearthcraft. The material base for beadwork and magic.

Canonical ladder:
- **Glass Sand** (tier 3) — from panning riverbeds
- **Bead Clay** (tier 1) — starter blank material
- **Wardenstone Shard** (tier 5) — midgame mineral
- **Blueglass Crystal** (tier 8) — high-tier mineral
- **Starfall Bead Blank** (tier 12) — endgame blank

See [`bead-materials.md`](bead-materials.md) for full definitions.

---

## Banned Names

The following names are **banned** from Old Town content. They represent generic fantasy or OSRS-coded materials that conflict with the world's cultural identity.

| Banned Name | Canonical Replacement | Reason |
|-------------|----------------------|--------|
| mithril | Wardenstone | Generic fantasy metal |
| adamantite | Blackbar seam | Generic fantasy metal |
| runite | Blueglass ore | Generic fantasy metal |
| magic tree | Witchwood | Generic fantasy name |
| elder tree | Crownheart | Generic fantasy name |
| dragon | Drake | Generic fantasy creature |
| dragon bones | Drakebone | Generic fantasy material |
| shark | Glass eel | Generic fantasy fish |
| swordfish | Deepwater eel | Generic fantasy fish |
| manta ray | Argent ray | Generic fantasy fish |
| sea turtle | Crown turtle | Generic fantasy creature |
| dark crab | Starfall crab | Generic fantasy name |

---

## Design Rules

1. **No banned names.** Every resource must use a canonical Old Town name.
2. **No tier gaps.** If a tier exists in the equipment ladder, the resource ladder should have a corresponding resource.
3. **Place names in resources.** Resources should evoke Old Town geography: rivers, roads, towns, and landmarks.
4. **Cultural names in endgame.** The top three tiers use the cultural tier names: Blueglass, Carmine, Argent, Crownsteel, Starfall.
5. **Kebab-case IDs.** All item IDs use lowercase with hyphens.
6. **Raw / cooked prefix.** Fish and meat use `raw_` and `cooked_` prefixes.
7. **No dead-end resources.** Every resource must be consumed by at least one production skill.

---

## Related Documents

- [`00-index.md`](00-index.md) — Resources navigation hub
- [`ores-and-stone.md`](ores-and-stone.md) — Mining resources
- [`woods-and-timber.md`](woods-and-timber.md) — Woodcutting resources
- [`fish-and-cooking.md`](fish-and-cooking.md) — Fishing resources
- [`hides-bones-and-trophies.md`](hides-bones-and-trophies.md) — Trapping resources
- [`herbs-roots-and-fungi.md`](herbs-roots-and-fungi.md) — Gardening resources
- [`bead-materials.md`](bead-materials.md) — Beadwork resources
- [`../skills/00-index.md`](../skills/00-index.md) — Skills navigation hub

---

*Total resource categories: 6*
*Total banned names: 12*
*Last updated: 2026-05-30*
