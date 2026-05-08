'use client';

import { Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import type { SceneProps } from './types';

const C_CYAN  = new THREE.Color('#00D4FF');
const C_GREEN = new THREE.Color('#00FF88');
const C_RED   = new THREE.Color('#FF3333');
const C_AMBER = new THREE.Color('#FF8C00');
const C_GRID  = new THREE.Color('#1A2840');

const Y_SRC    =  1.8;
const Y_SHIELD =  0.4;
const Y_PROXY  = -0.8;
const Y_DB     = -1.9;

type V3 = [number, number, number];

const P_SRC: V3[]   = [[-2.1, Y_SRC, 0], [0, Y_SRC, 0], [2.1, Y_SRC, 0]];
const P_SHIELD: V3  = [0, Y_SHIELD, 0];
const P_PROXY: V3[] = [[-1.7, Y_PROXY, 0], [0, Y_PROXY, 0], [1.7, Y_PROXY, 0]];
const P_DB: V3      = [0, Y_DB, 0];

interface NodeDef { pos: V3; col: THREE.Color; radius: number; }
const NODES: NodeDef[] = [
  { pos: P_SRC[0],   col: C_CYAN,  radius: 0.10 },
  { pos: P_SRC[1],   col: C_CYAN,  radius: 0.10 },
  { pos: P_SRC[2],   col: C_CYAN,  radius: 0.10 },
  { pos: P_SHIELD,   col: C_RED,   radius: 0.18 },
  { pos: P_PROXY[0], col: C_AMBER, radius: 0.08 },
  { pos: P_PROXY[1], col: C_AMBER, radius: 0.08 },
  { pos: P_PROXY[2], col: C_AMBER, radius: 0.08 },
  { pos: P_DB,       col: C_GREEN, radius: 0.16 },
];

interface EdgeDef { a: V3; b: V3; blocked: boolean; }
const EDGES: EdgeDef[] = [
  { a: P_SRC[0],   b: P_SHIELD,   blocked: true  },
  { a: P_SRC[1],   b: P_SHIELD,   blocked: true  },
  { a: P_SRC[2],   b: P_SHIELD,   blocked: true  },
  { a: P_SRC[0],   b: P_PROXY[0], blocked: false },
  { a: P_SRC[1],   b: P_PROXY[1], blocked: false },
  { a: P_SRC[2],   b: P_PROXY[2], blocked: false },
  { a: P_PROXY[0], b: P_PROXY[1], blocked: false },
  { a: P_PROXY[1], b: P_PROXY[2], blocked: false },
  { a: P_PROXY[0], b: P_DB,       blocked: false },
  { a: P_PROXY[1], b: P_DB,       blocked: false },
  { a: P_PROXY[2], b: P_DB,       blocked: false },
];

interface PacketDef {
  pts: [V3, V3] | [V3, V3, V3];
  col: THREE.Color;
  speed: number;
  phase: number;
  blocked: boolean;
}
const PACKETS: PacketDef[] = [
  { pts: [P_SRC[0], P_SHIELD],          col: C_RED,   speed: 0.50, phase: 0.00, blocked: true  },
  { pts: [P_SRC[1], P_SHIELD],          col: C_RED,   speed: 0.40, phase: 0.33, blocked: true  },
  { pts: [P_SRC[2], P_SHIELD],          col: C_RED,   speed: 0.60, phase: 0.67, blocked: true  },
  { pts: [P_SRC[0], P_PROXY[0], P_DB], col: C_GREEN, speed: 0.30, phase: 0.10, blocked: false },
  { pts: [P_SRC[1], P_PROXY[1], P_DB], col: C_GREEN, speed: 0.25, phase: 0.55, blocked: false },
  { pts: [P_SRC[2], P_PROXY[2], P_DB], col: C_GREEN, speed: 0.35, phase: 0.80, blocked: false },
  { pts: [P_SRC[0], P_PROXY[1], P_DB], col: C_CYAN,  speed: 0.22, phase: 0.20, blocked: false },
  { pts: [P_SRC[2], P_PROXY[0], P_DB], col: C_CYAN,  speed: 0.28, phase: 0.45, blocked: false },
];

function buildEdgeGeo(): THREE.BufferGeometry {
  const verts: number[] = [];
  const cols: number[]  = [];
  for (const { a, b, blocked } of EDGES) {
    const c = blocked ? C_RED : C_GREEN;
    verts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(cols,  3));
  return geo;
}

function buildShieldRing(): THREE.BufferGeometry {
  const verts: number[] = [];
  const [cx, cy, cz] = P_SHIELD;
  const S = 48;
  for (let i = 0; i < S; i++) {
    if (i % 5 < 2) continue;
    const a0 = (i / S) * Math.PI * 2;
    const a1 = ((i + 0.65) / S) * Math.PI * 2;
    verts.push(cx + Math.cos(a0) * 0.52, cy + Math.sin(a0) * 0.52, cz,
               cx + Math.cos(a1) * 0.52, cy + Math.sin(a1) * 0.52, cz);
  }
  for (let i = 0; i < S; i += 8) {
    const a0 = (i / S) * Math.PI * 2;
    const a1 = ((i + 1) / S) * Math.PI * 2;
    verts.push(cx + Math.cos(a0) * 0.70, cy + Math.sin(a0) * 0.70, cz,
               cx + Math.cos(a1) * 0.70, cy + Math.sin(a1) * 0.70, cz);
  }
  verts.push(cx - 0.24, cy, cz, cx + 0.24, cy, cz,
             cx, cy - 0.24, cz, cx, cy + 0.24, cz);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function buildLayerGrid(): THREE.BufferGeometry {
  const verts: number[] = [];
  for (const y of [Y_SRC, Y_SHIELD, Y_PROXY, Y_DB]) {
    verts.push(-3.0, y, -0.35, 3.0, y, -0.35,
               -3.0, y,  0.35, 3.0, y,  0.35);
    for (let x = -2.8; x <= 2.8; x += 0.45)
      verts.push(x, y, -0.34, x, y, 0.34);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function packetPos(
  def: PacketDef, t: number,
  va: THREE.Vector3, vb: THREE.Vector3, out: THREE.Vector3,
): void {
  const pts = def.pts;
  if (def.blocked) {
    const raw = (t * def.speed + def.phase) % 1;
    const pp  = raw < 0.5 ? raw * 2 : (1 - raw) * 2;
    const p0 = pts[0]; const p1 = pts[pts.length - 1];
    va.set(p0[0], p0[1], p0[2]);
    vb.set(p1[0], p1[1], p1[2]);
    out.lerpVectors(va, vb, pp * 0.85);
  } else {
    const segs = pts.length - 1;
    const tg   = (t * def.speed + def.phase) % 1;
    const si   = Math.min(Math.floor(tg * segs), segs - 1);
    const tl   = tg * segs - si;
    const p0 = pts[si]; const p1 = pts[si + 1];
    va.set(p0[0], p0[1], p0[2]);
    vb.set(p1[0], p1[1], p1[2]);
    out.lerpVectors(va, vb, tl);
  }
}

function CameraRig(): null {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function PipelineContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef    = useRef<THREE.Group>(null);
  const nodeMesh  = useRef<THREE.InstancedMesh>(null);
  const pktMesh   = useRef<THREE.InstancedMesh>(null);
  const shieldRef = useRef<THREE.LineSegments>(null);

  const nodeGeo   = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  const pktGeo    = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgeGeo   = useMemo(buildEdgeGeo,    []);
  const shieldGeo = useMemo(buildShieldRing, []);
  const layerGeo  = useMemo(buildLayerGrid,  []);

  const nodeMat = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.90,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const pktMat = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const shieldMat = useMemo(() => new THREE.LineBasicMaterial({
    color: C_RED, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const layerMat = useMemo(() => new THREE.LineBasicMaterial({
    color: C_GRID, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  const mtx  = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const col  = useMemo(() => new THREE.Color(), []);
  const va   = useMemo(() => new THREE.Vector3(), []);
  const vb   = useMemo(() => new THREE.Vector3(), []);
  const vc   = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const mesh = nodeMesh.current;
    if (!mesh) return;
    NODES.forEach((n, i) => {
      va.set(n.pos[0], n.pos[1], n.pos[2]);
      vb.set(n.radius, n.radius, n.radius);
      mtx.compose(va, quat, vb);
      mesh.setMatrixAt(i, mtx);
      mesh.setColorAt(i, n.col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mtx, quat, va, vb]);

  useFrame(({ clock }) => {
    const t      = clock.elapsedTime;
    const active = inView ? 1 : 0.15;
    const bass   = Math.min(1, Math.max(0, audioBass));
    const pulse  = 0.5 + 0.5 * Math.sin(t * 2.2);

    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(t * 0.11) * 0.055;
      rigRef.current.position.y = Math.sin(t * 0.19) * 0.018;
    }

    const nmesh = nodeMesh.current;
    if (nmesh) {
      NODES.forEach((n, i) => {
        const isShield = i === 3;
        const pp = isShield
          ? (1 + Math.sin(t * 3.1) * 0.22 + bass * 0.12)
          : (1 + Math.sin(t * 1.4 + i * 0.9) * 0.08);
        const r = n.radius * pp;
        va.set(n.pos[0], n.pos[1], n.pos[2]);
        vb.set(r, r, r);
        mtx.compose(va, quat, vb);
        nmesh.setMatrixAt(i, mtx);
        if (isShield) col.copy(C_RED).lerp(C_AMBER, pulse * 0.35);
        else col.copy(n.col);
        nmesh.setColorAt(i, col);
      });
      nmesh.instanceMatrix.needsUpdate = true;
      if (nmesh.instanceColor) nmesh.instanceColor.needsUpdate = true;
    }

    const pmesh = pktMesh.current;
    if (pmesh) {
      PACKETS.forEach((def, i) => {
        packetPos(def, t, va, vb, vc);
        const s = 0.065 + bass * 0.015;
        va.set(s, s, s);
        mtx.compose(vc, quat, va);
        pmesh.setMatrixAt(i, mtx);
        pmesh.setColorAt(i, def.col);
      });
      pmesh.instanceMatrix.needsUpdate = true;
      if (pmesh.instanceColor) pmesh.instanceColor.needsUpdate = true;
    }

    if (shieldRef.current) {
      shieldMat.opacity = (0.55 + pulse * 0.35) * active;
      shieldRef.current.scale.setScalar(1 + pulse * 0.028 + bass * 0.01);
    }
    edgeMat.opacity  = (0.25 + pulse * 0.10) * active;
    layerMat.opacity = (0.16 + pulse * 0.04) * active;
  });

  useEffect(() => () => {
    nodeGeo.dispose();  pktGeo.dispose();   edgeGeo.dispose();
    shieldGeo.dispose(); layerGeo.dispose();
    nodeMat.dispose();  pktMat.dispose();   edgeMat.dispose();
    shieldMat.dispose(); layerMat.dispose();
  }, [edgeGeo, edgeMat, layerGeo, layerMat, nodeGeo, nodeMat,
      pktGeo, pktMat, shieldGeo, shieldMat]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef}>
        <lineSegments geometry={layerGeo}  material={layerMat} />
        <lineSegments geometry={edgeGeo}   material={edgeMat}  />
        <lineSegments ref={shieldRef} geometry={shieldGeo} material={shieldMat} />
        <instancedMesh ref={nodeMesh} args={[nodeGeo, nodeMat, NODES.length]}   frustumCulled={false} />
        <instancedMesh ref={pktMesh}  args={[pktGeo,  pktMat,  PACKETS.length]} frustumCulled={false} />

        <Text position={[-2.85, 2.28, 0]} fontSize={0.088} color="#FF8C00"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.92}>
          AKAMAI BYPASS: ACTIVE | UPTIME: 99.7%
        </Text>
        <Text position={[-2.85, Y_SRC + 0.26, 0]} fontSize={0.062} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.75}>
          E-COMMERCE SOURCES
        </Text>
        <Text position={[0.30, Y_SHIELD + 0.30, 0]} fontSize={0.062} color="#FF3333"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.82}>
          AKAMAI SHIELD — BOT DETECT
        </Text>
        <Text position={[-2.85, Y_PROXY - 0.24, 0]} fontSize={0.062} color="#FF8C00"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.75}>
          PROXY FALLBACK LAYER
        </Text>
        <Text position={[-0.55, Y_DB - 0.25, 0]} fontSize={0.062} color="#00FF88"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.82}>
          GCP / MONGODB — PRICE DB
        </Text>
        <Text position={[-2.85, -2.42, 0]} fontSize={0.058} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.65}>
          OFFICIAL API → BLOCKED → PROXY ROUTE → INTERNAL JSON → DB  |  SELENIUM · KAFKA · DOCKER
        </Text>
      </group>
    </>
  );
}

export default function PipelineScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <PipelineContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}
