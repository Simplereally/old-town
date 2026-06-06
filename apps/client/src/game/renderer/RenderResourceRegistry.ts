import type {
  BufferGeometry,
  Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshToonMaterial,
  Texture,
} from "three";
import {
  MeshBasicMaterial as ThreeMeshBasicMaterial,
  MeshLambertMaterial as ThreeMeshLambertMaterial,
  MeshToonMaterial as ThreeMeshToonMaterial,
  ShaderMaterial as ThreeShaderMaterial,
} from "three";

/** Canonical asset class for a renderable entity. */
export type RenderResourceType =
  | "terrain"
  | "prop"
  | "actor"
  | "projectile"
  | "hitsplat"
  | "groundItem"
  | "farDeco"
  | "ui";

/** Key that uniquely identifies a render resource across the client. */
export interface RenderResourceKey {
  readonly type: RenderResourceType;
  readonly contentId: string;
  readonly variant?: string;
  readonly materialId?: string;
}

/** Factory function that creates a BufferGeometry on demand. */
export type RenderGeometryFactory = () => BufferGeometry;

/** Factory function that creates a Material on demand. */
export type RenderMaterialFactory = () => Material;

/** Factory function that creates a Texture on demand. */
export type RenderTextureFactory = () => Texture;

/** Stats exposed for diagnostics (E35). */
export interface RenderResourceStats {
  readonly geometryCount: number;
  readonly materialCount: number;
  readonly textureCount: number;
  readonly liveResourceKeys: number;
}

interface ResourceEntry<T> {
  resource: T;
  refCount: number;
  disposed: boolean;
}

/** Normalise a key into a deterministic string so equivalent keys collide. */
function normalizeKey(key: RenderResourceKey): string {
  const variant = (key.variant ?? "").toLowerCase().trim();
  const materialId = (key.materialId ?? "").toLowerCase().trim();
  return `${key.type}:${key.contentId.toLowerCase().trim()}:${variant}:${materialId}`;
}

/**
 * Central registry for reusable geometries, materials, and textures.
 *
 * All shared render resources must be obtained through this registry. It
 * normalises keys, deduplicates equivalent requests, tracks reference counts,
 * and disposes resources exactly once.
 *
 * Built-in Three.js materials (MeshLambertMaterial, MeshToonMaterial,
 * MeshBasicMaterial) are the default gameplay path. A custom ShaderMaterial
 * may only be registered with an explicit `justification` string; this is
 * enforced at registration time so the policy is self-documenting.
 */
export class RenderResourceRegistry {
  private readonly geometries = new Map<string, ResourceEntry<BufferGeometry>>();
  private readonly materials = new Map<string, ResourceEntry<Material>>();
  private readonly textures = new Map<string, ResourceEntry<Texture>>();
  private readonly geometryFactories = new Map<string, RenderGeometryFactory>();
  private readonly materialFactories = new Map<string, RenderMaterialFactory>();
  private readonly textureFactories = new Map<string, RenderTextureFactory>();
  private readonly shaderJustifications = new Map<string, string>();
  private _disposed = false;

  /** Register a geometry factory for a given key. Idempotent. */
  registerGeometry(key: RenderResourceKey, factory: RenderGeometryFactory): void {
    const k = normalizeKey(key);
    if (!this.geometryFactories.has(k)) {
      this.geometryFactories.set(k, factory);
    }
  }

  /**
   * Register a material factory for a given key.
   *
   * If the factory returns a ShaderMaterial, a `justification` MUST be
   * provided and documented. This is the registry-level enforcement of the
   * material standard from `asset-baking-and-instancing.md` §12.
   */
  registerMaterial(
    key: RenderResourceKey,
    factory: RenderMaterialFactory,
    justification?: string,
  ): void {
    const k = normalizeKey(key);
    const needsJustification = this._factoryReturnsShaderMaterial(factory);
    if (needsJustification && (!justification || justification.trim().length === 0)) {
      throw new Error(
        `RenderResourceRegistry: custom ShaderMaterial for key "${k}" requires an explicit justification. ` +
          "See asset-baking-and-instancing.md §12.",
      );
    }
    if (!this.materialFactories.has(k)) {
      this.materialFactories.set(k, factory);
      if (needsJustification && justification) {
        this.shaderJustifications.set(k, justification);
      }
    }
  }

