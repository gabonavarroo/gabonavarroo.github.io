'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { AboutPanel } from '@/components/about/AboutPanel';

// All R3F / browser-only components must be ssr:false in static export.
const AtomLoader = dynamic(
  () => import('@/components/loading/AtomLoader').then((m) => m.AtomLoader),
  { ssr: false }
);

const HeroScene = dynamic(
  () => import('@/components/hero/HeroScene').then((m) => m.HeroScene),
  { ssr: false }
);

const HeroText = dynamic(
  () => import('@/components/hero/HeroText').then((m) => m.HeroText),
  { ssr: false }
);

const HeroHUD = dynamic(
  () => import('@/components/hero/HeroHUD').then((m) => m.HeroHUD),
  { ssr: false }
);

const ParticleRunner = dynamic(
  () => import('@/components/transitions/ParticleRunner'),
  { ssr: false }
);

const SkillOrrery = dynamic(
  () => import('@/components/skills/SkillOrrery').then((m) => m.SkillOrrery),
  { ssr: false }
);

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  // Unmount HeroScene once the hero section leaves the viewport so it doesn't
  // bleed through the ParticleRunner section (which has its own opaque canvas).
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main data-section="root" className="relative z-10 min-h-screen">
      {/* Atom loader — fixed full-screen overlay, z-100. Unmounted after completion. */}
      {!loaderDone && (
        <AtomLoader onComplete={() => setLoaderDone(true)} />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        data-section="hero"
        style={{ position: 'relative', minHeight: '100vh' }}
      >
        {/*
         * HeroScene: position:fixed, z-index:1.
         * Unmounted via IntersectionObserver once the hero section leaves the viewport
         * so it doesn't bleed through the opaque ParticleRunner canvas beneath.
         */}
        {heroInView && <HeroScene style={{ zIndex: 1 }} />}

        {/* DOM layer — revealed after loader completes */}
        {loaderDone && (
          <>
            <HeroHUD />
            <HeroText />
          </>
        )}
      </section>

      {/* ── PARTICLE RUNNER TRANSITION ───────────────────────── */}
      <ParticleRunner />

      {/* ── ABOUT / DOSSIER ─────────────────────────────────── */}
      <AboutPanel />

      {/* ── SKILLS / ORBITAL INTERFACE ──────────────────────── */}
      <SkillOrrery />
    </main>
  );
}
