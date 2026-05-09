'use client';

import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';

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

type LabelAlign = 'center' | 'left';

interface CanvasLabelProps {
  text: string;
  color: string;
  width?: number;
  height?: number;
  fontSize?: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  align?: LabelAlign;
  maxLines?: number;
  letterSpacing?: number;
}

function isUsableColor(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth || !line) {
      line = nextLine;
      return;
    }

    lines.push(line);
    line = word;
  });

  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    let last = visible[visible.length - 1];
    while (last.length > 0 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[visible.length - 1] = `${last.trimEnd()}...`;
    return visible;
  }

  return lines;
}

function createLabelTexture({
  text,
  color,
  width,
  height,
  fontSize,
  align,
  maxLines,
  letterSpacing,
}: Required<Pick<CanvasLabelProps, 'text' | 'color' | 'width' | 'height' | 'fontSize' | 'align' | 'maxLines' | 'letterSpacing'>>) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.font = `600 ${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  const paddedWidth = width - 32;
  const lines = wrapCanvasText(ctx, text, paddedWidth, maxLines);
  const lineHeight = fontSize * 1.22;
  const totalHeight = (lines.length - 1) * lineHeight;
  const x = align === 'center' ? width / 2 : 16;

  lines.forEach((line, index) => {
    const y = height / 2 - totalHeight / 2 + index * lineHeight;
    if (letterSpacing <= 0 || align !== 'center') {
      ctx.fillText(line, x, y);
      return;
    }

    const chars = line.split('');
    const textWidth = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0);
    const spacingWidth = (chars.length - 1) * letterSpacing;
    let cursor = width / 2 - (textWidth + spacingWidth) / 2;
    chars.forEach((char) => {
      ctx.fillText(char, cursor, y);
      cursor += ctx.measureText(char).width + letterSpacing;
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function CanvasLabel({
  text,
  color,
  width = 512,
  height = 128,
  fontSize = 48,
  position = [0, 0, 0],
  scale = [1, 0.25, 1],
  align = 'center',
  maxLines = 1,
  letterSpacing = 0,
}: CanvasLabelProps) {
  const texture = useMemo(
    () =>
      createLabelTexture({
        text,
        color,
        width,
        height,
        fontSize,
        align,
        maxLines,
        letterSpacing,
      }),
    [align, color, fontSize, height, letterSpacing, maxLines, text, width]
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [texture]
  );

  useEffect(() => {
    return () => {
      texture.dispose();
      material.dispose();
    };
  }, [material, texture]);

  return (
    <mesh position={position} scale={scale} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

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

function useStaticOrreryFallback() {
  const [staticFallback, setStaticFallback] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse), (max-width: 767px)');
    const update = () => setStaticFallback(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return staticFallback;
}

const FALLBACK_COLORS: SkillColorMap = {
  '--cyan-pure': '#00D4FF',
  '--cyan-dim': '#007A99',
  '--cyan-ghost': '#00D4FF18',
  '--bg-void': '#05080F',
  '--bg-surface': '#0D1520',
  '--border-dim': '#1A2840',
  '--text-primary': '#E2E8F0',
  '--text-secondary': '#8BA3C0',
  '--blue-electric': '#2288FF',
  '--system-green': '#00FF88',
  '--data-gold': '#FFCC44',
  '--bio-teal': '#00CCAA',
  cyanPure: '#00D4FF',
  cyanDim: '#007A99',
  cyanGhost: '#00D4FF18',
  bgVoid: '#05080F',
  bgSurface: '#0D1520',
  borderDim: '#1A2840',
  textPrimary: '#E2E8F0',
  textSecondary: '#8BA3C0',
};

function useSkillColors() {
  const [colors, setColors] = useState<SkillColorMap>(FALLBACK_COLORS);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const resolved: SkillColorMap = { ...FALLBACK_COLORS };

    TOKEN_NAMES.forEach((token) => {
      const cssValue = styles.getPropertyValue(token).trim();
      resolved[token] = isUsableColor(cssValue)
        ? cssValue
        : FALLBACK_COLORS[token] || FALLBACK_COLORS.cyanPure;
    });

    setColors({
      ...resolved,
      cyanPure: resolved['--cyan-pure'] || FALLBACK_COLORS.cyanPure,
      cyanDim: resolved['--cyan-dim'] || FALLBACK_COLORS.cyanDim,
      cyanGhost: resolved['--cyan-ghost'] || FALLBACK_COLORS.cyanGhost,
      bgVoid: resolved['--bg-void'] || FALLBACK_COLORS.bgVoid,
      bgSurface: resolved['--bg-surface'] || FALLBACK_COLORS.bgSurface,
      borderDim: resolved['--border-dim'] || FALLBACK_COLORS.borderDim,
      textPrimary: resolved['--text-primary'] || FALLBACK_COLORS.textPrimary,
      textSecondary: resolved['--text-secondary'] || FALLBACK_COLORS.textSecondary,
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
            <CanvasLabel
              text={skill.name.toUpperCase()}
              position={[0, -0.12, 0]}
              color={textColor}
              width={512}
              height={160}
              fontSize={40}
              scale={[0.72, 0.23, 1]}
              maxLines={2}
            />
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
      <CanvasLabel
        text={assignment.category.label.toUpperCase()}
        position={[0, 0.035, 0.101]}
        color={colors.textPrimary}
        width={768}
        height={168}
        fontSize={56}
        scale={[0.96, 0.21, 1]}
        maxLines={1}
      />
      <CanvasLabel
        text={`CORE:${assignment.category.skills.filter((skill) => skill.level === 'core').length}`}
        position={[0, -0.13, 0.101]}
        color={color}
        width={384}
        height={96}
        fontSize={36}
        scale={[0.46, 0.12, 1]}
        letterSpacing={2}
      />
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
        enableZoom={false}
        enableRotate={!reducedMotion}
        enableDamping
        dampingFactor={0.05}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE }}
        autoRotate={!focusedId && !reducedMotion}
        autoRotateSpeed={0.4}
      />

    </>
  );
}

function StaticSkillMatrix({ colors }: { colors: SkillColorMap }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 'clamp(96px, 14vh, 132px) clamp(24px, 7vw, 112px) 112px',
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(76vw, 620px)',
          aspectRatio: '1 / 1',
        }}
      >
        {[0, 1, 2, 3].map((ring) => (
          <div
            key={ring}
            style={{
              position: 'absolute',
              inset: `${8 + ring * 9}%`,
              border: `1px dashed ${ring % 2 === 0 ? colors.cyanDim : colors.borderDim}`,
              borderRadius: '50%',
              transform: `rotate(${ring * 18 - 14}deg) scaleY(${0.72 + ring * 0.04})`,
              opacity: 0.65,
              boxShadow: `0 0 ${8 + ring * 2}px ${colors.cyanGhost}`,
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 70,
            height: 70,
            marginLeft: -35,
            marginTop: -35,
            borderRadius: '50%',
            background: colors.cyanPure,
            boxShadow: `0 0 18px ${colors.cyanPure}, 0 0 56px ${colors.cyanGhost}`,
          }}
        />

        {SKILLS.map((skill, index) => {
          const angle = -Math.PI / 2 + (index / SKILLS.length) * Math.PI * 2;
          const radius = index === 4 ? 24 : 38;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius * 0.72;
          const color = colors[skill.colorToken] || colors.cyanPure;

          return (
            <div
              key={skill.id}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                minWidth: 118,
                padding: '8px 10px',
                border: `1px solid ${color}`,
                background: 'rgba(13, 21, 32, 0.86)',
                color: colors.textPrimary,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textAlign: 'center',
                textTransform: 'uppercase',
                boxShadow: `0 0 16px ${colors.cyanGhost}`,
              }}
            >
              {skill.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SkillOrrery({ className, style }: SkillOrreryProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const colors = useSkillColors();
  const reducedMotion = usePrefersReducedMotion();
  const staticFallback = useStaticOrreryFallback();
  const shouldUseStaticFallback = reducedMotion || staticFallback;

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
        height: '100vh',
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

      {shouldUseStaticFallback ? (
        <StaticSkillMatrix colors={colors} />
      ) : (
        <WebGLErrorBoundary>
          <div
            data-cursor="lock"
            style={{
              position: 'absolute',
              top: 'clamp(104px, 15vh, 138px)',
              left: 'clamp(32px, 8vw, 132px)',
              right: 'clamp(32px, 8vw, 132px)',
              bottom: 112,
              minHeight: 360,
              background: '#05080F',
              border: '1px solid var(--border-dim)',
              boxShadow: 'inset 0 0 34px rgba(0, 212, 255, 0.08), 0 0 28px rgba(0, 212, 255, 0.08)',
              overflow: 'hidden',
              overscrollBehavior: 'auto',
              touchAction: 'auto',
            }}
          >
            <Canvas
              aria-hidden="true"
              camera={{ position: [0, 1.1, 7.2], fov: 46, near: 0.1, far: 100 }}
              dpr={[1, 2]}
              frameloop="always"
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              onCreated={({ gl }) => { gl.setClearColor(0x05080f, 1); }}
              style={{ width: '100%', height: '100%' }}
            >
              <SkillScene colors={colors} reducedMotion={reducedMotion} />
            </Canvas>
          </div>
        </WebGLErrorBoundary>
      )}

      {/* Scroll zone — non-canvas strip so the user can scroll past the OrbitControls canvas */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid var(--border-dim)',
          pointerEvents: 'none',
        }}
      >
        <span
          className="hud-label"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.14em' }}
        >
          DRAG TO ORBIT · HOVER TO INSPECT · SCROLL TO CONTINUE ↓
        </span>
      </div>
    </section>
  );
}

export default SkillOrrery;
