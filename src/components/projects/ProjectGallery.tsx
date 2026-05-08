'use client';
import { useRef, useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { PROJECTS } from '@/data/projects';
import { ProjectCard } from './ProjectCard';

export function ProjectGallery() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Synchronous mobile detection — avoids flash of wrong layout on client
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // GSAP horizontal pin — desktop only, re-run when isMobile changes
  useEffect(() => {
    if (isMobile) return;
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;

    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        duration: 1,
      });

      ScrollTrigger.create({
        trigger: outer,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        animation: tween,
        invalidateOnRefresh: true,
      });
    }, outer);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section data-section="projects" style={{ background: 'var(--bg-base)' }}>
      {/* Section header */}
      <div
        style={{
          padding: 'clamp(32px, 5vw, 64px) clamp(24px, 4vw, 48px) 24px',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <span
            className="hud-label"
            style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontSize: 10 }}
          >
            SECTION 04
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: 'clamp(24px, 4vw, 48px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            MISSION ARCHIVE
          </h2>
        </div>
        <span
          className="hud-label"
          style={{ color: 'var(--cyan-dim)', fontSize: 10 }}
        >
          {PROJECTS.length} OPERATIONS LOGGED
        </span>
      </div>

      {isMobile ? (
        /* ── Mobile: simple vertical stack ───────── */
        <div className="project-gallery-mobile">
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              total={PROJECTS.length}
              isMobile={true}
            />
          ))}
        </div>
      ) : (
        /* ── Desktop: horizontal scroll-jacked gallery */
        <div ref={outerRef} className="project-gallery-outer">
          <div ref={trackRef} className="project-gallery-track">
            {PROJECTS.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                total={PROJECTS.length}
                isMobile={false}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
