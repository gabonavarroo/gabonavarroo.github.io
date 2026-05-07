type Point3 = [number, number, number];

type Segment = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r0: number;
  r1: number;
  count: number;
  seed: number;
};

type Ellipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  seed: number;
  contourBias?: number;
};

type PoseSpec = {
  head: Ellipse;
  torso: Ellipse;
  pelvis: Ellipse;
  limbs: Segment[];
};

const TARGET_POINTS = 2048;

const hash01 = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const jitter = (seed: number, i: number, scale: number) =>
  (hash01(seed + i * 17.17) - 0.5) * scale;

const zOf = (seed: number, i: number): number =>
  Number(((hash01(seed * 3.1 + i * 19.97) - 0.5) * 0.1).toFixed(4));

const roundPoint = (x: number, y: number, z: number): Point3 => [
  Number(x.toFixed(4)),
  Number(y.toFixed(4)),
  Number(z.toFixed(4)),
];

const ellipsePoints = ({
  cx,
  cy,
  rx,
  ry,
  count,
  seed,
  contourBias = 0.72,
}: Ellipse): Point3[] => {
  const pts: Point3[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle =
      t * Math.PI * 2 +
      jitter(seed, i, 0.035) +
      0.18 * Math.sin(t * Math.PI * 10 + seed);

    const edge = hash01(seed + i * 2.31) < contourBias;
    const radial = edge
      ? 0.82 + hash01(seed + i * 5.03) * 0.2
      : Math.sqrt(hash01(seed + i * 7.71)) * 0.82;

    const x = cx + Math.cos(angle) * rx * radial + jitter(seed + 1000, i, 0.012);
    const y = cy + Math.sin(angle) * ry * radial + jitter(seed + 2000, i, 0.012);

    pts.push(roundPoint(x, y, zOf(seed, i)));
  }

  return pts;
};

const capsulePoints = ({
  ax,
  ay,
  bx,
  by,
  r0,
  r1,
  count,
  seed,
}: Segment): Point3[] => {
  const pts: Point3[] = [];

  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  for (let i = 0; i < count; i++) {
    const u = i / Math.max(1, count - 1);
    const wave = 0.02 * Math.sin(u * Math.PI * 6 + seed);
    const xBase = ax + dx * u;
    const yBase = ay + dy * u;
    const r = r0 + (r1 - r0) * u;

    const edge = hash01(seed + i * 3.13) < 0.76;
    const side = hash01(seed + i * 9.77) < 0.5 ? -1 : 1;
    const offset = edge
      ? side * r * (0.82 + hash01(seed + i * 4.41) * 0.28)
      : (hash01(seed + i * 8.19) - 0.5) * r * 1.42;

    const x = xBase + nx * offset + dx * wave * 0.04 + jitter(seed + 3000, i, 0.01);
    const y = yBase + ny * offset + dy * wave * 0.04 + jitter(seed + 4000, i, 0.01);

    pts.push(roundPoint(x, y, zOf(seed, i)));
  }

  return pts;
};

const normalizeCount = (pts: Point3[], target = TARGET_POINTS, seed = 1): Point3[] => {
  if (pts.length === target) return pts;

  const out = pts.slice(0, target);

  for (let i = out.length; i < target; i++) {
    const p = pts[Math.floor(hash01(seed + i * 11.31) * pts.length)];
    out.push(
      roundPoint(
        p[0] + jitter(seed + 5000, i, 0.012),
        p[1] + jitter(seed + 6000, i, 0.012),
        zOf(seed + 7000, i)
      )
    );
  }

  return out;
};

const makePose = (spec: PoseSpec, seed: number): Point3[] => {
  const pts: Point3[] = [
    ...ellipsePoints(spec.head),
    ...ellipsePoints(spec.torso),
    ...ellipsePoints(spec.pelvis),
    ...spec.limbs.flatMap(capsulePoints),
  ];

  return normalizeCount(pts, TARGET_POINTS, seed);
};

