'use client';

import { useEffect, useRef } from 'react';
import { gsap, SplitText } from '@/lib/gsap';
import { OPERATOR } from '@/data/operator';
import { StatusDot } from '@/components/ui/StatusDot';
import { HUDFrame } from '@/components/ui/HUDFrame';
import { PhotoShader } from '@/components/about/PhotoShader';

const DOSSIER_ROWS: { label: string; value: string }[] = [
  { label: 'OPERATIVE', value: OPERATOR.role },
  { label: 'INSTITUTION', value: OPERATOR.institution },
  { label: 'BASE', value: OPERATOR.location },
  { label: 'CLEARANCE', value: OPERATOR.clearance },
  { label: 'LANGUAGES', value: OPERATOR.languages.join(' · ') },
];

function HUDCornerBrackets() {
  const s = 20;
  const c = 'var(--cyan-pure)';
  const w = 1.5;
  const vb = `0 0 ${s} ${s}`;
  return (
    <>
      <svg
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, width: s, height: s, pointerEvents: 'none', zIndex: 10 }}
        viewBox={vb}
        fill="none"
      >
        <path d={`M0 ${s} L0 0 L${s} 0`} stroke={c} strokeWidth={w} />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', top: 0, right: 0, width: s, height: s, pointerEvents: 'none', zIndex: 10 }}
        viewBox={vb}
        fill="none"
      >
        <path d={`M${s} ${s} L${s} 0 L0 0`} stroke={c} strokeWidth={w} />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', bottom: 0, left: 0, width: s, height: s, pointerEvents: 'none', zIndex: 10 }}
        viewBox={vb}
        fill="none"
      >
        <path d={`M0 0 L0 ${s} L${s} ${s}`} stroke={c} strokeWidth={w} />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', bottom: 0, right: 0, width: s, height: s, pointerEvents: 'none', zIndex: 10 }}
        viewBox={vb}
        fill="none"
      >
        <path d={`M${s} 0 L${s} ${s} L0 ${s}`} stroke={c} strokeWidth={w} />
      </svg>
    </>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  valueRef: (el: HTMLSpanElement | null) => void;
}

function DataRow({ label, value, valueRef }: DataRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '112px minmax(12px, 48px) 1fr',
        columnGap: 8,
        padding: '10px 0',
        borderBottom: '1px solid var(--border-dim)',
        alignItems: 'center',
      }}
    >
      <span
        className="hud-label"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span
        aria-hidden
        style={{
          height: 1,
          background:
            'repeating-linear-gradient(90deg, var(--text-muted) 0, var(--text-muted) 2px, transparent 2px, transparent 8px)',
          opacity: 0.35,
        }}
      />
      <span
        ref={valueRef}
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          textAlign: 'right',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function AboutPanel() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const rowValueRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Track SplitText instances so we can revert them before ctx.revert()
    // — prevents the "removeChild" React/GSAP DOM conflict on unmount/resize.
    const splitInstances: SplitText[] = [];
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // Corner brackets draw-in
      if (photoContainerRef.current) {
        const paths =
          photoContainerRef.current.querySelectorAll<SVGPathElement>('path');
        if (paths.length > 0) {
          gsap.from(paths, {
            strokeDasharray: 80,
            strokeDashoffset: 80,
            duration: 0.8,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: photoContainerRef.current,
              start: 'top 80%',
            },
          });
        }
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      rowValueRefs.current.forEach((el, i) => {
        if (!el) return;

        if (!isMobile) {
          // Desktop: SplitText char-by-char type-in
          const split = new SplitText(el, { type: 'chars' });
          splitInstances.push(split);
          tl.from(
            split.chars,
            { opacity: 0, duration: 0.06, stagger: 0.03, ease: 'none' },
            i * 0.3
          );
        } else {
          // Mobile: simple row fade (no SplitText DOM surgery)
          tl.from(
            el,
            { opacity: 0, y: 8, duration: 0.5, ease: 'expo.out' },
            i * 0.12
          );
        }
      });

      const bioDelay = isMobile
        ? DOSSIER_ROWS.length * 0.12 + 0.15
        : DOSSIER_ROWS.length * 0.3 + 0.2;

      if (bioRef.current) {
        tl.fromTo(
          bioRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' },
          bioDelay
        );
      }
    }, sectionRef);

    return () => {
      // Revert SplitText FIRST so React can reconcile unmounted DOM cleanly
      splitInstances.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="about"
      style={{
        background: 'var(--bg-base)',
        paddingTop: 128,
        paddingBottom: 128,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 32px',
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: 64 }}>
          <p
            className="hud-label"
            style={{ color: 'var(--cyan-dim)', marginBottom: 8 }}
          >
            SECTION_02.DOSSIER
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            ABOUT
          </h2>
        </div>

        {/* 40 / 60 split grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40fr 60fr',
            gap: '48px',
            alignItems: 'start',
          }}
          className="about-grid"
        >
          {/* ── LEFT: Photo + HUD brackets + status ── */}
          <div ref={photoContainerRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <PhotoShader style={{ height: 480 }} />
              <HUDCornerBrackets />
            </div>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <StatusDot label="STATUS: ACTIVE" />
            </div>
          </div>

          {/* ── RIGHT: Dossier panel ── */}
          <HUDFrame label="PERSONNEL.FILE: GN-2024" status="ACTIVE">
            <div>
              {DOSSIER_ROWS.map(({ label, value }, i) => (
                <DataRow
                  key={label}
                  label={label}
                  value={value}
                  valueRef={(el) => {
                    rowValueRefs.current[i] = el;
                  }}
                />
              ))}

              <div
                style={{
                  borderTop: '1px solid var(--border-dim)',
                  margin: '24px 0 12px',
                }}
              />

              <div
                className="hud-label"
                style={{ color: 'var(--text-secondary)', marginBottom: 12 }}
              >
                MISSION
              </div>

              <p
                ref={bioRef}
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineHeight: 1.9,
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {OPERATOR.bio}
              </p>
            </div>
          </HUDFrame>
        </div>
      </div>
    </section>
  );
}
