'use client';

import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { gsap } from '@/lib/gsap';
import { SKILLS } from '@/data/skills';
import type { SkillCategory, SkillItem } from '@/data/types';

export const ORBIT_RADII = [1.5, 2.2, 2.9, 3.6, 4.7, 5.4, 6.2] as const;

export const ORBIT_INCLINATIONS = [
  0.1,
  -0.25,
  0.4,
  -0.55,
  0.72,
  -0.88,
  1.08,
] as const;

export const ORBIT_ROTATIONS: readonly [number, number, number][] = [
  [0.1, 0.0, 0.04],
  [-0.25, 0.72, -0.08],
  [0.4, -0.95, 0.12],
  [-0.55, 1.48, -0.16],
  [0.72, -1.85, 0.2],
  [-0.88, 2.25, -0.24],
  [1.08, -2.65, 0.28],
] as const;

const ORBIT_ASPECT_RATIOS = [0.72, 0.78, 0.68, 0.82, 0.74, 0.7, 0.76] as const;

type PodRingIndex = 0 | 1 | 2 | 3;

type SkillColorMap = Record<string, string> & {
  cyanPure: string;
  cyanDim: string;
  cyanGhost: string;
  bgVoid: string;
  bgSurface: string;
  borderDim: string;
  textPrimary: string;
  textSecondary: string;
};

interface SkillOrreryProps {
  className?: string;
  style?: CSSProperties;
}

interface OrbitAssignment {
  category: SkillCategory;
  ringIndex: PodRingIndex;
  baseTheta: number;
  speed: number;
  innerScale: number;
}

const TOKEN_NAMES = [
  '--cyan-pure',
  '--cyan-dim',
  '--cyan-ghost',
  '--bg-void',
  '--bg-surface',
  '--border-dim',
  '--text-primary',
  '--text-secondary',
  ...SKILLS.map((skill) => skill.colorToken),
] as const;

const tmpVector = new THREE.Vector3();

export function getPodPosition(
  ringIndex: PodRingIndex,
  theta: number
): [number, number, number] {
  const radius = ORBIT_RADII[ringIndex];
  const aspect = ORBIT_ASPECT_RATIOS[ringIndex];

  const semiMajor = radius;
  const semiMinor = radius * aspect;

  const localX = semiMajor * Math.cos(theta);
  const localY = 0;
  const localZ = semiMinor * Math.sin(theta);

  const [rotX, rotY, rotZ] = ORBIT_ROTATIONS[ringIndex];

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);

  const x1 = localX;
  const y1 = localY * cosX - localZ * sinX;
  const z1 = localY * sinX + localZ * cosX;

  const x2 = x1 * cosY + z1 * sinY;
  const y2 = y1;
  const z2 = -x1 * sinY + z1 * cosY;

  const x3 = x2 * cosZ - y2 * sinZ;
  const y3 = x2 * sinZ + y2 * cosZ;
  const z3 = z2;

  return [x3, y3, z3];
}

function scalePosition(position: [number, number, number], scale: number): [number, number, number] {
  return [position[0] * scale, position[1] * scale, position[2] * scale];
}

interface BoundaryState { hasError: boolean }

class WebGLErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };
  static getDerivedStateFromError(): BoundaryState { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="hud-label" style={{ color: 'var(--cyan-dim)' }}>ORBITAL RENDER UNAVAILABLE — GPU OFFLINE</p>
        </div>
      );
    }
    return this.props.children;
  }
}

class BloomBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };
  static getDerivedStateFromError(): BoundaryState { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return prefersReducedMotion;
}

function useSkillColors() {
  const [colors, setColors] = useState<SkillColorMap | null>(null);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const resolved: Record<string, string> = {};

    TOKEN_NAMES.forEach((token) => {
      resolved[token] = styles.getPropertyValue(token).trim();
    });

    setColors({
      ...resolved,
      cyanPure: resolved['--cyan-pure'],
      cyanDim: resolved['--cyan-dim'],
      cyanGhost: resolved['--cyan-ghost'],
      bgVoid: resolved['--bg-void'],
      bgSurface: resolved['--bg-surface'],
      borderDim: resolved['--border-dim'],
      textPrimary: resolved['--text-primary'],
      textSecondary: resolved['--text-secondary'],
    });
  }, []);

  return colors;
}

function createOrbitAssignments(): OrbitAssignment[] {
  return SKILLS.map((category, index) => {
    const ringIndex = Math.min(index, 3) as PodRingIndex;
    return {
      category,
      ringIndex,
      baseTheta: index * 1.34 + 0.42,
      speed: 0.12 + index * 0.025,
      innerScale: index === 4 ? 0.62 : 1,
    };
  });
}

