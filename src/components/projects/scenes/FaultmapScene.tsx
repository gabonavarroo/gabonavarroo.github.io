'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import {
  FAULTMAP_CLUSTERS,
  FAULTMAP_METRICS,
  FAULTMAP_PIPELINE_EDGES,
  FAULTMAP_PIPELINE_NODES,
  FAULTMAP_POINTS,
  type FaultmapClusterSeverity,
  type FaultmapDiagnosticMetric,
} from '@/data/faultmapGraph';
import type { SceneProps } from './types';

const POINT_VERTEX_SHADER = `
precision highp float;

attribute vec3 a_color;
attribute float a_alpha;
attribute float a_size;
attribute float a_pulse;
attribute float a_severity;

uniform float u_time;
uniform float u_audio_bass;
uniform float u_detection;
uniform float u_pixel_ratio;

varying vec3 v_color;
varying float v_alpha;
varying float v_kind;
varying float v_pulse;

void main() {
  v_color = a_color;
  v_kind = a_severity;

  float wave = sin(u_time * 4.8 + a_pulse * 6.28318) * 0.5 + 0.5;
  float detectionPulse = smoothstep(0.35, 1.0, u_detection) * wave;
  float failureBoost = step(0.75, a_severity) * step(a_severity, 1.75) * detectionPulse;
  float ghostFlicker = step(1.75, a_severity) * step(a_severity, 2.75) * (0.35 + 0.65 * wave);

  v_alpha = a_alpha + failureBoost * 0.22;
  v_alpha *= mix(1.0, ghostFlicker, step(1.75, a_severity) * step(a_severity, 2.75));
  v_pulse = failureBoost + ghostFlicker * 0.18 + u_audio_bass * 0.22;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float perspective = clamp(4.7 / max(1.0, -mvPosition.z), 0.68, 2.45);
  gl_PointSize = a_size * (1.0 + v_pulse * 0.65) * u_pixel_ratio * perspective;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const POINT_FRAGMENT_SHADER = `
precision highp float;

