'use client';

import { Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import {
  CRASH_FEATURE_IMPORTANCE,
  CRASH_FLOW_EDGES,
  CRASH_HOTSPOTS,
  CRASH_MODEL_METRICS,
  type CrashHotspot,
  type CrashRiskLevel,
} from '@/data/crashesGraph';
import type { SceneProps } from './types';

const CYAN = new THREE.Color('#00D4FF');
const CYAN_DIM = new THREE.Color('#007A99');
const AMBER = new THREE.Color('#FF8C00');
const RED = new THREE.Color('#FF3333');
const GREEN = new THREE.Color('#00FF88');
const GOLD = new THREE.Color('#FFCC44');
const MUTED = new THREE.Color('#264060');
const GRID = new THREE.Color('#1A2840');
const MAP_SCALE = 1.05;

interface CorridorSignal {
  source: THREE.Vector3;
  target: THREE.Vector3;
  strength: number;
  riskLevel: CrashRiskLevel;
  phase: number;
}

interface FeatureBar {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  color: THREE.Color;
  phase: number;
}

function riskColor(level: CrashRiskLevel): THREE.Color {
  if (level === 'critical') return RED;
  if (level === 'high') return AMBER;
  if (level === 'medium') return GOLD;
  return CYAN_DIM;
}

function riskWeight(level: CrashRiskLevel): number {
  if (level === 'critical') return 1.35;
  if (level === 'high') return 1.08;
  if (level === 'medium') return 0.78;
  return 0.5;
}

function metricColor(emphasis: string): string {
  if (emphasis === 'red') return '#FF3333';
  if (emphasis === 'amber') return '#FF8C00';
  if (emphasis === 'green') return '#00FF88';
  return '#00D4FF';
}

function toVector(hotspot: CrashHotspot): THREE.Vector3 {
  return new THREE.Vector3(
    hotspot.position[0] * MAP_SCALE,
    hotspot.position[1] * MAP_SCALE,
    hotspot.position[2] * MAP_SCALE
  );
}

function createHotspotMap(): Map<string, CrashHotspot> {
  return new Map(CRASH_HOTSPOTS.map((hotspot) => [hotspot.id, hotspot]));
}

function createCityGridGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const verticals = [-2.95, -2.52, -2.18, -1.78, -1.42, -1.08, -0.72, -0.34, -0.02, 0.34, 0.72, 1.08, 1.5];
  const horizontals = [-2.02, -1.66, -1.34, -1.02, -0.7, -0.38, -0.08, 0.24, 0.56, 0.88, 1.2, 1.52, 1.84, 2.06];

  verticals.forEach((x, index) => {
    const laneShift = index % 3 === 0 ? 0.08 : 0;
    vertices.push(x, -2.08 + laneShift, -0.24, x + Math.sin(index) * 0.035, 2.1 - laneShift, -0.24);
  });

  horizontals.forEach((y, index) => {
    const gap = index % 4 === 0 ? 0.22 : 0.04;
    vertices.push(-3.1 + gap, y, -0.25, 1.76 - gap, y + Math.cos(index) * 0.02, -0.25);
  });

  const arterialBands = [
    [[-2.9, 1.28, -0.22], [-0.1, 0.2, -0.22]],
    [[-1.92, -1.74, -0.22], [0.82, -1.74, -0.22]],
    [[-1.2, 1.6, -0.22], [-0.1, -1.4, -0.22]],
    [[0.16, 1.92, -0.22], [1.52, -1.5, -0.22]],
  ] satisfies Array<[[number, number, number], [number, number, number]]>;

  arterialBands.forEach(([a, b]) => vertices.push(...a, ...b));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCorridorGeometry(hotspotMap: Map<string, CrashHotspot>): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];

  CRASH_FLOW_EDGES.forEach((edge) => {
    const source = hotspotMap.get(edge.source);
    const target = hotspotMap.get(edge.target);
    if (!source || !target) return;
    const sourceVector = toVector(source);
    const targetVector = toVector(target);
    const color = riskColor(edge.riskLevel).clone().lerp(CYAN, edge.riskLevel === 'critical' ? 0.08 : 0.22);

    vertices.push(sourceVector.x, sourceVector.y, sourceVector.z, targetVector.x, targetVector.y, targetVector.z);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCorridorSignals(hotspotMap: Map<string, CrashHotspot>): CorridorSignal[] {
  return CRASH_FLOW_EDGES.filter((edge) => edge.riskLevel === 'critical' || edge.riskLevel === 'high').flatMap((edge, index) => {
    const source = hotspotMap.get(edge.source);
    const target = hotspotMap.get(edge.target);
    if (!source || !target) return [];

    return [
      {
        source: toVector(source),
        target: toVector(target),
        strength: edge.strength,
        riskLevel: edge.riskLevel,
        phase: (index * 0.113) % 1,
      },
    ];
  });
}

function createReticleGeometry(hotspots: CrashHotspot[]): THREE.BufferGeometry {
  const vertices: number[] = [];

  hotspots
    .filter((hotspot) => hotspot.riskLevel === 'critical')
    .forEach((hotspot, hotspotIndex) => {
      const center = toVector(hotspot);
      const radius = hotspot.radius * 1.75;
      const segments = 40;

      for (let index = 0; index < segments; index += 1) {
        if ((index + hotspotIndex) % 5 === 0) continue;
        const a0 = (index / segments) * Math.PI * 2;
        const a1 = ((index + 0.62) / segments) * Math.PI * 2;
        vertices.push(
          center.x + Math.cos(a0) * radius,
          center.y + Math.sin(a0) * radius,
          center.z + 0.08,
          center.x + Math.cos(a1) * radius,
          center.y + Math.sin(a1) * radius,
          center.z + 0.08
        );
      }

      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * Math.PI * 2;
        vertices.push(
          center.x + Math.cos(angle) * radius * 0.42,
          center.y + Math.sin(angle) * radius * 0.42,
          center.z + 0.09,
          center.x + Math.cos(angle) * radius * 1.15,
          center.y + Math.sin(angle) * radius * 1.15,
          center.z + 0.09
        );
      }
    });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createHotspotHaloGeometry(hotspots: CrashHotspot[]): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];

  hotspots.forEach((hotspot, hotspotIndex) => {
    const center = toVector(hotspot);
    const radius = hotspot.radius * (1.0 + riskWeight(hotspot.riskLevel) * 0.75);
    const segments = hotspot.riskLevel === 'critical' ? 42 : 30;
    const color = riskColor(hotspot.riskLevel);

    for (let index = 0; index < segments; index += 1) {
      if (hotspot.riskLevel !== 'critical' && index % 6 === 0) continue;
      const a0 = (index / segments) * Math.PI * 2;
      const a1 = ((index + 0.68) / segments) * Math.PI * 2;
      vertices.push(
        center.x + Math.cos(a0) * radius,
        center.y + Math.sin(a0) * radius,
        center.z + 0.07,
        center.x + Math.cos(a1) * radius,
        center.y + Math.sin(a1) * radius,
        center.z + 0.07
      );
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }

    if (hotspotIndex % 3 === 0 || hotspot.riskLevel === 'critical') {
      vertices.push(center.x - radius * 0.32, center.y, center.z + 0.08, center.x + radius * 0.32, center.y, center.z + 0.08);
      vertices.push(center.x, center.y - radius * 0.32, center.z + 0.08, center.x, center.y + radius * 0.32, center.z + 0.08);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function featureCategoryColor(category: string): THREE.Color {
  if (category === 'behavioral') return RED;
  if (category === 'geospatial') return CYAN;
  if (category === 'traffic') return AMBER;
  if (category === 'vehicle') return GREEN;
  return GOLD;
}

function createFeatureBarLineGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];

  CRASH_FEATURE_IMPORTANCE.forEach((feature, index) => {
    const x0 = 1.92;
    const width = feature.importance * 5.7;
    const y = 1.34 - index * 0.19;
    const z = 0.31;
    const height = 0.052;
    const color = featureCategoryColor(feature.category);
    const muted = MUTED;
    vertices.push(x0, y - height, z, x0 + width, y - height, z, x0, y + height, z, x0 + width, y + height, z);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
    vertices.push(x0, y, z - 0.01, x0 + 1.06, y, z - 0.01);
    colors.push(muted.r, muted.g, muted.b, muted.r, muted.g, muted.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createFeatureBars(): FeatureBar[] {
  return CRASH_FEATURE_IMPORTANCE.map((feature, index) => {
    const width = feature.importance * 5.7;
    return {
      position: new THREE.Vector3(1.92 + width * 0.5, 1.34 - index * 0.19, 0.24),
      scale: new THREE.Vector3(width, 0.105, 0.045),
      color: featureCategoryColor(feature.category),
      phase: index * 0.07,
    };
  });
}

function CameraRig(): null {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6.4);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function CrashesSceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const hotspotMeshRef = useRef<THREE.InstancedMesh>(null);
  const signalMeshRef = useRef<THREE.InstancedMesh>(null);
  const featureMeshRef = useRef<THREE.InstancedMesh>(null);
  const corridorRef = useRef<THREE.LineSegments>(null);
  const reticleRef = useRef<THREE.LineSegments>(null);
  const haloRef = useRef<THREE.LineSegments>(null);
  const featureLineRef = useRef<THREE.LineSegments>(null);
  const hotspotMap = useMemo(createHotspotMap, []);
  const cityGridGeometry = useMemo(createCityGridGeometry, []);
  const corridorGeometry = useMemo(() => createCorridorGeometry(hotspotMap), [hotspotMap]);
  const reticleGeometry = useMemo(() => createReticleGeometry(CRASH_HOTSPOTS), []);
  const haloGeometry = useMemo(() => createHotspotHaloGeometry(CRASH_HOTSPOTS), []);
  const featureLineGeometry = useMemo(createFeatureBarLineGeometry, []);
  const signals = useMemo(() => createCorridorSignals(hotspotMap), [hotspotMap]);
  const featureBars = useMemo(createFeatureBars, []);
  const hotspotGeometry = useMemo(() => new THREE.SphereGeometry(0.07, 18, 12), []);
  const signalGeometry = useMemo(() => new THREE.BoxGeometry(0.052, 0.018, 0.018), []);
  const featureGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GRID,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const corridorMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.38,
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
  const haloMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.74,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const featureLineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const hotspotMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const signalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const featureMaterial = useMemo(
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
  const flatQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (hotspotMeshRef.current) {
      CRASH_HOTSPOTS.forEach((hotspot, index) => {
        const position = toVector(hotspot);
        const base = hotspot.radius * (5.8 + hotspot.recidivismRate * 4.4);
        matrix.compose(position, flatQuaternion, new THREE.Vector3(base, base, base * (0.78 + riskWeight(hotspot.riskLevel) * 0.18)));
        hotspotMeshRef.current?.setMatrixAt(index, matrix);
        hotspotMeshRef.current?.setColorAt(index, riskColor(hotspot.riskLevel));
      });
      hotspotMeshRef.current.instanceMatrix.needsUpdate = true;
      if (hotspotMeshRef.current.instanceColor) hotspotMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (featureMeshRef.current) {
      featureBars.forEach((bar, index) => {
        matrix.compose(bar.position, flatQuaternion, bar.scale);
        featureMeshRef.current?.setMatrixAt(index, matrix);
        featureMeshRef.current?.setColorAt(index, bar.color);
      });
      featureMeshRef.current.instanceMatrix.needsUpdate = true;
      if (featureMeshRef.current.instanceColor) featureMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [featureBars, flatQuaternion, matrix]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.14;
    const bass = Math.min(1, Math.max(0, audioBass));
    const scan = 0.5 + 0.5 * Math.sin(t * 1.75);

    if (rigRef.current) {
      rigRef.current.rotation.x = -0.32 + Math.sin(t * 0.11) * 0.018;
      rigRef.current.rotation.y = Math.sin(t * 0.09) * 0.08;
      rigRef.current.position.y = Math.sin(t * 0.16) * 0.014;
    }

    if (hotspotMeshRef.current) {
      CRASH_HOTSPOTS.forEach((hotspot, index) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * (1.2 + riskWeight(hotspot.riskLevel)) + hotspot.pulseOffset);
        const riskPulse = hotspot.riskLevel === 'critical' ? pulse * 0.66 : pulse * 0.24;
        const base = hotspot.radius * (5.8 + hotspot.recidivismRate * 4.4);
        const scale = base * (1 + riskPulse + bass * 0.18);
        const height = riskWeight(hotspot.riskLevel) * (1 + pulse * 0.28);
        tempVector.copy(toVector(hotspot));
        tempVector.z += pulse * 0.11 * riskWeight(hotspot.riskLevel) + 0.04;
        matrix.compose(tempVector, flatQuaternion, new THREE.Vector3(scale, scale, scale * (0.74 + height * 0.16)));
        hotspotMeshRef.current?.setMatrixAt(index, matrix);
        color.copy(riskColor(hotspot.riskLevel)).lerp(hotspot.riskLevel === 'critical' ? GOLD : CYAN, pulse * 0.18);
        hotspotMeshRef.current?.setColorAt(index, color);
      });
      hotspotMeshRef.current.instanceMatrix.needsUpdate = true;
      if (hotspotMeshRef.current.instanceColor) hotspotMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (signalMeshRef.current) {
      signals.forEach((signal, index) => {
        const progress = (t * (0.18 + signal.strength * 0.34) + signal.phase) % 1;
        tempVector.lerpVectors(signal.source, signal.target, progress);
        tempVector.z += Math.sin(progress * Math.PI) * 0.06 + 0.05;
        direction.subVectors(signal.target, signal.source);
        const angle = Math.atan2(direction.y, direction.x);
        const packetQuaternion = flatQuaternion.setFromEuler(new THREE.Euler(0, 0, angle));
        const scale = new THREE.Vector3(1.0 + signal.strength * 1.9, 1, 1);
        matrix.compose(tempVector, packetQuaternion, scale);
        signalMeshRef.current?.setMatrixAt(index, matrix);
        signalMeshRef.current?.setColorAt(index, signal.riskLevel === 'critical' ? RED : AMBER);
      });
      signalMeshRef.current.instanceMatrix.needsUpdate = true;
      if (signalMeshRef.current.instanceColor) signalMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (featureMeshRef.current) {
      featureBars.forEach((bar, index) => {
        const load = THREE.MathUtils.smoothstep((t * 0.22 + bar.phase) % 1, 0.05, 0.82);
        matrix.compose(
          bar.position.clone().add(new THREE.Vector3((-bar.scale.x * (1 - load)) / 2, 0, 0)),
          flatQuaternion,
          new THREE.Vector3(Math.max(0.04, bar.scale.x * load), bar.scale.y, bar.scale.z)
        );
        featureMeshRef.current?.setMatrixAt(index, matrix);
      });
      featureMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    corridorMaterial.opacity = (0.22 + scan * 0.24 + bass * 0.08) * active;
    reticleMaterial.opacity = (0.42 + scan * 0.42) * active;
    haloMaterial.opacity = (0.52 + scan * 0.28) * active;
    featureLineMaterial.opacity = (0.64 + scan * 0.18) * active;
    gridMaterial.opacity = (0.18 + scan * 0.06) * active;
    if (corridorRef.current) corridorRef.current.scale.setScalar(1 + scan * 0.006);
    if (reticleRef.current) reticleRef.current.rotation.z = Math.sin(t * 0.3) * 0.025;
    if (haloRef.current) haloRef.current.scale.setScalar(1 + scan * 0.012 + bass * 0.008);
    if (featureLineRef.current) featureLineRef.current.position.x = Math.sin(t * 0.8) * 0.008;
  });

  useEffect(() => {
    return () => {
      cityGridGeometry.dispose();
      corridorGeometry.dispose();
      reticleGeometry.dispose();
      haloGeometry.dispose();
      featureLineGeometry.dispose();
      hotspotGeometry.dispose();
      signalGeometry.dispose();
      featureGeometry.dispose();
      gridMaterial.dispose();
      corridorMaterial.dispose();
      reticleMaterial.dispose();
      haloMaterial.dispose();
      featureLineMaterial.dispose();
      hotspotMaterial.dispose();
      signalMaterial.dispose();
      featureMaterial.dispose();
    };
  }, [
    cityGridGeometry,
    corridorGeometry,
    corridorMaterial,
    featureGeometry,
    featureMaterial,
    gridMaterial,
    haloGeometry,
    haloMaterial,
    hotspotGeometry,
    hotspotMaterial,
    reticleGeometry,
    reticleMaterial,
    signalGeometry,
    signalMaterial,
    featureLineGeometry,
    featureLineMaterial,
  ]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.32, 0.04, 0]}>
        <lineSegments geometry={cityGridGeometry} material={gridMaterial} />
        <lineSegments ref={corridorRef} geometry={corridorGeometry} material={corridorMaterial} />
        <lineSegments ref={haloRef} geometry={haloGeometry} material={haloMaterial} />
        <lineSegments ref={reticleRef} geometry={reticleGeometry} material={reticleMaterial} />
        <lineSegments ref={featureLineRef} geometry={featureLineGeometry} material={featureLineMaterial} />
        <instancedMesh ref={hotspotMeshRef} args={[hotspotGeometry, hotspotMaterial, CRASH_HOTSPOTS.length]} frustumCulled={false} />
        <instancedMesh ref={signalMeshRef} args={[signalGeometry, signalMaterial, signals.length]} frustumCulled={false} />
        <instancedMesh ref={featureMeshRef} args={[featureGeometry, featureMaterial, featureBars.length]} frustumCulled={false} />

        <Text
          position={[-2.92, 2.18, 0.24]}
          fontSize={0.085}
          color="#FF8C00"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.92}
        >
          CRASH RISK PREDICTOR | RECORDS: ~8M | ROC-AUC: 0.86
        </Text>

        <Text
          position={[-2.92, -2.22, 0.22]}
          fontSize={0.062}
          color="#00D4FF"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.78}
        >
          HOTSPOT RECIDIVISM MODEL | ENGINEERED RISK FEATURES | XGBOOST ENSEMBLE
        </Text>

        {CRASH_MODEL_METRICS.map((metric, index) => (
          <Text
            key={metric.label}
            position={[1.72, 2.0 - index * 0.18, 0.24]}
            fontSize={0.056}
            color={metricColor(metric.emphasis)}
            anchorX="left"
            anchorY="middle"
            material-transparent
            material-opacity={0.86}
          >
            {metric.label}: {metric.value}
          </Text>
        ))}

        <Text
          position={[1.72, 1.54, 0.24]}
          fontSize={0.054}
          color="#8BA3C0"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.74}
        >
          FEATURE IMPORTANCE
        </Text>

        {CRASH_FEATURE_IMPORTANCE.slice(0, 5).map((feature, index) => (
          <Text
            key={feature.feature}
            position={[1.72, 1.36 - index * 0.19, 0.26]}
            fontSize={0.043}
            color="#8BA3C0"
            anchorX="right"
            anchorY="middle"
            material-transparent
            material-opacity={0.78}
          >
            {feature.feature.toUpperCase()}
          </Text>
        ))}

        <Text
          position={[-0.72, 0.36, 0.36]}
          fontSize={0.053}
          color="#FF3333"
          anchorX="center"
          anchorY="middle"
          material-transparent
          material-opacity={0.84}
        >
          CRITICAL LOCK
        </Text>
      </group>
    </>
  );
}

function CrashesScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <CrashesSceneContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}

export { CrashesSceneContent };
export { CrashesScene };
export default CrashesScene;
