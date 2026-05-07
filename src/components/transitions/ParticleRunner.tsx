'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type JSX, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { RUNNER_POSES } from '@/data/runnerPoses';
import { ScrollTrigger, gsap } from '@/lib/gsap';

type Point3 = [number, number, number];

type PoseKey = 'standing' | 'stride1' | 'sprint' | 'stride2' | 'recovery';

type NormalizedRunnerData = {
  poses: Float32Array[];
  count: number;
  seeds: Float32Array;
};

const POSE_ORDER: PoseKey[] = ['standing', 'stride1', 'sprint', 'stride2', 'recovery'];
const STRIDE_CYCLES_PER_SECOND = 2.35;
const SCATTER_START_PROGRESS = 0.95;
const SCATTER_FADE_SECONDS = 3.2;

const POINT_VERT = `
precision highp float;

attribute float a_seed;

uniform float u_time;
uniform float u_pixel_ratio;
uniform float u_opacity;

varying float v_seed;
varying float v_alpha;

void main() {
  v_seed = a_seed;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float perspective = clamp(3.4 / max(0.8, -mvPosition.z), 0.78, 2.2);
  float pulse = 0.86 + sin(u_time * 4.0 + a_seed * 6.28318) * 0.12;

  gl_PointSize = (2.0 + a_seed * 2.9) * pulse * u_pixel_ratio * perspective;
  gl_Position = projectionMatrix * mvPosition;
  v_alpha = u_opacity;
}
`;

const POINT_FRAG = `
precision highp float;

varying float v_seed;
varying float v_alpha;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float dist = length(p);
  float core = smoothstep(0.22, 0.0, dist);
  float halo = smoothstep(0.5, 0.0, dist) * 0.42;
  float alpha = (core + halo) * v_alpha;

  if (alpha < 0.015) discard;

  vec3 cyan = vec3(0.0, 0.8314, 1.0);
  vec3 blue = vec3(0.06, 0.36, 0.72);
  vec3 color = mix(blue, cyan, 0.72 + core * 0.28);
  color += vec3(0.42, 0.9, 1.0) * core * (0.22 + v_seed * 0.16);

  gl_FragColor = vec4(color, alpha);
}
`;

function smoothstep01(value: number): number {
  return value * value * (3 - 2 * value);
}

function hash01(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function normalizeRunnerData(): NormalizedRunnerData {
  const poseArrays = POSE_ORDER.map((key) => RUNNER_POSES[key] as Point3[] | undefined).filter(
    (pose): pose is Point3[] => Array.isArray(pose)
  );
  const count = Math.min(...poseArrays.map((pose) => pose.length));

  if (!Number.isFinite(count) || count <= 0 || poseArrays.length !== POSE_ORDER.length) {
    throw new Error('RUNNER_POSES must include five non-empty pose arrays.');
  }

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;

  for (const pose of poseArrays) {
    for (let index = 0; index < count; index += 1) {
      const [x, y] = pose[index];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const height = Math.max(0.001, maxY - minY);
  const scale = 2 / height;
  const poses = poseArrays.map((pose) => {
    const buffer = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3;
      const [x, y, z] = pose[index];
      buffer[i3] = (x - centerX) * scale;
      buffer[i3 + 1] = (y - centerY) * scale;
      buffer[i3 + 2] = z * scale;
    }

    return buffer;
  });

  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    seeds[index] = hash01(index * 0.731 + 17.13);
  }

  return { poses, count, seeds };
}

function triggerStrideTick(): void {
  // AudioController currently exposes analyzer data only, not a narrow stride SFX method.
  // Wire a subtle synthesized footstep/click here if that API is added later.
}

function useMotionFallback(): boolean {
  // Component is dynamic-imported with ssr:false, so window is always defined here.
  // Initialize directly from media queries to avoid a false→canvas flash on desktop.
  const [fallback, setFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(max-width: 767px)').matches
    );
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setFallback(reducedMotion.matches || mobile.matches);
    };

    reducedMotion.addEventListener('change', update);
    mobile.addEventListener('change', update);

    return () => {
      reducedMotion.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
    };
  }, []);

  return fallback;
}

