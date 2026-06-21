/**
 * In-memory {@link SqlClient} test double.
 *
 * Dispatches on the leading `op:<name>` block-comment tag carried by every statement (parsed by
 * {@link readOpTag}) rather than parsing SQL, so it stays a faithful model of the few operations
 * the persistence layer issues — enough to exercise optimistic versioning, idempotent ledger
 * writes, and lease ownership end-to-end without a real PostgreSQL. Imported only by tests.
 */
import type { SqlClient, SqlQueryResult, SqlRow, SqlValue } from "./sql-client";
import { readOpTag } from "./statements";

interface CharacterRow {
  id: string;
  characterName: string;
  worldId: string;
  tileX: number;
  tileY: number;
  plane: number;
  health: number;
  maxHealth: number;
}

interface CharacterStateRecord {
  version: number;
  contentVersion: number;
  worldId: string;
  tileX: number;
  tileY: number;
  plane: number;
  health: number;
  maxHealth: number;
  combatStyle: string | null;
  skills: unknown;
  inventory: unknown;
  equipment: unknown;
  bank: unknown;
  questVars: unknown;
  savedAt: number;
}

interface AuditRecord {
  id: number;
  tick: number;
  characterId: string;
  itemId: string;
  quantity: number;
  reason: string;
  beforeQuantity: number | null;
  afterQuantity: number | null;
  contentVersion: number;
  idempotencyKey: string | null;
  metadata: unknown;
}

interface WorldSessionRecord {
  characterId: string;
  worldId: string;
  sessionId: string;
  leaseExpiresAt: number;
  lastHeartbeatAt: number;
}

interface OutboxRecord {
  id: number;
  topic: string;
  payload: Record<string, unknown>;
  processed: boolean;
}

export class InMemorySqlClient implements SqlClient {
  private nextCharacterSeq = 0;
  private nextAuditId = 0;
  private nextOutboxId = 0;
  private readonly characters = new Map<string, CharacterRow>();
  private readonly characterState = new Map<string, CharacterStateRecord>();
  private readonly audit: AuditRecord[] = [];
  private readonly idempotencyKeys = new Set<string>();
  private readonly worldSessions = new Map<string, WorldSessionRecord>();
  private readonly economyCommits = new Map<string, string>();
  private readonly outbox: OutboxRecord[] = [];
  /** Records every executed op for assertions about which statements ran. */
  readonly executedOps: string[] = [];

  async query<Row extends SqlRow = SqlRow>(
    text: string,
    params: readonly SqlValue[] = [],
  ): Promise<SqlQueryResult<Row>> {
    const op = readOpTag(text);
    if (!op) {
      throw new Error(`InMemorySqlClient received an untagged statement: ${text.slice(0, 60)}`);
    }
    this.executedOps.push(op);
    const result = this.dispatch(op, params);
    return { rows: result.rows as Row[], rowCount: result.rowCount };
  }

  async transaction<T>(fn: (tx: SqlClient) => Promise<T>): Promise<T> {
    // A single shared store needs no isolation for tests; optimistic checks still hold because
    // statements observe current state. Run on the same client.
    return fn(this);
  }

  async close(): Promise<void> {
    // Nothing to release.
  }

  private dispatch(op: string, params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    switch (op) {
      case "ping":
        return rows([{ ok: 1 }]);
      case "characters.find-by-dev-name":
      case "characters.resolve-id":
        return this.findCharacterByName(str(params[0]));
      case "characters.insert-dev":
        return this.insertCharacter(params);
      case "characters.update-headline":
        return this.updateHeadline(params);
      case "character_state.load-by-dev-name":
        return this.loadStateByName(str(params[0]));
      case "character_state.find-version":
        return this.findStateVersion(str(params[0]));
      case "character_state.insert":
        return this.insertState(params);
      case "character_state.update-optimistic":
        return this.updateStateOptimistic(params);
      case "audit.insert":
        return this.insertAudit(params);
      case "audit.recent":
        return this.recentAudit(num(params[0]));
      case "world_session.get":
        return this.getSession(str(params[0]));
      case "world_session.acquire":
        return this.acquireSession(params);
      case "world_session.renew":
        return this.renewSession(params);
      case "world_session.release":
        return this.releaseSession(params);
      case "economy.try-insert-commit":
        return this.tryInsertEconomyCommit(params);
      case "economy.lock-commit":
        return this.lockEconomyCommit(str(params[0]));
      case "economy.insert-outbox":
        return this.insertOutbox(params);
      case "economy.drain-outbox":
        return this.drainOutbox(num(params[0]));
      case "economy.mark-outbox":
        return this.markOutbox(params);
      default:
        throw new Error(`InMemorySqlClient has no handler for op:${op}`);
    }
  }

