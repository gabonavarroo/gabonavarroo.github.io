'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '@/components/audio/AudioController';

const VERT = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = `
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
  float t = u_time * (0.045 + audioMid * 0.075);

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

function BackgroundPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { getAnalyzerData } = useAudio();

  useFrame(({ clock, size }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.u_time.value = clock.getElapsedTime();
    matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    matRef.current.uniforms.u_audio_mid.value = getAnalyzerData().mid;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          u_time: { value: 0 },
          u_audio_mid: { value: 0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
        }}
        depthWrite={false}
      />
    </mesh>
  );
}

export function FBMBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1]}
      >
        <BackgroundPlane />
      </Canvas>
    </div>
  );
}
