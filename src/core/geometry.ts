// src/core/geometry.ts

import type { AABB, Sphere } from "./types";

/**
 * Returns a tight bounding sphere around an AABB.
 * Center is the box center; radius is half the diagonal length.
 */
export function bsphereFromAABB(aabb: AABB): Sphere {
  const cx = (aabb.min[0] + aabb.max[0]) * 0.5;
  const cy = (aabb.min[1] + aabb.max[1]) * 0.5;
  const cz = (aabb.min[2] + aabb.max[2]) * 0.5;

  const ex = (aabb.max[0] - aabb.min[0]) * 0.5;
  const ey = (aabb.max[1] - aabb.min[1]) * 0.5;
  const ez = (aabb.max[2] - aabb.min[2]) * 0.5;

  const r = Math.hypot(ex, ey, ez);

  return {
    center: [cx, cy, cz],
    radius: r,
  };
}

/** Convenience helpers **/
export function aabbCenter(aabb: AABB): [number, number, number] {
  return [
    (aabb.min[0] + aabb.max[0]) * 0.5,
    (aabb.min[1] + aabb.max[1]) * 0.5,
    (aabb.min[2] + aabb.max[2]) * 0.5,
  ];
}

export function aabbExtents(aabb: AABB): [number, number, number] {
  return [
    (aabb.max[0] - aabb.min[0]) * 0.5,
    (aabb.max[1] - aabb.min[1]) * 0.5,
    (aabb.max[2] - aabb.min[2]) * 0.5,
  ];
}
