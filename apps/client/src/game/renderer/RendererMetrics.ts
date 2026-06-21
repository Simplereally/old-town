const FRAME_SAMPLE_COUNT = 180;

function percentile(sorted: number[] | Float64Array, p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const a = sorted[lower] ?? 0;
  const b = sorted[upper] ?? 0;
  return a * (1 - weight) + b * weight;
}

export class RendererMetrics {
  private readonly frameTimes: Float64Array;
  private frameIndex = 0;
  private frameFilled = 0;

  // Current counts
  private drawCalls = 0;
  private geometries = 0;
  private textures = 0;
  private actors = 0;
  private objects = 0;
  private loadedChunks = 0;
  private snapshotDepth = 0;
  private uploadQueueDepth = 0;
  private workerQueueDepth = 0;
  private entityCount = 0;

  // Latest sampled values
  private latestHeap: number | null = null;
  private latestGpu: number | null = null;
  private lastFrameTimeMs = 0;
  private lastFps = 0;

  constructor() {
    this.frameTimes = new Float64Array(FRAME_SAMPLE_COUNT);
  }

  recordFrame(frameDeltaMs: number, drawCalls: number, geometries: number, textures: number): void {
    this.frameTimes[this.frameIndex] = frameDeltaMs;
    this.frameIndex = (this.frameIndex + 1) % FRAME_SAMPLE_COUNT;
    if (this.frameFilled < FRAME_SAMPLE_COUNT) {
      this.frameFilled++;
    }
    this.drawCalls = drawCalls;
    this.geometries = geometries;
    this.textures = textures;
    this.lastFrameTimeMs = frameDeltaMs;
    this.lastFps = Math.round(1000 / Math.max(frameDeltaMs, 0.001));
  }

  recordLayerCounts(actors: number, objects: number, loadedChunks: number): void {
    this.actors = actors;
    this.objects = objects;
    this.loadedChunks = loadedChunks;
  }

  recordSnapshotDepth(depth: number): void {
    this.snapshotDepth = depth;
  }

  recordUploadQueueDepth(depth: number): void {
    this.uploadQueueDepth = depth;
  }

  recordWorkerQueueDepth(depth: number): void {
    this.workerQueueDepth = depth;
  }

  recordEntityCount(count: number): void {
    this.entityCount = count;
  }

  recordHeapSample(bytes: number | null): void {
    this.latestHeap = bytes;
  }

  recordGpuTime(ms: number | null): void {
    this.latestGpu = ms;
  }

  computeStats(): {
    fps: number;
    lastFrameTimeMs: number;
    frameTimeP50: number;
    frameTimeP95: number;
    frameTimeP99: number;
    drawCalls: number;
    geometries: number;
    textures: number;
    actors: number;
    objects: number;
    loadedChunks: number;
    snapshotDepth: number;
    uploadQueueDepth: number;
    workerQueueDepth: number;
    entityCount: number;
    latestHeap: number | null;
    latestGpu: number | null;
  } {
    const copy = new Float64Array(this.frameFilled);
    if (this.frameFilled === FRAME_SAMPLE_COUNT) {
      // Ring buffer is full; copy in order from oldest to newest
      for (let i = 0; i < FRAME_SAMPLE_COUNT; i++) {
        copy[i] = this.frameTimes[(this.frameIndex + i) % FRAME_SAMPLE_COUNT] ?? 0;
      }
    } else {
      // Buffer partially filled; copy from start up to filled count
      for (let i = 0; i < this.frameFilled; i++) {
        copy[i] = this.frameTimes[i] ?? 0;
      }
    }

    const sorted = copy.slice().sort((a, b) => a - b);

    return {
      fps: this.lastFps,
      lastFrameTimeMs: this.lastFrameTimeMs,
      frameTimeP50: percentile(sorted, 50),
      frameTimeP95: percentile(sorted, 95),
      frameTimeP99: percentile(sorted, 99),
      drawCalls: this.drawCalls,
      geometries: this.geometries,
      textures: this.textures,
      actors: this.actors,
      objects: this.objects,
      loadedChunks: this.loadedChunks,
      snapshotDepth: this.snapshotDepth,
      uploadQueueDepth: this.uploadQueueDepth,
      workerQueueDepth: this.workerQueueDepth,
      entityCount: this.entityCount,
      latestHeap: this.latestHeap,
      latestGpu: this.latestGpu,
    };
  }
}

interface TimerQueryExt {
  readonly TIME_ELAPSED_EXT: number;
  readonly GPU_DISJOINT_EXT: number;
}

export class GpuTimingAdapter {
  private ext: TimerQueryExt | null = null;
  private gl: WebGL2RenderingContext | null = null;

  constructor(gl: WebGL2RenderingContext | null) {
    if (gl) {
      this.ext = gl.getExtension("EXT_disjoint_timer_query") as TimerQueryExt | null;
      this.gl = gl;
    }
  }

  createQuery(): WebGLQuery | null {
    if (!this.ext || !this.gl) return null;
    return this.gl.createQuery();
  }

  beginQuery(query: WebGLQuery): void {
    if (!this.ext || !this.gl) return;
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
  }

  endQuery(): void {
    if (!this.ext || !this.gl) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
  }

  getResultAvailable(query: WebGLQuery): boolean {
    if (!this.ext || !this.gl) return false;
    return this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE) as boolean;
  }

  getResult(query: WebGLQuery): number | null {
    if (!this.ext || !this.gl) return null;
    const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT) as boolean;
    if (disjoint) return null;
    const result = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT) as number;
    return result / 1e6;
  }

  deleteQuery(query: WebGLQuery): void {
    if (!this.gl) return;
    this.gl.deleteQuery(query);
  }

  isAvailable(): boolean {
    return this.ext !== null;
  }
}
