import type {
  DialogueDef,
  ItemDef,
  NpcDef,
  ObjectDef,
  QuestDef,
  QuestStage,
  SkillDef,
  SpellDef,
} from "@old-town/shared";

export interface ContentClientRegistries {
  readonly item: Record<string, ItemDef>;
  readonly npc: Record<string, NpcDef>;
  readonly object: Record<string, ObjectDef>;
  readonly skill: Record<string, SkillDef>;
  readonly spell: Record<string, SpellDef>;
  readonly quest: Record<string, QuestDef>;
  readonly dialogue: Record<string, DialogueDef>;
}

/**
 * Client-side content loader. Fetches the validated content registries from the
 * server once on startup and provides lookup methods for UI panels.
 */
export class ContentClient {
  private _registries: ContentClientRegistries | undefined;
  private _ready = false;
  private readonly _questStageCache = new Map<string, Map<number, QuestStage>>();

  get ready(): boolean {
    return this._ready;
  }

  async load(serverUrl: string): Promise<void> {
    const url = new URL(
      "/api/content",
      serverUrl.replace("ws://", "http://").replace("wss://", "https://"),
    );
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as ContentClientRegistries;
    this._registries = data;
    this._ready = true;
  }

  getItem(id: string): ItemDef | undefined {
    return this._registries?.item[id];
  }

  getNpc(id: string): NpcDef | undefined {
    return this._registries?.npc[id];
  }

  getObject(id: string): ObjectDef | undefined {
    return this._registries?.object[id];
  }

  getSkill(id: string): SkillDef | undefined {
    return this._registries?.skill[id];
  }

  getSpell(id: string): SpellDef | undefined {
    return this._registries?.spell[id];
  }

  getQuest(id: string): QuestDef | undefined {
    return this._registries?.quest[id];
  }

  getDialogue(id: string): DialogueDef | undefined {
    return this._registries?.dialogue[id];
  }

  getQuestStage(questId: string, stage: number): QuestStage | undefined {
    const cached = this._questStageCache.get(questId);
    if (cached) {
      return cached.get(stage);
    }
    const quest = this.getQuest(questId);
    if (!quest) return undefined;
    const stageMap = new Map<number, QuestStage>(quest.stages.map((s) => [s.stage, s]));
    this._questStageCache.set(questId, stageMap);
    return stageMap.get(stage);
  }

  getAllSkills(): SkillDef[] {
    return Object.values(this._registries?.skill ?? {});
  }

  getAllSpells(): SpellDef[] {
    return Object.values(this._registries?.spell ?? {});
  }

  getAllQuests(): QuestDef[] {
    return Object.values(this._registries?.quest ?? {});
  }
}