export const RUNNER_POSES: { [keyframe: string]: Point3[] } = {
  standing: makePose(
    {
      head: { cx: 0, cy: 0.78, rx: 0.17, ry: 0.18, count: 250, seed: 10 },
      torso: { cx: 0, cy: 0.22, rx: 0.27, ry: 0.43, count: 540, seed: 20 },
      pelvis: { cx: 0, cy: -0.22, rx: 0.23, ry: 0.15, count: 230, seed: 30 },
      limbs: [
        { ax: -0.18, ay: 0.45, bx: -0.27, by: 0.08, r0: 0.065, r1: 0.052, count: 150, seed: 40 },
        { ax: -0.27, ay: 0.08, bx: -0.19, by: -0.28, r0: 0.052, r1: 0.043, count: 135, seed: 50 },
        { ax: 0.18, ay: 0.45, bx: 0.26, by: 0.08, r0: 0.065, r1: 0.052, count: 150, seed: 60 },
        { ax: 0.26, ay: 0.08, bx: 0.18, by: -0.28, r0: 0.052, r1: 0.043, count: 135, seed: 70 },
        { ax: -0.1, ay: -0.33, bx: -0.12, by: -0.67, r0: 0.09, r1: 0.07, count: 150, seed: 80 },
        { ax: -0.12, ay: -0.67, bx: -0.13, by: -0.99, r0: 0.07, r1: 0.052, count: 135, seed: 90 },
        { ax: 0.1, ay: -0.33, bx: 0.12, by: -0.67, r0: 0.09, r1: 0.07, count: 150, seed: 100 },
        { ax: 0.12, ay: -0.67, bx: 0.13, by: -0.99, r0: 0.07, r1: 0.052, count: 135, seed: 110 },
      ],
    },
    1001
  ),

  stride1: makePose(
    {
      head: { cx: 0.08, cy: 0.77, rx: 0.17, ry: 0.18, count: 250, seed: 120 },
      torso: { cx: 0.04, cy: 0.2, rx: 0.27, ry: 0.43, count: 540, seed: 130 },
      pelvis: { cx: 0.02, cy: -0.24, rx: 0.24, ry: 0.15, count: 230, seed: 140 },
      limbs: [
        { ax: -0.17, ay: 0.45, bx: -0.41, by: 0.18, r0: 0.065, r1: 0.052, count: 150, seed: 150 },
        { ax: -0.41, ay: 0.18, bx: -0.28, by: -0.16, r0: 0.052, r1: 0.043, count: 135, seed: 160 },
        { ax: 0.2, ay: 0.43, bx: 0.42, by: 0.17, r0: 0.065, r1: 0.052, count: 150, seed: 170 },
        { ax: 0.42, ay: 0.17, bx: 0.55, by: -0.16, r0: 0.052, r1: 0.043, count: 135, seed: 180 },
        { ax: -0.09, ay: -0.34, bx: -0.45, by: -0.56, r0: 0.09, r1: 0.07, count: 150, seed: 190 },
        { ax: -0.45, ay: -0.56, bx: -0.76, by: -0.93, r0: 0.07, r1: 0.052, count: 135, seed: 200 },
        { ax: 0.11, ay: -0.34, bx: 0.42, by: -0.48, r0: 0.09, r1: 0.07, count: 150, seed: 210 },
        { ax: 0.42, ay: -0.48, bx: 0.35, by: -0.96, r0: 0.07, r1: 0.052, count: 135, seed: 220 },
      ],
    },
    1002
  ),

  sprint: makePose(
    {
      head: { cx: 0.18, cy: 0.72, rx: 0.17, ry: 0.18, count: 250, seed: 230 },
      torso: { cx: 0.1, cy: 0.14, rx: 0.28, ry: 0.43, count: 540, seed: 240 },
      pelvis: { cx: 0.03, cy: -0.28, rx: 0.24, ry: 0.15, count: 230, seed: 250 },
      limbs: [
        { ax: -0.08, ay: 0.41, bx: -0.38, by: 0.1, r0: 0.065, r1: 0.052, count: 150, seed: 260 },
        { ax: -0.38, ay: 0.1, bx: -0.6, by: 0.32, r0: 0.052, r1: 0.043, count: 135, seed: 270 },
        { ax: 0.27, ay: 0.37, bx: 0.52, by: 0.03, r0: 0.065, r1: 0.052, count: 150, seed: 280 },
        { ax: 0.52, ay: 0.03, bx: 0.78, by: -0.2, r0: 0.052, r1: 0.043, count: 135, seed: 290 },
        { ax: -0.09, ay: -0.37, bx: -0.58, by: -0.43, r0: 0.09, r1: 0.07, count: 150, seed: 300 },
        { ax: -0.58, ay: -0.43, bx: -0.9, by: -0.76, r0: 0.07, r1: 0.052, count: 135, seed: 310 },
        { ax: 0.12, ay: -0.36, bx: 0.55, by: -0.61, r0: 0.09, r1: 0.07, count: 150, seed: 320 },
        { ax: 0.55, ay: -0.61, bx: 0.78, by: -0.98, r0: 0.07, r1: 0.052, count: 135, seed: 330 },
      ],
    },
    1003
  ),

  stride2: makePose(
    {
      head: { cx: 0.06, cy: 0.77, rx: 0.17, ry: 0.18, count: 250, seed: 340 },
      torso: { cx: 0.03, cy: 0.2, rx: 0.27, ry: 0.43, count: 540, seed: 350 },
      pelvis: { cx: 0.02, cy: -0.24, rx: 0.24, ry: 0.15, count: 230, seed: 360 },
      limbs: [
        { ax: -0.17, ay: 0.44, bx: -0.39, by: 0.18, r0: 0.065, r1: 0.052, count: 150, seed: 370 },
        { ax: -0.39, ay: 0.18, bx: -0.52, by: -0.14, r0: 0.052, r1: 0.043, count: 135, seed: 380 },
        { ax: 0.19, ay: 0.44, bx: 0.43, by: 0.18, r0: 0.065, r1: 0.052, count: 150, seed: 390 },
        { ax: 0.43, ay: 0.18, bx: 0.3, by: -0.16, r0: 0.052, r1: 0.043, count: 135, seed: 400 },
        { ax: -0.09, ay: -0.34, bx: -0.42, by: -0.49, r0: 0.09, r1: 0.07, count: 150, seed: 410 },
        { ax: -0.42, ay: -0.49, bx: -0.35, by: -0.96, r0: 0.07, r1: 0.052, count: 135, seed: 420 },
        { ax: 0.11, ay: -0.34, bx: 0.45, by: -0.56, r0: 0.09, r1: 0.07, count: 150, seed: 430 },
        { ax: 0.45, ay: -0.56, bx: 0.76, by: -0.93, r0: 0.07, r1: 0.052, count: 135, seed: 440 },
      ],
    },
    1004
  ),

  recovery: makePose(
    {
      head: { cx: -0.02, cy: 0.76, rx: 0.17, ry: 0.18, count: 250, seed: 450 },
      torso: { cx: -0.01, cy: 0.19, rx: 0.27, ry: 0.43, count: 540, seed: 460 },
      pelvis: { cx: 0, cy: -0.24, rx: 0.24, ry: 0.15, count: 230, seed: 470 },
      limbs: [
        { ax: -0.18, ay: 0.44, bx: -0.42, by: 0.24, r0: 0.065, r1: 0.052, count: 150, seed: 480 },
        { ax: -0.42, ay: 0.24, bx: -0.48, by: -0.02, r0: 0.052, r1: 0.043, count: 135, seed: 490 },
        { ax: 0.17, ay: 0.44, bx: 0.4, by: 0.16, r0: 0.065, r1: 0.052, count: 150, seed: 500 },
        { ax: 0.4, ay: 0.16, bx: 0.28, by: -0.18, r0: 0.052, r1: 0.043, count: 135, seed: 510 },
        { ax: -0.1, ay: -0.34, bx: -0.48, by: -0.64, r0: 0.09, r1: 0.07, count: 150, seed: 520 },
        { ax: -0.48, ay: -0.64, bx: -0.66, by: -0.99, r0: 0.07, r1: 0.052, count: 135, seed: 530 },
        { ax: 0.1, ay: -0.34, bx: 0.46, by: -0.43, r0: 0.09, r1: 0.07, count: 150, seed: 540 },
        { ax: 0.46, ay: -0.43, bx: 0.18, by: -0.74, r0: 0.07, r1: 0.052, count: 135, seed: 550 },
      ],
    },
    1005
  ),
};