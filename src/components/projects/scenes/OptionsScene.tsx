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
const C_GOLD  = new THREE.Color('#FFCC44');
const C_GRID  = new THREE.Color('#1A2840');

// Volatility surface geometry: PlaneGeometry in local XY, Z = displaced height
// Group is rotated -45° around X so the plane lies at a perspectively readable angle
const SURF_W = 6;
const SURF_H = 4;
const SURF_WS = 40;
const SURF_HS = 28;
const SURF_COLS = SURF_WS + 1; // 41
const SURF_VERTS = SURF_COLS * (SURF_HS + 1); // 41 * 29 = 1189

// Ticker strip: 60 instanced thin boxes flowing left→right across the top
const N_TICKS = 60;

interface TickDef { phase: number; speed: number; yOffset: number; width: number; col: THREE.Color; }

const TICK_COLORS = [C_GREEN, C_RED, C_CYAN, C_AMBER, C_GREEN, C_CYAN];
const TICKS: TickDef[] = Array.from({ length: N_TICKS }, (_, i) => ({
  phase:   i / N_TICKS,
  speed:   0.16 + (i % 7) * 0.028,
  yOffset: ((i % 3) - 1) * 0.06,
  width:   0.06 + (i % 5) * 0.018,
  col:     TICK_COLORS[i % TICK_COLORS.length],
}));

