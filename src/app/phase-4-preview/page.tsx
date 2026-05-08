'use client';

import { useEffect, useState } from 'react';
import CDASScene from '@/components/projects/scenes/CDASScene';
import CrashesScene from '@/components/projects/scenes/CrashesScene';
import GeneticScene from '@/components/projects/scenes/GeneticScene';
import InsuLinkScene from '@/components/projects/scenes/InsuLinkScene';
import OptionsScene from '@/components/projects/scenes/OptionsScene';
import PharmacyScene from '@/components/projects/scenes/PharmacyScene';
import PipelineScene from '@/components/projects/scenes/PipelineScene';
import WordleScene from '@/components/projects/scenes/WordleScene';

export default function Phase4Preview() {
  const [scene, setScene] = useState('cdas');

  useEffect(() => {
    setScene(new URLSearchParams(window.location.search).get('scene') ?? 'cdas');
  }, []);

  const SceneComponent =
    scene === 'crashes'
      ? CrashesScene
      : scene === 'insulink'
        ? InsuLinkScene
        : scene === 'wordle'
          ? WordleScene
          : scene === 'pharmacy'
            ? PharmacyScene
            : scene === 'pipeline'
              ? PipelineScene
              : scene === 'options'
        ? OptionsScene
                : scene === 'genetic'
                  ? GeneticScene
                  : CDASScene;

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 2,
        width: '100vw',
        height: '100vh',
        margin: 0,
        overflow: 'hidden',
        background: '#05080F',
      }}
    >
      <style jsx global>{`
        .spotify-btn,
        .cursor-outer,
        .cursor-inner {
          display: none !important;
        }
      `}</style>
      <SceneComponent inView audioBass={0.42} />
    </main>
  );
}
