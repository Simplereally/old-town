import { describe, expect, it } from "vitest";
import {
  BoxGeometry,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshToonMaterial,
  ShaderMaterial,
  Texture,
} from "three";
import {
  BuiltInMaterials,
  RenderResourceRegistry,
  type RenderResourceKey,
} from "./RenderResourceRegistry";

function makeKey(partial: Partial<RenderResourceKey> & { contentId: string }): RenderResourceKey {
  const builder: Record<string, unknown> = {
    type: partial.type ?? "prop",
    contentId: partial.contentId,
  };
  if (partial.variant !== undefined) {
    builder.variant = partial.variant;
  }
  if (partial.materialId !== undefined) {
    builder.materialId = partial.materialId;
  }
  return builder as unknown as RenderResourceKey;
}

describe("RenderResourceRegistry", () => {
  it("returns the same geometry handle for duplicate keys", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerGeometry(key, () => new BoxGeometry(1, 1, 1));

    const g1 = registry.getGeometry(key);
    const g2 = registry.getGeometry(key);
    expect(g1).toBe(g2);
    expect(g1).toBeInstanceOf(BoxGeometry);
  });

  it("returns the same material handle for duplicate keys", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerMaterial(key, () => new MeshLambertMaterial());

    const m1 = registry.getMaterial(key);
    const m2 = registry.getMaterial(key);
    expect(m1).toBe(m2);
    expect(m1).toBeInstanceOf(MeshLambertMaterial);
  });

  it("returns the same texture handle for duplicate keys", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerTexture(key, () => new Texture());

    const t1 = registry.getTexture(key);
    const t2 = registry.getTexture(key);
    expect(t1).toBe(t2);
    expect(t1).toBeInstanceOf(Texture);
  });

  it("normalises keys so case and whitespace differences collide", () => {
    const registry = new RenderResourceRegistry();
    const keyA = makeKey({ contentId: "PROP:STONE_WALL", variant: "DAMAGED", materialId: "DEFAULT" });
    const keyB = makeKey({ contentId: "prop:stone_wall", variant: "damaged", materialId: "default" });
    registry.registerGeometry(keyA, () => new BoxGeometry(1, 1, 1));

    const g1 = registry.getGeometry(keyA);
    const g2 = registry.getGeometry(keyB);
    expect(g1).toBe(g2);
  });

  it("creates distinct resources for different contentIds", () => {
    const registry = new RenderResourceRegistry();
    const keyA = makeKey({ contentId: "prop:stone_wall" });
    const keyB = makeKey({ contentId: "prop:wood_fence" });
    registry.registerGeometry(keyA, () => new BoxGeometry(1, 1, 1));
    registry.registerGeometry(keyB, () => new BoxGeometry(2, 2, 2));

    const g1 = registry.getGeometry(keyA);
    const g2 = registry.getGeometry(keyB);
    expect(g1).not.toBe(g2);
  });

  it("creates distinct resources for different variants", () => {
    const registry = new RenderResourceRegistry();
    const keyA = makeKey({ contentId: "prop:stone_wall", variant: "summer" });
    const keyB = makeKey({ contentId: "prop:stone_wall", variant: "winter" });
    registry.registerGeometry(keyA, () => new BoxGeometry(1, 1, 1));
    registry.registerGeometry(keyB, () => new BoxGeometry(2, 2, 2));

    const g1 = registry.getGeometry(keyA);
    const g2 = registry.getGeometry(keyB);
    expect(g1).not.toBe(g2);
  });

  it("creates distinct resources for different materialIds", () => {
    const registry = new RenderResourceRegistry();
    const keyA = makeKey({ contentId: "prop:stone_wall", materialId: "default" });
    const keyB = makeKey({ contentId: "prop:stone_wall", materialId: "mossy" });
    registry.registerMaterial(keyA, () => new MeshLambertMaterial({ color: 0x888888 }));
    registry.registerMaterial(keyB, () => new MeshLambertMaterial({ color: 0x668866 }));

    const m1 = registry.getMaterial(keyA);
    const m2 = registry.getMaterial(keyB);
    expect(m1).not.toBe(m2);
  });

  it("throws when getting an unregistered geometry", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:unknown" });
    expect(() => registry.getGeometry(key)).toThrow("no geometry factory registered");
  });

  it("throws when getting an unregistered material", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:unknown" });
    expect(() => registry.getMaterial(key)).toThrow("no material factory registered");
  });

  it("throws when getting an unregistered texture", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:unknown" });
    expect(() => registry.getTexture(key)).toThrow("no texture factory registered");
  });

  it("disposes a geometry when ref count reaches zero", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposed = false;
    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      geo.dispose = () => {
        disposed = true;
      };
      return geo;
    });

    const g = registry.getGeometry(key);
    expect(g).toBeDefined();
    registry.releaseGeometry(key);
    expect(disposed).toBe(true);
  });

  it("disposes a material when ref count reaches zero", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposed = false;
    registry.registerMaterial(key, () => {
      const mat = new MeshLambertMaterial();
      mat.dispose = () => {
        disposed = true;
      };
      return mat;
    });

    const m = registry.getMaterial(key);
    expect(m).toBeDefined();
    registry.releaseMaterial(key);
    expect(disposed).toBe(true);
  });

  it("disposes a texture when ref count reaches zero", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposed = false;
    registry.registerTexture(key, () => {
      const tex = new Texture();
      tex.dispose = () => {
        disposed = true;
      };
      return tex;
    });

    const t = registry.getTexture(key);
    expect(t).toBeDefined();
    registry.releaseTexture(key);
    expect(disposed).toBe(true);
  });

  it("disposal is idempotent for geometry", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposeCalls = 0;
    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      const originalDispose = geo.dispose.bind(geo);
      geo.dispose = () => {
        disposeCalls++;
        originalDispose();
      };
      return geo;
    });

    registry.getGeometry(key);
    registry.releaseGeometry(key);
    registry.releaseGeometry(key);
    registry.releaseGeometry(key);
    expect(disposeCalls).toBe(1);
  });

  it("disposal is idempotent for material", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposeCalls = 0;
    registry.registerMaterial(key, () => {
      const mat = new MeshLambertMaterial();
      const originalDispose = mat.dispose.bind(mat);
      mat.dispose = () => {
        disposeCalls++;
        originalDispose();
      };
      return mat;
    });
    // registerMaterial probes the factory to detect ShaderMaterial, causing one dispose.
    const probeCalls = disposeCalls;

    registry.getMaterial(key);
    registry.releaseMaterial(key);
    registry.releaseMaterial(key);
    registry.releaseMaterial(key);
    expect(disposeCalls - probeCalls).toBe(1);
  });

  it("disposal is idempotent for texture", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposeCalls = 0;
    registry.registerTexture(key, () => {
      const tex = new Texture();
      const originalDispose = tex.dispose.bind(tex);
      tex.dispose = () => {
        disposeCalls++;
        originalDispose();
      };
      return tex;
    });

    registry.getTexture(key);
    registry.releaseTexture(key);
    registry.releaseTexture(key);
    registry.releaseTexture(key);
    expect(disposeCalls).toBe(1);
  });

  it("tracks ref count across multiple get/release cycles", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposeCalls = 0;
    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      const originalDispose = geo.dispose.bind(geo);
      geo.dispose = () => {
        disposeCalls++;
        originalDispose();
      };
      return geo;
    });

    const g1 = registry.getGeometry(key);
    const g2 = registry.getGeometry(key);
    expect(g1).toBe(g2);
    expect(disposeCalls).toBe(0);

    registry.releaseGeometry(key);
    expect(disposeCalls).toBe(0);

    registry.releaseGeometry(key);
    expect(disposeCalls).toBe(1);
  });

  it("stats reflect live resources accurately", () => {
    const registry = new RenderResourceRegistry();
    const keyA = makeKey({ contentId: "prop:stone_wall" });
    const keyB = makeKey({ contentId: "prop:wood_fence" });
    registry.registerGeometry(keyA, () => new BoxGeometry(1, 1, 1));
    registry.registerGeometry(keyB, () => new BoxGeometry(2, 2, 2));
    registry.registerMaterial(keyA, () => new MeshLambertMaterial());
    registry.registerTexture(keyA, () => new Texture());

    expect(registry.stats()).toEqual({
      geometryCount: 0,
      materialCount: 0,
      textureCount: 0,
      liveResourceKeys: 0,
    });

    registry.getGeometry(keyA);
    registry.getGeometry(keyB);
    registry.getMaterial(keyA);
    registry.getTexture(keyA);

    expect(registry.stats()).toEqual({
      geometryCount: 2,
      materialCount: 1,
      textureCount: 1,
      liveResourceKeys: 4,
    });

    registry.releaseGeometry(keyA);
    registry.releaseGeometry(keyB);
    registry.releaseMaterial(keyA);
    registry.releaseTexture(keyA);

    expect(registry.stats()).toEqual({
      geometryCount: 0,
      materialCount: 0,
      textureCount: 0,
      liveResourceKeys: 0,
    });
  });

  it("re-creates a disposed resource when the factory is still registered", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerGeometry(key, () => new BoxGeometry(1, 1, 1));
    registry.getGeometry(key);
    registry.releaseGeometry(key);
    const recreated = registry.getGeometry(key);
    expect(recreated).toBeDefined();
    expect(recreated).toBeInstanceOf(BoxGeometry);
  });

  it("throws when accessing a disposed resource with no factory registered", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerGeometry(key, () => new BoxGeometry(1, 1, 1));
    registry.getGeometry(key);
    registry.releaseGeometry(key);
    registry.dispose(); // clears all factories
    expect(() => registry.getGeometry(key)).toThrow("has been disposed");
  });

  it("disposes all resources on registry dispose", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let geoDisposed = false;
    let matDisposed = false;
    let texDisposed = false;

    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      const original = geo.dispose.bind(geo);
      geo.dispose = () => {
        geoDisposed = true;
        original();
      };
      return geo;
    });
    registry.registerMaterial(key, () => {
      const mat = new MeshLambertMaterial();
      const original = mat.dispose.bind(mat);
      mat.dispose = () => {
        matDisposed = true;
        original();
      };
      return mat;
    });
    registry.registerTexture(key, () => {
      const tex = new Texture();
      const original = tex.dispose.bind(tex);
      tex.dispose = () => {
        texDisposed = true;
        original();
      };
      return tex;
    });

    registry.getGeometry(key);
    registry.getMaterial(key);
    registry.getTexture(key);

    registry.dispose();
    expect(geoDisposed).toBe(true);
    expect(matDisposed).toBe(true);
    expect(texDisposed).toBe(true);
    expect(registry.stats().liveResourceKeys).toBe(0);
  });

  it("registry dispose is idempotent", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let disposeCalls = 0;
    registry.registerGeometry(key, () => {
      const geo = new BoxGeometry(1, 1, 1);
      const original = geo.dispose.bind(geo);
      geo.dispose = () => {
        disposeCalls++;
        original();
      };
      return geo;
    });

    registry.getGeometry(key);
    registry.dispose();
    registry.dispose();
    expect(disposeCalls).toBe(1);
  });

  it("throws when using registry after dispose", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    registry.registerGeometry(key, () => new BoxGeometry(1, 1, 1));
    registry.dispose();
    expect(() => registry.getGeometry(key)).toThrow("has been disposed");
  });

  it("allows registration idempotently", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    let factoryCalls = 0;
    registry.registerGeometry(key, () => {
      factoryCalls++;
      return new BoxGeometry(1, 1, 1);
    });
    registry.registerGeometry(key, () => {
      factoryCalls++;
      return new BoxGeometry(2, 2, 2);
    });

    registry.getGeometry(key);
    expect(factoryCalls).toBe(1);
  });

  it("accepts built-in MeshLambertMaterial without justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    expect(() =>
      registry.registerMaterial(key, () => new MeshLambertMaterial()),
    ).not.toThrow();
  });

  it("accepts built-in MeshToonMaterial without justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "actor:guard" });
    expect(() =>
      registry.registerMaterial(key, () => new MeshToonMaterial()),
    ).not.toThrow();
  });

  it("accepts built-in MeshBasicMaterial without justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "projectile:arrow" });
    expect(() =>
      registry.registerMaterial(key, () => new MeshBasicMaterial()),
    ).not.toThrow();
  });

  it("rejects custom ShaderMaterial without justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    expect(() =>
      registry.registerMaterial(key, () => new ShaderMaterial({})),
    ).toThrow("requires an explicit justification");
  });

  it("accepts custom ShaderMaterial with justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    expect(() =>
      registry.registerMaterial(
        key,
        () =>
          new ShaderMaterial({
            vertexShader: "void main() {}",
            fragmentShader: "void main() {}",
          }),
        "Prototyping water refraction for E35 stress-gate comparison.",
      ),
    ).not.toThrow();
  });

  it("stores and retrieves shader justification", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:water_special" });
    const justification = "Custom vertex displacement for animated waves.";
    registry.registerMaterial(
      key,
      () =>
        new ShaderMaterial({
          vertexShader: "void main() {}",
          fragmentShader: "void main() {}",
        }),
      justification,
    );
    expect(registry.getShaderJustification(key)).toBe(justification);
  });

  it("BuiltInMaterials.lambertVertexColors returns MeshLambertMaterial", () => {
    const mat = BuiltInMaterials.lambertVertexColors();
    expect(mat).toBeInstanceOf(MeshLambertMaterial);
    expect(mat.vertexColors).toBe(true);
    expect(mat.flatShading).toBe(true);
  });

  it("BuiltInMaterials.toon returns MeshToonMaterial", () => {
    const mat = BuiltInMaterials.toon({ color: 0xff0000 });
    expect(mat).toBeInstanceOf(MeshToonMaterial);
    expect(mat.color.getHex()).toBe(0xff0000);
  });

  it("BuiltInMaterials.basic returns MeshBasicMaterial", () => {
    const mat = BuiltInMaterials.basic({ color: 0x00ff00, transparent: true });
    expect(mat).toBeInstanceOf(MeshBasicMaterial);
    expect(mat.color.getHex()).toBe(0x00ff00);
    expect(mat.transparent).toBe(true);
  });

  it("has*Factory methods reflect registration state", () => {
    const registry = new RenderResourceRegistry();
    const key = makeKey({ contentId: "prop:stone_wall" });
    expect(registry.hasGeometryFactory(key)).toBe(false);
    expect(registry.hasMaterialFactory(key)).toBe(false);
    expect(registry.hasTextureFactory(key)).toBe(false);

    registry.registerGeometry(key, () => new BoxGeometry(1, 1, 1));
    registry.registerMaterial(key, () => new MeshLambertMaterial());
    registry.registerTexture(key, () => new Texture());

    expect(registry.hasGeometryFactory(key)).toBe(true);
    expect(registry.hasMaterialFactory(key)).toBe(true);
    expect(registry.hasTextureFactory(key)).toBe(true);
  });
});