function buildForecastCurve(): THREE.BufferGeometry {
  const verts: number[] = [];
  const N = 80;
  for (let i = 0; i < N - 1; i++) {
    const t0 = i / (N - 1);
    const t1 = (i + 1) / (N - 1);
    const x0 = -3 + t0 * 6;
    const x1 = -3 + t1 * 6;
    const z0 = x0 * x0 * 0.055 + 0.50;
    const z1 = x1 * x1 * 0.055 + 0.50;
    verts.push(x0, 0, z0, x1, 0, z1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function buildTerminalFrame(): THREE.BufferGeometry {
  const verts: number[] = [];
  const x0 = -3.4, x1 = -1.5, y0 = -0.1, y1 = 2.3;
  verts.push(x0, y0, 0, x1, y0, 0,
             x1, y0, 0, x1, y1, 0,
             x1, y1, 0, x0, y1, 0,
             x0, y1, 0, x0, y0, 0);
  // corner brackets
  const bk = 0.18;
  [
    [x0, y0], [x1, y0], [x1, y1], [x0, y1]
  ].forEach(([bx, by]) => {
    const sx = bx === x0 ? 1 : -1;
    const sy = by === y0 ? 1 : -1;
    verts.push(bx + sx * bk, by, 0, bx, by, 0, bx, by, 0, bx, by + sy * bk, 0);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function CameraRig(): null {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0.5, 0);
  }, [camera]);
  return null;
}

function OptionsContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const { mouse } = useThree();
  const rigRef       = useRef<THREE.Group>(null);
  const surfMeshRef  = useRef<THREE.Mesh>(null);
  const fcastRef     = useRef<THREE.LineSegments>(null);
  const tickMeshRef  = useRef<THREE.InstancedMesh>(null);
  const frameRef     = useRef<THREE.LineSegments>(null);

  // Surface geometry — mutated each frame for displacement
  const surfGeo = useMemo(() => new THREE.PlaneGeometry(SURF_W, SURF_H, SURF_WS, SURF_HS), []);

  const forecastGeo  = useMemo(buildForecastCurve,  []);
  const termFrameGeo = useMemo(buildTerminalFrame,   []);
  const tickGeo      = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const surfMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: C_CYAN, wireframe: true, transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const forecastMat = useMemo(() => new THREE.LineBasicMaterial({
    color: C_GOLD, transparent: true, opacity: 0.90,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const frameMat = useMemo(() => new THREE.LineBasicMaterial({
    color: C_CYAN, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const tickMat = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.90,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  const mtx  = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const col  = useMemo(() => new THREE.Color(), []);
  const va   = useMemo(() => new THREE.Vector3(), []);
  const vb   = useMemo(() => new THREE.Vector3(), []);

  // Init tick colors
  useEffect(() => {
    const mesh = tickMeshRef.current;
    if (!mesh) return;
    TICKS.forEach((tk, i) => mesh.setColorAt(i, tk.col));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const t      = clock.elapsedTime;
    const active = inView ? 1 : 0.15;
    const bass   = Math.min(1, Math.max(0, audioBass));
    const pulse  = 0.5 + 0.5 * Math.sin(t * 1.8);
    const mx     = mouse.x;
    const my     = mouse.y;

    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(t * 0.09) * 0.04;
      rigRef.current.position.y = Math.sin(t * 0.17) * 0.015;
    }

    // Update volatility surface: displace Z in local space (maps to world Y after rotation)
    {
      const posAttr = surfGeo.attributes['position'] as THREE.BufferAttribute;
      for (let idx = 0; idx < SURF_VERTS; idx++) {
        const ix = idx % SURF_COLS;
        const iy = Math.floor(idx / SURF_COLS);
        const x  = -3 + (ix / SURF_WS) * SURF_W;          // strike: -3 to 3
        const tenor = iy / SURF_HS;                         // 0=near-term, 1=far-term
        const smile = x * x * 0.055;                        // vol smile (parabolic wings)
        const term  = 0.50 / (tenor * 2.0 + 0.55);         // term structure
        const noise = 0.065 * Math.sin(x * 2.1 + t * 0.50) * Math.cos(tenor * 3.5 + t * 0.38);
        const mDeform = mx * 0.12 * Math.sin(x * 0.8) + my * 0.05;
        const bassLift = bass * 0.08 * Math.sin(x * 1.4 + t);
        posAttr.setZ(idx, smile + term + noise + mDeform + bassLift);
      }
      posAttr.needsUpdate = true;
    }

    // Update forecast curve opacity / pulse
    if (fcastRef.current) {
      forecastMat.opacity = (0.75 + pulse * 0.20) * active;
      fcastRef.current.position.z = 0.62 + Math.sin(t * 0.7) * 0.04 + bass * 0.05;
    }

    // Animate ticks
    {
      const mesh = tickMeshRef.current;
      if (mesh) {
        TICKS.forEach((tk, i) => {
          const x = (((t * tk.speed + tk.phase) % 1) * 8) - 4;
          va.set(x, 2.35 + tk.yOffset, 0.8);
          vb.set(tk.width, 0.030, 0.030);
          mtx.compose(va, quat, vb);
          mesh.setMatrixAt(i, mtx);
          col.copy(tk.col);
          mesh.setColorAt(i, col);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }

    surfMat.opacity  = (0.20 + pulse * 0.10 + bass * 0.06) * active;
    frameMat.opacity = (0.45 + pulse * 0.15) * active;
  });

  useEffect(() => () => {
    surfGeo.dispose();   forecastGeo.dispose(); termFrameGeo.dispose(); tickGeo.dispose();
    surfMat.dispose();   forecastMat.dispose(); frameMat.dispose();     tickMat.dispose();
  }, [forecastGeo, forecastMat, frameMat, surfGeo, surfMat, termFrameGeo, tickGeo, tickMat]);

  return (
    <>
      <CameraRig />
      <group ref={rigRef}>

        {/* Volatility surface — tilted back at 45° */}
        <group position={[0, -0.6, -1.2]} rotation={[-Math.PI * 0.38, 0, 0]}>
          <mesh ref={surfMeshRef} geometry={surfGeo} material={surfMat} frustumCulled={false} />
        </group>

        {/* LightGBM forecast curve — hovers above surface */}
        <group position={[0, -0.6, -1.2]} rotation={[-Math.PI * 0.38, 0, 0]}>
          <lineSegments ref={fcastRef} geometry={forecastGeo} material={forecastMat} frustumCulled={false} />
        </group>

        {/* Tick stream */}
        <instancedMesh ref={tickMeshRef} args={[tickGeo, tickMat, N_TICKS]} frustumCulled={false} />

        {/* Terminal frame (left panel) */}
        <lineSegments ref={frameRef} geometry={termFrameGeo} material={frameMat} position={[0, 0, 0.5]} />

        {/* ── FUI header ── */}
        <Text position={[-3.4, 2.80, 0.6]} fontSize={0.085} color="#FF8C00"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.92}>
          LIVE OPTIONS FLOW | MARKET: SIMULATION | LATENCY: &lt;50ms
        </Text>

        {/* ── Terminal: left panel ── */}
        <Text position={[-3.25, 2.18, 0.6]} fontSize={0.057} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.85}>
          KAFKA STREAM → FASTAPI INGEST
        </Text>
        <Text position={[-3.25, 2.00, 0.6]} fontSize={0.050} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [BUY]  AAPL 190C 06/21  Δ0.62  IV:0.31  OI:4821
        </Text>
        <Text position={[-3.25, 1.84, 0.6]} fontSize={0.050} color="#FF3333"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [SELL] SPY  440P 07/19  Δ0.41  IV:0.28  OI:9103
        </Text>
        <Text position={[-3.25, 1.68, 0.6]} fontSize={0.050} color="#00FF88"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [BUY]  NVDA 600C 06/28  Δ0.55  IV:0.44  OI:2267
        </Text>
        <Text position={[-3.25, 1.52, 0.6]} fontSize={0.050} color="#FF8C00"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [BUY]  QQQ  370P 06/21  Δ0.38  IV:0.26  OI:6654
        </Text>
        <Text position={[-3.25, 1.36, 0.6]} fontSize={0.050} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [SELL] TSLA 250C 08/16  Δ0.49  IV:0.58  OI:3312
        </Text>
        <Text position={[-3.25, 1.20, 0.6]} fontSize={0.050} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [BUY]  META 480C 07/05  Δ0.71  IV:0.33  OI:1189
        </Text>
        <Text position={[-3.25, 1.04, 0.6]} fontSize={0.050} color="#FF3333"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [SELL] AMZN 185P 06/21  Δ0.29  IV:0.24  OI:8841
        </Text>
        <Text position={[-3.25, 0.88, 0.6]} fontSize={0.050} color="#00FF88"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          [BUY]  MSFT 420C 09/20  Δ0.60  IV:0.29  OI:5530
        </Text>
        <Text position={[-3.25, 0.72, 0.6]} fontSize={0.050} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.78}>
          ░ LIGHTGBM VOL FORECAST: ACTIVE ░
        </Text>
        <Text position={[-3.25, 0.56, 0.6]} fontSize={0.050} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.65}>
          SHARDED MONGODB | PYSPARK ANALYTICS
        </Text>
        <Text position={[-3.25, 0.38, 0.6]} fontSize={0.048} color="#4A6080"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.60}>
          LATENCY P99: 47ms | TICKS/s: 2,840█
        </Text>

        {/* ── Metrics: right panel ── */}
        <Text position={[1.60, 2.18, 0.6]} fontSize={0.058} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.85}>
          VOL SURFACE METRICS
        </Text>
        <Text position={[1.60, 1.98, 0.6]} fontSize={0.052} color="#FFCC44"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          IV SKEW (25Δ):    0.234
        </Text>
        <Text position={[1.60, 1.82, 0.6]} fontSize={0.052} color="#FF8C00"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          GAMMA EXP:        −$1.2B
        </Text>
        <Text position={[1.60, 1.66, 0.6]} fontSize={0.052} color="#00FF88"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          PUT/CALL RATIO:   1.42
        </Text>
        <Text position={[1.60, 1.50, 0.6]} fontSize={0.052} color="#00D4FF"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          VOL/OI:           0.087
        </Text>
        <Text position={[1.60, 1.34, 0.6]} fontSize={0.052} color="#FF3333"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          ATM IV (30d):     0.286
        </Text>
        <Text position={[1.60, 1.18, 0.6]} fontSize={0.052} color="#FFCC44"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          TERM STRUCTURE:   INV
        </Text>
        <Text position={[1.60, 1.02, 0.6]} fontSize={0.052} color="#00FF88"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.80}>
          VANNA EXPOSURE:   +$340M
        </Text>
        <Text position={[1.60, 0.84, 0.6]} fontSize={0.052} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.72}>
          UNUSUAL ACTIVITY: 12 ALERTS
        </Text>

        {/* ── Surface axis labels ── */}
        <Text position={[-3.2, -2.35, 0.2]} fontSize={0.060} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.65}>
          STRIKE (MONEYNESS) →
        </Text>
        <Text position={[2.8, 0.20, 0.2]} fontSize={0.055} color="#8BA3C0"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.65}>
          ↑ IMPLIED VOL
        </Text>

        {/* ── Bottom tag ── */}
        <Text position={[-3.4, -2.65, 0.6]} fontSize={0.058} color="#007A99"
          anchorX="left" anchorY="middle" material-transparent material-opacity={0.60}>
          LIGHTGBM FORECAST  ──  GOLD CURVE  |  IV SURFACE  ──  CYAN GRID
        </Text>
      </group>
    </>
  );
}

export default function OptionsScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 4, 9], fov: 52, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <OptionsContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}
