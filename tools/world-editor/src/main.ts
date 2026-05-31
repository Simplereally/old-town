import {
  type ContentRegistries,
  type GroundItemSpawnDef,
  kindForContentDir,
  type LoadedContentFile,
  type MaterialDef,
  type NpcSpawnDef,
  type ObjectDef,
  type PlacedObjectDef,
  REGION_SIZE,
  type RegionMapDef,
  type ResourceNodeDef,
  STATIC_COLLISION_FLAG_DESCRIPTORS,
  validateContent,
} from "@old-town/shared";
import {
  addPlacement,
  applyTilePatch,
  assertRectBounds,
  assertRegionBounds,
  cloneRegion,
  deletePlacement,
  duplicatePlacement,
  type EditorTile,
  exportRegionJson,
  listRegions,
  materialHex,
  movePlacement,
  type PlacementDraft,
  type PlacementKind,
  type PlacementSelection,
  parseExportedRegion,
  type RegionSummary,
  rotateObjectPlacement,
  summarizeRegion,
  type TileEditPatch,
  tileAtFromMap,
  tileOverrideMap,
  uniqueTriggerId,
} from "./editor-model";
import {
  type EditorProbePoint,
  type InteractionProbeResult,
  interactionFixture,
  type LosProbeResult,
  losFixture,
  pathFixture,
  probeFixtureJson,
  runInteractionProbe,
  runLosProbe,
  runPathProbe,
} from "./probe-model";
import "./styles.css";

type BrushMode =
  | "inspect"
  | "terrain"
  | "height"
  | "flags"
  | "collision"
  | "object"
  | "resource"
  | "npc"
  | "item"
  | "trigger"
  | "move";
type PlacementPaletteKind = PlacementKind | "resource";
type ProbeMode = "path" | "los" | "interaction";

interface ProbeState {
  mode: ProbeMode;
  start?: EditorProbePoint | undefined;
  end?: EditorProbePoint | undefined;
  result?: ProbeResult | undefined;
}

type ProbeResult =
  | { readonly kind: "path"; readonly value: ReturnType<typeof runPathProbe> }
  | { readonly kind: "los"; readonly value: LosProbeResult }
  | { readonly kind: "interaction"; readonly value: InteractionProbeResult };

interface HistoryState {
  readonly undo: RegionMapDef[];
  readonly redo: RegionMapDef[];
}

