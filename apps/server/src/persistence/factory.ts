import {
  DisabledPersistenceAdapter,
  JsonFilePersistenceAdapter,
  type PersistenceAdapter,
} from "./adapter";

export interface PersistenceAdapterConfig {
  readonly enabled: boolean;
  readonly filePath: string;
}

export function createPersistenceAdapter(config: PersistenceAdapterConfig): PersistenceAdapter {
  if (!config.enabled) {
    return new DisabledPersistenceAdapter();
  }
  return new JsonFilePersistenceAdapter(config.filePath);
}
