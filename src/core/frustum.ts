// src/core/frustum.ts
import type { AABB, Sphere } from "./types";

export type Plane = { n: [number, number, number]; d: number };
export type Frustum = [Plane, Plane, Plane, Plane, Plane, Plane];

function normalizePlane(p: Plane): Plane {
  // p.n[0] x comp of norm, [1] = y, [2] = z,
  const len = Math.hypot(p.n[0], p.n[1], p.n[2]);
  return { n: [p.n[0] / len, p.n[1] / len, p.n[2] / len], d: p.d / len };
}

/** Matrix accessor for flat 4x4 arrays */
function mat(viewProj: number[], r: number, c: number, rowMajor: boolean): number {
  return rowMajor ? viewProj[r * 4 + c] : viewProj[c * 4 + r];
}

/** Build one plane using M[3] ± M[0/1/2] pattern, then normalize */
function makePlane(
  sx: number, sy: number, sz: number,
  viewProj: number[], rowMajor: boolean
): Plane {
  const nx = mat(viewProj, 0, 3, rowMajor) + sx * mat(viewProj, 0, 0, rowMajor)
                                    + sy * mat(viewProj, 0, 1, rowMajor)
                                    + sz * mat(viewProj, 0, 2, rowMajor);
  const ny = mat(viewProj, 1, 3, rowMajor) + sx * mat(viewProj, 1, 0, rowMajor)
                                    + sy * mat(viewProj, 1, 1, rowMajor)
                                    + sz * mat(viewProj, 1, 2, rowMajor);
  const nz = mat(viewProj, 2, 3, rowMajor) + sx * mat(viewProj, 2, 0, rowMajor)
                                    + sy * mat(viewProj, 2, 1, rowMajor)
                                    + sz * mat(viewProj, 2, 2, rowMajor);
  const d  = mat(viewProj, 3, 3, rowMajor) + sx * mat(viewProj, 3, 0, rowMajor)
                                    + sy * mat(viewProj, 3, 1, rowMajor)
                                    + sz * mat(viewProj, 3, 2, rowMajor);
  return normalizePlane({ n: [nx, ny, nz], d });
}

//By default, the function assumes your matrix is stored row-major (C/TS style).
//But you can override with opts = { rowMajor: false } if you’re working in column-major layout (OpenGL-style).
export function extractFrustumPlanes(
  viewProj: number[],
  opts?: { rowMajor?: boolean }
): Frustum {
  const rowMajor = opts?.rowMajor ?? true;

  const left   = makePlane(+1,  0,  0, viewProj, rowMajor); // M[3] + M[0]
  const right  = makePlane(-1,  0,  0, viewProj, rowMajor); // M[3] - M[0]
  const bottom = makePlane( 0, +1,  0, viewProj, rowMajor); // M[3] + M[1]
  const top    = makePlane( 0, -1,  0, viewProj, rowMajor); // M[3] - M[1]
  const nearP  = makePlane( 0,  0, +1, viewProj, rowMajor); // M[3] + M[2]
  const farP   = makePlane( 0,  0, -1, viewProj, rowMajor); // M[3] - M[2]

  return [left, right, bottom, top, nearP, farP];
}

export function aabbOutsidePlane(box: AABB, p: Plane): boolean {
  const px = p.n[0] >= 0 ? box.max[0] : box.min[0];
  const py = p.n[1] >= 0 ? box.max[1] : box.min[1];
  const pz = p.n[2] >= 0 ? box.max[2] : box.min[2];
  return (p.n[0] * px + p.n[1] * py + p.n[2] * pz + p.d) < 0;
}

export function sphereIntersectsFrustum(s: Sphere, fr: Frustum): boolean {
  for (const p of fr) {
    // signed distance from center to plane
    const dist = p.n[0]*s.center[0] + p.n[1]*s.center[1] + p.n[2]*s.center[2] + p.d;
    if (dist < -s.radius) return false; // completely outside this plane
  }
  return true; // intersects or fully inside
}
