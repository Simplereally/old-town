import type {
  AppearanceUpdate,
  ChunkData,
  HitsplatType,
  MoveSpeed,
  TileCoord,
} from "@old-town/shared";

// ---------------------------------------------------------------------------
// PresentationEvent — the typed S2C presentation event union.
//
// Producer: ClientPacketApplier pushes members at every packet-application
// site. Consumer: GameEngine._applyPresentationEvent switches exhaustively.
// A new producer kind the consumer forgets is a compile error, not a silent
// drop. This mirrors the typed action-payload spine (ADR-007) on the S2C
// side. Payload shapes are lifted verbatim from the producer push sites —
// the union is the contract.
// ---------------------------------------------------------------------------

export type PresentationEvent =
  | { readonly type: "actors.clear"; readonly payload: undefined }
  | { readonly type: "objects.clear"; readonly payload: undefined }
  | { readonly type: "groundItems.clear"; readonly payload: undefined }
  | { readonly type: "hitsplats.clear"; readonly payload: undefined }
  | { readonly type: "xpDrops.clear"; readonly payload: undefined }
  | { readonly type: "projectiles.clear"; readonly payload: undefined }
  | { readonly type: "chatOverhead.clear"; readonly payload: undefined }
  | {
      readonly type: "region.load";
      readonly payload: { readonly regionId: string; readonly chunks: readonly ChunkData[] };
    }
  | { readonly type: "region.unload"; readonly payload: { readonly regionId: string } }
  | {
      readonly type: "objects.spawn";
      readonly payload: {
        readonly entityId: number;
        readonly tile: TileCoord;
        readonly defId: string;
      };
    }
  | { readonly type: "objects.remove"; readonly payload: { readonly entityId: number } }
  | {
      readonly type: "objects.transform";
      readonly payload: { readonly entityId: number; readonly defId: string };
    }
  | {
      readonly type: "objects.updateDoorState";
      readonly payload: { readonly entityId: number; readonly isOpen: boolean };
    }
  | {
      readonly type: "actors.spawn";
      readonly payload: {
        readonly entityId: number;
        readonly tile: TileCoord;
        readonly defId: string | undefined;
        readonly isLocalPlayer: boolean;
        readonly kind: "player" | "npc";
      };
    }
  | { readonly type: "actors.remove"; readonly payload: { readonly entityId: number } }
  | {
      readonly type: "actors.updateTile";
      readonly payload: { readonly entityId: number; readonly tile: TileCoord };
    }
  | {
      readonly type: "actors.updateFacing";
      readonly payload: { readonly entityId: number; readonly direction: number };
    }
  | {
      readonly type: "actors.updateHealthBar";
      readonly payload: {
        readonly entityId: number;
        readonly health: number;
        readonly maxHealth: number;
      };
    }
  | {
      readonly type: "actors.notifyHit";
      readonly payload: { readonly entityId: number; readonly tick: number };
    }
  | {
      readonly type: "actors.updateAppearance";
      readonly payload: { readonly entityId: number; readonly appearance: AppearanceUpdate };
    }
  | {
      readonly type: "actors.setWeaponModel";
      readonly payload: { readonly entityId: number; readonly weaponItemId: string | null };
    }
  | {
      readonly type: "actors.setArmourModel";
      readonly payload: {
        readonly entityId: number;
        readonly slot: string;
        readonly itemId: string | null;
      };
    }
  | {
      readonly type: "actors.setAccessoryModel";
      readonly payload: {
        readonly entityId: number;
        readonly slot: string;
        readonly itemId: string | null;
      };
    }
  | {
      readonly type: "actors.updateAnimation";
      readonly payload: {
        readonly entityId: number;
        readonly animationId: string;
        readonly startTick: number | undefined;
      };
    }
  | {
      readonly type: "actors.updateMoveSpeed";
      readonly payload: { readonly entityId: number; readonly speed: MoveSpeed };
    }
  | { readonly type: "actors.hide"; readonly payload: { readonly entityId: number } }
  | { readonly type: "actors.show"; readonly payload: { readonly entityId: number } }
  | {
      readonly type: "groundItems.spawn";
      readonly payload: {
        readonly entityId: number;
        readonly tile: TileCoord;
        readonly defId: string;
        readonly quantity: number;
      };
    }
  | { readonly type: "groundItems.remove"; readonly payload: { readonly entityId: number } }
  | {
      readonly type: "hitsplats.show";
      readonly payload: {
        readonly entityId: number;
        readonly amount: number;
        readonly type: HitsplatType;
        readonly tick: number;
      };
    }
  | {
      readonly type: "xpDrops.show";
      readonly payload: {
        readonly entityId: number;
        readonly skillId: string;
        readonly amount: number;
        readonly tick: number;
      };
    }
  | {
      readonly type: "levelUps.show";
      readonly payload: {
        readonly entityId: number;
        readonly skillId: string;
        readonly newLevel: number;
        readonly tick: number;
      };
    }
  | {
      readonly type: "sounds.play";
      readonly payload: {
        readonly soundId: string;
        readonly tile?: TileCoord;
        readonly volume?: number;
      };
    }
  | {
      readonly type: "projectiles.spawn";
      readonly payload: {
        readonly id: string;
        readonly startTile: TileCoord;
        readonly endTile: TileCoord;
        readonly startTick: number;
        readonly hitTick: number;
      };
    }
  | {
      readonly type: "chatOverhead.show";
      readonly payload: { readonly entityId: number; readonly text: string };
    };

// ---------------------------------------------------------------------------
// DebugEvent — the typed debug overlay event union.
//
// Producer: ClientPacketApplier._applyDebugData pushes members from
// TickDeltaPacket.debug. Consumer: GameEngine._applyDebugEvent switches
// exhaustively. Separate queue, separate dispatch — kept split from
// PresentationEvent because they flow through separate channels.
// ---------------------------------------------------------------------------

export type DebugEvent =
  | { readonly type: "debug.clear"; readonly payload: undefined }
  | { readonly type: "debug.markPathTile"; readonly payload: { readonly tile: TileCoord } }
  | {
      readonly type: "debug.markTrueTile";
      readonly payload: { readonly tile: TileCoord; readonly entityId: number };
    }
  | { readonly type: "debug.markCollisionTile"; readonly payload: { readonly tile: TileCoord } }
  | { readonly type: "debug.markFootprint"; readonly payload: { readonly tile: TileCoord } }
  | {
      readonly type: "debug.markReachTiles";
      readonly payload: { readonly center: TileCoord; readonly radius: number };
    }
  | {
      readonly type: "debug.markLoSRay";
      readonly payload: {
        readonly start: { readonly x: number; readonly y: number; readonly z: number };
        readonly end: { readonly x: number; readonly y: number; readonly z: number };
      };
    }
  | {
      readonly type: "debug.setActionQueue";
      readonly payload: { readonly queue: readonly string[] };
    }
  | { readonly type: "debug.setCombatCooldown"; readonly payload: { readonly ticks: number } }
  | {
      readonly type: "debug.setPendingHits";
      readonly payload: { readonly hits: Map<string, number> };
    }
  | { readonly type: "debug.setNpcLeash"; readonly payload: { readonly tile: TileCoord } }
  | {
      readonly type: "debug.setVarbits";
      readonly payload: { readonly vars: Map<string, number> };
    };
