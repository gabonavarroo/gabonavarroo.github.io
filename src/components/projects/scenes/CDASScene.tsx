'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import { MEXICO_OUTLINE, MEXICO_STATES } from '@/data/mexicoStates';

interface SceneProps {
  inView: boolean;
  audioBass?: number;
}

interface PointSeed {
  position: [number, number, number];
  seed: number;
  priority: number;
}

const MAP_SCALE = 1.08;
const MAP_OFFSET_Y = -0.08;
const CYAN = new THREE.Color('#00D4FF');
const CYAN_DIM = new THREE.Color('#007A99');
const AMBER = new THREE.Color('#FF8C00');
const RED = new THREE.Color('#FF3333');
const GOLD = new THREE.Color('#FFCC44');
const CORE = new THREE.Vector3(0.35, -0.62, 0.24);

function projectPoint([x, y]: [number, number], z = 0): [number, number, number] {
  return [x * MAP_SCALE, y * MAP_SCALE + MAP_OFFSET_Y, z];
}

function centroid(points: [number, number][]): [number, number] {
  const sum = points.reduce(
    (acc, point) => {
      acc[0] += point[0];
      acc[1] += point[1];
      return acc;
    },
    [0, 0]
  );

  return [sum[0] / points.length, sum[1] / points.length];
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

function createNodeGeometry(points: PointSeed[]): THREE.BufferGeometry {
  const positions = new Float32Array(points.length * 3);
  const seeds = new Float32Array(points.length);
  const priorities = new Float32Array(points.length);

  points.forEach((point, index) => {
    positions.set(point.position, index * 3);
    seeds[index] = point.seed;
    priorities[index] = point.priority;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('a_seed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('a_priority', new THREE.BufferAttribute(priorities, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createSearchNodes(): PointSeed[] {
  return MEXICO_STATES.map((state, index) => {
    const [x, y] = centroid(state.coordinates);
    const wave = Math.sin(index * 11.73) * 0.045;
    const cross = Math.cos(index * 5.41) * 0.055;

    return {
      position: projectPoint([x + wave, y + cross], 0.16 + (index % 5) * 0.022),
      seed: (index * 0.173) % 1,
      priority: index % 7 === 0 || index % 11 === 0 ? 1 : 0.55 + (index % 4) * 0.1,
    };
  });
}

function createSourceNodes(): PointSeed[] {
  const nodes: PointSeed[] = [];
  const total = 46;

  for (let index = 0; index < total; index += 1) {
    const angle = (index / total) * Math.PI * 2 + Math.sin(index * 1.7) * 0.07;
    const radiusX = 4.25 + (index % 5) * 0.08;
    const radiusY = 2.72 + (index % 7) * 0.045;

    nodes.push({
      position: [Math.cos(angle) * radiusX, Math.sin(angle) * radiusY - 0.03, 0.04 + (index % 3) * 0.018],
      seed: (index * 0.137 + 0.21) % 1,
      priority: index % 6 === 0 ? 1 : 0.42,
    });
  }

  return nodes;
}

function createSourceBeamGeometry(sourceNodes: PointSeed[], searchNodes: PointSeed[]): THREE.BufferGeometry {
  const vertices: number[] = [];

  sourceNodes.forEach((node, index) => {
    const target = index % 3 === 0 ? CORE.toArray() : searchNodes[index % searchNodes.length].position;
    vertices.push(...node.position, ...target);
  });

  searchNodes.forEach((node, index) => {
    if (index % 2 === 0 || node.priority > 0.9) vertices.push(...node.position, ...CORE.toArray());
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createReticleGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const radii = [0.26, 0.45, 0.68];

  radii.forEach((radius, ringIndex) => {
    const segments = 80;
    for (let index = 0; index < segments; index += 1) {
      if ((index + ringIndex) % 7 === 0) continue;
      const a0 = (index / segments) * Math.PI * 2;
      const a1 = ((index + 0.72) / segments) * Math.PI * 2;
      vertices.push(
        CORE.x + Math.cos(a0) * radius,
        CORE.y + Math.sin(a0) * radius,
        CORE.z + 0.03,
        CORE.x + Math.cos(a1) * radius,
        CORE.y + Math.sin(a1) * radius,
        CORE.z + 0.03
      );
    }
  });

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const inner = 0.12;
    const outer = 0.88;
    vertices.push(
      CORE.x + Math.cos(angle) * inner,
      CORE.y + Math.sin(angle) * inner,
      CORE.z + 0.035,
      CORE.x + Math.cos(angle) * outer,
      CORE.y + Math.sin(angle) * outer,
      CORE.z + 0.035
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

const NODE_VERT = `
precision highp float;

attribute float a_seed;
attribute float a_priority;

uniform float u_time;
uniform float u_audio;
uniform float u_pixel_ratio;

varying float v_seed;
varying float v_priority;
varying float v_pulse;

void main() {
  v_seed = a_seed;
  v_priority = a_priority;
  v_pulse = 0.5 + 0.5 * sin(u_time * (2.2 + a_seed * 1.7) + a_seed * 18.849);

  vec3 pos = position;
  pos.z += v_pulse * 0.055 * (0.4 + a_priority);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float size = (4.0 + a_priority * 8.5 + v_pulse * 5.0 + u_audio * 4.0) * u_pixel_ratio;
  size *= clamp(5.8 / max(1.0, -mvPosition.z), 0.72, 2.3);

  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const NODE_FRAG = `
precision highp float;

uniform vec3 u_low_color;
uniform vec3 u_hot_color;

varying float v_seed;
varying float v_priority;
varying float v_pulse;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float core = smoothstep(0.18, 0.0, d);
  float ring = smoothstep(0.48, 0.22, d) * smoothstep(0.18, 0.28, d);
  float halo = smoothstep(0.5, 0.0, d) * 0.38;
  float alpha = core + ring * (0.3 + v_pulse * 0.55) + halo * (0.4 + v_priority);
  if (alpha < 0.025) discard;

  vec3 color = mix(u_low_color, u_hot_color, smoothstep(0.48, 1.0, v_priority + v_pulse * 0.25));
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

function CDASSceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.LineSegments>(null);
  const sweepRef = useRef<THREE.LineSegments>(null);
  const reticleRef = useRef<THREE.LineSegments>(null);
  const nodeMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sourceMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sourceNodes = useMemo(createSourceNodes, []);
  const searchNodes = useMemo(createSearchNodes, []);
  const mapFillGeometry = useMemo(createMapFillGeometry, []);
  const stateBoundaryGeometry = useMemo(() => createBoundaryGeometry(false), []);
  const outlineGeometry = useMemo(() => createBoundaryGeometry(true), []);
  const nodeGeometry = useMemo(() => createNodeGeometry(searchNodes), [searchNodes]);
  const sourceGeometry = useMemo(() => createNodeGeometry(sourceNodes), [sourceNodes]);
  const beamGeometry = useMemo(() => createSourceBeamGeometry(sourceNodes, searchNodes), [sourceNodes, searchNodes]);
  const reticleGeometry = useMemo(createReticleGeometry, []);
  const mapFillMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#061624',
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
      }),
    []
  );
  const stateBoundaryMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN_DIM,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const outlineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const beamMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const reticleMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: RED,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const sweepGeometry = useMemo(() => {
    const vertices: number[] = [];
    for (let index = 0; index < 18; index += 1) {
      const x = -3.2 + index * 0.38;
      vertices.push(x, -2.15, 0.21, x + 1.15, 2.1, 0.21);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeBoundingSphere();
    return geometry;
  }, []);
  const sweepMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const nodeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_audio: { value: 0 },
          u_pixel_ratio: { value: 1 },
          u_low_color: { value: AMBER },
          u_hot_color: { value: RED },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const sourceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_audio: { value: 0 },
          u_pixel_ratio: { value: 1 },
          u_low_color: { value: CYAN_DIM },
          u_hot_color: { value: CYAN },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  nodeMaterialRef.current = nodeMaterial;
  sourceMaterialRef.current = sourceMaterial;

  useFrame(({ clock, size }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.18;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
    const bass = Math.min(1, Math.max(0, audioBass));

    nodeMaterial.uniforms.u_time.value = t;
    nodeMaterial.uniforms.u_audio.value = bass;
    nodeMaterial.uniforms.u_pixel_ratio.value = Math.min(size.width / 900, 1.8);
    sourceMaterial.uniforms.u_time.value = t * 0.74 + 1.8;
    sourceMaterial.uniforms.u_audio.value = bass * 0.45;
    sourceMaterial.uniforms.u_pixel_ratio.value = Math.min(size.width / 900, 1.8);

    if (rigRef.current) {
      rigRef.current.rotation.z = Math.sin(t * 0.08) * 0.018;
      rigRef.current.position.y = Math.sin(t * 0.16) * 0.018;
    }
    if (beamRef.current) beamMaterial.opacity = (0.14 + pulse * 0.16 + bass * 0.1) * active;
    if (reticleRef.current) {
      reticleRef.current.rotation.z = t * 0.18;
      reticleRef.current.scale.setScalar(1 + pulse * 0.035 + bass * 0.05);
      reticleMaterial.opacity = (0.55 + pulse * 0.25) * active;
    }
    if (sweepRef.current) {
      sweepRef.current.position.x = ((t * 0.36) % 1.45) - 0.72;
      sweepMaterial.opacity = (0.1 + pulse * 0.22) * active;
    }
  });

  useEffect(() => {
    return () => {
      mapFillGeometry.dispose();
      stateBoundaryGeometry.dispose();
      outlineGeometry.dispose();
      nodeGeometry.dispose();
      sourceGeometry.dispose();
      beamGeometry.dispose();
      reticleGeometry.dispose();
      sweepGeometry.dispose();
      mapFillMaterial.dispose();
      stateBoundaryMaterial.dispose();
      outlineMaterial.dispose();
      beamMaterial.dispose();
      reticleMaterial.dispose();
      sweepMaterial.dispose();
      nodeMaterialRef.current?.dispose();
      sourceMaterialRef.current?.dispose();
    };
  }, [
    beamGeometry,
    beamMaterial,
    mapFillGeometry,
    mapFillMaterial,
    nodeGeometry,
    outlineGeometry,
    outlineMaterial,
    reticleGeometry,
    reticleMaterial,
    sourceGeometry,
    stateBoundaryGeometry,
    stateBoundaryMaterial,
    sweepGeometry,
    sweepMaterial,
  ]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.38, 0.04, -0.04]}>
        <mesh geometry={mapFillGeometry} material={mapFillMaterial} />
        <lineSegments geometry={stateBoundaryGeometry} material={stateBoundaryMaterial} />
        <lineSegments geometry={outlineGeometry} material={outlineMaterial} />
        <lineSegments ref={beamRef} geometry={beamGeometry} material={beamMaterial} />
        <lineSegments ref={sweepRef} geometry={sweepGeometry} material={sweepMaterial} />
        <lineSegments ref={reticleRef} geometry={reticleGeometry} material={reticleMaterial} />
        <points geometry={sourceGeometry} material={sourceMaterial} frustumCulled={false} />
        <points geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} />
      </group>
    </>
  );
}

function CDASScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 6.8], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <CDASSceneContent inView={inView} audioBass={audioBass} />
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
          color: '#00D4FF',
          textShadow: '0 0 14px rgba(0, 212, 255, 0.55)',
          pointerEvents: 'none',
        }}
      >
        SYSTEM: BUSQUEDA COLECTIVA NACIONAL
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
          color: '#FF8C00',
          textShadow: '0 0 14px rgba(255, 140, 0, 0.45)',
          pointerEvents: 'none',
        }}
      >
        46 SOURCES | FUZZY MATCH CORE | ACTIVE RETICLE
      </span>
    </div>
  );
}

export { CDASSceneContent };
export { CDASScene };
export default CDASScene;
