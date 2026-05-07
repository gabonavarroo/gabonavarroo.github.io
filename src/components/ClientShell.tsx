'use client';

import dynamic from 'next/dynamic';

// ssr: false is only allowed inside Client Components in Next.js 15 App Router.
// All WebGL/canvas and DOM-interaction-only components live here.
const FBMBackground = dynamic(
  () => import('@/components/ui/FBMBackground').then((m) => m.FBMBackground),
  { ssr: false }
);

const CustomCursor = dynamic(
  () => import('@/components/ui/CustomCursor').then((m) => m.CustomCursor),
  { ssr: false }
);

const SpotifyMusicButton = dynamic(
  () => import('@/components/audio/SpotifyMusicButton').then((m) => m.SpotifyMusicButton),
  { ssr: false }
);

export function ClientShell() {
  return (
    <>
      <FBMBackground />
      <CustomCursor />
      <SpotifyMusicButton />
    </>
  );
}
