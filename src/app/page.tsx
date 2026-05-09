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

function SkillOrreryLoading() {
  return (
    <section
      data-section="skills"
      style={{
        position: 'relative',
        height: '100vh',
        background: 'var(--bg-void)',
        borderTop: '1px solid var(--border-dim)',
        borderBottom: '1px solid var(--border-dim)',
        overflow: 'hidden',
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
        <p className="hud-label" style={{ color: 'var(--cyan-pure)', margin: '0 0 10px' }}>
          SKILL MATRIX LOADING
        </p>
        <div style={{ height: 2, width: '100%', background: 'var(--border-dim)', overflow: 'hidden' }}>
          <div
            style={{
              width: '42%',
              height: '100%',
              background: 'var(--cyan-pure)',
              boxShadow: '0 0 12px var(--cyan-glow)',
            }}
          />
        </div>
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 'clamp(104px, 15vh, 138px) clamp(32px, 8vw, 132px) 112px',
          border: '1px solid var(--border-dim)',
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: '50%',
            background: 'var(--cyan-pure)',
            boxShadow: '0 0 22px var(--cyan-pure), 0 0 70px var(--cyan-ghost)',
          }}
        />
      </div>
    </section>
  );
}

const SkillOrrery = dynamic(
  () => import('@/components/skills/SkillOrrery').then((m) => m.SkillOrrery),
  { ssr: false, loading: () => <SkillOrreryLoading /> }
);

const ProjectGallery = dynamic(
  () => import('@/components/projects/ProjectGallery').then((m) => m.ProjectGallery),
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

      {/* ── PROJECTS / MISSION ARCHIVE ──────────────────────── */}
      <ProjectGallery />
    </main>
  );
}