  private findCharacterByName(name: string): { rows: SqlRow[]; rowCount: number } {
    const found = [...this.characters.values()].find(
      (c) => c.characterName.toLowerCase() === name.toLowerCase(),
    );
    return found ? rows([{ id: found.id }]) : rows([]);
  }

  private insertCharacter(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const id = `char-uuid-${++this.nextCharacterSeq}`;
    this.characters.set(id, {
      id,
      characterName: str(params[0]),
      worldId: str(params[1]),
      tileX: num(params[2]),
      tileY: num(params[3]),
      plane: num(params[4]),
      health: num(params[5]),
      maxHealth: num(params[6]),
    });
    return rows([{ id }]);
  }

  private updateHeadline(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const character = this.characters.get(str(params[0]));
    if (!character) {
      return { rows: [], rowCount: 0 };
    }
    character.worldId = str(params[1]);
    character.tileX = num(params[2]);
    character.tileY = num(params[3]);
    character.plane = num(params[4]);
    character.health = num(params[5]);
    character.maxHealth = num(params[6]);
    return { rows: [], rowCount: 1 };
  }

  private loadStateByName(name: string): { rows: SqlRow[]; rowCount: number } {
    const character = [...this.characters.values()].find(
      (c) => c.characterName.toLowerCase() === name.toLowerCase(),
    );
    if (!character) {
      return rows([]);
    }
    const state = this.characterState.get(character.id);
    if (!state) {
      return rows([]);
    }
    return rows([
      {
        character_id: character.id,
        version: state.version,
        content_version: state.contentVersion,
        world_id: state.worldId,
        tile_x: state.tileX,
        tile_y: state.tileY,
        plane: state.plane,
        health: state.health,
        max_health: state.maxHealth,
        combat_style: state.combatStyle,
        skills: state.skills,
        inventory: state.inventory,
        equipment: state.equipment,
        bank: state.bank,
        quest_vars: state.questVars,
        saved_at: state.savedAt,
      },
    ]);
  }

  private findStateVersion(characterId: string): { rows: SqlRow[]; rowCount: number } {
    const state = this.characterState.get(characterId);
    return state ? rows([{ version: state.version }]) : rows([]);
  }

  private insertState(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const characterId = str(params[0]);
    this.characterState.set(characterId, {
      version: 1,
      ...stateFromParams(params, 1),
    });
    return { rows: [], rowCount: 1 };
  }

  private updateStateOptimistic(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const characterId = str(params[0]);
    const expected = num(params[1]);
    const state = this.characterState.get(characterId);
    if (!state || state.version !== expected) {
      return { rows: [], rowCount: 0 };
    }
    this.characterState.set(characterId, {
      version: state.version + 1,
      ...stateFromParams(params, 2),
    });
    return { rows: [], rowCount: 1 };
  }

  private insertAudit(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const idempotencyKey = params[8] === null ? null : str(params[8]);
    if (idempotencyKey !== null && this.idempotencyKeys.has(idempotencyKey)) {
      return { rows: [], rowCount: 0 };
    }
    if (idempotencyKey !== null) {
      this.idempotencyKeys.add(idempotencyKey);
    }
    this.audit.push({
      id: ++this.nextAuditId,
      tick: num(params[0]),
      characterId: str(params[1]),
      itemId: str(params[2]),
      quantity: num(params[3]),
      reason: str(params[4]),
      beforeQuantity: params[5] === null ? null : num(params[5]),
      afterQuantity: params[6] === null ? null : num(params[6]),
      contentVersion: num(params[7]),
      idempotencyKey,
      metadata: params[9] ?? {},
    });
    return { rows: [], rowCount: 1 };
  }

  private recentAudit(limit: number): { rows: SqlRow[]; rowCount: number } {
    const ordered = [...this.audit].sort((a, b) => b.id - a.id).slice(0, limit);
    return rows(
      ordered.map((entry) => ({
        id: entry.id,
        tick: entry.tick,
        character_id: this.characters.get(entry.characterId)?.characterName ?? entry.characterId,
        item_id: entry.itemId,
        quantity: entry.quantity,
        reason: entry.reason,
        before_quantity: entry.beforeQuantity,
        after_quantity: entry.afterQuantity,
        idempotency_key: entry.idempotencyKey,
        metadata: entry.metadata,
      })),
    );
  }