function RunnerPoints({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const data = useMemo(normalizeRunnerData, []);
  const positionsRef = useRef(new Float32Array(data.count * 3));
  const scatterVelocitiesRef = useRef(new Float32Array(data.count * 3));
  const scatterBaseRef = useRef(new Float32Array(data.count * 3));
  const scatterActiveRef = useRef(false);
  const scatterStartTimeRef = useRef(0);
  const lastStrideStepRef = useRef(-1);

  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute('position', new THREE.BufferAttribute(positionsRef.current, 3));
    nextGeometry.setAttribute('a_seed', new THREE.BufferAttribute(data.seeds, 1));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [data.seeds]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_pixel_ratio: { value: 1 },
          u_opacity: { value: 1 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const progress = progressRef.current;
    const phase = (elapsed * STRIDE_CYCLES_PER_SECOND) % POSE_ORDER.length;
    const poseIndex = Math.floor(phase);
    const nextPoseIndex = (poseIndex + 1) % POSE_ORDER.length;
    const localPhase = smoothstep01(phase - poseIndex);
    const currentPose = data.poses[poseIndex];
    const nextPose = data.poses[nextPoseIndex];
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionsRef.current;

    material.uniforms.u_time.value = elapsed;
    material.uniforms.u_pixel_ratio.value = Math.min(window.devicePixelRatio || 1, 2);

    if (groupRef.current) {
      const startX = viewport.width * -0.43;
      const endX = viewport.width * 0.43;
      groupRef.current.position.x = THREE.MathUtils.lerp(startX, endX, progress);
      groupRef.current.position.y = Math.sin(elapsed * Math.PI * STRIDE_CYCLES_PER_SECOND * 2) * 0.035;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(-0.045, 0.035, Math.sin(phase * Math.PI * 2) * 0.5 + 0.5);
    }

    const strideStep = Math.floor(phase * 2);
    if (progress > 0.04 && progress < SCATTER_START_PROGRESS && strideStep !== lastStrideStepRef.current) {
      lastStrideStepRef.current = strideStep;
      triggerStrideTick();
    }

    if (progress >= SCATTER_START_PROGRESS && !scatterActiveRef.current) {
      scatterActiveRef.current = true;
      scatterStartTimeRef.current = elapsed;

      for (let index = 0; index < data.count; index += 1) {
        const i3 = index * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        const length = Math.hypot(x, y, z) || 1;
        const magnitude = 8 + hash01(index * 3.71 + 91.4) * 4;

        scatterBaseRef.current[i3] = x;
        scatterBaseRef.current[i3 + 1] = y;
        scatterBaseRef.current[i3 + 2] = z;
        scatterVelocitiesRef.current[i3] = (x / length) * magnitude + 4.2;
        scatterVelocitiesRef.current[i3 + 1] = (y / length) * magnitude;
        scatterVelocitiesRef.current[i3 + 2] = (z / length) * magnitude + (hash01(index * 5.19) - 0.5) * 1.4;
      }
    }

    if (progress < SCATTER_START_PROGRESS - 0.015 && scatterActiveRef.current) {
      scatterActiveRef.current = false;
      scatterStartTimeRef.current = 0;
    }

    if (scatterActiveRef.current) {
      const scatterSeconds = Math.max(0, elapsed - scatterStartTimeRef.current);
      const scatterProgress = Math.min(1, scatterSeconds / SCATTER_FADE_SECONDS);
      const fade = Math.max(0, 1 - scatterSeconds / SCATTER_FADE_SECONDS);

      material.uniforms.u_opacity.value = fade;

      for (let index = 0; index < data.count; index += 1) {
        const i3 = index * 3;
        positions[i3] = scatterBaseRef.current[i3] + scatterVelocitiesRef.current[i3] * scatterProgress;
        positions[i3 + 1] = scatterBaseRef.current[i3 + 1] + scatterVelocitiesRef.current[i3 + 1] * scatterProgress;
        positions[i3 + 2] = scatterBaseRef.current[i3 + 2] + scatterVelocitiesRef.current[i3 + 2] * scatterProgress;
      }
    } else {
      material.uniforms.u_opacity.value = 1;

      for (let index = 0; index < data.count; index += 1) {
        const i3 = index * 3;
        positions[i3] = THREE.MathUtils.lerp(currentPose[i3], nextPose[i3], localPhase);
        positions[i3 + 1] = THREE.MathUtils.lerp(currentPose[i3 + 1], nextPose[i3 + 1], localPhase);
        positions[i3 + 2] = THREE.MathUtils.lerp(currentPose[i3 + 2], nextPose[i3 + 2], localPhase);
      }
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

function StaticRunnerFallback() {
  const dots = Array.from({ length: 32 }, (_, index) => index);

  return (
    <section
      data-section="particle-runner"
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 20px',
        background: 'var(--bg-void)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 'min(520px, 86vw)',
          position: 'relative',
          borderTop: '1px solid var(--cyan-dim)',
          boxShadow: '0 0 18px var(--cyan-ghost)',
          paddingTop: 34,
        }}
      >
        <div
          className="hud-label"
          style={{
            color: 'var(--text-secondary)',
            marginBottom: 18,
          }}
        >
          TRANSITION VECTOR / STATIC MODE
        </div>
        <div
          style={{
            display: 'flex',
            gap: 5,
            justifyContent: 'center',
            alignItems: 'center',
            height: 56,
          }}
        >
          {dots.map((dot) => (
            <span
              key={dot}
              style={{
                width: dot % 5 === 0 ? 4 : 3,
                height: dot % 7 === 0 ? 18 : dot % 3 === 0 ? 28 : 10,
                borderRadius: 999,
                background: 'var(--cyan-pure)',
                opacity: 0.35 + (dot % 6) * 0.08,
                boxShadow: '0 0 10px var(--cyan-glow)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ParticleRunner(): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const fallback = useMotionFallback();

  useEffect(() => {
    if (fallback || !sectionRef.current) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: '+=100%',
      scrub: 1.5,
      pin: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
      onLeaveBack: () => {
        progressRef.current = 0;
      },
    });

    return () => {
      trigger.kill();
    };
  }, [fallback]);

  if (fallback) {
    return <StaticRunnerFallback />;
  }

  return (
    <section
      ref={sectionRef}
      data-section="particle-runner"
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-void)',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Canvas
          aria-hidden="true"
          camera={{ position: [0, 0, 4.2], fov: 45, near: 0.1, far: 80 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <RunnerPoints progressRef={progressRef} />
        </Canvas>
        <div
          className="hud-label"
          style={{
            position: 'absolute',
            left: 'clamp(20px, 4vw, 56px)',
            bottom: 'clamp(24px, 5vh, 56px)',
            color: 'var(--text-muted)',
            textShadow: '0 0 16px var(--cyan-ghost)',
            pointerEvents: 'none',
          }}
        >
          KINETIC BRIDGE / DOSSIER ACCESS
        </div>
      </div>
    </section>
  );
}
