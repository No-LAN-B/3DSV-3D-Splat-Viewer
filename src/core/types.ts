// src/core/types.ts

export type TileId = string;

export type Residency =
  | "Unloaded"
  | "Queued"
  | "Loading"
  | "Resident"
  | "Pinned"
  | "Evicting"
  | "Failed";

export interface AABB {
  min: [number, number, number]; // world-space
  max: [number, number, number]; // world-space
}

export interface Sphere {
  center: [number, number, number]; // world-space
  radius: number;                   // world units
}

export interface TileMeta {
  id: TileId;
  url: string;             // where to fetch this tile
  byteSize: number;        // approximate decoded size
  aabb: AABB;              // for precise tests and screen-size estimate
  bsphere: Sphere;         // cheap early-out cull
  lodLevel?: number;       // optional LOD index or error bucket
}

export interface LoadResult {
  id: TileId;
  meta: TileMeta;
  // Keep concrete for now; we will widen to a discriminated union later
  payload: ArrayBuffer;
}

export interface TileRequest {
  id: TileId;
  priority: number;     // lower = higher priority
  signal?: AbortSignal; // optional cancel
}

export interface TileLoader {
  fetchMeta(id: TileId): Promise<TileMeta>;
  fetchTile(req: TileRequest): { promise: Promise<LoadResult>; cancel: () => void };
}

export interface TileResident {
  id: TileId;
  meta: TileMeta;
  gpuHandle: unknown;   // placeholder for VAO/VBO/buffer handles
}

export interface ResidencyView {
  has(id: TileId): boolean;
  get(id: TileId): TileResident | undefined;
  sizeBytes(): number;
  residentIds(): Iterable<TileId>;
}
