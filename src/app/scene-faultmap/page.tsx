'use client';

import dynamic from 'next/dynamic';

const FaultmapScene = dynamic(() => import('@/components/projects/scenes/FaultmapScene'), {
  ssr: false,
});

export default function FaultmapSceneHarness() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#05080f' }}>
      <FaultmapScene inView audioBass={0.35} />
      <style jsx global>{`
        .spotify-btn {
          display: none !important;
        }
      `}</style>
    </main>
  );
}
