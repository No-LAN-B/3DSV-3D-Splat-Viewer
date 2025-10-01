// src/core/screen.ts
import type { AABB } from "./types";

type Vec2 = [number, number];

// TODO: implement matrix accessor (rowMajor vs colMajor)
function mat(viewProj: number[], r: number, c: number, rowMajor: boolean): number {
  // placeholder
  return 0;
}

// TODO: multiply a point [x,y,z,1] by viewProj → return [X,Y,Z,W]
function mulPoint(viewProj: number[], rowMajor: boolean, p: [number, number, number]) {
  // placeholder
  return [0,0,0,1] as const;
}

// TODO: generate 8 corners of the box
function corners(aabb: AABB): [number, number, number][] {
  return [];
}

/**
 * Rough projected pixel area of an AABB.
 * Steps:
 * 1. Project 8 corners into clip space.
 * 2. Do perspective divide (X/W, Y/W).
 * 3. (Optional) clamp NDC to [-1,1].
 * 4. Scale into pixel coords.
 * 5. Compute area of bounding rect.
 */
export function estimateAabbPixelArea(
  aabb: AABB,
  viewProj: number[],
  viewport: Vec2,
  opts?: { rowMajor?: boolean; clampNDC?: boolean }
): number {
  // TODO: implement steps above
  return 0;
}
