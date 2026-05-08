'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import { MEXICO_OUTLINE, MEXICO_STATES } from '@/data/mexicoStates';

interface SceneProps {
  inView: boolean;
  audioBass?: number;
}

interface SitePoint {
  position: [number, number, number];
  score: number;
  selected: number;
  pruned: number;
  seed: number;
}

const MAP_SCALE = 1.08;
const MAP_OFFSET_Y = -0.08;
const CYAN = new THREE.Color('#00D4FF');
const CYAN_DIM = new THREE.Color('#007A99');
const GOLD = new THREE.Color('#FFCC44');
const ORANGE = new THREE.Color('#FF6B35');
const GREEN = new THREE.Color('#00FF88');

function projectPoint([x, y]: [number, number], z = 0): [number, number, number] {
  return [x * MAP_SCALE, y * MAP_SCALE + MAP_OFFSET_Y, z];
}

function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 0.000001) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function stateBounds(points: [number, number][]): { minX: number; maxX: number; minY: number; maxY: number } {
  return points.reduce(
    (bounds, [x, y]) => ({
      minX: Math.min(bounds.minX, x),
      maxX: Math.max(bounds.maxX, x),
      minY: Math.min(bounds.minY, y),
      maxY: Math.max(bounds.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
}

function pseudoRandom(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createMapFillGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  MEXICO_STATES.forEach((state) => {
    const contour = state.coordinates.map(([x, y]) => new THREE.Vector2(x * MAP_SCALE, y * MAP_SCALE + MAP_OFFSET_Y));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

    contour.forEach((point) => vertices.push(point.x, point.y, -0.025));
    triangles.forEach(([a, b, c]) => indices.push(vertexOffset + a, vertexOffset + b, vertexOffset + c));
    vertexOffset += contour.length;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createBoundaryGeometry(includeOutline: boolean): THREE.BufferGeometry {
  const vertices: number[] = [];
  const addPath = (path: [number, number][], z: number) => {
    for (let index = 0; index < path.length - 1; index += 1) {
      vertices.push(...projectPoint(path[index], z), ...projectPoint(path[index + 1], z));
    }
  };

  MEXICO_STATES.forEach((state) => addPath(state.coordinates, 0.01));
  if (includeOutline) addPath(MEXICO_OUTLINE, 0.035);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCandidateSites(): SitePoint[] {
  const candidates: SitePoint[] = [];
  let globalIndex = 0;

  MEXICO_STATES.forEach((state, stateIndex) => {
    const bounds = stateBounds(state.coordinates);
    const targetCount = stateIndex < 8 ? 8 : stateIndex < 20 ? 6 : 5;
    let accepted = 0;
    let attempt = 0;

    while (accepted < targetCount && attempt < 80) {
      const rx = pseudoRandom(globalIndex + attempt, stateIndex + 0.31);
      const ry = pseudoRandom(globalIndex + attempt, stateIndex + 0.73);
      const point: [number, number] = [
        bounds.minX + (bounds.maxX - bounds.minX) * rx,
        bounds.minY + (bounds.maxY - bounds.minY) * ry,
      ];

      if (pointInPolygon(point, state.coordinates)) {
        const demand = 0.45 + pseudoRandom(globalIndex, stateIndex + 1.7) * 0.55;
        const accessGap = 0.35 + pseudoRandom(globalIndex, stateIndex + 4.2) * 0.65;
        const score = demand * 0.58 + accessGap * 0.42;
        candidates.push({
          position: projectPoint(point, 0.14 + score * 0.09),
          score,
          selected: 0,
          pruned: score < 0.53 || (globalIndex + stateIndex) % 9 === 0 ? 1 : 0,
          seed: pseudoRandom(globalIndex, stateIndex + 9.1),
        });
        accepted += 1;
        globalIndex += 1;
      }

      attempt += 1;
    }
  });

  return candidates
    .map((candidate) => ({ ...candidate }))
    .sort((a, b) => b.score - a.score)
    .map((candidate, index) => ({
      ...candidate,
      selected: index < 47 ? 1 : 0,
      pruned: index >= 47 && candidate.pruned ? 1 : 0,
    }))
    .sort((a, b) => a.seed - b.seed);
}

function createSiteGeometry(points: SitePoint[]): THREE.BufferGeometry {
  const positions = new Float32Array(points.length * 3);
  const scores = new Float32Array(points.length);
  const selected = new Float32Array(points.length);
  const pruned = new Float32Array(points.length);
  const seeds = new Float32Array(points.length);

  points.forEach((point, index) => {
    positions.set(point.position, index * 3);
    scores[index] = point.score;
    selected[index] = point.selected;
    pruned[index] = point.pruned;
    seeds[index] = point.seed;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('a_score', new THREE.BufferAttribute(scores, 1));
  geometry.setAttribute('a_selected', new THREE.BufferAttribute(selected, 1));
  geometry.setAttribute('a_pruned', new THREE.BufferAttribute(pruned, 1));
  geometry.setAttribute('a_seed', new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCoverageGeometry(points: SitePoint[]): THREE.BufferGeometry {
  const vertices: number[] = [];
  const selected = points.filter((point) => point.selected > 0.5);

  selected.forEach((point, selectedIndex) => {
    const radius = 0.18 + point.score * 0.16 + (selectedIndex % 4) * 0.014;
    const segments = 56;
    for (let index = 0; index < segments; index += 1) {
      if ((index + selectedIndex) % 10 === 0) continue;
      const a0 = (index / segments) * Math.PI * 2;
      const a1 = ((index + 0.78) / segments) * Math.PI * 2;
      vertices.push(
        point.position[0] + Math.cos(a0) * radius,
        point.position[1] + Math.sin(a0) * radius,
        0.1,
        point.position[0] + Math.cos(a1) * radius,
        point.position[1] + Math.sin(a1) * radius,
        0.1
      );
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createScoreBeamGeometry(points: SitePoint[]): THREE.BufferGeometry {
  const vertices: number[] = [];
  const highValue = points.filter((point) => point.selected > 0.5 && point.score > 0.76);
  const hub = new THREE.Vector3(0.08, -0.7, 0.32);

  highValue.forEach((point, index) => {
    if (index % 2 === 0) vertices.push(point.position[0], point.position[1], point.position[2], hub.x, hub.y, hub.z);
  });

  points.forEach((point, index) => {
    if (point.pruned > 0.5 && index % 5 === 0) {
      const size = 0.045;
      vertices.push(
        point.position[0] - size,
        point.position[1] - size,
        0.2,
        point.position[0] + size,
        point.position[1] + size,
        0.2,
        point.position[0] - size,
        point.position[1] + size,
        0.2,
        point.position[0] + size,
        point.position[1] - size,
        0.2
      );
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

const SITE_VERT = `
precision highp float;

attribute float a_score;
attribute float a_selected;
attribute float a_pruned;
attribute float a_seed;

uniform float u_time;
uniform float u_audio;
uniform float u_pixel_ratio;

varying float v_score;
varying float v_selected;
varying float v_pruned;
varying float v_pulse;

void main() {
  v_score = a_score;
  v_selected = a_selected;
  v_pruned = a_pruned;
  v_pulse = 0.5 + 0.5 * sin(u_time * (1.5 + a_seed) + a_seed * 23.0);

  vec3 pos = position;
  pos.z += a_selected * v_pulse * 0.07;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float baseSize = mix(2.4, 5.0, a_score) + a_selected * (5.6 + v_pulse * 3.5);
  baseSize *= mix(0.62, 1.0, 1.0 - a_pruned);
  gl_PointSize = baseSize * (1.0 + u_audio * 0.32) * u_pixel_ratio * clamp(5.8 / max(1.0, -mvPosition.z), 0.72, 2.2);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const SITE_FRAG = `
precision highp float;

uniform vec3 u_candidate_color;
uniform vec3 u_selected_color;
uniform vec3 u_pruned_color;

varying float v_score;
varying float v_selected;
varying float v_pruned;
varying float v_pulse;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float core = smoothstep(0.18, 0.0, d);
  float halo = smoothstep(0.5, 0.0, d) * (0.25 + v_score * 0.35);
  float ring = smoothstep(0.46, 0.33, d) * smoothstep(0.25, 0.36, d) * v_selected;
  float alpha = core + halo + ring * (0.45 + v_pulse * 0.5);
  alpha *= mix(1.0, 0.42, v_pruned);
  if (alpha < 0.025) discard;

  vec3 scored = mix(u_candidate_color, u_selected_color, v_selected);
  vec3 color = mix(scored, u_pruned_color, v_pruned * 0.72);
  color = mix(color, vec3(1.0, 0.95, 0.58), core * v_selected * 0.38);
  gl_FragColor = vec4(color, alpha);
}
`;

function CameraRig(): null {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6.8);
    camera.lookAt(0, -0.08, 0);
  }, [camera]);

  return null;
}

function PharmacySceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const coverageRef = useRef<THREE.LineSegments>(null);
  const scoreBeamRef = useRef<THREE.LineSegments>(null);
  const siteMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sites = useMemo(createCandidateSites, []);
  const selectedCount = sites.filter((site) => site.selected > 0.5).length;
  const mapFillGeometry = useMemo(createMapFillGeometry, []);
  const stateBoundaryGeometry = useMemo(() => createBoundaryGeometry(false), []);
  const outlineGeometry = useMemo(() => createBoundaryGeometry(true), []);
  const siteGeometry = useMemo(() => createSiteGeometry(sites), [sites]);
  const coverageGeometry = useMemo(() => createCoverageGeometry(sites), [sites]);
  const scoreBeamGeometry = useMemo(() => createScoreBeamGeometry(sites), [sites]);
  const mapFillMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#071520',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    []
  );
  const stateBoundaryMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN_DIM,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const outlineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const coverageMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: ORANGE,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const scoreBeamMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const siteMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SITE_VERT,
        fragmentShader: SITE_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_audio: { value: 0 },
          u_pixel_ratio: { value: 1 },
          u_candidate_color: { value: GOLD },
          u_selected_color: { value: GREEN },
          u_pruned_color: { value: ORANGE },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  siteMaterialRef.current = siteMaterial;

  useFrame(({ clock, size }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.16;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.75);
    const bass = Math.min(1, Math.max(0, audioBass));

    siteMaterial.uniforms.u_time.value = t;
    siteMaterial.uniforms.u_audio.value = bass;
    siteMaterial.uniforms.u_pixel_ratio.value = Math.min(size.width / 900, 1.8);

    if (rigRef.current) {
      rigRef.current.rotation.z = Math.sin(t * 0.075) * 0.014;
      rigRef.current.position.y = Math.cos(t * 0.12) * 0.016;
    }
    if (coverageRef.current) {
      coverageRef.current.scale.setScalar(1 + pulse * 0.025 + bass * 0.035);
      coverageMaterial.opacity = (0.22 + pulse * 0.24) * active;
    }
    if (scoreBeamRef.current) scoreBeamMaterial.opacity = (0.18 + pulse * 0.18 + bass * 0.08) * active;
  });

  useEffect(() => {
    return () => {
      mapFillGeometry.dispose();
      stateBoundaryGeometry.dispose();
      outlineGeometry.dispose();
      siteGeometry.dispose();
      coverageGeometry.dispose();
      scoreBeamGeometry.dispose();
      mapFillMaterial.dispose();
      stateBoundaryMaterial.dispose();
      outlineMaterial.dispose();
      coverageMaterial.dispose();
      scoreBeamMaterial.dispose();
      siteMaterialRef.current?.dispose();
    };
  }, [
    coverageGeometry,
    coverageMaterial,
    mapFillGeometry,
    mapFillMaterial,
    outlineGeometry,
    outlineMaterial,
    scoreBeamGeometry,
    scoreBeamMaterial,
    siteGeometry,
    stateBoundaryGeometry,
    stateBoundaryMaterial,
  ]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.38, 0.03, -0.04]}>
        <mesh geometry={mapFillGeometry} material={mapFillMaterial} />
        <lineSegments geometry={stateBoundaryGeometry} material={stateBoundaryMaterial} />
        <lineSegments geometry={outlineGeometry} material={outlineMaterial} />
        <lineSegments ref={coverageRef} geometry={coverageGeometry} material={coverageMaterial} />
        <lineSegments ref={scoreBeamRef} geometry={scoreBeamGeometry} material={scoreBeamMaterial} />
        <points geometry={siteGeometry} material={siteMaterial} frustumCulled={false} />
      </group>
    </>
  );
}

function PharmacyScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const selectedCount = 47;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 6.8], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <PharmacySceneContent inView={inView} audioBass={audioBass} />
      </Canvas>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 24,
          top: 22,
          fontFamily: 'var(--font-orbitron)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: '#FFCC44',
          textShadow: '0 0 14px rgba(255, 204, 68, 0.5)',
          pointerEvents: 'none',
        }}
      >
        P-MEDIAN SOLVED | SITES: {selectedCount}
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: 24,
          bottom: 22,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          color: '#00D4FF',
          textShadow: '0 0 14px rgba(0, 212, 255, 0.45)',
          pointerEvents: 'none',
        }}
      >
        SCORED CANDIDATES | COVERAGE GAIN +12% | PRUNING ACTIVE
      </span>
    </div>
  );
}

export { PharmacySceneContent };
export { PharmacyScene };
export default PharmacyScene;
