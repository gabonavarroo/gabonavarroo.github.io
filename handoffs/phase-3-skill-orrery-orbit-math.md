# HANDOFF: Gemini → Codex

## Task
SkillOrrery orbit math for Phase 3.

## Input
- DESIGN.md Section 3 — Skills / Orbital Interface
- plans/phase-3-about-skills.md
- src/data/skills.ts

## Spec reference
Phase 3 requires 4 inclined elliptical orbits, distinct X-axis tilts and Y-axis rotations, and a helper for computing skill pod world positions.

## Expected output
Codex should use the following orbit constants and helper function inside `src/components/skills/SkillOrrery.tsx`, or extract them into `src/lib/skillOrreryMath.ts`.

## Quality bar
The result should look like a futuristic orbital skill matrix, not a flat carousel. The rings should appear non-coplanar from the camera view.

## Orbit math
```ts
}

export const ORBIT_RADII = [1.5, 2.2, 2.9, 3.6, 4.7, 5.4, 6.2] as const;

export const ORBIT_INCLINATIONS = [
  0.1,
  -0.25,
  0.4,
  -0.55,
  0.72,
  -0.88,
  1.08,
] as const;

export const ORBIT_ROTATIONS: readonly [number, number, number][] = [
  [0.1, 0.0, 0.04],
  [-0.25, 0.72, -0.08],
  [0.4, -0.95, 0.12],
  [-0.55, 1.48, -0.16],
  [0.72, -1.85, 0.2],
  [-0.88, 2.25, -0.24],
  [1.08, -2.65, 0.28],
] as const;

const ORBIT_ASPECT_RATIOS = [0.72, 0.78, 0.68, 0.82, 0.74, 0.7, 0.76] as const;

type PodRingIndex = 0 | 1 | 2 | 3;

export function getPodPosition(
  ringIndex: PodRingIndex,
  theta: number
): [number, number, number] {
  const radius = ORBIT_RADII[ringIndex];
  const aspect = ORBIT_ASPECT_RATIOS[ringIndex];

  const semiMajor = radius;
  const semiMinor = radius * aspect;

  const localX = semiMajor * Math.cos(theta);
  const localY = 0;
  const localZ = semiMinor * Math.sin(theta);

  const [rotX, rotY, rotZ] = ORBIT_ROTATIONS[ringIndex];

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);

  const x1 = localX;
  const y1 = localY * cosX - localZ * sinX;
  const z1 = localY * sinX + localZ * cosX;

  const x2 = x1 * cosY + z1 * sinY;
  const y2 = y1;
  const z2 = -x1 * sinY + z1 * cosY;

  const x3 = x2 * cosZ - y2 * sinZ;
  const y3 = x2 * sinZ + y2 * cosZ;
  const z3 = z2;

  return [x3, y3, z3];
}