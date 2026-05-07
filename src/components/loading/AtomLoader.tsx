'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from '@/lib/gsap';
import { useAudio } from '@/components/audio/AudioController';

interface AtomLoaderProps {
  onComplete: () => void;
}

interface RingSpec {
  radius: number;
  nodes: number;
  speed: number;
  rotation: [number, number, number];
}

const RINGS: RingSpec[] = [
  { radius: 0.8, nodes: 8, speed: 0.8, rotation: [0.0, 0.0, 0.0] },
  { radius: 1.35, nodes: 10, speed: 0.5, rotation: [0.74, 0.0, 0.24] },
  { radius: 2.0, nodes: 12, speed: 0.3, rotation: [-0.48, 0.5, -0.15] },
];

function createDashedRingGeometry(radius: number): THREE.BufferGeometry {
  const dashCount = 72;
  const dashFill = 0.54;
  const segmentsPerDash = 3;
  const vertices: number[] = [];

  for (let dash = 0; dash < dashCount; dash += 1) {
    const start = (dash / dashCount) * Math.PI * 2;
    const end = ((dash + dashFill) / dashCount) * Math.PI * 2;

    for (let segment = 0; segment < segmentsPerDash; segment += 1) {
      const a0 = THREE.MathUtils.lerp(start, end, segment / segmentsPerDash);
      const a1 = THREE.MathUtils.lerp(start, end, (segment + 1) / segmentsPerDash);
      vertices.push(
        Math.cos(a0) * radius,
        Math.sin(a0) * radius,
        0,
        Math.cos(a1) * radius,
        Math.sin(a1) * radius,
        0
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function CoreOrb({ opacityRef }: { opacityRef: RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.08, 24, 12), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00D4FF',
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 5) * 0.08;
    groupRef.current?.scale.setScalar(pulse);
    if (materialRef.current) {
      materialRef.current.opacity = opacityRef.current;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material}>
        <primitive attach="material" object={material} ref={materialRef} />
      </mesh>
    </group>
  );
}

function OrbitPath({ radius, speed, opacityRef }: { radius: number; speed: number; opacityRef: RefObject<number> }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const geometry = useMemo(() => createDashedRingGeometry(radius), [radius]);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#00D4FF',
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (lineRef.current) {
      lineRef.current.rotation.z = clock.elapsedTime * speed * 0.16;
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.6 * opacityRef.current;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}

function OrbitNodes({
  radius,
  count,
  speed,
  opacityRef,
}: {
  radius: number;
  count: number;
  speed: number;
  opacityRef: RefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.04, 16, 8), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00D4FF',
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.elapsedTime * speed;
    for (let index = 0; index < count; index += 1) {
      const angle = t + (index / count) * Math.PI * 2;
      const pulse = 1 + Math.sin(clock.elapsedTime * 3 + index * 0.8) * 0.14;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.95 * opacityRef.current;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]}>
      <primitive attach="material" object={material} ref={materialRef} />
    </instancedMesh>
  );
}

function AtomRing({
  spec,
  opacityRef,
  registerRef,
}: {
  spec: RingSpec;
  opacityRef: RefObject<number>;
  registerRef: (node: THREE.Group | null) => void;
}) {
  return (
    <group ref={registerRef} rotation={spec.rotation}>
      <OrbitPath radius={spec.radius} speed={spec.speed} opacityRef={opacityRef} />
      <OrbitNodes radius={spec.radius} count={spec.nodes} speed={spec.speed} opacityRef={opacityRef} />
    </group>
  );
}

function AtomScene({
  overlayRef,
  onComplete,
}: {
  overlayRef: RefObject<HTMLDivElement | null>;
  onComplete: () => void;
}) {
  const sceneRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group | null>(null);
  const ringRefs = useRef<Array<THREE.Group | null>>([]);
  const opacityRef = useRef(1);
  const completeRef = useRef(onComplete);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useFrame(({ clock }) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.32) * 0.08;
      sceneRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.23) * 0.05;
    }
  });

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    perspectiveCamera.position.set(0, 0, 4);
    perspectiveCamera.lookAt(0, 0, 0);
    opacityRef.current = 1;

    const context = gsap.context(() => {
      const scene = sceneRef.current;
      const core = coreRef.current;
      const rings = ringRefs.current.filter((ring): ring is THREE.Group => ring !== null);
      const overlay = overlayRef.current;
      if (!scene || !core || rings.length !== RINGS.length || !overlay) return;

      gsap.set(overlay, { opacity: 1 });
      gsap.set(scene.scale, { x: 1, y: 1, z: 1 });
      gsap.set(core.scale, { x: 0, y: 0, z: 0 });
      rings.forEach((ring) => gsap.set(ring.scale, { x: 0, y: 0, z: 0 }));

      const timeline = gsap.timeline({
        defaults: { overwrite: true },
        onComplete: () => completeRef.current(),
      });

      timeline
        .to(core.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'expo.out' }, 0)
        .to(core.scale, { x: 1.42, y: 1.42, z: 1.42, duration: 0.24, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.24)
        .to(perspectiveCamera.position, { z: 0.8, duration: 1.2, ease: 'expo.in' }, 2.4)
        .to(scene.scale, { x: 8, y: 8, z: 8, duration: 1.2, ease: 'expo.in' }, 2.4)
        .to(opacityRef, { current: 0, duration: 1.0, ease: 'power2.in' }, 2.58)
        .to(overlay, { opacity: 0, duration: 1.0, ease: 'power2.in' }, 2.58);

      rings.forEach((ring, index) => {
        timeline.to(ring.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'expo.out' }, 0.48 + index * 0.2);
      });
    }, sceneRef);

    return () => context.revert();
  }, [camera, overlayRef]);

  return (
    <group ref={sceneRef}>
      <group ref={coreRef}>
        <CoreOrb opacityRef={opacityRef} />
      </group>
      {RINGS.map((spec, index) => (
        <AtomRing
          key={spec.radius}
          spec={spec}
          opacityRef={opacityRef}
          registerRef={(node) => {
            ringRefs.current[index] = node;
          }}
        />
      ))}
    </group>
  );
}

export function AtomLoader({ onComplete }: AtomLoaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const audio = useAudio();

  useEffect(() => {
    const unlockAudio = () => audio.play();
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, [audio]);

  return (
    <div
      ref={overlayRef}
      onPointerDown={() => audio.play()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'auto',
        background:
          'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.08), rgba(5, 8, 15, 0.18) 32%, rgba(5, 8, 15, 1) 78%), var(--bg-void)',
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 72, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <AtomScene overlayRef={overlayRef} onComplete={onComplete} />
      </Canvas>
    </div>
  );
}