  /** Register a texture factory for a given key. Idempotent. */
  registerTexture(key: RenderResourceKey, factory: RenderTextureFactory): void {
    const k = normalizeKey(key);
    if (!this.textureFactories.has(k)) {
      this.textureFactories.set(k, factory);
    }
  }

  /** Obtain a geometry, creating it if necessary and incrementing its ref count. */
  getGeometry(key: RenderResourceKey): BufferGeometry {
    this._ensureNotDisposed();
    const k = normalizeKey(key);
    const existing = this.geometries.get(k);
    if (existing) {
      if (existing.disposed) {
        const factory = this.geometryFactories.get(k);
        if (!factory) {
          throw new Error(
            `RenderResourceRegistry: geometry for key "${k}" was already disposed and no factory is registered.`,
          );
        }
        const geometry = factory();
        const entry: ResourceEntry<BufferGeometry> = {
          resource: geometry,
          refCount: 1,
          disposed: false,
        };
        this.geometries.set(k, entry);
        return geometry;
      }
      existing.refCount++;
      return existing.resource;
    }
    const factory = this.geometryFactories.get(k);
    if (!factory) {
      throw new Error(`RenderResourceRegistry: no geometry factory registered for key "${k}".`);
    }
    const geometry = factory();
    const entry: ResourceEntry<BufferGeometry> = {
      resource: geometry,
      refCount: 1,
      disposed: false,
    };
    this.geometries.set(k, entry);
    return geometry;
  }

  /** Obtain a material, creating it if necessary and incrementing its ref count. */
  getMaterial(key: RenderResourceKey): Material {
    this._ensureNotDisposed();
    const k = normalizeKey(key);
    const existing = this.materials.get(k);
    if (existing) {
      if (existing.disposed) {
        // Re-create the material if the factory is still registered.
        const factory = this.materialFactories.get(k);
        if (!factory) {
          throw new Error(
            `RenderResourceRegistry: material for key "${k}" was already disposed and no factory is registered.`,
          );
        }
        const material = factory();
        const entry: ResourceEntry<Material> = { resource: material, refCount: 1, disposed: false };
        this.materials.set(k, entry);
        return material;
      }
      existing.refCount++;
      return existing.resource;
    }
    const factory = this.materialFactories.get(k);
    if (!factory) {
      throw new Error(`RenderResourceRegistry: no material factory registered for key "${k}".`);
    }
    const material = factory();
    const entry: ResourceEntry<Material> = { resource: material, refCount: 1, disposed: false };
    this.materials.set(k, entry);
    return material;
  }

  /** Obtain a texture, creating it if necessary and incrementing its ref count. */
  getTexture(key: RenderResourceKey): Texture {
    this._ensureNotDisposed();
    const k = normalizeKey(key);
    const existing = this.textures.get(k);
    if (existing) {
      if (existing.disposed) {
        const factory = this.textureFactories.get(k);
        if (!factory) {
          throw new Error(
            `RenderResourceRegistry: texture for key "${k}" was already disposed and no factory is registered.`,
          );
        }
        const texture = factory();
        const entry: ResourceEntry<Texture> = { resource: texture, refCount: 1, disposed: false };
        this.textures.set(k, entry);
        return texture;
      }
      existing.refCount++;
      return existing.resource;
    }
    const factory = this.textureFactories.get(k);
    if (!factory) {
      throw new Error(`RenderResourceRegistry: no texture factory registered for key "${k}".`);
    }
    const texture = factory();
    const entry: ResourceEntry<Texture> = { resource: texture, refCount: 1, disposed: false };
    this.textures.set(k, entry);
    return texture;
  }

