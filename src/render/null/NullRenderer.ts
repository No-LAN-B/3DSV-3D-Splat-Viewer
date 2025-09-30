import type {
  IRenderer,
  RendererConfig,
  RendererStats,
  TileHandle,
  DrawList,
} from "../IRenderer";

export class NullRenderer implements IRenderer {
  private cfg: RendererConfig = {
    drawMode: "points",
    useWboit: false,
    lodPxThreshold: 1.0,
    maxOnscreenInstances: 200_000,
  };

  private stats: RendererStats = {
    frame: 0,
    cpuMs: 0,
    gpuMs: 0,
    tilesUploaded: 0,
    tilesResident: 0,
    instancesDrawn: 0,
    trianglesDrawn: 0,
    bytesGPU: 0,
  };

  // Tracks which tile IDs are currently "resident" (ie. considered uploaded to GPU).
  // In NullRenderer I just simulate this set, but in real backends (WebGL/WebGPU)
  // it would correspond to buffers/textures that are alive in GPU memory.
  // Used for LRU eviction, memory budgeting, and HUD stats.
  private resident = new Set<TileHandle>();
  private canvas?: HTMLCanvasElement; // this property may be undefined until set.

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas; // only for size; no GL/GPU work here
  }

  resize(_w: number, _h: number): void {
    // no-op, but keep to mirror real backends
  }

  beginFrame(): void {
    this.stats.frame++;
    // reset per-frame counters
    this.stats.tilesUploaded = 0;
    this.stats.instancesDrawn = 0;
    this.stats.trianglesDrawn = 0;
    // gpuMs stays as whatever caller/overlay wants to show (0 for null)
  }

  setCamera(_view: Float32Array, _proj: Float32Array): void {
    // no-op
  }

  uploadTile(tileId: TileHandle, _buf: ArrayBufferLike): void {
    if (!this.resident.has(tileId)) {
      this.resident.add(tileId);
      this.stats.tilesResident = this.resident.size;
      this.stats.tilesUploaded++;
      // pretend each tile costs ~1MB on "GPU" for budgeting UX
      this.stats.bytesGPU += 1_000_000;
    }
  }

  removeTile(tileId: TileHandle): void {
    if (this.resident.delete(tileId)) {
      this.stats.tilesResident = this.resident.size;
      this.stats.bytesGPU = Math.max(0, this.stats.bytesGPU - 1_000_000);
    }
  }

  setConfig(cfg: Partial<RendererConfig>): void {
    this.cfg = { ...this.cfg, ...cfg };
  }

  draw(list: DrawList): void {
    // Simulate the instance budget so HUD/UX matches real life
    const budget = this.cfg.maxOnscreenInstances ?? 200_000; // returns this. (max...) if not null or undef otherwise returns 200000
    const drawn = Math.min(list.instanceCount, budget);
    this.stats.instancesDrawn += drawn;

    // Give the HUD something to show as "gpu time" (purely synthetic)
    const syntheticGpuMs = (drawn / 1000) * 0.008;
    this.stats.gpuMs = Math.round(syntheticGpuMs * 1000) / 1000;
  }

  endFrame(): void {
    
  }

  getStats(): RendererStats {
    return { ...this.stats };
  }

  dispose(): void {
    this.resident.clear();
    this.stats.tilesResident = 0;
    this.stats.bytesGPU = 0;
  }
}

export default NullRenderer;
