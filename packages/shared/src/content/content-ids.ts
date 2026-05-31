/**
 * Content identifier conventions.
 *
 * Every piece of content in Old Town is addressed by a **stable lowercase snake_case
 * string id**, never a legacy numeric id. Ids are authored by hand in JSON content and
 * referenced across the engine, so they must be human-readable, diff-friendly, and stable
 * across releases.
 *
 * Naming rule (all categories): `^[a-z][a-z0-9_]*$`, 1–64 characters.
 *   - items:        e.g. "penny_hatchet", "raw_reedfish"
 *   - npcs:         e.g. "town_guard", "river_rat"
 *   - objects:      e.g. "oak_tree", "copper_rock"
 *   - skills:       e.g. "woodcutting", "attack"
 *   - spells:       e.g. "ember_flick", "homeward_murmur"
 *   - quests:       e.g. "smoke_over_old_town"
 *   - drop tables:  e.g. "river_rat_drops"
 *   - animations:   e.g. "chop_swing", "human_walk"
 *   - materials:    e.g. "grass", "cobblestone"
 *   - assets:       e.g. "tree_oak", "icon_penny_hatchet"
 *
 * ORIGINALITY (POC_SPEC §23.3): Old Town uses original content only. Do NOT use OSRS /
 * Jagex item/NPC/object/animation ids, cache identifiers, asset names, map layouts,
 * protocol opcodes, or copied quest structures. Ids must be original Old Town names.
 */
import type { Brand, ItemId, NpcId, ObjectId } from "../types/ids";

export type SkillId = Brand<string, "SkillId">;
export type SpellId = Brand<string, "SpellId">;
export type QuestId = Brand<string, "QuestId">;
export type DropTableId = Brand<string, "DropTableId">;
export type AnimationId = Brand<string, "AnimationId">;
export type MaterialId = Brand<string, "MaterialId">;

/** Reference to an original art/audio asset (model, texture, icon, sound). */
export type AssetId = Brand<string, "AssetId">;

/** Maximum content id length. */
export const MAX_CONTENT_ID_LENGTH = 64;

/** Canonical content id pattern: lowercase snake_case, must start with a letter. */
export const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Whether a string is a valid content id. */
export function isContentId(value: string): boolean {
  return (
    value.length >= 1 && value.length <= MAX_CONTENT_ID_LENGTH && CONTENT_ID_PATTERN.test(value)
  );
}

function assertContentId(value: string, category: string): void {
  if (!isContentId(value)) {
    throw new Error(
      `Invalid ${category} id ${JSON.stringify(value)}: must match ${CONTENT_ID_PATTERN} (lowercase snake_case, 1-${MAX_CONTENT_ID_LENGTH} chars)`,
    );
  }
}

/** Validate and brand an item id. */
export function itemId(value: string): ItemId {
  assertContentId(value, "item");
  return value as ItemId;
}

/** Validate and brand an NPC id. */
export function npcId(value: string): NpcId {
  assertContentId(value, "npc");
  return value as NpcId;
}

/** Validate and brand an object id. */
export function objectId(value: string): ObjectId {
  assertContentId(value, "object");
  return value as ObjectId;
}

/** Validate and brand a skill id. */
export function skillId(value: string): SkillId {
  assertContentId(value, "skill");
  return value as SkillId;
}

/** Validate and brand a spell id. */
export function spellId(value: string): SpellId {
  assertContentId(value, "spell");
  return value as SpellId;
}

/** Validate and brand a quest id. */
export function questId(value: string): QuestId {
  assertContentId(value, "quest");
  return value as QuestId;
}

/** Validate and brand a drop-table id. */
export function dropTableId(value: string): DropTableId {
  assertContentId(value, "drop table");
  return value as DropTableId;
}

/** Validate and brand an animation id. */
export function animationId(value: string): AnimationId {
  assertContentId(value, "animation");
  return value as AnimationId;
}

/** Validate and brand a material id. */
export function materialId(value: string): MaterialId {
  assertContentId(value, "material");
  return value as MaterialId;
}

/** Validate and brand an asset id. */
export function assetId(value: string): AssetId {
  assertContentId(value, "asset");
  return value as AssetId;
}