const contentModules = import.meta.glob("../../../content/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

interface EditorState {
  readonly registries: ContentRegistries;
  readonly regions: RegionSummary[];
  selected: RegionSummary;
  cameraX: number;
  cameraY: number;
  zoom: number;
  brushMode: BrushMode;
  history: HistoryState;
  probe: ProbeState;
  hoverTile?: { readonly x: number; readonly y: number } | undefined;
  selectedTile?: { readonly x: number; readonly y: number } | undefined;
  selectedPlacement?: PlacementSelection | undefined;
  dragging?: { readonly x: number; readonly y: number; readonly distance: number } | undefined;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root");
}
const appRoot = app;

const files = loadedContentFiles();
const validation = validateContent(files);
if (!validation.ok || validation.issues.length > 0) {
  appRoot.innerHTML = `<main class="boot-error"><h1>Content failed validation</h1><pre>${escapeHtml(
    validation.issues
      .map((issue) => `${issue.path ?? "(unknown)"} ${issue.pointer ?? "/"} ${issue.message}`)
      .join("\n"),
  )}</pre></main>`;
} else {
  const regions = listRegions(validation.registries);
  const selected = regions[0];
  if (!selected) {
    appRoot.innerHTML = '<main class="boot-error"><h1>No region maps found</h1></main>';
  } else {
    mountEditor({
      registries: validation.registries,
      regions,
      selected,
      cameraX: REGION_SIZE / 2,
      cameraY: REGION_SIZE / 2,
      zoom: 12,
      brushMode: "inspect",
      history: { undo: [], redo: [] },
      probe: { mode: "path" },
    });
  }
}

function mountEditor(state: EditorState): void {
  appRoot.innerHTML = `
    <main class="editor-shell">
      <aside class="side-panel" aria-label="World editor controls">
        <header class="brand-block">
          <span class="kicker">Old Town</span>
          <h1>World Editor</h1>
        </header>
        <label class="field-label" for="region-select">Region</label>
        <select id="region-select" class="region-select"></select>
        <section class="stat-grid" aria-label="Region stats">
          <div><span id="stat-region">-</span><small>region</small></div>
          <div><span id="stat-overrides">0</span><small>tiles</small></div>
          <div><span id="stat-objects">0</span><small>objects</small></div>
          <div><span id="stat-npcs">0</span><small>npcs</small></div>
        </section>
        <section class="hover-readout" aria-label="Tile readout">
          <span id="hover-title">No tile</span>
          <code id="hover-detail">outside</code>
        </section>
        <section class="hover-readout" aria-label="Selected tile">
          <span id="selected-title">No selection</span>
          <code id="selected-detail">none</code>
        </section>
        <section class="tile-editor" aria-label="Tile editor">
          <label class="field-label" for="brush-mode">Brush</label>
          <select id="brush-mode" class="region-select">
            <option value="inspect">Inspect</option>
            <option value="terrain">Terrain</option>
            <option value="height">Height</option>
            <option value="flags">Flags</option>
            <option value="collision">Collision</option>
            <option value="object">Object</option>
            <option value="resource">Resource</option>
            <option value="npc">NPC</option>
            <option value="item">Item</option>
            <option value="trigger">Trigger</option>
            <option value="move">Move</option>
          </select>
          <div class="compact-fields">
            <label>
              <span>Underlay</span>
              <select id="underlay-select"></select>
            </label>
            <label>
              <span>Overlay</span>
              <select id="overlay-select"></select>
            </label>
          </div>
          <div class="height-row">
            <button id="height-down" type="button" title="Lower height">-</button>
            <label>
              <span>Height</span>
              <input id="height-input" type="number" step="1" value="0" />
            </label>
            <button id="height-up" type="button" title="Raise height">+</button>
          </div>
          <div class="check-grid">
            <label><input id="water-toggle" type="checkbox" /> Water</label>
            <label><input id="bridge-toggle" type="checkbox" /> Bridge</label>
          </div>
          <label class="zone-field">
            <span>Zone</span>
            <input id="zone-input" type="text" autocomplete="off" />
          </label>
          <div id="collision-flags" class="flag-grid" aria-label="Collision flags"></div>
          <button id="apply-tile" type="button">Apply to Selected</button>
          <div class="history-row" aria-label="History controls">
            <button id="undo-button" type="button" title="Undo">Undo</button>
            <button id="redo-button" type="button" title="Redo">Redo</button>
          </div>
        </section>
        <section class="tile-editor" aria-label="Placement editor">
          <label class="field-label" for="placement-kind">Placement</label>
          <select id="placement-kind">
            <option value="object">Object</option>
            <option value="resource">Resource</option>
            <option value="npc">NPC</option>
            <option value="groundItem">Ground Item</option>
            <option value="trigger">Trigger</option>
          </select>
          <div class="compact-fields">
            <label>
              <span>Object</span>
              <select id="object-palette"></select>
            </label>
            <label>
              <span>Resource</span>
              <select id="resource-palette"></select>
            </label>
            <label>
              <span>NPC</span>
              <select id="npc-palette"></select>
            </label>
            <label>
              <span>Item</span>
              <select id="item-palette"></select>
            </label>
          </div>
          <div class="triple-fields">
            <label>
              <span>Rotation</span>
              <input id="object-rotation" type="number" min="0" max="3" step="1" value="0" />
            </label>
            <label>
              <span>Wander</span>
              <input id="npc-wander" type="number" min="0" step="1" value="0" />
            </label>
            <label>
              <span>Qty</span>
              <input id="item-quantity" type="number" min="1" step="1" value="1" />
            </label>
          </div>
          <label class="zone-field">
            <span>Trigger ID</span>
            <input id="trigger-id" type="text" autocomplete="off" />
          </label>
          <div class="triple-fields">
            <label>
              <span>Width</span>
              <input id="trigger-width" type="number" min="1" step="1" value="1" />
            </label>
            <label>
              <span>Height</span>
              <input id="trigger-height" type="number" min="1" step="1" value="1" />
            </label>
            <label>
              <span>Tag</span>
              <input id="trigger-tag" type="text" autocomplete="off" />
            </label>
          </div>
          <div class="placement-actions" aria-label="Placement actions">
            <button id="place-button" type="button">Place</button>
            <button id="move-placement" type="button">Move</button>
            <button id="rotate-placement" type="button">Rotate</button>
            <button id="duplicate-placement" type="button">Duplicate</button>
            <button id="delete-placement" type="button">Delete</button>
          </div>
        </section>
        <section class="tile-editor" aria-label="Probe tools">
          <label class="field-label" for="probe-mode">Probe</label>
          <select id="probe-mode">
            <option value="path">Path</option>
            <option value="los">LoS</option>
            <option value="interaction">Interaction</option>
          </select>
          <div class="history-row" aria-label="Probe endpoints">
            <button id="probe-start" type="button">Set A</button>
            <button id="probe-end" type="button">Set B</button>
          </div>
          <div class="check-grid">
            <label>
              <span>Distance</span>
              <input id="probe-distance" type="number" min="0" step="1" value="1" />
            </label>
            <label><input id="probe-los-required" type="checkbox" /> Require LoS</label>
          </div>
          <button id="run-probe" type="button">Run Probe</button>
          <button id="export-probe" type="button">Export Probe Fixture</button>
          <code id="probe-status" class="probe-status">no probe</code>
        </section>
        <div class="tool-row" aria-label="Camera controls">
          <button id="zoom-out" type="button" title="Zoom out">-</button>
          <button id="zoom-reset" type="button" title="Reset camera">Reset</button>
          <button id="zoom-in" type="button" title="Zoom in">+</button>
        </div>
        <input id="import-file" class="file-input" type="file" accept="application/json,.json" />
        <label class="secondary-action" for="import-file">Import Region JSON</label>
        <button id="export-button" class="primary-action" type="button">Export Region JSON</button>
        <a id="download-link" class="download-link" download="region.json">Download</a>
      </aside>
      <section class="viewport-panel">
        <div class="top-strip">
          <span id="validity-pill" aria-live="polite">schema ok</span>
          <span id="active-region">region -</span>
          <span id="active-zoom">zoom -</span>
          <span>64x64 tiles</span>
          <span>4x4 chunks</span>
        </div>
        <canvas id="region-canvas" aria-label="Region tile canvas"></canvas>
        <textarea id="export-output" spellcheck="false" aria-label="Exported region JSON"></textarea>
      </section>
    </main>
  `;

  const canvas = mustElement<HTMLCanvasElement>("region-canvas");
  const select = mustElement<HTMLSelectElement>("region-select");
  const exportOutput = mustElement<HTMLTextAreaElement>("export-output");
  const downloadLink = mustElement<HTMLAnchorElement>("download-link");
  const importFile = mustElement<HTMLInputElement>("import-file");
  const brushMode = mustElement<HTMLSelectElement>("brush-mode");
  const underlaySelect = mustElement<HTMLSelectElement>("underlay-select");
  const overlaySelect = mustElement<HTMLSelectElement>("overlay-select");
  const heightInput = mustElement<HTMLInputElement>("height-input");
  const waterToggle = mustElement<HTMLInputElement>("water-toggle");
  const bridgeToggle = mustElement<HTMLInputElement>("bridge-toggle");
  const zoneInput = mustElement<HTMLInputElement>("zone-input");
  const placementKind = mustElement<HTMLSelectElement>("placement-kind");
  const objectPalette = mustElement<HTMLSelectElement>("object-palette");
  const resourcePalette = mustElement<HTMLSelectElement>("resource-palette");
  const npcPalette = mustElement<HTMLSelectElement>("npc-palette");
  const itemPalette = mustElement<HTMLSelectElement>("item-palette");
  const probeMode = mustElement<HTMLSelectElement>("probe-mode");

  populateMaterialSelects(state.registries.material, underlaySelect, overlaySelect);
  populatePlacementPalettes(state, objectPalette, resourcePalette, npcPalette, itemPalette);
  populateCollisionFlags();
  updateRegionOptions(state, select);
  select.value = state.selected.key;
  select.addEventListener("change", () => {
    const next = state.regions.find((region) => region.key === select.value);
    if (!next) {
      return;
    }
    state.selected = next;
    state.cameraX = REGION_SIZE / 2;
    state.cameraY = REGION_SIZE / 2;
    state.selectedTile = undefined;
    state.selectedPlacement = undefined;
    state.probe = { mode: state.probe.mode };
    state.history.undo.length = 0;
    state.history.redo.length = 0;
    updateExport(state, exportOutput, downloadLink);
    syncControlsFromSelectedTile(state);
    updateUi(state);
    draw(state, canvas);
  });

  brushMode.addEventListener("change", () => {
    state.brushMode = parseBrushMode(brushMode.value);
    syncPlacementKindFromBrush(state.brushMode, placementKind);
  });
  placementKind.addEventListener("change", () => {
    state.brushMode = brushModeForPlacementKind(parsePlacementKind(placementKind.value));
    brushMode.value = state.brushMode;
  });
  probeMode.addEventListener("change", () => {
    state.probe.mode = parseProbeMode(probeMode.value);
    state.probe.result = undefined;
    updateUi(state);
    draw(state, canvas);
  });
  mustElement<HTMLButtonElement>("apply-tile").addEventListener("click", () => {
    applyCurrentBrush(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("place-button").addEventListener("click", () => {
    placeCurrentPlacement(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("move-placement").addEventListener("click", () => {
    moveSelectedPlacementToTile(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("rotate-placement").addEventListener("click", () => {
    rotateSelectedPlacement(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("duplicate-placement").addEventListener("click", () => {
    duplicateSelectedPlacement(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("delete-placement").addEventListener("click", () => {
    deleteSelectedPlacement(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("probe-start").addEventListener("click", () => {
    setProbePoint(state, "start", canvas);
  });
  mustElement<HTMLButtonElement>("probe-end").addEventListener("click", () => {
    setProbePoint(state, "end", canvas);
  });
  mustElement<HTMLButtonElement>("run-probe").addEventListener("click", () => {
    runCurrentProbe(state, canvas);
  });
  mustElement<HTMLButtonElement>("export-probe").addEventListener("click", () => {
    exportProbeFixture(state, exportOutput);
  });
  mustElement<HTMLButtonElement>("undo-button").addEventListener("click", () => {
    undoRegionEdit(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("redo-button").addEventListener("click", () => {
    redoRegionEdit(state, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("height-down").addEventListener("click", () => {
    adjustHeightBrush(state, -1, select, exportOutput, downloadLink, canvas);
  });
  mustElement<HTMLButtonElement>("height-up").addEventListener("click", () => {
    adjustHeightBrush(state, 1, select, exportOutput, downloadLink, canvas);
  });
  for (const control of [
    underlaySelect,
    overlaySelect,
    heightInput,
    waterToggle,
    bridgeToggle,
    zoneInput,
    objectPalette,
    resourcePalette,
    npcPalette,
    itemPalette,
    mustElement<HTMLInputElement>("object-rotation"),
    mustElement<HTMLInputElement>("npc-wander"),
    mustElement<HTMLInputElement>("item-quantity"),
    mustElement<HTMLInputElement>("trigger-id"),
    mustElement<HTMLInputElement>("trigger-width"),
    mustElement<HTMLInputElement>("trigger-height"),
    mustElement<HTMLInputElement>("trigger-tag"),
    mustElement<HTMLInputElement>("probe-distance"),
    mustElement<HTMLInputElement>("probe-los-required"),
  ]) {
    control.addEventListener("change", () => setStatus("brush ready", "ok"));
  }

  mustElement<HTMLButtonElement>("zoom-out").addEventListener("click", () => {
    state.zoom = clampZoom(state.zoom / 1.25);
    updateUi(state);
    draw(state, canvas);
  });
  mustElement<HTMLButtonElement>("zoom-in").addEventListener("click", () => {
    state.zoom = clampZoom(state.zoom * 1.25);
    updateUi(state);
    draw(state, canvas);
  });
  mustElement<HTMLButtonElement>("zoom-reset").addEventListener("click", () => {
    state.cameraX = REGION_SIZE / 2;
    state.cameraY = REGION_SIZE / 2;
    state.zoom = 12;
    updateUi(state);
    draw(state, canvas);
  });
  mustElement<HTMLButtonElement>("export-button").addEventListener("click", () => {
    updateExport(state, exportOutput, downloadLink);
    setStatus("schema ok", "ok");
  });
  importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (!file) {
      return;
    }
    void importRegion(file, state, select, exportOutput, downloadLink, canvas).finally(() => {
      importFile.value = "";
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = { x: event.clientX, y: event.clientY, distance: 0 };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (state.dragging) {
      const dx = event.clientX - state.dragging.x;
      const dy = event.clientY - state.dragging.y;
      state.cameraX -= dx / state.zoom;
      state.cameraY -= dy / state.zoom;
      state.dragging = {
        x: event.clientX,
        y: event.clientY,
        distance: state.dragging.distance + Math.abs(dx) + Math.abs(dy),
      };
    }
    state.hoverTile = tileFromMouse(canvas, state, event);
    updateUi(state);
    draw(state, canvas);
  });
  canvas.addEventListener("pointerup", (event) => {
    const wasClick = state.dragging !== undefined && state.dragging.distance < 4;
    state.dragging = undefined;
    canvas.releasePointerCapture(event.pointerId);
    if (wasClick) {
      selectCanvasTile(state, canvas, event, select, exportOutput, downloadLink);
    }
    updateUi(state);
    draw(state, canvas);
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const before = worldFromScreen(canvas, state, event.offsetX, event.offsetY);
      state.zoom = clampZoom(state.zoom * (event.deltaY > 0 ? 0.9 : 1.1));
      const after = worldFromScreen(canvas, state, event.offsetX, event.offsetY);
      state.cameraX += before.x - after.x;
      state.cameraY += before.y - after.y;
      state.hoverTile = tileFromMouse(canvas, state, event);
      updateUi(state);
      draw(state, canvas);
    },
    { passive: false },
  );
  window.addEventListener("resize", () => draw(state, canvas));

  updateExport(state, exportOutput, downloadLink);
  syncControlsFromSelectedTile(state);
  updateUi(state);
  draw(state, canvas);
}

function loadedContentFiles(): LoadedContentFile[] {
  const files: LoadedContentFile[] = [];
  for (const [modulePath, data] of Object.entries(contentModules)) {
    const marker = "content/";
    const markerIndex = modulePath.indexOf(marker);
    if (markerIndex < 0) {
      continue;
    }
    const path = modulePath.slice(markerIndex + marker.length);
    const topDir = path.split("/")[0];
    const kind = topDir ? kindForContentDir(topDir) : undefined;
    if (!kind) {
      continue;
    }
    files.push({ path, kind, data });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function populateMaterialSelects(
  materials: ReadonlyMap<string, MaterialDef>,
  underlaySelect: HTMLSelectElement,
  overlaySelect: HTMLSelectElement,
): void {
  const sorted = Array.from(materials.values()).sort((a, b) => a.id.localeCompare(b.id));
  underlaySelect.replaceChildren();
  overlaySelect.replaceChildren();
  overlaySelect.append(new Option("(none)", ""));
  for (const material of sorted) {
    const label = `${material.id} - ${material.name}`;
    underlaySelect.append(new Option(label, material.id));
    overlaySelect.append(new Option(label, material.id));
  }
}

function populatePlacementPalettes(
  state: EditorState,
  objectPalette: HTMLSelectElement,
  resourcePalette: HTMLSelectElement,
  npcPalette: HTMLSelectElement,
  itemPalette: HTMLSelectElement,
): void {
  appendDefOptions(objectPalette, state.registries.object);
  appendResourceOptions(resourcePalette, state.registries.resourceNode, state.registries.object);
  appendDefOptions(npcPalette, state.registries.npc);
  appendDefOptions(itemPalette, state.registries.item);
}

function appendDefOptions<T extends { readonly id: string; readonly name: string }>(
  select: HTMLSelectElement,
  registry: ReadonlyMap<string, T>,
): void {
  select.replaceChildren();
  for (const def of Array.from(registry.values()).sort((a, b) => a.id.localeCompare(b.id))) {
    select.append(new Option(`${def.id} - ${def.name}`, def.id));
  }
}

function appendResourceOptions(
  select: HTMLSelectElement,
  resources: ReadonlyMap<string, ResourceNodeDef>,
  objects: ReadonlyMap<string, ObjectDef>,
): void {
  select.replaceChildren();
  const resourceObjects = Array.from(objects.values()).filter(
    (object) => object.resourceNodeId !== undefined && resources.has(object.resourceNodeId),
  );
  for (const object of resourceObjects.sort((a, b) =>
    (a.resourceNodeId ?? "").localeCompare(b.resourceNodeId ?? ""),
  )) {
    const resourceNodeId = object.resourceNodeId;
    const resource = resourceNodeId ? resources.get(resourceNodeId) : undefined;
    if (!resource) {
      continue;
    }
    select.append(new Option(`${resource.id} - ${resource.name} (${object.id})`, object.id));
  }
}

function populateCollisionFlags(): void {
  const container = mustElement("collision-flags");
  container.replaceChildren(
    ...STATIC_COLLISION_FLAG_DESCRIPTORS.map((descriptor) => {
      const label = document.createElement("label");
      label.className = "flag-toggle";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "collision-flag";
      input.value = String(descriptor.flag);
      const text = document.createElement("span");
      text.textContent = descriptor.label;
      const code = document.createElement("code");
      code.textContent = String(descriptor.flag);
      label.append(input, text, code);
      return label;
    }),
  );
}

function parseBrushMode(value: string): BrushMode {
  if (
    value === "terrain" ||
    value === "height" ||
    value === "flags" ||
    value === "collision" ||
    value === "object" ||
    value === "resource" ||
    value === "npc" ||
    value === "item" ||
    value === "trigger" ||
    value === "move"
  ) {
    return value;
  }
  return "inspect";
}

function parsePlacementKind(value: string): PlacementPaletteKind {
  if (value === "resource" || value === "npc" || value === "groundItem" || value === "trigger") {
    return value;
  }
  return "object";
}

function brushModeForPlacementKind(kind: PlacementPaletteKind): BrushMode {
  return kind === "groundItem" ? "item" : kind;
}

function syncPlacementKindFromBrush(mode: BrushMode, select: HTMLSelectElement): void {
  if (mode === "object" || mode === "npc" || mode === "trigger") {
    select.value = mode;
  } else if (mode === "item") {
    select.value = "groundItem";
  } else if (mode === "resource") {
    select.value = "resource";
  }
}

function parseProbeMode(value: string): ProbeMode {
  if (value === "los" || value === "interaction") {
    return value;
  }
  return "path";
}

function selectCanvasTile(
  state: EditorState,
  canvas: HTMLCanvasElement,
  event: Pick<MouseEvent, "offsetX" | "offsetY">,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
): void {
  const tile = tileFromMouse(canvas, state, event);
  if (!assertRegionBounds(tile.x, tile.y)) {
    setStatus("outside region", "error");
    return;
  }
  state.selectedTile = tile;
  if (state.brushMode === "inspect") {
    state.selectedPlacement = placementAtTile(state, tile.x, tile.y);
    syncControlsFromSelectedTile(state);
    syncControlsFromSelectedPlacement(state);
    setStatus("tile selected", "ok");
    return;
  }
  if (state.brushMode === "move") {
    moveSelectedPlacementToTile(state, select, exportOutput, downloadLink, canvas);
    return;
  }
  if (isPlacementBrush(state.brushMode)) {
    placeCurrentPlacement(state, select, exportOutput, downloadLink, canvas);
    return;
  }
  applyCurrentBrush(state, select, exportOutput, downloadLink, canvas);
}

function applyCurrentBrush(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const tile = state.selectedTile;
  if (!tile || !assertRegionBounds(tile.x, tile.y)) {
    setStatus("select a tile", "error");
    return;
  }
  if (!isTileEditBrush(state.brushMode)) {
    placeCurrentPlacement(state, select, exportOutput, downloadLink, canvas);
    return;
  }
  commitTilePatch(
    state,
    select,
    exportOutput,
    downloadLink,
    canvas,
    tile.x,
    tile.y,
    currentBrushPatch(state.brushMode),
  );
}

function isTileEditBrush(
  mode: BrushMode,
): mode is "inspect" | "terrain" | "height" | "flags" | "collision" {
  return (
    mode === "inspect" ||
    mode === "terrain" ||
    mode === "height" ||
    mode === "flags" ||
    mode === "collision"
  );
}

function isPlacementBrush(
  mode: BrushMode,
): mode is "object" | "resource" | "npc" | "item" | "trigger" {
  return (
    mode === "object" ||
    mode === "resource" ||
    mode === "npc" ||
    mode === "item" ||
    mode === "trigger"
  );
}

function currentBrushPatch(mode: BrushMode): TileEditPatch {
  switch (mode) {
    case "terrain":
      return {
        underlayId: mustElement<HTMLSelectElement>("underlay-select").value,
        overlayId: mustElement<HTMLSelectElement>("overlay-select").value || null,
      };
    case "height":
      return { height: numericInputValue("height-input") };
    case "flags":
      return {
        water: mustElement<HTMLInputElement>("water-toggle").checked,
        bridge: mustElement<HTMLInputElement>("bridge-toggle").checked,
        zoneId: normalizedOptionalText("zone-input"),
      };
    case "collision":
      return { collision: selectedCollisionMask() };
    case "inspect":
    case "object":
    case "resource":
    case "npc":
    case "item":
    case "trigger":
    case "move":
      return {};
  }
}

function selectedCollisionMask(): number {
  let mask = 0;
  for (const input of document.querySelectorAll<HTMLInputElement>(
    'input[name="collision-flag"]:checked',
  )) {
    mask |= Number(input.value);
  }
  return mask;
}

function adjustHeightBrush(
  state: EditorState,
  delta: number,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const input = mustElement<HTMLInputElement>("height-input");
  input.value = String(numericInputValue("height-input") + delta);
  if (state.selectedTile && state.brushMode === "height") {
    applyCurrentBrush(state, select, exportOutput, downloadLink, canvas);
  } else {
    setStatus("brush ready", "ok");
  }
}

function commitTilePatch(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  patch: TileEditPatch,
): void {
  const before = cloneRegion(state.selected.region);
  const next = cloneRegion(state.selected.region);
  try {
    applyTilePatch(next, x, y, patch);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "tile edit failed", "error");
    return;
  }
  if (exportRegionJson(before) === exportRegionJson(next)) {
    syncControlsFromSelectedTile(state);
    setStatus("unchanged", "ok");
    return;
  }

  state.history.undo.push(before);
  if (state.history.undo.length > 50) {
    state.history.undo.shift();
  }
  state.history.redo.length = 0;
  replaceSelectedRegion(state, select, next);
  updateExport(state, exportOutput, downloadLink);
  syncControlsFromSelectedTile(state);
  updateUi(state);
  draw(state, canvas);
  setStatus("edit applied", "ok");
}

function placeCurrentPlacement(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const tile = state.selectedTile;
  if (!tile || !assertRegionBounds(tile.x, tile.y)) {
    setStatus("select a tile", "error");
    return;
  }
  commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, (region) =>
    addPlacement(region, currentPlacementDraft(state, tile.x, tile.y)),
  );
}

function moveSelectedPlacementToTile(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const tile = state.selectedTile;
  const selection = state.selectedPlacement;
  if (!tile || !assertRegionBounds(tile.x, tile.y)) {
    setStatus("select a tile", "error");
    return;
  }
  if (!selection) {
    setStatus("select placement", "error");
    return;
  }
  commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, (region) => {
    movePlacement(region, selection, tile.x, tile.y);
    return selection;
  });
}

function rotateSelectedPlacement(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const selection = state.selectedPlacement;
  if (!selection) {
    setStatus("select object", "error");
    return;
  }
  commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, (region) => {
    rotateObjectPlacement(region, selection);
    return selection;
  });
}

function duplicateSelectedPlacement(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const selection = state.selectedPlacement;
  if (!selection) {
    setStatus("select placement", "error");
    return;
  }
  commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, (region) =>
    duplicatePlacement(region, selection),
  );
}

function deleteSelectedPlacement(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const selection = state.selectedPlacement;
  if (!selection) {
    setStatus("select placement", "error");
    return;
  }
  commitPlacementMutation(state, select, exportOutput, downloadLink, canvas, (region) => {
    deletePlacement(region, selection);
    return undefined;
  });
}

function commitPlacementMutation(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
  mutate: (region: RegionMapDef) => PlacementSelection | undefined,
): void {
  const before = cloneRegion(state.selected.region);
  const next = cloneRegion(state.selected.region);
  let nextSelection: PlacementSelection | undefined;
  try {
    nextSelection = mutate(next);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "placement edit failed", "error");
    return;
  }
  if (exportRegionJson(before) === exportRegionJson(next)) {
    setStatus("unchanged", "ok");
    return;
  }
  state.history.undo.push(before);
  if (state.history.undo.length > 50) {
    state.history.undo.shift();
  }
  state.history.redo.length = 0;
  state.selectedPlacement = nextSelection;
  replaceSelectedRegion(state, select, next);
  updateExport(state, exportOutput, downloadLink);
  syncControlsFromSelectedPlacement(state);
  updateUi(state);
  draw(state, canvas);
  setStatus("placement saved", "ok");
}

function currentPlacementDraft(state: EditorState, x: number, y: number): PlacementDraft {
  const kind = placementKindForBrush(state.brushMode);
  switch (kind) {
    case "object":
      return {
        kind: "object",
        value: {
          objectId: mustElement<HTMLSelectElement>("object-palette").value,
          x,
          y,
          rotation: clampInt(numericInputValue("object-rotation"), 0, 3),
        },
      };
    case "resource":
      return {
        kind: "object",
        value: {
          objectId: requiredSelectValue("resource-palette", "No resource-backed object available"),
          x,
          y,
          rotation: clampInt(numericInputValue("object-rotation"), 0, 3),
        },
      };
    case "npc":
      return {
        kind: "npc",
        value: {
          npcId: mustElement<HTMLSelectElement>("npc-palette").value,
          x,
          y,
          wanderRadius: Math.max(0, numericInputValue("npc-wander")),
        },
      };
    case "groundItem":
      return {
        kind: "groundItem",
        value: {
          itemId: mustElement<HTMLSelectElement>("item-palette").value,
          quantity: Math.max(1, numericInputValue("item-quantity")),
          x,
          y,
        },
      };
    case "trigger": {
      const width = Math.max(1, numericInputValue("trigger-width"));
      const height = Math.max(1, numericInputValue("trigger-height"));
      if (!assertRectBounds(x, y, width, height)) {
        throw new RangeError("Trigger rectangle is outside region bounds");
      }
      const tag = normalizedOptionalText("trigger-tag");
      return {
        kind: "trigger",
        value: {
          id: uniqueTriggerId(state.selected.region, triggerIdBase(x, y)),
          x,
          y,
          width,
          height,
          ...(tag ? { tag } : {}),
        },
      };
    }
  }
}

function placementKindForBrush(mode: BrushMode): PlacementPaletteKind {
  if (mode === "resource" || mode === "npc" || mode === "trigger") {
    return mode;
  }
  if (mode === "item") {
    return "groundItem";
  }
  if (mode === "object") {
    return "object";
  }
  return parsePlacementKind(mustElement<HTMLSelectElement>("placement-kind").value);
}

function triggerIdBase(x: number, y: number): string {
  const value = normalizedOptionalText("trigger-id");
  return value ?? `trigger_${x}_${y}`;
}

function requiredSelectValue(id: string, message: string): string {
  const value = mustElement<HTMLSelectElement>(id).value;
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function setProbePoint(
  state: EditorState,
  endpoint: "start" | "end",
  canvas: HTMLCanvasElement,
): void {
  const tile = state.selectedTile;
  if (!tile || !assertRegionBounds(tile.x, tile.y)) {
    setStatus("select a tile", "error");
    return;
  }
  state.probe = { ...state.probe, [endpoint]: { x: tile.x, y: tile.y }, result: undefined };
  updateUi(state);
  draw(state, canvas);
  setStatus(endpoint === "start" ? "probe A set" : "probe B set", "ok");
}

function runCurrentProbe(state: EditorState, canvas: HTMLCanvasElement): void {
  const start = state.probe.start;
  if (!start) {
    setStatus("set probe A", "error");
    return;
  }
  try {
    if (state.probe.mode === "path") {
      const end = requiredProbeEnd(state);
      state.probe.result = {
        kind: "path",
        value: runPathProbe(state.selected.region, state.registries, start, end),
      };
    } else if (state.probe.mode === "los") {
      const end = requiredProbeEnd(state);
      state.probe.result = {
        kind: "los",
        value: runLosProbe(state.selected.region, state.registries, start, end),
      };
    } else {
      const selection = state.selectedPlacement;
      if (!selection) {
        throw new Error("Select a placement for interaction probe");
      }
      state.probe.result = {
        kind: "interaction",
        value: runInteractionProbe(
          state.selected.region,
          state.registries,
          start,
          selection,
          Math.max(0, numericInputValue("probe-distance")),
          mustElement<HTMLInputElement>("probe-los-required").checked,
        ),
      };
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "probe failed", "error");
    return;
  }
  updateUi(state);
  draw(state, canvas);
  setStatus("probe complete", "ok");
}

function exportProbeFixture(state: EditorState, output: HTMLTextAreaElement): void {
  const fixture = currentProbeFixture(state);
  if (!fixture) {
    setStatus("run probe first", "error");
    return;
  }
  output.value = probeFixtureJson(fixture);
  setStatus("probe fixture", "ok");
}

function currentProbeFixture(state: EditorState) {
  const start = state.probe.start;
  const result = state.probe.result;
  if (!start || !result) {
    return undefined;
  }
  switch (result.kind) {
    case "path": {
      const end = state.probe.end;
      return end ? pathFixture(state.selected.region, start, end, result.value) : undefined;
    }
    case "los": {
      const end = state.probe.end;
      return end ? losFixture(state.selected.region, start, end, result.value) : undefined;
    }
    case "interaction":
      return interactionFixture(state.selected.region, start, result.value);
  }
}

function requiredProbeEnd(state: EditorState): EditorProbePoint {
  const end = state.probe.end;
  if (!end) {
    throw new Error("Set probe B");
  }
  return end;
}

function undoRegionEdit(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const previous = state.history.undo.pop();
  if (!previous) {
    setStatus("nothing to undo", "error");
    return;
  }
  state.history.redo.push(cloneRegion(state.selected.region));
  replaceSelectedRegion(state, select, previous);
  updateExport(state, exportOutput, downloadLink);
  syncControlsFromSelectedTile(state);
  syncControlsFromSelectedPlacement(state);
  updateUi(state);
  draw(state, canvas);
  setStatus("undo", "ok");
}

function redoRegionEdit(
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): void {
  const next = state.history.redo.pop();
  if (!next) {
    setStatus("nothing to redo", "error");
    return;
  }
  state.history.undo.push(cloneRegion(state.selected.region));
  replaceSelectedRegion(state, select, next);
  updateExport(state, exportOutput, downloadLink);
  syncControlsFromSelectedTile(state);
  syncControlsFromSelectedPlacement(state);
  updateUi(state);
  draw(state, canvas);
  setStatus("redo", "ok");
}

function replaceSelectedRegion(
  state: EditorState,
  select: HTMLSelectElement,
  region: RegionMapDef,
): void {
  const summary = summarizeRegion(region);
  const index = state.regions.findIndex((candidate) => candidate.key === state.selected.key);
  if (index >= 0) {
    state.regions[index] = summary;
  } else {
    state.regions.push(summary);
  }
  state.regions.sort((a, b) => a.key.localeCompare(b.key));
  state.selected = summary;
  updateRegionOptions(state, select);
  select.value = summary.key;
}

function syncControlsFromSelectedTile(state: EditorState): void {
  const tile = state.selectedTile;
  if (!tile || !assertRegionBounds(tile.x, tile.y)) {
    return;
  }
  const region = state.selected.region;
  const current = tileAtFromMap(region, tileOverrideMap(region), tile.x, tile.y);
  setMaterialValue("underlay-select", current.underlayId);
  setOptionalMaterialValue("overlay-select", current.overlayId);
  mustElement<HTMLInputElement>("height-input").value = String(current.height);
  mustElement<HTMLInputElement>("water-toggle").checked = current.water;
  mustElement<HTMLInputElement>("bridge-toggle").checked = current.bridge;
  mustElement<HTMLInputElement>("zone-input").value = current.zoneId ?? "";
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="collision-flag"]')) {
    input.checked = (current.collision & Number(input.value)) !== 0;
  }
}

function setMaterialValue(id: string, materialId: string): void {
  const select = mustElement<HTMLSelectElement>(id);
  if (!Array.from(select.options).some((option) => option.value === materialId)) {
    select.append(new Option(materialId, materialId));
  }
  select.value = materialId;
}

function setOptionalMaterialValue(id: string, materialId: string | undefined): void {
  if (materialId === undefined) {
    mustElement<HTMLSelectElement>(id).value = "";
    return;
  }
  setMaterialValue(id, materialId);
}

function placementAtTile(state: EditorState, x: number, y: number): PlacementSelection | undefined {
  const region = state.selected.region;
  for (let i = region.objects.length - 1; i >= 0; i -= 1) {
    const placed = region.objects[i];
    if (!placed) {
      continue;
    }
    const def = state.registries.object.get(placed.objectId);
    const width = def?.width ?? 1;
    const length = def?.length ?? 1;
    if (pointInRect(x, y, placed.x, placed.y, width, length)) {
      return { kind: "object", index: i };
    }
  }
  for (let i = region.npcSpawns.length - 1; i >= 0; i -= 1) {
    const placed = region.npcSpawns[i];
    if (!placed) {
      continue;
    }
    const def = state.registries.npc.get(placed.npcId);
    const size = def?.size ?? 1;
    if (pointInRect(x, y, placed.x, placed.y, size, size)) {
      return { kind: "npc", index: i };
    }
  }
  for (let i = region.groundItemSpawns.length - 1; i >= 0; i -= 1) {
    const placed = region.groundItemSpawns[i];
    if (placed && placed.x === x && placed.y === y) {
      return { kind: "groundItem", index: i };
    }
  }
  for (let i = region.triggers.length - 1; i >= 0; i -= 1) {
    const placed = region.triggers[i];
    if (placed && pointInRect(x, y, placed.x, placed.y, placed.width, placed.height)) {
      return { kind: "trigger", index: i };
    }
  }
  return undefined;
}

function syncControlsFromSelectedPlacement(state: EditorState): void {
  const selected = selectedPlacementValue(state);
  if (!selected) {
    return;
  }
  const placementKind = mustElement<HTMLSelectElement>("placement-kind");
  switch (selected.kind) {
    case "object": {
      const object = selected.value;
      const def = state.registries.object.get(object.objectId);
      placementKind.value = def?.resourceNodeId ? "resource" : "object";
      setSelectValue(def?.resourceNodeId ? "resource-palette" : "object-palette", object.objectId);
      mustElement<HTMLInputElement>("object-rotation").value = String(object.rotation);
      return;
    }
    case "npc": {
      placementKind.value = "npc";
      setSelectValue("npc-palette", selected.value.npcId);
      mustElement<HTMLInputElement>("npc-wander").value = String(selected.value.wanderRadius ?? 0);
      return;
    }
    case "groundItem": {
      placementKind.value = "groundItem";
      setSelectValue("item-palette", selected.value.itemId);
      mustElement<HTMLInputElement>("item-quantity").value = String(selected.value.quantity);
      return;
    }
    case "trigger": {
      placementKind.value = "trigger";
      mustElement<HTMLInputElement>("trigger-id").value = selected.value.id;
      mustElement<HTMLInputElement>("trigger-width").value = String(selected.value.width);
      mustElement<HTMLInputElement>("trigger-height").value = String(selected.value.height);
      mustElement<HTMLInputElement>("trigger-tag").value = selected.value.tag ?? "";
      return;
    }
  }
}

function selectedPlacementValue(state: EditorState):
  | {
      readonly kind: "object";
      readonly selection: PlacementSelection;
      readonly value: PlacedObjectDef;
    }
  | { readonly kind: "npc"; readonly selection: PlacementSelection; readonly value: NpcSpawnDef }
  | {
      readonly kind: "groundItem";
      readonly selection: PlacementSelection;
      readonly value: GroundItemSpawnDef;
    }
  | {
      readonly kind: "trigger";
      readonly selection: PlacementSelection;
      readonly value: RegionMapDef["triggers"][number];
    }
  | undefined {
  const selection = state.selectedPlacement;
  if (!selection) {
    return undefined;
  }
  switch (selection.kind) {
    case "object": {
      const value = state.selected.region.objects[selection.index];
      return value ? { kind: "object", selection, value } : undefined;
    }
    case "npc": {
      const value = state.selected.region.npcSpawns[selection.index];
      return value ? { kind: "npc", selection, value } : undefined;
    }
    case "groundItem": {
      const value = state.selected.region.groundItemSpawns[selection.index];
      return value ? { kind: "groundItem", selection, value } : undefined;
    }
    case "trigger": {
      const value = state.selected.region.triggers[selection.index];
      return value ? { kind: "trigger", selection, value } : undefined;
    }
  }
}

function setSelectValue(id: string, value: string): void {
  const select = mustElement<HTMLSelectElement>(id);
  if (Array.from(select.options).some((option) => option.value === value)) {
    select.value = value;
  }
}

function pointInRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  width: number,
  height: number,
): boolean {
  return x >= rectX && y >= rectY && x < rectX + width && y < rectY + height;
}

function numericInputValue(id: string): number {
  const value = Number(mustElement<HTMLInputElement>(id).value);
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function normalizedOptionalText(id: string): string | null {
  const value = mustElement<HTMLInputElement>(id).value.trim();
  return value.length > 0 ? value : null;
}

async function importRegion(
  file: File,
  state: EditorState,
  select: HTMLSelectElement,
  exportOutput: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
): Promise<void> {
  try {
    const imported = parseExportedRegion(await file.text());
    const summary = summarizeRegion(imported);
    const existingIndex = state.regions.findIndex((region) => region.key === summary.key);
    if (existingIndex >= 0) {
      state.regions[existingIndex] = summary;
    } else {
      state.regions.push(summary);
      state.regions.sort((a, b) => a.key.localeCompare(b.key));
    }
    state.selected = summary;
    state.cameraX = REGION_SIZE / 2;
    state.cameraY = REGION_SIZE / 2;
    state.zoom = 12;
    state.selectedTile = undefined;
    state.selectedPlacement = undefined;
    state.probe = { mode: state.probe.mode };
    state.history.undo.length = 0;
    state.history.redo.length = 0;
    updateRegionOptions(state, select);
    select.value = summary.key;
    updateExport(state, exportOutput, downloadLink);
    syncControlsFromSelectedTile(state);
    updateUi(state);
    draw(state, canvas);
    setStatus("import ok", "ok");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "import failed", "error");
  }
}

function updateRegionOptions(state: EditorState, select: HTMLSelectElement): void {
  select.replaceChildren();
  for (const region of state.regions) {
    const option = document.createElement("option");
    option.value = region.key;
    option.textContent = region.label;
    select.append(option);
  }
}

function draw(state: EditorState, canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#101417";
  ctx.fillRect(0, 0, rect.width, rect.height);

  const region = state.selected.region;
  const overrides = tileOverrideMap(region);
  const materials = state.registries.material;
  const view = visibleBounds(rect, state);

  for (let y = view.minY; y <= view.maxY; y += 1) {
    for (let x = view.minX; x <= view.maxX; x += 1) {
      if (!assertRegionBounds(x, y)) {
        continue;
      }
      const tile = tileAtFromMap(region, overrides, x, y);
      const screen = screenFromWorld(rect, state, x, y);
      ctx.fillStyle = materialHex(materials.get(tile.overlayId ?? tile.underlayId));
      ctx.fillRect(screen.x, screen.y, state.zoom + 0.5, state.zoom + 0.5);
      if (tile.water) {
        ctx.fillStyle = "rgba(45, 131, 167, 0.55)";
        ctx.fillRect(screen.x, screen.y, state.zoom, state.zoom);
      }
      if (tile.collision > 0) {
        ctx.fillStyle = "rgba(201, 76, 61, 0.32)";
        ctx.fillRect(screen.x, screen.y, state.zoom, state.zoom);
        ctx.strokeStyle = "rgba(255, 222, 173, 0.36)";
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y + state.zoom);
        ctx.lineTo(screen.x + state.zoom, screen.y);
        ctx.stroke();
      }
    }
  }

  drawGrid(ctx, rect, state);
  drawPlacements(ctx, rect, state);
  drawProbe(ctx, rect, state);

  if (state.selectedTile && assertRegionBounds(state.selectedTile.x, state.selectedTile.y)) {
    const screen = screenFromWorld(rect, state, state.selectedTile.x, state.selectedTile.y);
    ctx.strokeStyle = "#8bd0bd";
    ctx.lineWidth = 3;
    ctx.strokeRect(screen.x + 1.5, screen.y + 1.5, state.zoom - 3, state.zoom - 3);
  }

  if (state.hoverTile && assertRegionBounds(state.hoverTile.x, state.hoverTile.y)) {
    const screen = screenFromWorld(rect, state, state.hoverTile.x, state.hoverTile.y);
    ctx.strokeStyle = "#f7d37a";
    ctx.lineWidth = 2;
    ctx.strokeRect(screen.x + 1, screen.y + 1, state.zoom - 2, state.zoom - 2);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, rect: DOMRect, state: EditorState): void {
  ctx.lineWidth = 1;
  for (let i = 0; i <= REGION_SIZE; i += 1) {
    const vertical = screenFromWorld(rect, state, i, 0).x;
    const horizontal = screenFromWorld(rect, state, 0, i).y;
    ctx.strokeStyle = i % 8 === 0 ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(vertical, screenFromWorld(rect, state, 0, 0).y);
    ctx.lineTo(vertical, screenFromWorld(rect, state, 0, REGION_SIZE).y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screenFromWorld(rect, state, 0, 0).x, horizontal);
    ctx.lineTo(screenFromWorld(rect, state, REGION_SIZE, 0).x, horizontal);
    ctx.stroke();
  }
  const origin = screenFromWorld(rect, state, 0, 0);
  ctx.strokeStyle = "#d7b56d";
  ctx.lineWidth = 2;
  ctx.strokeRect(origin.x, origin.y, REGION_SIZE * state.zoom, REGION_SIZE * state.zoom);
}

function drawPlacements(ctx: CanvasRenderingContext2D, rect: DOMRect, state: EditorState): void {
  const region = state.selected.region;
  for (const [index, placed] of region.triggers.entries()) {
    drawFootprint(ctx, rect, state, placed.x, placed.y, placed.width, placed.height, {
      fill: "rgba(138, 208, 189, 0.12)",
      stroke: selectionStroke(state, { kind: "trigger", index }, "#8bd0bd"),
      lineWidth: 2,
    });
  }
  for (const [index, placed] of region.objects.entries()) {
    const def = state.registries.object.get(placed.objectId);
    const width = def?.width ?? 1;
    const length = def?.length ?? 1;
    const resource = def?.resourceNodeId !== undefined;
    drawReachTiles(ctx, rect, state, placed.x, placed.y, width, length);
    drawFootprint(ctx, rect, state, placed.x, placed.y, width, length, {
      fill: resource ? "rgba(75, 142, 87, 0.38)" : "rgba(32, 23, 19, 0.72)",
      stroke: selectionStroke(state, { kind: "object", index }, resource ? "#77d26f" : "#f0a84a"),
      lineWidth: 2,
    });
    drawFacingNotch(ctx, rect, state, placed.x, placed.y, placed.rotation);
  }
  for (const [index, spawn] of region.npcSpawns.entries()) {
    const def = state.registries.npc.get(spawn.npcId);
    const size = def?.size ?? 1;
    drawReachTiles(ctx, rect, state, spawn.x, spawn.y, size, size);
    drawFootprint(ctx, rect, state, spawn.x, spawn.y, size, size, {
      fill: "rgba(124, 199, 216, 0.24)",
      stroke: selectionStroke(state, { kind: "npc", index }, "#7cc7d8"),
      lineWidth: 2,
    });
    const screen = screenFromWorld(rect, state, spawn.x + 0.5, spawn.y + 0.5);
    ctx.fillStyle = "#7cc7d8";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, Math.max(3, state.zoom * 0.28), 0, Math.PI * 2);
    ctx.fill();
    if (spawn.wanderRadius !== undefined && spawn.wanderRadius > 0) {
      drawFootprint(
        ctx,
        rect,
        state,
        spawn.x - spawn.wanderRadius,
        spawn.y - spawn.wanderRadius,
        spawn.wanderRadius * 2 + 1,
        spawn.wanderRadius * 2 + 1,
        { stroke: "rgba(124, 199, 216, 0.2)", lineWidth: 1 },
      );
    }
  }
  for (const [index, spawn] of region.groundItemSpawns.entries()) {
    const screen = screenFromWorld(rect, state, spawn.x + 0.5, spawn.y + 0.5);
    ctx.fillStyle =
      state.selectedPlacement?.kind === "groundItem" && state.selectedPlacement.index === index
        ? "#ffffff"
        : "#e3c75f";
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - state.zoom * 0.28);
    ctx.lineTo(screen.x + state.zoom * 0.28, screen.y);
    ctx.lineTo(screen.x, screen.y + state.zoom * 0.28);
    ctx.lineTo(screen.x - state.zoom * 0.28, screen.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFootprint(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  state: EditorState,
  x: number,
  y: number,
  width: number,
  height: number,
  style: { readonly fill?: string; readonly stroke?: string; readonly lineWidth: number },
): void {
  const origin = screenFromWorld(rect, state, x, y);
  if (style.fill) {
    ctx.fillStyle = style.fill;
    ctx.fillRect(origin.x, origin.y, width * state.zoom, height * state.zoom);
  }
  if (style.stroke) {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.lineWidth;
    ctx.strokeRect(origin.x, origin.y, width * state.zoom, height * state.zoom);
  }
}

function drawReachTiles(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  state: EditorState,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  drawFootprint(ctx, rect, state, x - 1, y - 1, width + 2, height + 2, {
    stroke: "rgba(247, 211, 122, 0.18)",
    lineWidth: 1,
  });
}

function drawFacingNotch(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  state: EditorState,
  x: number,
  y: number,
  rotation: number,
): void {
  const center = screenFromWorld(rect, state, x + 0.5, y + 0.5);
  const length = state.zoom * 0.38;
  const angle = (rotation % 4) * (Math.PI / 2) - Math.PI / 2;
  ctx.strokeStyle = "#fff1bd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(angle) * length, center.y + Math.sin(angle) * length);
  ctx.stroke();
}

function selectionStroke(
  state: EditorState,
  selection: PlacementSelection,
  fallback: string,
): string {
  return state.selectedPlacement?.kind === selection.kind &&
    state.selectedPlacement.index === selection.index
    ? "#ffffff"
    : fallback;
}

function drawProbe(ctx: CanvasRenderingContext2D, rect: DOMRect, state: EditorState): void {
  if (state.probe.start) {
    drawProbeTile(ctx, rect, state, state.probe.start, "#77d26f");
  }
  if (state.probe.end) {
    drawProbeTile(ctx, rect, state, state.probe.end, "#f08a73");
  }
  const result = state.probe.result;
  if (!result) {
    return;
  }
  if (result.kind === "path") {
    drawProbePath(
      ctx,
      rect,
      state,
      result.value.path.map((tile) => ({ x: tile.x, y: tile.y })),
      result.value.reached,
    );
  } else if (result.kind === "los") {
    drawProbePath(ctx, rect, state, result.value.ray, result.value.clear);
  } else {
    for (const tile of result.value.reachTiles) {
      drawProbeTile(ctx, rect, state, tile, "rgba(247, 211, 122, 0.28)");
    }
    drawProbePath(
      ctx,
      rect,
      state,
      result.value.path.path.map((tile) => ({ x: tile.x, y: tile.y })),
      result.value.path.reached,
    );
    if (result.value.nearestTile) {
      drawProbeTile(ctx, rect, state, result.value.nearestTile, "#ffffff");
    }
  }
}

function drawProbePath(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  state: EditorState,
  path: readonly EditorProbePoint[],
  success: boolean,
): void {
  ctx.strokeStyle = success ? "#8bd0bd" : "#f08a73";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [index, tile] of path.entries()) {
    const screen = screenFromWorld(rect, state, tile.x + 0.5, tile.y + 0.5);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
    drawProbeTile(
      ctx,
      rect,
      state,
      tile,
      success ? "rgba(139, 208, 189, 0.34)" : "rgba(240, 138, 115, 0.34)",
    );
  }
  ctx.stroke();
}

function drawProbeTile(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  state: EditorState,
  tile: EditorProbePoint,
  color: string,
): void {
  const screen = screenFromWorld(rect, state, tile.x, tile.y);
  ctx.fillStyle = color;
  ctx.fillRect(
    screen.x + 2,
    screen.y + 2,
    Math.max(2, state.zoom - 4),
    Math.max(2, state.zoom - 4),
  );
}

function updateUi(state: EditorState): void {
  const region = state.selected.region;
  mustElement("stat-region").textContent = state.selected.key;
  mustElement("stat-overrides").textContent = String(region.tiles.overrides.length);
  mustElement("stat-objects").textContent = String(region.objects.length);
  mustElement("stat-npcs").textContent = String(region.npcSpawns.length);
  mustElement("active-region").textContent = `region ${state.selected.key}`;
  mustElement("active-zoom").textContent = `zoom ${state.zoom.toFixed(1)}`;
  mustElement("probe-status").textContent = probeSummary(state);
  mustElement<HTMLButtonElement>("undo-button").disabled = state.history.undo.length === 0;
  mustElement<HTMLButtonElement>("redo-button").disabled = state.history.redo.length === 0;
  const hasPlacementSelection = selectedPlacementValue(state) !== undefined;
  mustElement<HTMLButtonElement>("move-placement").disabled = !hasPlacementSelection;
  mustElement<HTMLButtonElement>("rotate-placement").disabled =
    state.selectedPlacement?.kind !== "object";
  mustElement<HTMLButtonElement>("duplicate-placement").disabled = !hasPlacementSelection;
  mustElement<HTMLButtonElement>("delete-placement").disabled = !hasPlacementSelection;

  const selectedTitle = mustElement("selected-title");
  const selectedDetail = mustElement("selected-detail");
  if (!state.selectedTile || !assertRegionBounds(state.selectedTile.x, state.selectedTile.y)) {
    selectedTitle.textContent = "No selection";
    selectedDetail.textContent = "none";
  } else {
    const selected = tileAtFromMap(
      region,
      tileOverrideMap(region),
      state.selectedTile.x,
      state.selectedTile.y,
    );
    selectedTitle.textContent = `Selected ${selected.x}, ${selected.y}`;
    const placement = selectedPlacementValue(state);
    selectedDetail.textContent = placement
      ? `${tileSummary(selected)} ${placementSummary(state, placement.selection)}`
      : tileSummary(selected);
  }

  const hoverTitle = mustElement("hover-title");
  const hoverDetail = mustElement("hover-detail");
  if (!state.hoverTile || !assertRegionBounds(state.hoverTile.x, state.hoverTile.y)) {
    hoverTitle.textContent = "No tile";
    hoverDetail.textContent = "outside";
    return;
  }
  const tile = tileAtFromMap(region, tileOverrideMap(region), state.hoverTile.x, state.hoverTile.y);
  hoverTitle.textContent = `Tile ${tile.x}, ${tile.y}`;
  hoverDetail.textContent = tileSummary(tile);
}

function tileSummary(tile: EditorTile): string {
  const markers = [
    tile.water ? "water" : undefined,
    tile.bridge ? "bridge" : undefined,
    tile.zoneId ? `zone=${tile.zoneId}` : undefined,
  ].filter((value): value is string => value !== undefined);
  const suffix = markers.length > 0 ? ` ${markers.join(" ")}` : "";
  return `${tile.underlayId} h=${tile.height} col=${tile.collision}${suffix}`;
}

function placementSummary(state: EditorState, selection: PlacementSelection): string {
  switch (selection.kind) {
    case "object": {
      const placed = state.selected.region.objects[selection.index];
      return placed ? `object=${placed.objectId} rot=${placed.rotation}` : "";
    }
    case "npc": {
      const placed = state.selected.region.npcSpawns[selection.index];
      return placed ? `npc=${placed.npcId} wander=${placed.wanderRadius ?? 0}` : "";
    }
    case "groundItem": {
      const placed = state.selected.region.groundItemSpawns[selection.index];
      return placed ? `item=${placed.itemId} qty=${placed.quantity}` : "";
    }
    case "trigger": {
      const placed = state.selected.region.triggers[selection.index];
      return placed ? `trigger=${placed.id} ${placed.width}x${placed.height}` : "";
    }
  }
}

function probeSummary(state: EditorState): string {
  const start = state.probe.start ? `A=${state.probe.start.x},${state.probe.start.y}` : "A=-";
  const end = state.probe.end ? `B=${state.probe.end.x},${state.probe.end.y}` : "B=-";
  const result = state.probe.result;
  if (!result) {
    return `${state.probe.mode} ${start} ${end}`;
  }
  if (result.kind === "path") {
    return `path reached=${result.value.reached} steps=${result.value.path.length}`;
  }
  if (result.kind === "los") {
    return `los clear=${result.value.clear} ray=${result.value.ray.length}`;
  }
  return `interaction inRange=${result.value.inRange} path=${result.value.path.path.length}`;
}

function updateExport(
  state: EditorState,
  output: HTMLTextAreaElement,
  downloadLink: HTMLAnchorElement,
): void {
  const json = exportRegionJson(state.selected.region);
  parseExportedRegion(json);
  output.value = json;
  const blob = new Blob([json], { type: "application/json" });
  const oldUrl = downloadLink.href;
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `old-town-${state.selected.key.replaceAll(":", "-")}.json`;
  if (oldUrl.startsWith("blob:")) {
    URL.revokeObjectURL(oldUrl);
  }
}

function setStatus(message: string, severity: "ok" | "error"): void {
  const pill = mustElement("validity-pill");
  pill.textContent = message;
  pill.dataset.severity = severity;
}

function tileFromMouse(
  canvas: HTMLCanvasElement,
  state: EditorState,
  event: Pick<MouseEvent, "offsetX" | "offsetY">,
): { x: number; y: number } {
  const world = worldFromScreen(canvas, state, event.offsetX, event.offsetY);
  return { x: Math.floor(world.x), y: Math.floor(world.y) };
}

function worldFromScreen(
  canvas: HTMLCanvasElement,
  state: EditorState,
  x: number,
  y: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (x - rect.width / 2) / state.zoom + state.cameraX,
    y: (y - rect.height / 2) / state.zoom + state.cameraY,
  };
}

function screenFromWorld(
  rect: DOMRect,
  state: EditorState,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: (x - state.cameraX) * state.zoom + rect.width / 2,
    y: (y - state.cameraY) * state.zoom + rect.height / 2,
  };
}

function visibleBounds(
  rect: DOMRect,
  state: EditorState,
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const halfWidth = rect.width / state.zoom / 2 + 2;
  const halfHeight = rect.height / state.zoom / 2 + 2;
  return {
    minX: Math.max(0, Math.floor(state.cameraX - halfWidth)),
    maxX: Math.min(REGION_SIZE - 1, Math.ceil(state.cameraX + halfWidth)),
    minY: Math.max(0, Math.floor(state.cameraY - halfHeight)),
    maxY: Math.min(REGION_SIZE - 1, Math.ceil(state.cameraY + halfHeight)),
  };
}

function clampZoom(value: number): number {
  return Math.max(4, Math.min(42, value));
}

function mustElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element as T;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