function OrbitRing({
  ringIndex,
  color,
}: {
  ringIndex: PodRingIndex;
  color: string;
}) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segmentCount = 96;

    for (let segment = 0; segment < segmentCount; segment += 1) {
      if (segment % 3 === 2) continue;
      const t0 = (segment / segmentCount) * Math.PI * 2;
      const t1 = ((segment + 0.55) / segmentCount) * Math.PI * 2;
      points.push(
        new THREE.Vector3(...getPodPosition(ringIndex, t0)),
        new THREE.Vector3(...getPodPosition(ringIndex, t1))
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [ringIndex]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
      }),
    [color]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <lineSegments geometry={geometry} material={material} />;
}

function CoreSphere({
  color,
  reducedMotion,
}: {
  color: string;
  reducedMotion: boolean;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.6,
        roughness: 0.22,
        metalness: 0.28,
      }),
    [color]
  );

  useFrame((_, delta) => {
    if (!coreRef.current || reducedMotion) return;
    coreRef.current.rotation.y += delta * 0.32;
    coreRef.current.rotation.x += delta * 0.08;
  });

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return (
    <group>
      <mesh ref={coreRef} material={material}>
        <sphereGeometry args={[0.58, 48, 32]} />
      </mesh>
      <mesh scale={1.2}>
        <sphereGeometry args={[0.58, 48, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function TechNodeCluster({
  skills,
  color,
  textColor,
}: {
  skills: SkillItem[];
  color: string;
  textColor: string;
}) {
  const visibleSkills = skills.slice(0, 5);

  return (
    <group>
      {visibleSkills.map((skill, index) => {
        const angle = (index / visibleSkills.length) * Math.PI * 2;
        const radius = 0.72;
        const y = Math.sin(angle) * 0.38;
        const x = Math.cos(angle) * radius;
        const z = 0.32 + Math.sin(angle * 1.7) * 0.16;

        return (
          <group key={skill.name} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.045, 16, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.6}
                roughness={0.35}
              />
            </mesh>
            <Text
              position={[0, -0.12, 0]}
              fontSize={0.07}
              anchorX="center"
              anchorY="middle"
              color={textColor}
              maxWidth={0.72}
              textAlign="center"
            >
              {skill.name.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SkillPod({
  assignment,
  color,
  colors,
  focusedId,
  reducedMotion,
  onFocus,
  onBlur,
}: {
  assignment: OrbitAssignment;
  color: string;
  colors: SkillColorMap;
  focusedId: string | null;
  reducedMotion: boolean;
  onFocus: (id: string, position: THREE.Vector3) => void;
  onBlur: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const techRef = useRef<THREE.Group>(null);
  const revealRef = useRef(0);
  const positionRef = useRef(new THREE.Vector3());
  const isFocused = focusedId === assignment.category.id;

  const podMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.bgSurface,
        emissive: color,
        emissiveIntensity: 0.42,
        roughness: 0.28,
        metalness: 0.48,
        transparent: true,
        opacity: 0.92,
      }),
    [color, colors.bgSurface]
  );

  const borderMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.42,
        wireframe: true,
      }),
    [color]
  );

  useFrame(({ camera, clock }, delta) => {
    const group = groupRef.current;
    const techGroup = techRef.current;
    if (!group) return;

    const elapsed = reducedMotion ? 0 : clock.elapsedTime;
    const theta = assignment.baseTheta + elapsed * assignment.speed;
    const nextPosition = scalePosition(
      getPodPosition(assignment.ringIndex, theta),
      assignment.innerScale
    );

    positionRef.current.set(...nextPosition);
    group.position.lerp(positionRef.current, reducedMotion ? 1 : 0.12);
    group.lookAt(camera.position);

    const targetScale = isFocused ? 1.34 : 1;
    group.scale.lerp(tmpVector.setScalar(targetScale), reducedMotion ? 1 : 1 - Math.pow(0.001, delta));

    revealRef.current += ((isFocused ? 1 : 0) - revealRef.current) * (reducedMotion ? 1 : 0.18);
    if (techGroup) {
      const reveal = Math.max(0.001, revealRef.current);
      techGroup.visible = revealRef.current > 0.025;
      techGroup.scale.setScalar(reveal);
      techGroup.position.z = 0.12 + revealRef.current * 0.12;
    }
  });

  useEffect(() => {
    return () => {
      podMaterial.dispose();
      borderMaterial.dispose();
    };
  }, [borderMaterial, podMaterial]);

  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onFocus(assignment.category.id, positionRef.current);
  };

  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onBlur(assignment.category.id);
  };

  return (
    <group
      ref={groupRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      data-skill-pod={assignment.category.id}
    >
      <RoundedBox args={[1.12, 0.42, 0.16]} radius={0.05} smoothness={5} material={podMaterial} />
      <RoundedBox args={[1.2, 0.5, 0.18]} radius={0.055} smoothness={5} material={borderMaterial} />
      <Text
        position={[0, 0.035, 0.101]}
        fontSize={0.115}
        anchorX="center"
        anchorY="middle"
        color={colors.textPrimary}
        maxWidth={0.92}
        textAlign="center"
      >
        {assignment.category.label.toUpperCase()}
      </Text>
      <Text
        position={[0, -0.13, 0.101]}
        fontSize={0.055}
        anchorX="center"
        anchorY="middle"
        color={color}
        letterSpacing={0.08}
      >
        {`CORE:${assignment.category.skills.filter((skill) => skill.level === 'core').length}`}
      </Text>
      <group ref={techRef} visible={false}>
        <TechNodeCluster
          skills={assignment.category.skills}
          color={color}
          textColor={colors.textSecondary}
        />
      </group>
    </group>
  );
}

function SkillScene({
  colors,
  reducedMotion,
}: {
  colors: SkillColorMap;
  reducedMotion: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const focusRef = useRef<THREE.Vector3 | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const assignments = useMemo(createOrbitAssignments, []);

  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const target = focusRef.current ?? tmpVector.set(0, 0, 0);
    controls.target.lerp(target, reducedMotion ? 1 : 0.08);

    if (focusRef.current) {
      const desiredCamera = tmpVector.copy(focusRef.current).add(new THREE.Vector3(0.9, 0.45, 4.2));
      camera.position.lerp(desiredCamera, reducedMotion ? 1 : 0.035);
    }

    controls.update();
  });

  const handleFocus = (id: string, position: THREE.Vector3) => {
    focusRef.current = position.clone();
    setFocusedId(id);
  };

  const handleBlur = (id: string) => {
    setFocusedId((current) => (current === id ? null : current));
    focusRef.current = null;
  };

  return (
    <>
      <color attach="background" args={[colors.bgVoid]} />
      <fog attach="fog" args={[colors.bgVoid, 8, 13]} />
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 0, 2.8]} intensity={3.2} color={colors.cyanPure} />
      <pointLight position={[-4, 3, 5]} intensity={1.4} color={colors.cyanDim} />

      <CoreSphere color={colors.cyanPure} reducedMotion={reducedMotion} />

      {[0, 1, 2, 3].map((ringIndex) => (
        <OrbitRing
          key={ringIndex}
          ringIndex={ringIndex as PodRingIndex}
          color={ringIndex % 2 === 0 ? colors.cyanDim : colors.borderDim}
        />
      ))}

      {assignments.map((assignment) => (
        <SkillPod
          key={assignment.category.id}
          assignment={assignment}
          color={colors[assignment.category.colorToken] || colors.cyanPure}
          colors={colors}
          focusedId={focusedId}
          reducedMotion={reducedMotion}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={4.8}
        maxDistance={9.5}
        autoRotate={!focusedId && !reducedMotion}
        autoRotateSpeed={0.4}
      />

      <BloomBoundary>
        <EffectComposer>
          <Bloom intensity={1.4} luminanceThreshold={0.2} luminanceSmoothing={0.12} />
        </EffectComposer>
      </BloomBoundary>
    </>
  );
}

export function SkillOrrery({ className, style }: SkillOrreryProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const colors = useSkillColors();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: reducedMotion ? 0.01 : 1.2,
          ease: 'expo.out',
          transformOrigin: 'left center',
        }
      );
    }, progressRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      data-section="skills"
      className={className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg-void)',
        borderTop: '1px solid var(--border-dim)',
        borderBottom: '1px solid var(--border-dim)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 45%, var(--cyan-ghost), transparent 34%), linear-gradient(180deg, rgba(5, 8, 15, 0.2), var(--bg-void))',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          zIndex: 2,
          width: 'min(360px, calc(100vw - 64px))',
        }}
      >
        <p
          className="hud-label"
          style={{ color: 'var(--cyan-pure)', margin: '0 0 10px' }}
        >
          SKILL MATRIX LOADED
        </p>
        <div
          style={{
            height: 2,
            width: '100%',
            background: 'var(--border-dim)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={progressRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--cyan-pure)',
              boxShadow: '0 0 12px var(--cyan-glow)',
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>

      <WebGLErrorBoundary>
        <Canvas
          aria-hidden="true"
          camera={{ position: [0, 1.1, 7.2], fov: 46, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {colors && <SkillScene colors={colors} reducedMotion={reducedMotion} />}
        </Canvas>
      </WebGLErrorBoundary>
    </section>
  );
}

export default SkillOrrery;
