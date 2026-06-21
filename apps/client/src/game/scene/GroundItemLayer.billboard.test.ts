import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { CanvasTexture, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { GroundItemLayer, type IconTextureResolver } from "./GroundItemLayer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);

describe("GroundItemLayer billboard (E41-S09)", () => {
  let scene: Scene;
  let layer: GroundItemLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new GroundItemLayer({ scene });
  });

  it("falls back to gem mesh when no icon resolver is set", () => {
    layer.spawn(ID1, TILE, "coin", 1, "icon_coin");
    expect(layer.itemCount).toBe(1);
    const targets = layer.getRaycastTargets();
    expect(targets).toHaveLength(1);
  });

  it("uses sprite billboard when icon resolver returns a texture", () => {
    const resolver: IconTextureResolver = (_assetId: string) =>
      new CanvasTexture(document.createElement("canvas"));
    layer.setIconResolver(resolver);
    layer.spawn(ID1, TILE, "coin", 1, "icon_coin");
    expect(layer.itemCount).toBe(1);
    // Sprites are not raycast targets (only Mesh instances are)
    const targets = layer.getRaycastTargets();
    expect(targets).toHaveLength(0);
  });

  it("falls back to gem when icon resolver returns null", () => {
    const resolver: IconTextureResolver = () => null;
    layer.setIconResolver(resolver);
    layer.spawn(ID1, TILE, "coin", 1, "icon_coin");
    expect(layer.itemCount).toBe(1);
    const targets = layer.getRaycastTargets();
    expect(targets).toHaveLength(1);
  });

  it("falls back to gem when no iconAssetId is provided", () => {
    const resolver: IconTextureResolver = () => new CanvasTexture(document.createElement("canvas"));
    layer.setIconResolver(resolver);
    layer.spawn(ID1, TILE, "coin", 1);
    expect(layer.itemCount).toBe(1);
    const targets = layer.getRaycastTargets();
    expect(targets).toHaveLength(1);
  });

  it("caches textures across spawns", () => {
    let createCount = 0;
    const resolver: IconTextureResolver = () => {
      createCount++;
      return new CanvasTexture(document.createElement("canvas"));
    };
    layer.setIconResolver(resolver);
    layer.spawn(ID1, TILE, "coin", 1, "icon_coin");
    layer.remove(ID1);
    layer.spawn(entityId(2), TILE, "coin", 1, "icon_coin");
    expect(createCount).toBe(1);
  });

  it("disposes sprite material on remove", () => {
    const resolver: IconTextureResolver = () => new CanvasTexture(document.createElement("canvas"));
    layer.setIconResolver(resolver);
    layer.spawn(ID1, TILE, "coin", 1, "icon_coin");
    layer.remove(ID1);
    expect(layer.itemCount).toBe(0);
  });
});
