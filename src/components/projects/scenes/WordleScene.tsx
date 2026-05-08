'use client';

import { Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import { WORDLE_OPTIMAL_PATH, WORDLE_TREE_EDGES, WORDLE_TREE_NODES, type WordleTreeNode } from '@/data/wordleTree';
import type { SceneProps } from './types';

const CYAN = new THREE.Color('#00D4FF');
const GOLD = new THREE.Color('#FFCC44');
const RED = new THREE.Color('#FF3333');
const BLUE = new THREE.Color('#2288FF');
const MUTED = new THREE.Color('#4A6080');
const ROOT = new THREE.Color('#E2E8F0');
const TREE_SCALE_X = 1.08;
const TREE_SCALE_Y = 1.0;
const TREE_SCALE_Z = 0.82;

interface DecisionNode {
  node: WordleTreeNode;
  position: THREE.Vector3;
  scatter: THREE.Vector3;
  phase: number;
}

interface DecisionPacket {
  source: THREE.Vector3;
  target: THREE.Vector3;
  phase: number;
  kept: boolean;
}

function toVector(node: WordleTreeNode): THREE.Vector3 {
  return new THREE.Vector3(
    node.position[0] * TREE_SCALE_X,
    node.position[1] * TREE_SCALE_Y,
    node.position[2] * TREE_SCALE_Z
  );
}

function createNodeMap(): Map<string, WordleTreeNode> {
  return new Map(WORDLE_TREE_NODES.map((node) => [node.id, node]));
}

function createDecisionNodes(): DecisionNode[] {
  return WORDLE_TREE_NODES.map((node, index) => {
    const position = toVector(node);
    const fromRoot = position.clone().sub(new THREE.Vector3(-2.8, 0, 0));
    const fallback = new THREE.Vector3(Math.cos(index), Math.sin(index * 1.7), Math.sin(index * 0.7));
    const scatter = fromRoot.lengthSq() > 0.001 ? fromRoot.normalize() : fallback.normalize();
    scatter.multiplyScalar(0.18 + node.depth * 0.22 + (index % 5) * 0.035);

    return {
      node,
      position,
      scatter,
      phase: ((index * 0.137) % 1) + node.depth * 0.11,
    };
  });
}

function createEdgeGeometry(nodeMap: Map<string, WordleTreeNode>, mode: 'kept' | 'pruned'): THREE.BufferGeometry {
  const vertices: number[] = [];

  WORDLE_TREE_EDGES.forEach((edge) => {
    const isKept = edge.kept && !edge.pruned;
    if ((mode === 'kept' && !isKept) || (mode === 'pruned' && isKept)) return;

    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;

    const sourceVector = toVector(source);
    const targetVector = toVector(target);
    vertices.push(sourceVector.x, sourceVector.y, sourceVector.z, targetVector.x, targetVector.y, targetVector.z);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createPrunedFragmentGeometry(nodes: DecisionNode[]): THREE.BufferGeometry {
  const vertices: number[] = [];

  nodes
    .filter(({ node }) => node.pruned)
    .forEach(({ position, scatter }, index) => {
      const size = 0.045 + (index % 4) * 0.014;
      const zLift = 0.18 + (index % 5) * 0.025;
      const base = position.clone().add(scatter.clone().multiplyScalar(1.45));
      vertices.push(
        base.x - size,
        base.y,
        base.z + zLift,
        base.x + size,
        base.y + size * 0.42,
        base.z + zLift,
        base.x,
        base.y - size,
        base.z + zLift * 0.8,
        base.x + size * 0.75,
        base.y + size,
        base.z + zLift * 0.95
      );
    });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createDecisionPackets(nodeMap: Map<string, WordleTreeNode>): DecisionPacket[] {
  return WORDLE_TREE_EDGES.filter((edge) => edge.kept).flatMap((edge, index) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return [];

    return [
      {
        source: toVector(source),
        target: toVector(target),
        phase: index * 0.17,
        kept: true,
      },
    ];
  });
}

function createEntropyBars(): { position: THREE.Vector3; score: number; color: THREE.Color }[] {
  return WORDLE_OPTIMAL_PATH.flatMap((id) => {
    const node = WORDLE_TREE_NODES.find((candidate) => candidate.id === id);
    if (!node || typeof node.score !== 'number') return [];
    return [
      {
        position: toVector(node).add(new THREE.Vector3(0.0, -0.16, 0.04)),
        score: node.score,
        color: node.depth === 0 ? GOLD : CYAN,
      },
    ];
  });
}

function CameraRig(): null {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6.4);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function WordleSceneContent({ inView, audioBass = 0 }: SceneProps): ReactElement {
  const rigRef = useRef<THREE.Group>(null);
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const packetMeshRef = useRef<THREE.InstancedMesh>(null);
  const entropyMeshRef = useRef<THREE.InstancedMesh>(null);
  const keptEdgeRef = useRef<THREE.LineSegments>(null);
  const prunedEdgeRef = useRef<THREE.LineSegments>(null);
  const fragmentRef = useRef<THREE.LineSegments>(null);
  const nodeMap = useMemo(createNodeMap, []);
  const decisionNodes = useMemo(createDecisionNodes, []);
  const packets = useMemo(() => createDecisionPackets(nodeMap), [nodeMap]);
  const entropyBars = useMemo(createEntropyBars, []);
  const keptEdgeGeometry = useMemo(() => createEdgeGeometry(nodeMap, 'kept'), [nodeMap]);
  const prunedEdgeGeometry = useMemo(() => createEdgeGeometry(nodeMap, 'pruned'), [nodeMap]);
  const fragmentGeometry = useMemo(() => createPrunedFragmentGeometry(decisionNodes), [decisionNodes]);
  const nodeGeometry = useMemo(() => new THREE.OctahedronGeometry(0.055, 1), []);
  const packetGeometry = useMemo(() => new THREE.SphereGeometry(0.028, 10, 8), []);
  const entropyGeometry = useMemo(() => new THREE.BoxGeometry(0.04, 0.12, 0.022), []);
  const nodeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const packetMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const entropyMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const keptEdgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const prunedEdgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: MUTED,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const fragmentMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: RED,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (nodeMeshRef.current) {
      decisionNodes.forEach(({ node, position, scatter }, index) => {
        const prunedOffset = node.pruned ? scatter.clone().multiplyScalar(0.6) : new THREE.Vector3();
        const startPosition = position.clone().add(prunedOffset);
        const scale = node.depth === 0 ? 2.05 : node.kept ? 1.36 : 0.74;
        matrix.compose(startPosition, quaternion, new THREE.Vector3(scale, scale, scale));
        nodeMeshRef.current?.setMatrixAt(index, matrix);
        if (node.depth === 0) color.copy(ROOT);
        else if (node.kept) color.copy(CYAN).lerp(GOLD, node.depth * 0.18);
        else color.copy(MUTED).lerp(RED, node.depth * 0.1);
        nodeMeshRef.current?.setColorAt(index, color);
      });
      nodeMeshRef.current.instanceMatrix.needsUpdate = true;
      if (nodeMeshRef.current.instanceColor) nodeMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (entropyMeshRef.current) {
      entropyBars.forEach((bar, index) => {
        const height = Math.max(0.24, bar.score / 7.92);
        matrix.compose(
          bar.position,
          quaternion,
          new THREE.Vector3(1 + nodeMap.size * 0, height * 2.8, 1)
        );
        entropyMeshRef.current?.setMatrixAt(index, matrix);
        entropyMeshRef.current?.setColorAt(index, bar.color);
      });
      entropyMeshRef.current.instanceMatrix.needsUpdate = true;
      if (entropyMeshRef.current.instanceColor) entropyMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [color, decisionNodes, entropyBars, matrix, nodeMap.size, quaternion]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const active = inView ? 1 : 0.14;
    const bass = Math.min(1, Math.max(0, audioBass));
    const pruneWave = 0.5 + 0.5 * Math.sin(t * 0.74);
    const glowPulse = 0.5 + 0.5 * Math.sin(t * 2.1);

    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(t * 0.12) * 0.1;
      rigRef.current.rotation.z = Math.sin(t * 0.09) * 0.016;
      rigRef.current.position.y = Math.sin(t * 0.18) * 0.018;
    }

    if (nodeMeshRef.current) {
      decisionNodes.forEach(({ node, position, scatter, phase }, index) => {
        const depthDelay = node.depth * 0.17 + phase * 0.08;
        const wave = THREE.MathUtils.smoothstep(pruneWave + 0.2, depthDelay, depthDelay + 0.34);
        const pulse = 0.5 + 0.5 * Math.sin(t * (node.kept ? 3.4 : 1.4) + phase * Math.PI * 2);
        tempVector.copy(position);
        if (node.pruned) tempVector.add(scatter.clone().multiplyScalar(0.74 + wave * 1.28));
        tempVector.z += node.kept ? pulse * 0.08 : wave * 0.12;

        const baseScale = node.depth === 0 ? 2.05 : node.kept ? 1.32 : 0.56;
        const pulseScale = node.kept ? pulse * 0.32 + bass * 0.14 : (1 - wave) * 0.18;
        const scale = baseScale + pulseScale;
        matrix.compose(tempVector, quaternion, new THREE.Vector3(scale, scale, scale));
        nodeMeshRef.current?.setMatrixAt(index, matrix);
      });
      nodeMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (packetMeshRef.current) {
      packets.forEach((packet, index) => {
        const progress = (t * 0.32 + packet.phase) % 1;
        const eased = progress < 0.5 ? progress * progress * 2 : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        tempVector.lerpVectors(packet.source, packet.target, eased);
        tempVector.z += Math.sin(progress * Math.PI) * 0.12;
        const scale = 0.74 + Math.sin(progress * Math.PI) * 1.35 + bass * 0.18;
        matrix.compose(tempVector, quaternion, new THREE.Vector3(scale, scale, scale));
        packetMeshRef.current?.setMatrixAt(index, matrix);
      });
      packetMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (entropyMeshRef.current) {
      entropyBars.forEach((bar, index) => {
        const fill = Math.max(0.24, bar.score / 7.92);
        const scale = fill * (2.3 + glowPulse * 0.34 + bass * 0.16);
        matrix.compose(bar.position, quaternion, new THREE.Vector3(1, scale, 1));
        entropyMeshRef.current?.setMatrixAt(index, matrix);
      });
      entropyMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    keptEdgeMaterial.opacity = (0.58 + glowPulse * 0.34 + bass * 0.08) * active;
    prunedEdgeMaterial.opacity = (0.08 + (1 - pruneWave) * 0.12) * active;
    fragmentMaterial.opacity = (0.12 + pruneWave * 0.34) * active;
    if (keptEdgeRef.current) keptEdgeRef.current.scale.setScalar(1 + glowPulse * 0.015);
    if (fragmentRef.current) fragmentRef.current.rotation.z = Math.sin(t * 0.2) * 0.018;
  });

  useEffect(() => {
    return () => {
      keptEdgeGeometry.dispose();
      prunedEdgeGeometry.dispose();
      fragmentGeometry.dispose();
      nodeGeometry.dispose();
      packetGeometry.dispose();
      entropyGeometry.dispose();
      nodeMaterial.dispose();
      packetMaterial.dispose();
      entropyMaterial.dispose();
      keptEdgeMaterial.dispose();
      prunedEdgeMaterial.dispose();
      fragmentMaterial.dispose();
    };
  }, [
    entropyGeometry,
    entropyMaterial,
    fragmentGeometry,
    fragmentMaterial,
    keptEdgeGeometry,
    keptEdgeMaterial,
    nodeGeometry,
    nodeMaterial,
    packetGeometry,
    packetMaterial,
    prunedEdgeGeometry,
    prunedEdgeMaterial,
  ]);

  const slate = WORDLE_TREE_NODES[0];
  const selected = WORDLE_OPTIMAL_PATH.map((id) => WORDLE_TREE_NODES.find((node) => node.id === id)).filter(
    (node): node is WordleTreeNode => Boolean(node)
  );

  return (
    <>
      <CameraRig />
      <group ref={rigRef} rotation={[-0.18, 0.02, 0]}>
        <lineSegments ref={prunedEdgeRef} geometry={prunedEdgeGeometry} material={prunedEdgeMaterial} />
        <lineSegments ref={keptEdgeRef} geometry={keptEdgeGeometry} material={keptEdgeMaterial} />
        <lineSegments ref={fragmentRef} geometry={fragmentGeometry} material={fragmentMaterial} />
        <instancedMesh ref={nodeMeshRef} args={[nodeGeometry, nodeMaterial, decisionNodes.length]} frustumCulled={false} />
        <instancedMesh ref={packetMeshRef} args={[packetGeometry, packetMaterial, packets.length]} frustumCulled={false} />
        <instancedMesh ref={entropyMeshRef} args={[entropyGeometry, entropyMaterial, entropyBars.length]} frustumCulled={false} />
        <Text
          position={[-3.12, 1.98, 0.34]}
          fontSize={0.095}
          color="#FFCC44"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.92}
        >
          ENTROPY-OPTIMAL | BRANCHING FACTOR: 2.3 | RANK: #1
        </Text>
        <Text
          position={[-3.02, -2.03, 0.3]}
          fontSize={0.067}
          color="#00D4FF"
          anchorX="left"
          anchorY="middle"
          material-transparent
          material-opacity={0.82}
        >
          PRUNING WAVE ACTIVE | {WORDLE_TREE_NODES.length} STATES COLLAPSING TO {WORDLE_OPTIMAL_PATH.length} MOVES
        </Text>
        <Text
          position={toVector(slate).add(new THREE.Vector3(-0.12, 0.26, 0.24))}
          fontSize={0.086}
          color="#E2E8F0"
          anchorX="center"
          anchorY="middle"
          material-transparent
          material-opacity={0.88}
        >
          SLATE 7.92
        </Text>
        {selected.slice(1).map((node) => (
          <Text
            key={node.id}
            position={toVector(node).add(new THREE.Vector3(0.0, 0.18, 0.2))}
            fontSize={0.06}
            color={node.depth === 3 ? '#FFCC44' : '#00D4FF'}
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={0.8}
          >
            {node.label} {typeof node.score === 'number' ? node.score.toFixed(2) : ''}
          </Text>
        ))}
      </group>
    </>
  );
}

function WordleScene({ inView, audioBass = 0 }: SceneProps): ReactElement {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05080F' }}>
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={['#05080F']} />
        <WordleSceneContent inView={inView} audioBass={audioBass} />
      </Canvas>
    </div>
  );
}

export { WordleSceneContent };
export { WordleScene };
export default WordleScene;