  /** Decrement the reference count for a geometry. Disposes when count reaches zero. */
  releaseGeometry(key: RenderResourceKey): void {
    const k = normalizeKey(key);
    const entry = this.geometries.get(k);
    if (!entry) return;
    if (entry.disposed) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.resource.dispose();
      entry.disposed = true;
    }
  }

  /** Decrement the reference count for a material. Disposes when count reaches zero. */
  releaseMaterial(key: RenderResourceKey): void {
    const k = normalizeKey(key);
    const entry = this.materials.get(k);
    if (!entry) return;
    if (entry.disposed) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.resource.dispose();
      entry.disposed = true;
    }
  }

  /** Decrement the reference count for a texture. Disposes when count reaches zero. */
  releaseTexture(key: RenderResourceKey): void {
    const k = normalizeKey(key);
    const entry = this.textures.get(k);
    if (!entry) return;
    if (entry.disposed) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.resource.dispose();
      entry.disposed = true;
    }
  }

  /** Return current resource statistics. */
  stats(): RenderResourceStats {
    return {
      geometryCount: this._countLive(this.geometries),
      materialCount: this._countLive(this.materials),
      textureCount: this._countLive(this.textures),
      liveResourceKeys:
        this._countLive(this.geometries) +
        this._countLive(this.materials) +
        this._countLive(this.textures),
    };
  }

  /** Return the justification string for a custom ShaderMaterial, if any. */
  getShaderJustification(key: RenderResourceKey): string | undefined {
    return this.shaderJustifications.get(normalizeKey(key));
  }

  /** Return whether a geometry factory is registered for the key. */
  hasGeometryFactory(key: RenderResourceKey): boolean {
    return this.geometryFactories.has(normalizeKey(key));
  }

  /** Return whether a material factory is registered for the key. */
  hasMaterialFactory(key: RenderResourceKey): boolean {
    return this.materialFactories.has(normalizeKey(key));
  }

  /** Return whether a texture factory is registered for the key. */
  hasTextureFactory(key: RenderResourceKey): boolean {
    return this.textureFactories.has(normalizeKey(key));
  }

  /** Dispose all live resources and remove their entries, but keep factories intact. */
  clearLiveResources(): void {
    for (const entry of this.geometries.values()) {
      if (!entry.disposed) {
        entry.resource.dispose();
        entry.disposed = true;
      }
    }
    this.geometries.clear();
    for (const entry of this.materials.values()) {
      if (!entry.disposed) {
        entry.resource.dispose();
        entry.disposed = true;
      }
    }
    this.materials.clear();
    for (const entry of this.textures.values()) {
      if (!entry.disposed) {
        entry.resource.dispose();
        entry.disposed = true;
      }
    }
    this.textures.clear();
  }

  /** Dispose the entire registry and all remaining live resources. Idempotent. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.clearLiveResources();
    this.geometryFactories.clear();
    this.materialFactories.clear();
    this.textureFactories.clear();
    this.shaderJustifications.clear();
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error("RenderResourceRegistry has been disposed.");
    }
  }

  private _countLive<T>(map: Map<string, ResourceEntry<T>>): number {
    let count = 0;
    for (const entry of map.values()) {
      if (!entry.disposed) count++;
    }
    return count;
  }

  private _factoryReturnsShaderMaterial(factory: RenderMaterialFactory): boolean {
    // We cannot know the runtime type without calling the factory.
    // Register a probe instance in a non-rendering context to determine the type.
    // This is only called during registration (load time), not the hot path.
    const probe = factory();
    const isShader = probe instanceof ThreeShaderMaterial;
    // Dispose probe immediately so it does not leak.
    probe.dispose();
    return isShader;
  }
}

/** Convenience helpers that create the standard built-in gameplay materials. */
export const BuiltInMaterials = {
  /**
   * Create a vertex-coloured Lambert material — the standard retro look for
   * terrain, props, ground items, and actors.
   */
  lambertVertexColors(flatShading = true): MeshLambertMaterial {
    return new ThreeMeshLambertMaterial({ vertexColors: true, flatShading });
  },

  /** Create a toon-shaded material for actors and stylised props. */
  toon(options?: { color?: number; gradientMap?: Texture }): MeshToonMaterial {
    return new ThreeMeshToonMaterial({
      color: options?.color ?? 0xffffff,
      gradientMap: options?.gradientMap ?? null,
    });
  },

  /** Create a basic unlit material for projectiles, hitsplats, and far decorations. */
  basic(options?: { color?: number; map?: Texture; transparent?: boolean }): MeshBasicMaterial {
    return new ThreeMeshBasicMaterial({
      color: options?.color ?? 0xffffff,
      map: options?.map ?? null,
      transparent: options?.transparent ?? false,
    });
  },
} as const;
