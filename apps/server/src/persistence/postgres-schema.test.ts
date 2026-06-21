import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DisabledPersistenceAdapter } from "./adapter";
import { createPersistenceAdapter } from "./factory";

const REQUIRED_TABLES = [
  "accounts",
  "characters",
  "character_skills",
  "character_inventory",
  "character_equipment",
  "character_quest_vars",
  "character_unlocked_content",
  "character_bank",
  "world_ground_items",
  "audit_item_transactions",
] as const;

const REQUIRED_INDEXES = [
  "idx_characters_account_id",
  "idx_character_skills_character_id",
  "idx_character_inventory_character_id",
  "idx_character_equipment_character_id",
  "idx_character_quest_vars_character_id",
  "idx_character_unlocked_content_character_id",
  "idx_character_bank_character_id",
  "idx_world_ground_items_visibility",
  "idx_audit_item_transactions_character_id",
  "idx_audit_item_transactions_character_tick",
] as const;

describe("PostgreSQL persistence schema", () => {
  it("declares every POC_SPEC section 20 persistence table and required indexes", async () => {
    const sql = await readMigration("0001_persistence_schema.up.sql");

    for (const table of REQUIRED_TABLES) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i"));
    }
    for (const index of REQUIRED_INDEXES) {
      expect(sql).toMatch(new RegExp(`CREATE (UNIQUE )?INDEX IF NOT EXISTS ${index}\\b`, "i"));
    }
    expect(sql).toMatch(/audit_item_transactions\s*\([\s\S]*character_id uuid NOT NULL/i);
    expect(sql).toMatch(/audit_item_transactions\s*\([\s\S]*metadata jsonb NOT NULL/i);
    expect(sql).toMatch(/world_ground_items\s*\([\s\S]*owner_character_id uuid/i);
  });

  it("keeps PostgreSQL schema files decoupled from the default dev adapter", async () => {
    const adapter = createPersistenceAdapter({
      enabled: false,
      filePath: "unused.json",
    });

    expect(adapter).toBeInstanceOf(DisabledPersistenceAdapter);
  });
});

describe("PostgreSQL persistence subsystem schema (0002)", () => {
  it("adds the versioned character_state snapshot table", async () => {
    const sql = await readMigration("0002_persistence_subsystem.up.sql");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS character_state\b/i);
    expect(sql).toMatch(/character_state[\s\S]*version bigint NOT NULL/i);
    expect(sql).toMatch(/character_state[\s\S]*content_version integer NOT NULL/i);
    expect(sql).toMatch(/character_state[\s\S]*skills jsonb NOT NULL/i);
  });

  it("adds the world_sessions lease table for one-live-owner-per-character", async () => {
    const sql = await readMigration("0002_persistence_subsystem.up.sql");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS world_sessions\b/i);
    expect(sql).toMatch(/world_sessions[\s\S]*lease_expires_at bigint NOT NULL/i);
    expect(sql).toMatch(/world_sessions[\s\S]*session_id text NOT NULL/i);
  });

  it("hardens the item ledger with content version and an idempotency unique index", async () => {
    const sql = await readMigration("0002_persistence_subsystem.up.sql");
    expect(sql).toMatch(/ALTER TABLE audit_item_transactions[\s\S]*idempotency_key text/i);
    expect(sql).toMatch(/ALTER TABLE audit_item_transactions[\s\S]*content_version integer/i);
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_item_transactions_idempotency\b/i,
    );
    expect(sql).toMatch(/WHERE idempotency_key IS NOT NULL/i);
  });

  it("provides a reversible down migration", async () => {
    const sql = await readMigration("0002_persistence_subsystem.down.sql");
    expect(sql).toMatch(/DROP TABLE IF EXISTS world_sessions/i);
    expect(sql).toMatch(/DROP TABLE IF EXISTS character_state/i);
    expect(sql).toMatch(/DROP INDEX IF EXISTS idx_audit_item_transactions_idempotency/i);
  });
});

async function readMigration(fileName: string): Promise<string> {
  return readFile(join(process.cwd(), "apps/server/migrations", fileName), "utf8");
}
