'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '@/components/audio/AudioController';

interface AudioBands {
  bass: number;
  mid: number;
  high: number;
}

interface HeroSceneProps {
  className?: string;
  style?: CSSProperties;
  debugAudio?: Partial<AudioBands>;
}

const PARTICLE_COUNT = 3000;
const REPEL_RADIUS = 1.5;
const REPEL_STRENGTH = 0.78;

const FBM_VERT = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FBM_FRAG = `
precision highp float;

uniform float u_time;
uniform float u_audio_mid;
uniform vec2 u_resolution;

varying vec2 v_uv;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  mat2 warp = rotate2d(0.47);

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    p = warp * p + vec2(8.31, 2.73);
    amplitude *= 0.5;
    frequency *= 2.08;
  }

  return value;
}

void main() {
  vec2 safeResolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / safeResolution;
  vec2 p = (gl_FragCoord.xy * 2.0 - safeResolution) / min(safeResolution.x, safeResolution.y);

  float audioMid = clamp(u_audio_mid, 0.0, 1.0);
  float t = u_time * (0.052 + audioMid * 0.105);

  vec2 drift = vec2(t, t * 0.72);
  float q = fbm(p * 1.45 + drift);
  float r = fbm(p * 2.15 + vec2(q * 1.35 + t * 0.6, q * 0.9 - t * 0.38));
  float f = fbm(p * 2.7 + vec2(r + t, q - t * 0.42));

  float nebula = smoothstep(0.18, 0.94, f * 1.16);
  float core = smoothstep(0.38, 1.0, q * r * 1.85);

  vec3 bgVoid = vec3(0.0196, 0.0314, 0.0588);
  vec3 bgBase = vec3(0.0314, 0.0471, 0.0784);
  vec3 bgSurface = vec3(0.0510, 0.0824, 0.1255);
  vec3 cyanPure = vec3(0.0, 0.8314, 1.0);

  vec3 col = mix(bgVoid, bgBase, 0.55 + 0.45 * nebula);
  col = mix(col, bgSurface, core * 0.5);

  float trace = smoothstep(0.58, 0.64, f) * (1.0 - smoothstep(0.78, 0.92, f));
  float filament = 1.0 - smoothstep(0.0, 0.08, abs(f - r) - 0.015);
  col += cyanPure * (trace * 0.065 + filament * 0.045) * (0.75 + audioMid * 0.6);

  vec2 vignetteUv = uv - 0.5;
  vignetteUv.x *= safeResolution.x / safeResolution.y;
  float vignette = 1.0 - smoothstep(0.16, 1.18, dot(vignetteUv, vignetteUv));
  col *= 0.58 + 0.42 * vignette;

  gl_FragColor = vec4(col, 1.0);
}
`;

const POINT_VERT = `
precision highp float;

attribute float a_seed;

uniform float u_time;
uniform float u_bass;
uniform float u_high;
uniform float u_pixel_ratio;

varying float v_seed;
varying float v_intensity;

void main() {
  v_seed = a_seed;
  v_intensity = 0.62 + u_high * 0.85 + sin(u_time * 1.3 + a_seed * 6.28318) * 0.08;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float perspective = clamp(4.8 / max(1.0, -mvPosition.z), 0.7, 2.4);
  float size = (2.0 + a_seed * 2.6) * (1.0 + u_bass * 1.35) * u_pixel_ratio * perspective;

  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const POINT_FRAG = `
precision highp float;

uniform float u_high;