varying vec3 v_color;
varying float v_alpha;
varying float v_kind;
varying float v_pulse;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float core = smoothstep(0.2, 0.0, d);
  float halo = smoothstep(0.5, 0.04, d) * 0.42;
  float ring = smoothstep(0.42, 0.36, d) * smoothstep(0.22, 0.32, d);
  float alpha = (core + halo + ring * v_pulse) * v_alpha;

  if (alpha < 0.015) discard;

  vec3 hot = vec3(1.0, 0.2, 0.16);
  vec3 teal = vec3(0.0, 0.8, 0.66);
  vec3 color = mix(v_color, hot, step(0.75, v_kind) * step(v_kind, 1.75) * v_pulse * 0.28);
  color = mix(color, teal, step(1.75, v_kind) * step(v_kind, 2.75) * 0.22);
  color += core * vec3(0.72, 0.96, 1.0) * 0.18;

  gl_FragColor = vec4(color, alpha);
}
`;

interface PointCloudData {
  scatterPositions: Float32Array;
  targetPositions: Float32Array;
  currentPositions: Float32Array;
  colors: Float32Array;
  alphas: Float32Array;
  sizes: Float32Array;
  pulses: Float32Array;
  severities: Float32Array;
}

interface LineData {
  positions: Float32Array;
  colors: Float32Array;
}

const clusterById = new Map(FAULTMAP_CLUSTERS.map((cluster) => [cluster.id, cluster]));

const severityColor = (severity: FaultmapClusterSeverity): THREE.Color => {
  switch (severity) {
    case 'critical':
      return new THREE.Color('#ff3333');
    case 'elevated':
      return new THREE.Color('#ff8c00');
    case 'coverage_gap':
      return new THREE.Color('#00ccaa');
    case 'normal':
    default:
      return new THREE.Color('#00d4ff');
  }
};

const metricColor = (emphasis: FaultmapDiagnosticMetric['emphasis']): string => {
  switch (emphasis) {
    case 'red':
      return 'var(--alert-red)';
    case 'amber':
      return 'var(--alert-amber)';
    case 'green':
      return 'var(--system-green)';
    case 'cyan':
    default:
      return 'var(--cyan-pure)';
  }
};

function createPointCloudData(): PointCloudData {
  const count = FAULTMAP_POINTS.length;
  const scatterPositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const currentPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const alphas = new Float32Array(count);
  const sizes = new Float32Array(count);
  const pulses = new Float32Array(count);
  const severities = new Float32Array(count);

  FAULTMAP_POINTS.forEach((point, index) => {
    const i3 = index * 3;
    const cluster = clusterById.get(point.clusterId);
    const severity = cluster?.severity ?? 'normal';
    const color = severityColor(severity);
    const spiral = index * 2.399963;
    const shell = Math.sqrt((index + 1) / count);
    const scatterRadius = 2.6 + shell * 1.7 + Math.sin(index * 0.73) * 0.24;
    const uncovered = point.kind === 'uncovered_prompt';
    const representative = point.kind === 'representative_prompt';
    const failing = point.kind === 'failing_prompt';

    targetPositions[i3] = point.position[0];
    targetPositions[i3 + 1] = point.position[1];
    targetPositions[i3 + 2] = point.position[2];
    scatterPositions[i3] = Math.cos(spiral) * scatterRadius;
    scatterPositions[i3 + 1] = Math.sin(spiral * 0.92) * (1.35 + shell * 0.82);
    scatterPositions[i3 + 2] = Math.sin(index * 1.17) * 1.25 + Math.cos(spiral) * 0.55;
    currentPositions[i3] = THREE.MathUtils.lerp(scatterPositions[i3], targetPositions[i3], 0.72);
    currentPositions[i3 + 1] = THREE.MathUtils.lerp(scatterPositions[i3 + 1], targetPositions[i3 + 1], 0.72);
    currentPositions[i3 + 2] = THREE.MathUtils.lerp(scatterPositions[i3 + 2], targetPositions[i3 + 2], 0.72);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    alphas[index] = Math.min(1, point.opacity + 0.16);
    sizes[index] = representative ? 18 : failing ? 11 : uncovered ? 8.8 : 7.4;
    pulses[index] = point.pulseOffset;
    severities[index] =
      uncovered ? 2 : representative ? 3 : severity === 'critical' || severity === 'elevated' ? 1 : 0;
  });

  return { scatterPositions, targetPositions, currentPositions, colors, alphas, sizes, pulses, severities };
}

function createLineData(): LineData {
  const positions: number[] = [];
  const colors: number[] = [];

  FAULTMAP_CLUSTERS.forEach((cluster) => {
    const points = FAULTMAP_POINTS.filter((point) => point.clusterId === cluster.id);
    const representative = points.find((point) => point.kind === 'representative_prompt') ?? points[0];
    const color = severityColor(cluster.severity);
    const linkCount = cluster.severity === 'normal' ? 5 : 7;

    points.slice(1, linkCount).forEach((point) => {
      positions.push(...representative.position, ...point.position);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    });
  });

  return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
}

function EmbeddingCloud({ inView, audioBass = 0 }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const settleRef = useRef(0.72);
  const detectionRef = useRef(0.58);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const pointData = useMemo(createPointCloudData, []);
  const lineData = useMemo(createLineData, []);

  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pointData.currentPositions, 3));
    geometry.setAttribute('a_color', new THREE.BufferAttribute(pointData.colors, 3));
    geometry.setAttribute('a_alpha', new THREE.BufferAttribute(pointData.alphas, 1));
    geometry.setAttribute('a_size', new THREE.BufferAttribute(pointData.sizes, 1));
    geometry.setAttribute('a_pulse', new THREE.BufferAttribute(pointData.pulses, 1));
    geometry.setAttribute('a_severity', new THREE.BufferAttribute(pointData.severities, 1));
    geometry.computeBoundingSphere();
    return geometry;
  }, [pointData]);

  const pointsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINT_VERTEX_SHADER,
        fragmentShader: POINT_FRAGMENT_SHADER,
        uniforms: {
          u_time: { value: 0 },
          u_audio_bass: { value: 0 },
          u_detection: { value: 0 },
          u_pixel_ratio: { value: 1 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(lineData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(lineData.colors, 3));
    geometry.computeBoundingSphere();
    return geometry;
  }, [lineData]);

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const haloGeometry = useMemo(() => new THREE.SphereGeometry(1, 28, 14), []);
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.32,
        wireframe: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const mesh = haloRef.current;
    if (!mesh) return;

    FAULTMAP_CLUSTERS.forEach((cluster, index) => {
      mesh.setColorAt(index, severityColor(cluster.severity));
    });

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    settleRef.current += ((inView ? 1 : 0.12) - settleRef.current) * 0.035;
    detectionRef.current += ((inView ? 1 : 0) - detectionRef.current) * 0.026;

    const settle = THREE.MathUtils.smoothstep(settleRef.current, 0, 1);
    const detection = Math.max(0, THREE.MathUtils.smoothstep(detectionRef.current, 0.42, 1));
    const position = pointsGeometry.getAttribute('position') as THREE.BufferAttribute;

    for (let index = 0; index < FAULTMAP_POINTS.length; index += 1) {
      const i3 = index * 3;
      const pulse = pointData.pulses[index];
      const ghost = pointData.severities[index] === 2;
      const flicker = ghost ? Math.sin(elapsed * 8.5 + pulse * 8.2) * 0.028 : 0;
      const drift = Math.sin(elapsed * 0.7 + pulse * 6.28318) * 0.018;

      pointData.currentPositions[i3] =
        THREE.MathUtils.lerp(pointData.scatterPositions[i3], pointData.targetPositions[i3], settle) + drift;
      pointData.currentPositions[i3 + 1] =
        THREE.MathUtils.lerp(pointData.scatterPositions[i3 + 1], pointData.targetPositions[i3 + 1], settle) +
        flicker;
      pointData.currentPositions[i3 + 2] =
        THREE.MathUtils.lerp(pointData.scatterPositions[i3 + 2], pointData.targetPositions[i3 + 2], settle) -
        drift * 0.6;
    }

    position.needsUpdate = true;
    pointsMaterial.uniforms.u_time.value = elapsed;
    pointsMaterial.uniforms.u_audio_bass.value = audioBass;
    pointsMaterial.uniforms.u_detection.value = detection;
    pointsMaterial.uniforms.u_pixel_ratio.value = Math.min(window.devicePixelRatio || 1, 2);

    const haloMesh = haloRef.current;
    if (haloMesh) {
      FAULTMAP_CLUSTERS.forEach((cluster, index) => {
        const hotCluster = cluster.severity === 'critical' || cluster.severity === 'elevated';
        const gapCluster = cluster.severity === 'coverage_gap';
        const pulse = Math.sin(elapsed * (hotCluster ? 3.2 : 1.7) + index * 0.84) * 0.5 + 0.5;
        const scale =
          cluster.radius *
          (hotCluster ? 2.05 + detection * pulse * 0.42 : gapCluster ? 1.92 + pulse * 0.1 : 1.72 + pulse * 0.05);

        tempObject.position.set(cluster.center[0], cluster.center[1], cluster.center[2]);
        tempObject.rotation.set(elapsed * 0.06 + index * 0.18, elapsed * 0.04 + index * 0.21, index * 0.37);
        tempObject.scale.set(scale * 1.32, scale * 0.86, scale * 1.02);
        tempObject.updateMatrix();
        haloMesh.setMatrixAt(index, tempObject.matrix);
      });

      haloMesh.instanceMatrix.needsUpdate = true;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(elapsed * 0.16) * 0.13;
      groupRef.current.rotation.x = -0.08 + Math.sin(elapsed * 0.11) * 0.035;
    }
  });

  useEffect(() => {
    return () => {
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
    };
  }, [haloGeometry, haloMaterial, lineGeometry, lineMaterial, pointsGeometry, pointsMaterial]);

  const labels = useMemo(
    () =>
      FAULTMAP_CLUSTERS.filter((cluster) => cluster.severity !== 'normal').map((cluster) => ({
        id: cluster.id,
        label:
          cluster.severity === 'coverage_gap'
            ? 'COVERAGE GAP'
            : cluster.severity === 'critical'
              ? cluster.name.includes('Medical')
                ? 'MEDICAL SAFETY'
                : 'LEGAL FAILURE'
              : cluster.name.includes('Long')
                ? 'LONG CTX'
                : 'BILLING',
        color: severityColor(cluster.severity).getStyle(),
        position: [
          Math.max(-2.05, Math.min(2.05, cluster.center[0])),
          cluster.id === 'cluster-legal-compliance'
            ? cluster.center[1] + cluster.radius * 0.82
            : cluster.center[1] + cluster.radius * 1.2,
          cluster.center[2],
        ] as [
          number,
          number,
          number,
        ],
      })),
    []
  );

  return (
    <group ref={groupRef} position={[0, 0.22, 0]}>
      <points geometry={pointsGeometry} material={pointsMaterial} frustumCulled={false} />
      <lineSegments geometry={lineGeometry} material={lineMaterial} frustumCulled={false} />
      <instancedMesh
        ref={haloRef}
        args={[haloGeometry, haloMaterial, FAULTMAP_CLUSTERS.length]}
        frustumCulled={false}
      />

      {labels.map((label) => (
        <Text
          key={label.id}
          position={label.position}
          fontSize={0.075}
          letterSpacing={0.08}
          color={label.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#05080f"
        >
          {label.label}
        </Text>
      ))}
    </group>
  );
}

function SceneBackdrop() {
  return (
    <>
      <mesh position={[0, 0, -2.2]} frustumCulled={false}>
        <planeGeometry args={[7.5, 5.2]} />
        <meshBasicMaterial color="#05080f" transparent opacity={0.78} depthWrite={false} />
      </mesh>
      <gridHelper
        args={[7.2, 18, '#1e3050', '#1a2840']}
        position={[0, -1.52, -0.55]}
        rotation={[0.2, 0, 0]}
      />
    </>
  );
}

function SceneCanvas({ inView, audioBass }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.15], fov: 43, near: 0.1, far: 80 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#05080f']} />
      <fog attach="fog" args={['#05080f', 5.4, 9.5]} />
      <SceneBackdrop />
      <ambientLight intensity={0.72} />
      <pointLight position={[0, 2.8, 3.8]} color="#00d4ff" intensity={1.8} />
      <pointLight position={[-2.6, 0.8, 2.2]} color="#ff3333" intensity={1.1} />
      <EmbeddingCloud inView={inView} audioBass={audioBass} />
    </Canvas>
  );
}

export default function FaultmapScene({ inView, audioBass = 0 }: SceneProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 420,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 36%, rgba(0, 212, 255, 0.13), transparent 32%), linear-gradient(180deg, #05080f 0%, #080c14 100%)',
      }}
      aria-label="Faultmap semantic failure slice detection scene"
    >
      <SceneCanvas inView={inView} audioBass={audioBass} />

      <div style={styles.header}>
        <span style={styles.kicker}>FAILURE SLICE DETECTION</span>
        <strong style={styles.title}>LLM DIAGNOSTIC EMBEDDING MAP</strong>
        <span style={styles.subtitle}>where failures cluster, why they repeat, what coverage missed</span>
      </div>

      <div style={styles.metricsGrid}>
        {FAULTMAP_METRICS.map((metric) => (
          <div key={metric.label} style={styles.metricPanel}>
            <span style={styles.metricLabel}>{metric.label}</span>
            <strong style={{ ...styles.metricValue, color: metricColor(metric.emphasis) }}>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div style={styles.pipeline} aria-label="Faultmap diagnostic pipeline">
        {FAULTMAP_PIPELINE_NODES.map((node, index) => (
          <div
            key={node.id}
            style={{
              ...styles.pipelineNode,
              animationDelay: `${index * 360}ms`,
              borderColor: node.status === 'active' ? 'rgba(255, 140, 0, 0.72)' : 'rgba(0, 212, 255, 0.34)',
            }}
          >
            <span style={styles.pipelineDot} />
            <span style={styles.pipelineLabel}>{node.label}</span>
            {index < FAULTMAP_PIPELINE_EDGES.length && <span style={styles.pipelineArrow}>→</span>}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes faultmap-pipeline-arm {
          0%,
          24% {
            opacity: 0.32;
            transform: translateY(4px);
            box-shadow: none;
          }
          42%,
          76% {
            opacity: 1;
            transform: translateY(0);
            box-shadow: 0 0 14px rgba(0, 212, 255, 0.24);
          }
          100% {
            opacity: 0.74;
            transform: translateY(0);
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  header: {
    position: 'absolute',
    top: 18,
    left: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxWidth: 360,
    pointerEvents: 'none',
  },
  kicker: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.16em',
    color: 'var(--alert-red)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-orbitron)',
    fontSize: 16,
    lineHeight: 1.1,
    letterSpacing: '0.04em',
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    lineHeight: 1.4,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    position: 'absolute',
    top: 18,
    right: 18,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(118px, 1fr))',
    gap: 8,
    width: 286,
    pointerEvents: 'none',
  },
  metricPanel: {
    minHeight: 46,
    padding: '8px 9px',
    border: '1px solid rgba(0, 212, 255, 0.22)',
    borderTopColor: 'rgba(0, 212, 255, 0.52)',
    background: 'linear-gradient(180deg, rgba(13, 21, 32, 0.78), rgba(5, 8, 15, 0.52))',
    backdropFilter: 'blur(8px)',
  },
  metricLabel: {
    display: 'block',
    marginBottom: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    lineHeight: 1.2,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  metricValue: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  pipeline: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: 7,
    pointerEvents: 'none',
  },
  pipelineNode: {
    position: 'relative',
    minHeight: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 7px',
    border: '1px solid rgba(0, 212, 255, 0.34)',
    background: 'rgba(5, 8, 15, 0.68)',
    animation: 'faultmap-pipeline-arm 3200ms ease-in-out infinite',
  },
  pipelineDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--cyan-pure)',
    boxShadow: '0 0 8px var(--cyan-pure)',
    flex: '0 0 auto',
  },
  pipelineLabel: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    lineHeight: 1,
    color: 'var(--text-code)',
    textTransform: 'uppercase',
  },
  pipelineArrow: {
    position: 'absolute',
    right: -9,
    color: 'var(--cyan-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    zIndex: 1,
  },
} satisfies Record<string, CSSProperties>;
