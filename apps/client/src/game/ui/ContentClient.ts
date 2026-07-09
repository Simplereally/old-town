import type {
  AudioCategory,
  AudioDef,
  ContentClientRegistries,
  DialogueDef,
  ItemDef,
  MaterialDef,
  NpcDef,
  ObjectDef,
  QuestDef,
  QuestStage,
  SkillDef,
  SpellDef,
} from "@old-town/shared";

export type { ContentClientRegistries } from "@old-town/shared";

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

  async load(httpBaseUrl: string): Promise<void> {
    const url = new URL("/api/content", httpBaseUrl);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
    }
    const raw: unknown = await response.json();
    if (raw === null || typeof raw !== "object") {
      throw new Error("Invalid content response: expected an object");
    }
    // The server is authoritative and validates content with Zod on boot.
    // The client trusts the server's /api/content response — no runtime Zod needed.
    this._registries = raw as ContentClientRegistries;
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

  getMaterial(id: string): MaterialDef | undefined {
    return this._registries?.material[id];
  }

  getAllMaterials(): Record<string, MaterialDef> {
    return this._registries?.material ?? {};
  }

  getAudio(id: string): AudioDef | undefined {
    return this._registries?.audio[id];
  }

  getAllAudio(): Record<string, AudioDef> {
    return this._registries?.audio ?? {};
  }

  getAudioByCategory(category: AudioCategory): readonly AudioDef[] {
    return Object.values(this._registries?.audio ?? {}).filter((def) => def.category === category);
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

  getAllSkills(): readonly SkillDef[] {
    return Object.values(this._registries?.skill ?? {});
  }

  getAllSpells(): readonly SpellDef[] {
    return Object.values(this._registries?.spell ?? {});
  }

  getAllQuests(): readonly QuestDef[] {
    return Object.values(this._registries?.quest ?? {});
  }
}