varying float v_seed;
varying float v_intensity;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float dist = length(p);
  float core = smoothstep(0.22, 0.0, dist);
  float halo = smoothstep(0.5, 0.0, dist) * 0.34;
  float alpha = (core + halo) * v_intensity;

  if (alpha < 0.02) discard;

  vec3 cyan = vec3(0.0, 0.8314, 1.0);
  vec3 pale = vec3(0.72, 0.95, 1.0);
  vec3 color = mix(cyan, pale, core * 0.48 + u_high * 0.18 + v_seed * 0.08);

  gl_FragColor = vec4(color, alpha);
}
`;

function createParticleData() {
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const i3 = index * 3;
    const angle = index * 2.399963 + Math.sin(index * 0.017) * 0.8;
    const shell = Math.sqrt((index + 0.5) / PARTICLE_COUNT);
    const noise = Math.sin(index * 12.9898) * Math.cos(index * 78.233);
    const radius = 0.35 + shell * 2.45 + noise * 0.18;
    const verticalSquash = 0.64 + Math.sin(index * 0.011) * 0.08;
    const z = (Math.sin(index * 0.073) * 0.75 + noise * 0.4) * (0.42 + shell * 0.22);

    basePositions[i3] = Math.cos(angle) * radius;
    basePositions[i3 + 1] = Math.sin(angle) * radius * verticalSquash;
    basePositions[i3 + 2] = z;

    currentPositions[i3] = basePositions[i3];
    currentPositions[i3 + 1] = basePositions[i3 + 1];
    currentPositions[i3 + 2] = basePositions[i3 + 2];

    seeds[index] = Math.abs(noise % 1);
  }

  return { basePositions, currentPositions, seeds };
}

function mergeAudioBands(live: AudioBands, debugAudio?: Partial<AudioBands>): AudioBands {
  return {
    bass: debugAudio?.bass ?? live.bass,
    mid: debugAudio?.mid ?? live.mid,
    high: debugAudio?.high ?? live.high,
  };
}

function FBMPlane({ audioRef }: { audioRef: MutableRefObject<AudioBands> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FBM_VERT,
        fragmentShader: FBM_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_audio_mid: { value: 0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
        },
        depthWrite: false,
        depthTest: false,
      }),
    []
  );

  useFrame(({ clock, size }) => {
    material.uniforms.u_time.value = clock.elapsedTime;
    material.uniforms.u_audio_mid.value = audioRef.current.mid;
    material.uniforms.u_resolution.value.set(size.width, size.height);
  });

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <primitive attach="material" object={material} />
    </mesh>
  );
}

function ParticleCloud({ debugAudio }: { debugAudio?: Partial<AudioBands> }) {
  const audio = useAudio();
  const mousePointRef = useRef<THREE.Vector3 | null>(null);
  const pointerActiveRef = useRef(false);
  const intersectionRef = useRef(new THREE.Vector3());
  const audioRef = useRef<AudioBands>({ bass: 0, mid: 0, high: 0 });
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const { camera, pointer, raycaster, viewport } = useThree();
  const { basePositions, currentPositions, seeds } = useMemo(createParticleData, []);
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    nextGeometry.setAttribute('a_seed', new THREE.BufferAttribute(seeds, 1));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [currentPositions, seeds]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_bass: { value: 0 },
          u_high: { value: 0 },
          u_pixel_ratio: { value: 1 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const markPointerActive = () => {
      pointerActiveRef.current = true;
    };
    const markPointerInactive = () => {
      pointerActiveRef.current = false;
      mousePointRef.current = null;
    };

    window.addEventListener('pointermove', markPointerActive, { passive: true });
    window.addEventListener('blur', markPointerInactive);
    document.addEventListener('mouseleave', markPointerInactive);

    return () => {
      window.removeEventListener('pointermove', markPointerActive);
      window.removeEventListener('blur', markPointerInactive);
      document.removeEventListener('mouseleave', markPointerInactive);
    };
  }, []);

  useFrame(({ clock }) => {
    const liveAudio = audio.getAnalyzerData();
    const bands = mergeAudioBands(liveAudio, debugAudio);
    audioRef.current = bands;

    material.uniforms.u_time.value = clock.elapsedTime;
    material.uniforms.u_bass.value = bands.bass;
    material.uniforms.u_high.value = bands.high;
    material.uniforms.u_pixel_ratio.value = Math.min(window.devicePixelRatio || 1, 2);

    if (pointerActiveRef.current) {
      raycaster.setFromCamera(pointer, camera);
      mousePointRef.current = raycaster.ray.intersectPlane(plane, intersectionRef.current)
        ? intersectionRef.current
        : null;
    }

    if (prefersReducedMotion) return;

    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const spread = 1 + bands.bass * 2.5;
    const highLift = 1 + bands.high * 0.32;
    const mouse = mousePointRef.current;
    const aspectBias = Math.max(1, viewport.width / Math.max(viewport.height, 0.001));

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const i3 = index * 3;
      const baseX = basePositions[i3] * spread;
      const baseY = basePositions[i3 + 1] * (0.96 + bands.bass * 0.35);
      const baseZ = basePositions[i3 + 2] * highLift;
      let targetX = baseX;
      let targetY = baseY;
      let targetZ = baseZ;

      if (mouse) {
        const dx = baseX - mouse.x * aspectBias;
        const dy = baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < REPEL_RADIUS) {
          const force = (1 - distance / REPEL_RADIUS) ** 2 * REPEL_STRENGTH;
          const invDistance = distance > 0.0001 ? 1 / distance : 1;
          targetX += dx * invDistance * force;
          targetY += dy * invDistance * force;
          targetZ += force * 0.28;
        }
      }

      const spring = 0.075 + bands.high * 0.035;
      currentPositions[i3] += (targetX - currentPositions[i3]) * spring;
      currentPositions[i3 + 1] += (targetY - currentPositions[i3 + 1]) * spring;
      currentPositions[i3 + 2] += (targetZ - currentPositions[i3 + 2]) * spring;
    }

    position.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <>
      <FBMPlane audioRef={audioRef} />
      <points geometry={geometry} material={material} frustumCulled={false} />
    </>
  );
}

export function HeroScene({ className, style, debugAudio }: HeroSceneProps) {
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'auto',
        ...style,
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 52, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <ParticleCloud debugAudio={debugAudio} />
      </Canvas>
    </div>
  );
}
