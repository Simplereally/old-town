---
doc_type: authority
canonical_path: docs/recipes/recipe-system.md
parent_index: docs/recipes/00-index.md
root_index: docs/00-index.md
---

Parent: [`Recipes Index`](00-index.md)

Authority references:
- `docs/recipes/00-index.md`
- `docs/tools-and-intermediates/tool-system.md`
- `docs/tools-and-intermediates/stations.md`
- `POC_SPEC.md`

# Recipe System

Recipes are content definitions. Systems execute recipes; they do not hardcode specific production behavior.

## Recipe Families

| Family | Example |
|--------|---------|
| Refining | Ore to bar, hide to leather, log to plank |
| Assembly | Bar plus rivets to armour |
| Finishing | Unstrung bow plus sinew cord to bow |
| Batching | Shafts plus feathers plus heads to arrows |
| Cooking | Raw fish to cooked fish, ingredients to pie or stew |
| Mixing | Herb plus phial plus secondary to potion |
| Coating | Oil or poison applied to weapon or ammo |
| Firing | Bead blank to fired bead |
| Stringing | Fired beads plus cord to bead strand |
| Surveying | Blank map plus landmark data to chart |
| Forgery | Blank writ plus seal plus Sleight check to forged document |
| Contracting | Warden contract plus proof item to reward |

## Recipe Fields

| Field | Rule |
|-------|------|
| Recipe ID | Use kebab-case IDs and keep them stable once content ships |
| Skill | Exactly one skill receives XP for the action |
| Level | Gate the action by skill level, not client state |
| XP | Keep provisional until balancing, but never omit |
| Action ticks | Use 600ms ticks; no sleep or animation callback gameplay |
| Tool | Name the required item family or exact item |
| Station | Name the required object when advanced work needs a place |
| Inputs | List consumed item IDs and quantities |
| Outputs | List produced item IDs and quantities |
| Failure | Explicitly define burn, waste, partial refund, or none |
| Byproduct | Define useful scraps when the loop needs an economy hook |
| Unlock source | Default, quest, guild, shop, drop, or Wardenry contract |
| Economy role | Training, profit, utility, PvP, PvE, or prestige |

## Design Rules

1. No recipe without a reason. It must support training, profit, questing, combat, skilling, convenience, or prestige.
2. No hidden hardcoding. Recipes are content definitions.
3. Stations matter. Advanced recipes should pull players into towns, guilds, camps, shrines, and workshops.
4. Tools matter without clutter. Starter recipes need one obvious tool. Advanced recipes can require tool plus station.
5. Intermediates should create trade. Not every player should gather every input.
6. Batching is first class. Arrows, darts, bolts, beads, phials, and food prep need batch production.
7. Failures should be flavourful. Burned food, cracked beads, slag, scraps, and spilled mixtures are better than generic failure.
8. Byproducts are economy hooks. Ash, scraps, bones, offcuts, empty phials, and slag should feed later loops.
9. Unlocks can come later. Quest, guild, and contract recipes do not need to be known at level 1.
10. Starter identity chains must be smooth. Full Penny, Full Lath, Full Patch, and Full Chalk should be understandable.

## Server Authority

The server validates the recipe, skill level, inventory inputs, tool, station proximity, tick timing, failure result, outputs, and XP. The client sends intent only.

