---
doc_type: authority
canonical_path: docs/recipes/recipe-chains.md
parent_index: docs/recipes/00-index.md
root_index: docs/00-index.md
---

Parent: [`Recipes Index`](00-index.md)

Authority references:
- `docs/skills/skill-interlocks.md`
- `docs/tools-and-intermediates/intermediate-items.md`
- `docs/recipes/recipe-system.md`
- `docs/world/starter-economy-loops.md`
- `docs/creatures/starter-drop-tables.md`
- `docs/favour/starter-favour-progression.md`
- `docs/quests/starter-quest-arc.md`
- `docs/economy/00-index.md`
- `docs/ledger/civic-ledger-system.md`

# Recipe Chains

Starter chains teach the economy. They should be short, readable, and achievable without hidden dependencies.

Shop prices and service fees for starter chains live in [`../economy/00-index.md`](../economy/00-index.md).

## Full Penny Chain

Town anchor: Foundry Row, Osric Penny, north quarry, Bellows Furnace, Anvil.

Quest hook: [`A Penny for the Forge`](../quests/a-penny-for-the-forge.md).

| Step | Skill | Inputs | Tool / Station | Output |
|------|-------|--------|----------------|--------|
| Gather ore | Mining | Penny Copper, Tinstone | Pickaxe | Ore stack |
| Smelt ingot | Smithing | Penny Copper, Tinstone | Bellows Furnace | Pennywrought Ingot |
| Forge gear | Smithing | Pennywrought Ingot | Pig Iron Hammer, Anvil | Pennywrought Shortblade, Helm, Ward |

Player language: "Mine copper and tinstone, smelt penny ingots, hammer out full penny."

## Full Lath Chain

Town anchor: Lath Yard, Letha Lath, Oldroad Gate, Bow Bench.

Quest hook: [`String Enough to Sing`](../quests/string-enough-to-sing.md).

| Step | Skill | Inputs | Tool / Station | Output |
|------|-------|--------|----------------|--------|
| Cut wood | Woodcutting | Lathwood or Oldroad Oak | Hatchet | Log |
| Make stave | Bowcraft | Lathwood Log | Whittling Knife | Lathwood Bow Stave |
| String bow | Bowcraft | Lathwood Bow Stave, Sinew Cord | Bow Bench | Lathwood Shortbow |
| Make arrows | Bowcraft | Arrow Shafts, Bellfeathers, Penny Arrowheads | Whittling Knife | Lathwood Arrows |

Player language: "Cut wood, make shafts, add feathers, string the bow."

Monster-fed inputs: Bellfeathers from Bell Bats or Road Crows, Sinew Cord from Bog Foxes.

## Full Patch Chain

Town anchor: Patch Lane, Nell Patch, south fields, Tanning Frame.

Quest hook: Nell's Good Hide, planned Full Patch quest.

| Step | Skill | Inputs | Tool / Station | Output |
|------|-------|--------|----------------|--------|
| Trap animals | Trapping | Rabbit Hide or Fox Hide | Twine Snare | Raw Hide |
| Cure hide | Tailoring | Raw Hide | Tanning Frame | Cured Hide |
| Stitch armour | Tailoring | Cured Hide | Bone Needle | Patchhide Coif, Jerkin, Chaps |

Player language: "Trap animals, cure hides, stitch full patch."

Monster-fed inputs: Wing Hide from Bell Bats, Fox Hide from Bog Foxes, torn cloth from Cellar Rats for Threadbare repairs.

## Full Chalk Chain

Town anchor: Chalkhouse Court, Mother Tallow, Bead Kiln, Bead Loom.

Quest hook: [`The Beadwife's Errand`](../quests/the-beadwifes-errand.md).

| Step | Skill | Inputs | Tool / Station | Output |
|------|-------|--------|----------------|--------|
| Gather material | Mining | Bead Clay or Glass Sand | Pickaxe or pan | Bead material |
| Light kiln | Hearthcraft | Fuel | Flintbox, Bead Kiln | Kiln fire |
| Shape blank | Beadwork | Bead Clay | Chalk Drill | Bead Clay Blank |
| Drill bead | Beadwork | Bead Clay Blank | Chalk Drill | Drilled Bead |
| Fire bead | Beadwork | Drilled Bead, glaze | Glaze Bowl, Bead Kiln | Chalkmarked Bead |
| String bead | Beadwork | Chalkmarked Bead, Bead Cord | Bead Loom | Bead string or focus item |

Player language: "Dig clay, drill beads, fire them, string them, cast with them."

Monster-fed inputs: Bone Chips and Grave Dust from Grave Mites, Echo Dust from Bell Bats, Blackcoal Ash from Ash Drake Whelps.

Favour crossover: bless beads at Shrine Hearth, dedicate Bone Chips and Grave Dust at Gravegate Shrine, and use Votive Beads for Favour/Magic recipes.

## Ledger Connections

Completing a recipe chain counts toward district deed tiers. See [`../ledger/district-deeds.md`](../ledger/district-deeds.md).

| Chain | District | Deed Tier Credit |
|-------|----------|------------------|
| Full Penny | Foundry Row | Stamped |
| Full Lath | Lath Yard | Stamped |
| Full Patch | Patch Lane | Stamped |
| Full Chalk | Chalkhouse Court | Stamped |

District deed rewards for production chains include service discounts and station access, not direct coin.
