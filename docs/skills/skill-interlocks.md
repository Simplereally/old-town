---
doc_type: authority
canonical_path: docs/skills/skill-interlocks.md
parent_index: docs/skills/00-index.md
system_index: docs/skills/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skills Index`](00-index.md)

Authority references:
- `POC_SPEC.md`
- `docs/skills/skill-system.md`
- `docs/skills/combat-skills.md`
- `docs/skills/gathering-skills.md`
- `docs/skills/production-skills.md`
- `docs/skills/utility-skills.md`
- `docs/favour/00-index.md`

# Skill Interlocks

## Philosophy

Skills form an economy, not isolated grinds. Every skill feeds another through tangible resources, tools, and dependencies. A miner without a smith is just a person with rocks. A smith without a miner is just a person with hammers. The web of interlocks ensures that no player, and no skill, exists in a vacuum.

## The Resource Web

| Skill | Produces | Consumes | Used By |
|-------|----------|----------|---------|
| Mining | Ores, stone, glass sand | Pickaxe (Smithing) | Smithing, Beadwork |
| Woodcutting | Logs, timber, kindling | Axe (Smithing) | Bowcraft, Carpentry, Hearthcraft |
| Fishing | Fish, pearls, shells | Rod (Smithing) | Cooking, Handicraft |
| Trapping | Hides, feathers, sinew | Traps (Smithing) | Tailoring, Bowcraft |
| Gardening | Herbs, crops, dye plants | Trowel (Smithing) | Apothecary, Cooking, Handicraft |
| Smithing | Weapons, armour, tools | Ores (Mining) | Arms, Might, Guard, Ranged, Magic, all gathering |
| Bowcraft | Bows, arrows, bolts, thrown parts | Logs (Woodcutting), sinew/feathers (Trapping) | Ranged |
| Tailoring | Leather armour, robes, capes | Hides (Trapping) | Guard, Ranged |
| Handicraft | Jewellery, charms, trophies | Gems (Mining), pearls/shells (Fishing), dye (Gardening) | All (accessories) |
| Beadwork | Spell beads, pouches, foci | Glass sand (Mining), kiln fire (Hearthcraft) | Magic |
| Apothecary | Potions, salves, poisons | Herbs (Gardening), water (Mining) | All (boosts) |
| Cooking | Food, combo food, teas | Fish (Fishing), crops (Gardening), meat (Trapping) | Vitality |
| Carpentry | Houses, workshops, stalls | Logs (Woodcutting), planks (Woodcutting) | Utility (housing) |
| Arms | Melee accuracy, monster ore drops | Weapons (Smithing) | Combat level, Mining (ore drops) |
| Might | Melee damage | Weapons (Smithing) | Combat level |
| Guard | Defence, zone access | Armour (Smithing/Tailoring) | Combat level, Wardenry (zone access) |
| Vitality | Health pool | Food (Cooking) | Combat level |
| Ranged | Ranged accuracy, meat bait | Bows/ammo (Bowcraft) | Combat level, Trapping (meat bait) |
| Magic | Spell accuracy | Magic weapons (Smithing), beads (Beadwork) | Combat level |
| Favour | Shrine boons, Favour points | Offerings, beads, candles, flowers, shrines | Wardenry, Magic, Hearthcraft |
| Wayfaring | Shortcuts, stamina | None (body) | Cartography |
| Sleight | Loot, coins, forged documents, smuggled goods | None (body) | Wardenry (forged permits), Handicraft (stolen gems), Market (coins) |
| Wardenry | Bounty loot, trophy tokens, monster parts | Favour (Favour), forged documents (Sleight) | Handicraft (trophies), Tailoring (rare hides), Smithing (drakebone for Blueglass) |
| Hearthcraft | Fires, warmth, kiln fuel | Logs (Woodcutting), kindling (Woodcutting) | Cooking, Beadwork, Favour |
| Cartography | Maps, routes, surveys | Survey kit (Handicraft) | Wayfaring |

## Starter Identity Paths

| Identity | Path | Skills | Result |
|----------|------|--------|--------|
| Full Penny | Mining → Smithing → Arms/Might/Guard | Mining, Smithing, Arms, Might, Guard | Melee warrior |
| Full Lath | Woodcutting → Bowcraft → Ranged | Woodcutting, Bowcraft, Ranged | Ranged specialist |
| Full Patch | Trapping → Tailoring → Ranged/Guard | Trapping, Tailoring, Ranged, Guard | Ranged skirmisher |
| Full Chalk | Mining/Gardening/Hearthcraft → Beadwork → Magic | Mining, Gardening, Hearthcraft, Beadwork, Magic | Magic user |

## Loop Examples

### Combat Loop

Kill creatures for drops. Sell or process drops into smithing materials. Smith better weapons and armour. Equip the new gear. Kill stronger creatures. The loop tightens as higher-level monsters drop rarer materials, which smith into better gear, which unlocks harder monsters.

### Gatherer Loop

Find a resource node. Extract the resource. Craft it into a good or sell it raw. Use the profit to buy a better tool. Return to a harder node with the better tool. The tool upgrade from Smithing is the gate that lets the gatherer reach higher-tier resources.

### Crafter Loop

Buy raw materials from gatherers or the market. Craft them into finished goods. Sell the goods for profit. Use the profit to buy better materials or tools. Craft higher-tier goods. The crafter's progression is tied to both their skill level and the quality of inputs they can afford.

### Explorer Loop

Train Wayfaring to unlock shortcuts and stamina. Use Cartography to map new regions and discover bounties. Complete Wardenry bounties for rewards. Spend Favour at shrines for boons that aid exploration. The loop rewards players who venture off the beaten path and document what they find.

## Dead-End Audit

| Skill | Has Input? | Has Output? | Output Type | Proof |
|-------|-----------|-------------|-------------|-------|
| Mining | Yes (tools) | Yes (ores) | Material | Smithing consumes ores |
| Woodcutting | Yes (tools) | Yes (logs) | Material | Bowcraft, Carpentry, and Hearthcraft consume logs |
| Fishing | Yes (tools) | Yes (fish) | Material | Cooking and Handicraft consume fish, pearls, and shells |
| Trapping | Yes (tools) | Yes (hides) | Material | Tailoring and Bowcraft consume hides, feathers, and sinew |
| Gardening | Yes (tools) | Yes (herbs) | Material | Apothecary, Cooking, and Handicraft consume herbs and crops |
| Smithing | Yes (ores) | Yes (gear) | Material | Arms, Might, Guard, Ranged, Magic, and all gathering skills consume smithing products |
| Bowcraft | Yes (logs, sinew, feathers) | Yes (bows, ammo) | Material | Ranged consumes bows and ammunition |
| Tailoring | Yes (hides) | Yes (armour) | Material | Guard and Ranged consume leather armour and robes |
| Handicraft | Yes (gems, pearls, dye) | Yes (jewellery) | Material | All combat skills consume accessories |
| Beadwork | Yes (glass sand, kiln fire) | Yes (beads) | Material | Magic and Favour consume spell beads and foci |
| Apothecary | Yes (herbs, water) | Yes (potions) | Material | All combat skills consume potions and salves |
| Cooking | Yes (fish, crops, meat) | Yes (food) | Material | Vitality consumes food for health pool growth |
| Carpentry | Yes (logs, planks) | Yes (housing) | Material / Access | Utility skills consume houses, workshops, and stalls |
| Arms | Yes (weapons) | Yes (accuracy) | Combat | Combat level consumes Arms for melee hit chance |
| Might | Yes (weapons) | Yes (damage) | Combat | Combat level consumes Might for melee damage output |
| Guard | Yes (armour) | Yes (defence) | Combat | Combat level consumes Guard for damage reduction |
| Vitality | Yes (food) | Yes (health) | Combat | Combat level consumes Vitality for total health pool |
| Ranged | Yes (bows, ammo) | Yes (accuracy) | Combat | Combat level consumes Ranged for ranged hit chance |
| Magic | Yes (magic weapons, beads) | Yes (accuracy) | Combat | Combat level consumes Magic for spell hit chance |
| Favour | Yes (beads, shrines) | Yes (boons) | Access / Combat | Wardenry consumes Favour points for bounty access |
| Wayfaring | Yes (none, body skill) | Yes (shortcuts) | Access | Cartography consumes Wayfaring discoveries for map data |
| Sleight | Yes (none, body skill) | Yes (loot, forged documents) | Economy / Access | Wardenry consumes forged permits; Handicraft consumes stolen gems for jewellery |
| Wardenry | Yes (favour, forged documents) | Yes (trophy tokens, monster parts) | Material / Access | Handicraft consumes trophy tokens; Tailoring consumes rare hides; Smithing consumes drakebone for Blueglass firing |
| Hearthcraft | Yes (logs, kindling) | Yes (fire) | Material / Access | Cooking, Beadwork, and Favour consume hearth fires |
| Cartography | Yes (survey kit) | Yes (maps) | Access | Wayfaring consumes maps for route planning |

## Closed Resource Loops

The following chains are explicit circular flows. Every node in the chain is a skill. Every arrow is a tangible resource.

### Loop A: Mining → Smithing → Arms → Mining

| Step | Output Skill | Consumed By | Resource |
|------|-------------|-------------|----------|
| 1 | Mining | Smithing | Copper ore, tin ore |
| 2 | Smithing | Arms | `pennywrought_shortblade` |
| 3 | Arms | Mining | Monster ore drops from slain creatures |

**Why this loop works:** The miner extracts ore for the smith. The smith forges weapons for the fighter. The fighter kills monsters that drop ore and stone, which the miner can gather. The smith also forges better pickaxes for the miner, unlocking higher-tier nodes.

### Loop B: Woodcutting → Bowcraft → Ranged → Trapping → Bowcraft

| Step | Output Skill | Consumed By | Resource |
|------|-------------|-------------|----------|
| 1 | Woodcutting | Bowcraft | Oak logs |
| 2 | Bowcraft | Ranged | `oak_shortbow` |
| 3 | Ranged | Trapping | Meat bait from slain creatures |
| 4 | Trapping | Bowcraft | Sinew for bowstrings, feathers for arrows |

**Why this loop works:** The woodcutter supplies logs for the bowcrafter. The bowcrafter makes bows for the ranger. The ranger kills creatures that yield meat bait for the trapper. The trapper uses that bait to catch higher-tier beasts, which yield sinew and feathers for the bowcrafter.

### Loop C: Wayfaring → Cartography → Wayfaring

| Step | Output Skill | Consumed By | Resource |
|------|-------------|-------------|----------|
| 1 | Wayfaring | Cartography | Shortcuts, stamina data |
| 2 | Cartography | Wayfaring | Maps, route plans |

**Why this loop works:** The wayfarer discovers shortcuts and stamina paths. The cartographer maps those discoveries into route plans. The wayfarer then uses those maps to plan even longer expeditions, finding new shortcuts to map.

### Loop D: Wardenry → Handicraft → Guard → Wardenry

| Step | Output Skill | Consumed By | Resource |
|------|-------------|-------------|----------|
| 1 | Wardenry | Handicraft | Trophy tokens, monster parts |
| 2 | Handicraft | Guard | Trophy accessories, rings, charms |
| 3 | Guard | Wardenry | Zone clearance for dangerous bounty areas |

**Why this loop works:** The warden completes bounties and brings back trophy tokens. The handicrafter turns those trophies into accessories that boost the guard's defence. The guard's training and equipment unlock access to even more dangerous zones where higher-tier bounties await.

## Skill Progression: Starter → Midgame → Endgame

Every skill in Old Town has a three-phase progression that mirrors the player's journey through the world. These phases are not rigid level brackets, but represent how the skill's role in the economy changes as the player grows.

| Skill | Starter (1–20) | Midgame (20–70) | Endgame (70–99) |
|-------|---------------|-----------------|-----------------|
| **Mining** | Chip copper and tin. Sell ore to smiths. | Quarry wardenstone and blackbar seams. Forge your own pickaxe. | Blast blueglass veins. Supply the server with starfall ore. |
| **Woodcutting** | Fell oak and willow. Sell logs for kindling. | Coppice maple and yew. Craft your own graveiron axe. | Tap witchwood and oldroad oak. Supply the bowcrafters. |
| **Fishing** | Net shrimp and sardines. Sell raw fish to cooks. | Angle for trout and salmon. Craft your own graveiron rod. | Dredge for glass eels and argent rays. Supply the feasts. |
| **Trapping** | Snare rabbits and birds. Sell feathers to fletchers. | Bait wolves and bears. Craft your own graveiron traps. | Track drakes for hides and drakebone. Supply the smiths. |
| **Gardening** | Sow allotments. Sell crops to the market. | Graft herbs and fruit trees. Craft your own graveiron trowel. | Harvest the starfall orchard. Supply the apothecaries. |
| **Smithing** | Smelt pennywrought bars. Repair cobbled gear. | Forge graveiron weapons and armour. Supply your combat skills. | Craft starfall bars for the server's endgame warriors. |
| **Bowcraft** | Fletch wooden arrows. String shortbows. | Shape graveiron crossbows and warbows. Supply your Ranged skill. | Craft starfall arrows for the server's endgame rangers. |
| **Tailoring** | Stitch leather jerkins. Sew rags into capes. | Craft graveiron range harnesses. Supply your Guard and Ranged. | Sew starfall capes for the mastery system. |
| **Handicraft** | Mould copper rings. Polish clay beads. | Chisel blueglass gems. Engrave graveiron trophies. | Craft starfall keepsakes for the server's masters. |
| **Beadwork** | Drill clay bead blanks. Fire pennywrought beads. | String graveiron beads for ward spells. | Fire starfall beads for the server's endgame mages. |
| **Apothecary** | Mix weak salves. Brew basic potions. | Distill graveiron brews for boosts. Supply your combat skills. | Decant starfall philtres for the server's warriors. |
| **Cooking** | Fry basic fish. Bake bread. | Stew graveiron pies and combo food. Supply your Vitality. | Prepare starfall banquets for the server's feasts. |
| **Carpentry** | Saw basic planks. Build simple furniture. | Frame graveiron workshops and storage. | Build starfall estates for the server's masters. |
| **Arms** | Slash with pennywrought blades. Learn to parry. | Lunge with graveiron longblades. Master the riposte. | Cleave with starfall greatblades. Lead the charge. |
| **Might** | Smash with basic hammers. Learn to bludgeon. | Heave graveiron mauls. Sunder blackbar armour. | Crush with starfall weapons. Break the wyrm's skull. |
| **Guard** | Block with cobbled shields. Brace for impact. | Deflect graveiron blows. Shield your allies. | Absorb starfall strikes. Become immovable. |
| **Vitality** | Endure. Recover by the fire. | Withstand graveiron wounds. Resist the wyrm's venom. | Survive the starfall blast. Live with a sliver. |
| **Ranged** | Nock wooden arrows. Loose at rabbits. | Draw graveiron crossbows. Loose at drakes. | Volley starfall arrows. Lead the ranged assault. |
| **Magic** | Invoke basic beads. Channel through wands. | Weave graveiron ward spells. Bind the wyrm. | Unleash the starfall codex. Command the battlefield. |
| **Favour** | Bless at the roadside shrine. Consecrate remains. | Invoke the warden's oath. Sanctify the contract zone. | Vow the starfall oath. Protect the entire raid. |
| **Wayfaring** | Shortcut low walls. Climb simple ropes. | Traverse rivers. Ferry across the Wardenbrook. | Sprint the rooftop highways. Reach any point in the town. |
| **Sleight** | Lift coins from common folk. Palm small items. | Jimmy graveiron locks. Forge permits for the warden. | Smuggle starfall contraband. Master the underworld. |
| **Wardenry** | Track basic beasts. Bind small predators. | Contract drakes. Cleanse the oldroad mine. | Claim legendary bounties. Hunt the world bosses. |
| **Hearthcraft** | Kindle campfires. Bank cooking fires. | Kiln-fire blueglass beads. Lamp-light the shrines. | Master the starfall kiln. Any fire works at peak. |
| **Cartography** | Survey local landmarks. Sketch the town. | Triangulate dungeon layouts. Chart the rivers. | Chart the entire world. Reveal every hidden place. |

**Rule:** The starter phase is about learning and basic supply. The midgame phase is about self-sufficiency and feeding your own combat skills. The endgame phase is about server-wide supply, mastery, and enabling other players.

## Design Rules

1. **Every skill must produce at least one of:** material output, access output, efficiency output, combat output, economy output, or narrative output. Combat and Utility skills may unlock access or routes rather than producing raw materials.
2. **No skill is an island.** Skills exist in a web of dependencies, not in isolation.
3. **Interlocks are documented in JSON, not hardcoded.**
4. **New skills must define their connections before their mechanics.**
5. **Starter identities are suggestions, not mandates.**
6. **Closed loops are self-sustaining at their tier:** a player can complete the loop without external market intervention.

## Related Documents

- [`00-index.md`](00-index.md)
- [`skill-system.md`](skill-system.md)
- [`combat-skills.md`](combat-skills.md)
- [`gathering-skills.md`](gathering-skills.md)
- [`production-skills.md`](production-skills.md)
- [`utility-skills.md`](utility-skills.md)
- [`../favour/00-index.md`](../favour/00-index.md)

*Total skills audited: 25*
*Dead ends: 0*
*Last updated: 2026-05-30*