  private getSession(characterId: string): { rows: SqlRow[]; rowCount: number } {
    const session = this.worldSessions.get(characterId);
    if (!session) {
      return rows([]);
    }
    return rows([
      {
        character_id: session.characterId,
        world_id: session.worldId,
        session_id: session.sessionId,
        lease_expires_at: session.leaseExpiresAt,
        last_heartbeat_at: session.lastHeartbeatAt,
      },
    ]);
  }

  /** Models the atomic acquire upsert: insert when absent; update only when expired or same session. */
  private acquireSession(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const characterId = str(params[0]);
    const sessionId = str(params[2]);
    const now = num(params[5]);
    const existing = this.worldSessions.get(characterId);
    const isUpdate = existing !== undefined;
    if (existing && existing.leaseExpiresAt >= now && existing.sessionId !== sessionId) {
      return { rows: [], rowCount: 0 };
    }
    this.worldSessions.set(characterId, {
      characterId,
      worldId: str(params[1]),
      sessionId,
      leaseExpiresAt: num(params[3]),
      lastHeartbeatAt: num(params[4]),
    });
    return rows([{ was_update: isUpdate }]);
  }

  private renewSession(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const session = this.worldSessions.get(str(params[0]));
    if (!session || session.sessionId !== str(params[1])) {
      return { rows: [], rowCount: 0 };
    }
    session.leaseExpiresAt = num(params[2]);
    session.lastHeartbeatAt = num(params[3]);
    return { rows: [], rowCount: 1 };
  }

  private releaseSession(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const session = this.worldSessions.get(str(params[0]));
    if (!session || session.sessionId !== str(params[1])) {
      return { rows: [], rowCount: 0 };
    }
    this.worldSessions.delete(str(params[0]));
    return { rows: [], rowCount: 1 };
  }

  /** INSERT ON CONFLICT DO NOTHING RETURNING — owns the key if it returns a row. */
  private tryInsertEconomyCommit(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const key = str(params[0]);
    const hash = str(params[1]);
    if (this.economyCommits.has(key)) {
      return rows([]);
    }
    this.economyCommits.set(key, hash);
    return rows([{ payload_hash: hash }]);
  }

  private lockEconomyCommit(key: string): { rows: SqlRow[]; rowCount: number } {
    const hash = this.economyCommits.get(key);
    return hash === undefined ? rows([]) : rows([{ payload_hash: hash }]);
  }

  private insertOutbox(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    this.outbox.push({
      id: ++this.nextOutboxId,
      topic: str(params[0]),
      payload: (params[1] ?? {}) as Record<string, unknown>,
      processed: false,
    });
    return { rows: [], rowCount: 1 };
  }

  private drainOutbox(limit: number): { rows: SqlRow[]; rowCount: number } {
    const pending = this.outbox.filter((event) => !event.processed).slice(0, limit);
    return rows(pending.map((event) => ({ id: event.id, topic: event.topic, payload: event.payload })));
  }

  private markOutbox(params: readonly SqlValue[]): { rows: SqlRow[]; rowCount: number } {
    const ids = new Set((params[0] as unknown as readonly number[]).map((id) => Number(id)));
    let count = 0;
    for (const event of this.outbox) {
      if (ids.has(event.id) && !event.processed) {
        event.processed = true;
        count += 1;
      }
    }
    return { rows: [], rowCount: count };
  }
}

function stateFromParams(
  params: readonly SqlValue[],
  offset: number,
): Omit<CharacterStateRecord, "version"> {
  return {
    contentVersion: num(params[offset]),
    worldId: str(params[offset + 1]),
    tileX: num(params[offset + 2]),
    tileY: num(params[offset + 3]),
    plane: num(params[offset + 4]),
    health: num(params[offset + 5]),
    maxHealth: num(params[offset + 6]),
    combatStyle: params[offset + 7] === null ? null : str(params[offset + 7]),
    skills: params[offset + 8],
    inventory: params[offset + 9],
    equipment: params[offset + 10],
    bank: params[offset + 11],
    questVars: params[offset + 12],
    savedAt: num(params[offset + 13]),
  };
}

function rows(value: SqlRow[]): { rows: SqlRow[]; rowCount: number } {
  return { rows: value, rowCount: value.length };
}

function str(value: SqlValue): string {
  if (typeof value === "string") {
    return value;
  }
  throw new TypeError(`Expected a string param, received ${typeof value}`);
}

function num(value: SqlValue): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  throw new TypeError(`Expected a numeric param, received ${typeof value}`);
}
