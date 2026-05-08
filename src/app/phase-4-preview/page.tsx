'use client';

import { useMemo } from 'react';
import CDASScene from '@/components/projects/scenes/CDASScene';
import InsuLinkScene from '@/components/projects/scenes/InsuLinkScene';
import PharmacyScene from '@/components/projects/scenes/PharmacyScene';
import WordleScene from '@/components/projects/scenes/WordleScene';

export default function Phase4Preview() {
  const scene = useMemo(() => {
    if (typeof window === 'undefined') return 'cdas';
    return new URLSearchParams(window.location.search).get('scene') ?? 'cdas';
  }, []);

  const SceneComponent =
    scene === 'insulink' ? InsuLinkScene : scene === 'wordle' ? WordleScene : scene === 'pharmacy' ? PharmacyScene : CDASScene;

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
