-- Down migration for 0001_persistence_schema.up.sql.

BEGIN;

DROP TABLE IF EXISTS audit_item_transactions;
DROP TABLE IF EXISTS world_ground_items;
DROP TABLE IF EXISTS character_bank;
DROP TABLE IF EXISTS character_unlocked_content;
DROP TABLE IF EXISTS character_quest_vars;
DROP TABLE IF EXISTS character_equipment;
DROP TABLE IF EXISTS character_inventory;
DROP TABLE IF EXISTS character_skills;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS accounts;

COMMIT;
