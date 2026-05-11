'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EXPERIENCE } from '@/data/experience';
import type { ExperienceEntry } from '@/data/types';
import { HUDFrame } from '@/components/ui/HUDFrame';

gsap.registerPlugin(ScrollTrigger);

const TYPE_ICONS: Record<ExperienceEntry['type'], string> = {
  work: '◈',
  award: '★',
  event: '◉',
};

const TYPE_COLORS: Record<ExperienceEntry['type'], string> = {
  work: 'var(--cyan-pure)',
  award: 'var(--system-green)',
  event: 'var(--alert-amber, #FFB830)',
};

function EntryCard({
  entry,
  side,
  index,
}: {
  entry: ExperienceEntry;
  side: 'left' | 'right';
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          clipPath: side === 'left' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
          opacity: 0,
        },
        {
          clipPath: 'inset(0 0% 0 0%)',
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
          },
          delay: index * 0.08,
        }
      );
    }, el);
    return () => ctx.revert();
  }, [side, index]);

  const iconColor = TYPE_COLORS[entry.type];

  return (
    <div
      ref={cardRef}
      className="mission-entry-card"
      style={{
        gridColumn: side === 'left' ? '1' : '3',
        gridRow: String(index + 1),
        padding: '20px 24px',
        border: '1px solid var(--border-dim)',
        background: 'linear-gradient(135deg, rgba(5,8,15,0.95), rgba(10,20,40,0.85))',
        position: 'relative',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Corner brackets */}
      <span
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: 12,
          height: 12,
          borderTop: `1px solid ${iconColor}`,
          borderLeft: `1px solid ${iconColor}`,
          opacity: 0.8,
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          width: 12,
          height: 12,
          borderBottom: `1px solid ${iconColor}`,
          borderRight: `1px solid ${iconColor}`,
          opacity: 0.8,
        }}
      />

      {/* Quarter tag */}
      <p
        className="hud-label"
        style={{
          color: iconColor,
          fontSize: '10px',
          marginBottom: 6,
          letterSpacing: '0.15em',
        }}
      >
        {TYPE_ICONS[entry.type]} {entry.quarter} · {entry.location}
      </p>

      {/* Org + Role */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-dim, #4A6480)',
          marginBottom: 2,
          letterSpacing: '0.08em',
        }}
      >
        {entry.org}
      </p>
      <h3
        style={{
          fontFamily: 'var(--font-orbitron)',
          fontSize: 'clamp(13px, 1.4vw, 16px)',
          fontWeight: 700,
          color: 'var(--cyan-bright, #7EE8FF)',
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        {entry.role}
      </h3>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: 'var(--border-dim)',
          marginBottom: 10,
        }}
      />

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.65,
          marginBottom: 12,
        }}
      >
        {entry.description}
      </p>

      {/* Tech tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entry.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 8px',
              border: `1px solid ${iconColor}40`,
              color: iconColor,
              letterSpacing: '0.06em',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MissionLog() {
  const sectionRef = useRef<HTMLElement>(null);
  const spineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const spine = spineRef.current;
    if (!spine) return;

    const ctx = gsap.context(() => {
      // Animated data-packet dash flow
      gsap.to(spine, {
        strokeDashoffset: -200,
        duration: 2.5,
        ease: 'none',
        repeat: -1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="experience"
      style={{
        position: 'relative',
        padding: 'clamp(64px, 10vw, 128px) clamp(20px, 5vw, 80px)',
        background: 'var(--bg-void)',
        borderTop: '1px solid var(--border-dim)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,255,0.04), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Section header */}
      <div style={{ marginBottom: 64, maxWidth: '100%' }}>
        <HUDFrame label="SECTION.05 — MISSION LOG" status="ACTIVE">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}
          >
            CLASSIFIED FIELD OPERATIONS · CHRONOLOGICAL ORDER
          </p>
        </HUDFrame>
      </div>

      {/* Timeline layout */}
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        {/* SVG spine — desktop only */}
        <svg
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            height: '100%',
            width: 2,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
          preserveAspectRatio="none"
        >
          {/* Static glowing spine */}
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="100%"
            stroke="var(--border-dim)"
            strokeWidth="1"
          />
          {/* Animated data-packet overlay */}
          <line
            ref={spineRef}
            x1="1"
            y1="0"
            x2="1"
            y2="100%"
            stroke="var(--cyan-pure)"
            strokeWidth="1.5"
            strokeDasharray="6 18"
            strokeDashoffset="0"
            opacity="0.7"
            style={{ filter: 'drop-shadow(0 0 3px var(--cyan-pure))' }}
          />
        </svg>

        {/* Desktop grid */}
        <div
          className="mission-log-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 64px 1fr',
            gap: '48px 0',
            alignItems: 'start',
          }}
        >
          {EXPERIENCE.map((entry, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <EntryCard key={entry.id} entry={entry} side={side} index={i} />
            );
          })}
        </div>

        {/* Mobile single-column (overrides grid via CSS) */}
      </div>
    </section>
  );
}
