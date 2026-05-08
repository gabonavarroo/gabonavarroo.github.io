'use client';

import { Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import { INSULINK_EDGES, INSULINK_HUB_ID, INSULINK_NODES, type InsuLinkNode } from '@/data/insulinkGraph';
import type { SceneProps } from './types';

const CYAN = new THREE.Color('#00D4FF');
const TEAL = new THREE.Color('#00CCAA');
const GREEN = new THREE.Color('#00FF88');
const GOLD = new THREE.Color('#FFCC44');
const BLUE = new THREE.Color('#2288FF');
const DIM = new THREE.Color('#1A2840');
const NODE_SCALE = 1.28;

interface CareSignal {
  source: THREE.Vector3;
  target: THREE.Vector3;
  phase: number;
  strength: number;
  route: 'booking' | 'clinical';
}

interface VitalParticle {
  position: [number, number, number];
  seed: number;
}

function toVector(node: InsuLinkNode): THREE.Vector3 {
  return new THREE.Vector3(
    node.position[0] * NODE_SCALE,
    node.position[1] * NODE_SCALE,
    node.position[2] * NODE_SCALE
  );
}

function createNodeMap(): Map<string, InsuLinkNode> {
  return new Map(INSULINK_NODES.map((node) => [node.id, node]));
}

function createEdgeGeometry(nodeMap: Map<string, InsuLinkNode>): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];

  INSULINK_EDGES.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;

    const sourceVector = toVector(source);
    const targetVector = toVector(target);
    const sourceColor = source.type === 'patient' ? TEAL : CYAN;
    const targetColor = target.type === 'hub' ? GREEN : BLUE;
    const mix = source.type === 'patient' && target.type === 'doctor' ? 0.42 : 0.68;
    const color = sourceColor.clone().lerp(targetColor, mix).multiplyScalar(0.82);

    vertices.push(sourceVector.x, sourceVector.y, sourceVector.z, targetVector.x, targetVector.y, targetVector.z);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  });

  const doctorNodes = INSULINK_NODES.filter((node) => node.type === 'doctor');
  const hub = nodeMap.get(INSULINK_HUB_ID);
  if (hub) {
    const hubVector = toVector(hub);
    doctorNodes.forEach((doctor) => {
      const doctorVector = toVector(doctor);
      vertices.push(doctorVector.x, doctorVector.y, doctorVector.z, hubVector.x, hubVector.y, hubVector.z);
      colors.push(CYAN.r, CYAN.g, CYAN.b, GREEN.r, GREEN.g, GREEN.b);
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCareSignals(nodeMap: Map<string, InsuLinkNode>): CareSignal[] {
  const signals: CareSignal[] = [];
  const hub = nodeMap.get(INSULINK_HUB_ID);

  INSULINK_EDGES.forEach((edge, index) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target || target.type === 'hub') return;

    signals.push({
      source: toVector(source),
      target: toVector(target),
      phase: source.pulseOffset + index * 0.013,
      strength: edge.strength,
      route: 'booking',
    });
  });

  if (hub) {
    const hubVector = toVector(hub);
    INSULINK_NODES.filter((node) => node.type === 'doctor').forEach((doctor, index) => {
      signals.push({
        source: toVector(doctor),
        target: hubVector,
        phase: doctor.pulseOffset + index * 0.031,
        strength: 0.92,
        route: 'clinical',
      });
    });
  }

  return signals;
}

function createVitalsGeometry(): THREE.BufferGeometry {
  const particles: VitalParticle[] = [];
  const total = 180;

  for (let index = 0; index < total; index += 1) {
    const angle = (index / total) * Math.PI * 2;
    const radius = 2.15 + Math.sin(index * 2.17) * 0.22 + (index % 5) * 0.04;
    particles.push({
      position: [
        Math.cos(angle) * radius,
        Math.sin(angle) * (1.42 + (index % 7) * 0.012),
        -0.42 + (index % 13) * 0.06,
      ],
      seed: (index * 0.137) % 1,
    });
  }

  const positions = new Float32Array(particles.length * 3);
  const seeds = new Float32Array(particles.length);
  particles.forEach((particle, index) => {
    positions.set(particle.position, index * 3);
    seeds[index] = particle.seed;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('a_seed', new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createPulseRingGeometry(radius: number, segments: number, z: number): THREE.BufferGeometry {
  const vertices: number[] = [];

  for (let index = 0; index < segments; index += 1) {
    if (index % 6 === 0) continue;
    const a0 = (index / segments) * Math.PI * 2;
    const a1 = ((index + 0.72) / segments) * Math.PI * 2;
    vertices.push(
      Math.cos(a0) * radius,
      Math.sin(a0) * radius,
      z,
      Math.cos(a1) * radius,
      Math.sin(a1) * radius,
      z
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

const VITALS_VERTEX_SHADER = `
precision highp float;

attribute float a_seed;

uniform float u_time;
uniform float u_audio;
uniform float u_pixel_ratio;

varying float v_alpha;

void main() {
  float pulse = 0.5 + 0.5 * sin(u_time * 1.7 + a_seed * 24.0);
  vec3 pos = position;
  pos.z += pulse * 0.08;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.35 + pulse * 2.4 + u_audio * 1.4) * u_pixel_ratio;
  gl_Position = projectionMatrix * mvPosition;
  v_alpha = 0.16 + pulse * 0.38;
}
`;

const VITALS_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 u_color;

varying float v_alpha;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float alpha = smoothstep(0.5, 0.0, d) * v_alpha;
  if (alpha < 0.025) discard;
  gl_FragColor = vec4(u_color, alpha);
}
`;

function CameraRig(): null {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 5.9);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function InsuLinkSceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const patientMeshRef = useRef<THREE.InstancedMesh>(null);
  const doctorMeshRef = useRef<THREE.InstancedMesh>(null);
  const hubMeshRef = useRef<THREE.InstancedMesh>(null);
  const packetMeshRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const ringARef = useRef<THREE.LineSegments>(null);
  const ringBRef = useRef<THREE.LineSegments>(null);
  const vitalsMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const nodeMap = useMemo(createNodeMap, []);
  const patients = useMemo(() => INSULINK_NODES.filter((node) => node.type === 'patient'), []);
  const doctors = useMemo(() => INSULINK_NODES.filter((node) => node.type === 'doctor'), []);
  const hub = useMemo(() => INSULINK_NODES.find((node) => node.type === 'hub') ?? INSULINK_NODES[0], []);
  const signals = useMemo(() => createCareSignals(nodeMap), [nodeMap]);
  const edgeGeometry = useMemo(() => createEdgeGeometry(nodeMap), [nodeMap]);
  const vitalsGeometry = useMemo(createVitalsGeometry, []);
  const ringAGeometry = useMemo(() => createPulseRingGeometry(0.38, 92, 0.08), []);
  const ringBGeometry = useMemo(() => createPulseRingGeometry(0.68, 116, 0.1), []);
  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.035, 14, 10), []);
  const doctorGeometry = useMemo(() => new THREE.OctahedronGeometry(0.058, 1), []);
  const hubGeometry = useMemo(() => new THREE.SphereGeometry(0.105, 24, 16), []);
  const packetGeometry = useMemo(() => new THREE.SphereGeometry(0.024, 10, 8), []);
  const patientMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: TEAL,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const doctorMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const hubMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: GREEN,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const packetMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const edgeMaterial = useMemo(
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
  const ringMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GREEN,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const ringMaterialOuter = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const vitalsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VITALS_VERTEX_SHADER,
        fragmentShader: VITALS_FRAGMENT_SHADER,
        uniforms: {
          u_time: { value: 0 },
          u_audio: { value: 0 },
          u_pixel_ratio: { value: 1 },
          u_color: { value: TEAL },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);
  const hubVector = useMemo(() => toVector(hub), [hub]);

  vitalsMaterialRef.current = vitalsMaterial;

  useEffect(() => {
    if (patientMeshRef.current) {
      patients.forEach((patient, index) => {
        const position = toVector(patient);
        const size = 0.78 + (patient.pulseOffset % 0.4);
        matrix.compose(position, new THREE.Quaternion(), new THREE.Vector3(size, size, size));
        patientMeshRef.current?.setMatrixAt(index, matrix);
        patientMeshRef.current?.setColorAt(index, color.copy(TEAL).lerp(BLUE, patient.pulseOffset * 0.3));
      });
      patientMeshRef.current.instanceMatrix.needsUpdate = true;
      if (patientMeshRef.current.instanceColor) patientMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (doctorMeshRef.current) {
      doctors.forEach((doctor, index) => {
        const position = toVector(doctor);
        const size = 0.96 + doctor.pulseOffset * 0.18;
        matrix.compose(position, new THREE.Quaternion(), new THREE.Vector3(size, size, size));
        doctorMeshRef.current?.setMatrixAt(index, matrix);
        doctorMeshRef.current?.setColorAt(index, color.copy(CYAN).lerp(GOLD, 0.2 + doctor.pulseOffset * 0.2));
      });
      doctorMeshRef.current.instanceMatrix.needsUpdate = true;
      if (doctorMeshRef.current.instanceColor) doctorMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (hubMeshRef.current) {
      matrix.compose(hubVector, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
      hubMeshRef.current.setMatrixAt(0, matrix);
      hubMeshRef.current.setColorAt(0, GREEN);
      hubMeshRef.current.instanceMatrix.needsUpdate = true;
      if (hubMeshRef.current.instanceColor) hubMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [color, doctors, hubVector, matrix, patients]);

  useFrame(({ clock, size }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.12;
    const bass = Math.min(1, Math.max(0, audioBass));
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);

    vitalsMaterial.uniforms.u_time.value = t;
    vitalsMaterial.uniforms.u_audio.value = bass;
    vitalsMaterial.uniforms.u_pixel_ratio.value = Math.min(size.width / 900, 1.8);

    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(t * 0.12) * 0.16;
      rigRef.current.rotation.z = Math.sin(t * 0.18) * 0.025;
    }

    if (patientMeshRef.current) {
      patients.forEach((patient, index) => {
        const heartbeat = 0.5 + 0.5 * Math.sin(t * 4.6 + patient.pulseOffset * Math.PI * 2);
        const sizePulse = 0.82 + heartbeat * 0.34 + bass * 0.14;
        matrix.compose(toVector(patient), new THREE.Quaternion(), new THREE.Vector3(sizePulse, sizePulse, sizePulse));
        patientMeshRef.current?.setMatrixAt(index, matrix);
      });
      patientMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (doctorMeshRef.current) {
      doctors.forEach((doctor, index) => {
        const heartbeat = 0.5 + 0.5 * Math.sin(t * 3.3 + doctor.pulseOffset * Math.PI * 2);
        const sizePulse = 1.04 + heartbeat * 0.22 + bass * 0.08;
        matrix.compose(toVector(doctor), new THREE.Quaternion(), new THREE.Vector3(sizePulse, sizePulse, sizePulse));
        doctorMeshRef.current?.setMatrixAt(index, matrix);
      });
      doctorMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (hubMeshRef.current) {
      const hubScale = 1.0 + pulse * 0.44 + bass * 0.32;
      matrix.compose(hubVector, new THREE.Quaternion(), new THREE.Vector3(hubScale, hubScale, hubScale));
      hubMeshRef.current.setMatrixAt(0, matrix);
      hubMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (packetMeshRef.current) {
      signals.forEach((signal, index) => {
        const progress = (t * (0.18 + signal.strength * 0.22) + signal.phase) % 1;
        const eased = progress < 0.5 ? progress * progress * 2 : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        tempVector.lerpVectors(signal.source, signal.target, eased);
        tempVector.z += Math.sin(progress * Math.PI) * (signal.route === 'clinical' ? 0.13 : 0.08);
        const signalScale = (0.72 + Math.sin(progress * Math.PI) * 0.9 + bass * 0.22) * signal.strength;
        matrix.compose(tempVector, new THREE.Quaternion(), new THREE.Vector3(signalScale, signalScale, signalScale));
        packetMeshRef.current?.setMatrixAt(index, matrix);
        packetMeshRef.current?.setColorAt(index, signal.route === 'clinical' ? color.copy(GREEN).lerp(CYAN, 0.45) : color.copy(TEAL).lerp(GOLD, 0.22));
      });
      packetMeshRef.current.instanceMatrix.needsUpdate = true;
      if (packetMeshRef.current.instanceColor) packetMeshRef.current.instanceColor.needsUpdate = true;
    }

    edgeMaterial.opacity = (0.16 + pulse * 0.1 + bass * 0.04) * active;
    ringMaterial.opacity = (0.35 + pulse * 0.28) * active;
    ringMaterialOuter.opacity = (0.22 + pulse * 0.18) * active;

    if (edgeRef.current) edgeRef.current.rotation.z = Math.sin(t * 0.08) * 0.02;
    if (ringARef.current) {
      ringARef.current.rotation.z = -t * 0.34;
      ringARef.current.scale.setScalar(1 + pulse * 0.22 + bass * 0.08);
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.z = t * 0.24;
      ringBRef.current.scale.setScalar(1.08 + pulse * 0.14 + bass * 0.05);
    }
  });

  useEffect(() => {
    return () => {
      edgeGeometry.dispose();
      vitalsGeometry.dispose();
      ringAGeometry.dispose();
      ringBGeometry.dispose();
      nodeGeometry.dispose();
      doctorGeometry.dispose();
      hubGeometry.dispose();
      packetGeometry.dispose();
      patientMaterial.dispose();
      doctorMaterial.dispose();
      hubMaterial.dispose();
      packetMaterial.dispose();
      edgeMaterial.dispose();
      ringMaterial.dispose();
      ringMaterialOuter.dispose();
      vitalsMaterialRef.current?.dispose();
    };
  }, [
    doctorGeometry,
    doctorMaterial,
    edgeGeometry,
    edgeMaterial,
    hubGeometry,
    hubMaterial,
    nodeGeometry,
    packetGeometry,
    packetMaterial,
    patientMaterial,
    ringAGeometry,
    ringBGeometry,
    ringMaterial,
    ringMaterialOuter,
    vitalsGeometry,
  ]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.28, 0.08, -0.02]}>
        <lineSegments ref={edgeRef} geometry={edgeGeometry} material={edgeMaterial} />
        <points geometry={vitalsGeometry} material={vitalsMaterial} frustumCulled={false} />
        <lineSegments ref={ringARef} geometry={ringAGeometry} material={ringMaterial} position={hubVector} />
        <lineSegments ref={ringBRef} geometry={ringBGeometry} material={ringMaterialOuter} position={hubVector} />
        <instancedMesh ref={patientMeshRef} args={[nodeGeometry, patientMaterial, patients.length]} frustumCulled={false} />
        <instancedMesh ref={doctorMeshRef} args={[doctorGeometry, doctorMaterial, doctors.length]} frustumCulled={false} />
        <instancedMesh ref={hubMeshRef} args={[hubGeometry, hubMaterial, 1]} frustumCulled={false} />
        <instancedMesh ref={packetMeshRef} args={[packetGeometry, packetMaterial, signals.length]} frustumCulled={false} />
        <Text
          position={[-2.7, 1.98, 0.28]}
          fontSize={0.092}
          color="#00CCAA"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.88}
        >
          INSULINK PLATFORM | USERS: 70+ | CONSULTATIONS: ACTIVE
        </Text>
        <Text
          position={[-2.7, -2.05, 0.26]}
          fontSize={0.066}
          color="#00D4FF"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.78}
        >
          PATIENT VITALS - DOCTOR AUTHORITY - CARE COORDINATION CORE
        </Text>
        <Text
          position={[0.24, 0.2, 0.34]}
          fontSize={0.065}
          color="#00FF88"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.82}
        >
          CORE
        </Text>
      </group>
    </>
  );
}

function InsuLinkScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 5.9], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <InsuLinkSceneContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}

export { InsuLinkSceneContent };
export { InsuLinkScene };
export default InsuLinkScene;
