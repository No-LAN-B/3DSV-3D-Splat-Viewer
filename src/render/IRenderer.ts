// Common types the renderer needs
export type Mat4 = Float32Array;

export type RendererConfig = {
  drawMode?: "points" | "quads";          // visual path
  useWboit?: boolean;                     // toggle OIT
  lodPxThreshold?: number;                // min projected px to draw
  maxOnscreenInstances?: number;          // hard cap
};

export type RendererStats = {
  frame: number;                          // frame counter
  cpuMs: number;                          // set by caller if desired
  gpuMs?: number;                         // real renderers may fill
  tilesUploaded: number;                  // total tiles uploaded this frame
  tilesResident: number;                  // current resident tiles
  instancesDrawn: number;                 // instances drawn this frame
  trianglesDrawn: number;                 // mostly for mesh paths
  bytesGPU: number;                       // estimated GPU memory in bytes
};

export type TileHandle = number;          // your tile ID (index.json -> id)
export type TileGPUResource = unknown;    // backend-specific handle

// Minimal per-draw info (expand later if you batch by material etc.)
export type DrawList = {
  // Number of instances the renderer should draw this frame (already culled/LOD'd)
  instanceCount: number;
  // Optional: a list of tile IDs in the order you want drawn (helps for debug/hints)
  tileIds?: TileHandle[];
};

/**
 * All render backends (Null, WebGL2, WebGPU) should implement this shape.
 * Keep this API stable so you can swap implementations freely.
 */
export interface IRenderer {
  /** one-time init, called after canvas/context exists */
  init(canvas: HTMLCanvasElement): Promise<void> | void;

  /** notify renderer about viewport change (CSS/device pixel ratio handled by caller) */
  resize(width: number, height: number): void;

  /** begin a new frame (reset internal counters) */
  beginFrame(): void;

  /** set camera matrices (column-major 4x4) */
  setCamera(view: Mat4, proj: Mat4): void;

  /** upload a decoded tile buffer; return a backend resource handle if you want */
  uploadTile(tileId: TileHandle, interleavedBuffer: ArrayBufferLike): TileGPUResource | void;

  /** remove a previously uploaded tile (for LRU eviction) */
  removeTile(tileId: TileHandle): void;

  /** set runtime toggles (LOD thresholds, modes, etc.) */
  setConfig(cfg: Partial<RendererConfig>): void;

  /** issue draws for the current frame */
  draw(list: DrawList): void;

  /** finalize the frame (resolve passes, timers, etc.) */
  endFrame(): void;

  /** query stats for HUD */
  getStats(): RendererStats;

  /** release all GPU resources */
  dispose(): void;
}
