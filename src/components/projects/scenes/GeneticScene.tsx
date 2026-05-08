'use client';

import { Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './types';

const CYAN = new THREE.Color('#00D4FF');
const CYAN_DIM = new THREE.Color('#007A99');
const GOLD = new THREE.Color('#FFCC44');
const GREEN = new THREE.Color('#00FF88');
const AMBER = new THREE.Color('#FF8C00');
const GRID = new THREE.Color('#1A2840');
const WHITE = new THREE.Color('#E2E8F0');

interface CurveSpec {
  phase: number;
  drift: number;
  amplitude: number;
  color: THREE.Color;
}

interface SparkSpec {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  phase: number;
}

interface MetricBar {
  label: string;
  value: string;
  fill: number;
  color: string;
}

const METRICS: MetricBar[] = [
  { label: 'GENERATION', value: '342', fill: 0.92, color: '#00D4FF' },
  { label: 'FITNESS', value: '0.018 LOSS', fill: 0.84, color: '#00FF88' },
  { label: 'R2', value: '0.95', fill: 0.95, color: '#FFCC44' },
  { label: 'MUTATION', value: '3.8%', fill: 0.38, color: '#FF8C00' },
];

function targetY(t: number): number {
  return -1.12 + t * 2.42 + Math.pow(t, 2.8) * 0.92 + Math.sin(t * Math.PI * 2.6) * 0.055;
}

function curveY(t: number, spec: CurveSpec): number {
  const bias = spec.drift * (1 - t) * 0.64;
  const wave = Math.sin(t * Math.PI * (2.0 + spec.phase * 1.7) + spec.phase * 6.2) * spec.amplitude;
  const lateError = Math.cos(t * Math.PI * 4.2 + spec.phase * 3.1) * spec.amplitude * 0.42 * (1 - t * 0.65);
  return targetY(t) + bias + wave + lateError;
}

function pointForCurve(t: number, y: number, z = 0): [number, number, number] {
  return [-2.64 + t * 4.7, y, z];
}

function createAxisGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  vertices.push(-2.82, -1.32, -0.08, 2.38, -1.32, -0.08);
  vertices.push(-2.82, -1.32, -0.08, -2.82, 2.18, -0.08);

  for (let index = 0; index <= 10; index += 1) {
    const x = -2.82 + index * 0.52;
    vertices.push(x, -1.38, -0.08, x, -1.26, -0.08);
  }

  for (let index = 0; index <= 7; index += 1) {
    const y = -1.32 + index * 0.49;
    vertices.push(-2.89, y, -0.08, -2.75, y, -0.08);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createGridGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];

  for (let index = 0; index <= 12; index += 1) {
    const x = -2.82 + index * 0.43;
    vertices.push(x, -1.32, -0.18, x, 2.18, -0.18);
  }

  for (let index = 0; index <= 8; index += 1) {
    const y = -1.32 + index * 0.44;
    vertices.push(-2.82, y, -0.18, 2.38, y, -0.18);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createHistoricalPoints(): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const samples = 42;

  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    const jitter = Math.sin(index * 2.91) * 0.045 + Math.cos(index * 1.7) * 0.026;
    positions.push(...pointForCurve(t, targetY(t) + jitter, 0.08));
    const color = WHITE.clone().lerp(CYAN, t * 0.28);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCurveGeometry(specs: CurveSpec[]): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];
  const segments = 88;

  specs.forEach((spec) => {
    for (let index = 0; index < segments; index += 1) {
      const t0 = index / segments;
      const t1 = (index + 1) / segments;
      const p0 = pointForCurve(t0, curveY(t0, spec), spec.phase * 0.12 - 0.12);
      const p1 = pointForCurve(t1, curveY(t1, spec), spec.phase * 0.12 - 0.12);
      vertices.push(...p0, ...p1);
      colors.push(spec.color.r, spec.color.g, spec.color.b, spec.color.r, spec.color.g, spec.color.b);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createBestCurveGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];
  const segments = 128;

  for (let index = 0; index < segments; index += 1) {
    const t0 = index / segments;
    const t1 = (index + 1) / segments;
    const p0 = pointForCurve(t0, targetY(t0) + Math.sin(t0 * Math.PI * 7) * 0.018, 0.18);
    const p1 = pointForCurve(t1, targetY(t1) + Math.sin(t1 * Math.PI * 7) * 0.018, 0.18);
    const c0 = CYAN.clone().lerp(GOLD, Math.max(0, t0 - 0.64) * 1.8);
    const c1 = CYAN.clone().lerp(GOLD, Math.max(0, t1 - 0.64) * 1.8);
    vertices.push(...p0, ...p1);
    colors.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createMetricBarGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];

  METRICS.forEach((metric, index) => {
    const y = 1.36 - index * 0.32;
    const x0 = 1.12;
    const width = metric.fill * 1.25;
    const color = new THREE.Color(metric.color);
    const muted = GRID;
    vertices.push(x0, y, 0.28, x0 + 1.25, y, 0.28);
    colors.push(muted.r, muted.g, muted.b, muted.r, muted.g, muted.b);
    vertices.push(x0, y + 0.035, 0.3, x0 + width, y + 0.035, 0.3);
    vertices.push(x0, y - 0.035, 0.3, x0 + width, y - 0.035, 0.3);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createSparkSpecs(): SparkSpec[] {
  const sparks: SparkSpec[] = [];
  const count = 34;

  for (let index = 0; index < count; index += 1) {
    const t = 0.08 + ((index * 0.137) % 0.84);
    const branch = index % 2 === 0 ? 1 : -1;
    const position = new THREE.Vector3(...pointForCurve(t, targetY(t) + branch * (0.2 + (index % 5) * 0.035), 0.32));
    sparks.push({
      position,
      velocity: new THREE.Vector3(branch * (0.12 + (index % 4) * 0.035), 0.12 + (index % 3) * 0.05, 0.04),
      color: index % 3 === 0 ? GOLD : index % 3 === 1 ? AMBER : CYAN,
      phase: (index * 0.077) % 1,
    });
  }

  return sparks;
}

function createCurveSpecs(): CurveSpec[] {
  return Array.from({ length: 10 }, (_, index) => ({
    phase: index / 9,
    drift: 0.72 - index * 0.08,
    amplitude: 0.24 - index * 0.014,
    color: CYAN_DIM.clone().lerp(CYAN, index / 16),
  }));
}

function CameraRig(): null {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6.2);
    camera.lookAt(0, 0.25, 0);
  }, [camera]);

  return null;
}

function GeneticSceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const populationRef = useRef<THREE.LineSegments>(null);
  const bestRef = useRef<THREE.LineSegments>(null);
  const sparkMeshRef = useRef<THREE.InstancedMesh>(null);
  const pointMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const axisGeometry = useMemo(createAxisGeometry, []);
  const gridGeometry = useMemo(createGridGeometry, []);
  const historicalGeometry = useMemo(createHistoricalPoints, []);
  const populationGeometry = useMemo(() => createCurveGeometry(createCurveSpecs()), []);
  const bestGeometry = useMemo(createBestCurveGeometry, []);
  const metricBarGeometry = useMemo(createMetricBarGeometry, []);
  const sparkSpecs = useMemo(createSparkSpecs, []);
  const sparkGeometry = useMemo(() => new THREE.OctahedronGeometry(0.045, 1), []);
  const axisMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GRID,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const populationMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const bestMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const metricBarMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.84,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const pointMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.035,
        transparent: true,
        opacity: 0.74,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const sparkMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);

  pointMaterialRef.current = pointMaterial;

  useEffect(() => {
    if (!sparkMeshRef.current) return;

    sparkSpecs.forEach((spark, index) => {
      matrix.compose(spark.position, quaternion, new THREE.Vector3(1, 1, 1));
      sparkMeshRef.current?.setMatrixAt(index, matrix);
      sparkMeshRef.current?.setColorAt(index, spark.color);
    });
    sparkMeshRef.current.instanceMatrix.needsUpdate = true;
    if (sparkMeshRef.current.instanceColor) sparkMeshRef.current.instanceColor.needsUpdate = true;
  }, [matrix, quaternion, sparkSpecs]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.14;
    const bass = Math.min(1, Math.max(0, audioBass));
    const convergence = 0.5 + 0.5 * Math.sin(t * 0.42);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);

    if (rigRef.current) {
      rigRef.current.rotation.x = -0.18 + Math.sin(t * 0.12) * 0.018;
      rigRef.current.rotation.y = Math.sin(t * 0.1) * 0.06;
      rigRef.current.position.y = Math.sin(t * 0.16) * 0.012;
    }

    populationMaterial.opacity = (0.14 + (1 - convergence) * 0.22 + bass * 0.04) * active;
    bestMaterial.opacity = (0.7 + pulse * 0.26 + bass * 0.08) * active;
    metricBarMaterial.opacity = (0.62 + pulse * 0.16) * active;
    axisMaterial.opacity = (0.48 + pulse * 0.1) * active;
    gridMaterial.opacity = (0.16 + pulse * 0.05) * active;
    pointMaterial.opacity = (0.56 + pulse * 0.22) * active;

    if (populationRef.current) {
      populationRef.current.scale.y = 0.82 + convergence * 0.18;
      populationRef.current.position.z = -0.04 + convergence * 0.08;
    }

    if (bestRef.current) {
      bestRef.current.scale.setScalar(1 + pulse * 0.012 + bass * 0.01);
    }

    if (sparkMeshRef.current) {
      sparkSpecs.forEach((spark, index) => {
        const local = (t * 0.22 + spark.phase) % 1;
        const burst = Math.sin(local * Math.PI);
        tempVector.copy(spark.position).addScaledVector(spark.velocity, burst * (0.8 + convergence * 0.4));
        const scale = 0.52 + burst * 1.28 + bass * 0.18;
        matrix.compose(tempVector, quaternion, new THREE.Vector3(scale, scale, scale));
        sparkMeshRef.current?.setMatrixAt(index, matrix);
        sparkMeshRef.current?.setColorAt(index, color.copy(spark.color).lerp(GREEN, convergence * 0.22));
      });
      sparkMeshRef.current.instanceMatrix.needsUpdate = true;
      if (sparkMeshRef.current.instanceColor) sparkMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      axisGeometry.dispose();
      gridGeometry.dispose();
      historicalGeometry.dispose();
      populationGeometry.dispose();
      bestGeometry.dispose();
      metricBarGeometry.dispose();
      sparkGeometry.dispose();
      axisMaterial.dispose();
      gridMaterial.dispose();
      populationMaterial.dispose();
      bestMaterial.dispose();
      metricBarMaterial.dispose();
      pointMaterialRef.current?.dispose();
      sparkMaterial.dispose();
    };
  }, [
    axisGeometry,
    axisMaterial,
    bestGeometry,
    bestMaterial,
    gridGeometry,
    gridMaterial,
    historicalGeometry,
    metricBarGeometry,
    metricBarMaterial,
    populationGeometry,
    populationMaterial,
    sparkGeometry,
    sparkMaterial,
  ]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.18, 0.02, 0]}>
        <lineSegments geometry={gridGeometry} material={gridMaterial} />
        <lineSegments geometry={axisGeometry} material={axisMaterial} />
        <points geometry={historicalGeometry} material={pointMaterial} frustumCulled={false} />
        <lineSegments ref={populationRef} geometry={populationGeometry} material={populationMaterial} />
        <lineSegments ref={bestRef} geometry={bestGeometry} material={bestMaterial} />
        <lineSegments geometry={metricBarGeometry} material={metricBarMaterial} />
        <instancedMesh ref={sparkMeshRef} args={[sparkGeometry, sparkMaterial, sparkSpecs.length]} frustumCulled={false} />

        <Text
          position={[-2.95, 2.22, 0.25]}
          fontSize={0.092}
          color="#00D4FF"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.9}
        >
          GA OPTIMIZER | GEN: 342 | CONVERGENCE: OK
        </Text>

        <Text
          position={[-2.95, -2.08, 0.2]}
          fontSize={0.064}
          color="#8BA3C0"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.78}
        >
          HISTORICAL CO2 TRAJECTORY | POPULATION CURVES | CROSSOVER MUTATION
        </Text>

        <Text
          position={[-2.9, -1.62, 0.22]}
          fontSize={0.052}
          color="#8BA3C0"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.68}
        >
          1960
        </Text>
        <Text
          position={[2.12, -1.62, 0.22]}
          fontSize={0.052}
          color="#8BA3C0"
          anchorX="right"
          anchorY="middle"
          material-transparent
          material-opacity={0.68}
        >
          2024
        </Text>
        <Text
          position={[-3.08, 2.0, 0.22]}
          fontSize={0.048}
          color="#8BA3C0"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.68}
        >
          CO2 PPM
        </Text>

        <Text
          position={[1.08, 1.78, 0.26]}
          fontSize={0.065}
          color="#FFCC44"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.88}
        >
          FIT TELEMETRY
        </Text>
        {METRICS.map((metric, index) => (
          <Text
            key={metric.label}
            position={[1.08, 1.48 - index * 0.32, 0.26]}
            fontSize={0.052}
            color={metric.color}
            anchorX="left"
            anchorY="middle"
            material-transparent
            material-opacity={0.86}
          >
            {metric.label}: {metric.value}
          </Text>
        ))}

        <Text
          position={[-0.02, 1.78, 0.32]}
          fontSize={0.055}
          color="#FFCC44"
          anchorX="center"
          anchorY="middle"
          material-transparent
          material-opacity={0.82}
        >
          BEST CANDIDATE THREAD
        </Text>
      </group>
    </>
  );
}

function GeneticScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <GeneticSceneContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}

export { GeneticSceneContent };
export { GeneticScene };
export default GeneticScene;
