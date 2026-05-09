'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsap';
import { GlowButton } from '@/components/ui/GlowButton';
import type { Project } from '@/data/types';
import { PROJECT_DOSSIERS } from '@/data/projectDossiers';

interface ProjectDossierOverlayProps {
  project: Project;
  onClose: () => void;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span
      className="hud-label"
      style={{
        display: 'block',
        color: 'var(--cyan-dim)',
        fontSize: 9,
        letterSpacing: '0.18em',
        marginBottom: 10,
      }}
    >
      {label}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border-dim)', margin: '4px 0' }} />;
}

export function ProjectDossierOverlay({ project, onClose }: ProjectDossierOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dossier = PROJECT_DOSSIERS[project.sceneId] ?? null;

  // Slide in on mount
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(panel, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'expo.out' });
    });
    return () => ctx.revert();
  }, []);

  const close = () => {
    const panel = panelRef.current;
    if (!panel) { onClose(); return; }
    gsap.to(panel, { x: '100%', duration: 0.25, ease: 'expo.in', onComplete: onClose });
  };

  // ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const content = (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5,8,15,0.65)',
          zIndex: 80,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} dossier`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(640px, 100vw)',
          height: '100vh',
          background: 'var(--bg-raised)',
          borderLeft: '1px solid var(--border-med)',
          borderTop: '1px solid var(--cyan-dim)',
          zIndex: 81,
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transform: 'translateX(100%)',
        }}
      >
        {/* Corner accent */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -1,
            left: -1,
            width: 4,
            height: 4,
            background: 'var(--cyan-pure)',
            display: 'block',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              className="hud-label"
              style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}
            >
              {project.id}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: 'clamp(16px, 2.5vw, 26px)',
                fontWeight: 700,
                color: 'var(--cyan-pure)',
                margin: '8px 0 4px',
                letterSpacing: '0.04em',
              }}
            >
              {project.title}
            </h2>
            <span
              className="hud-label"
              style={{ color: 'var(--text-secondary)', fontSize: 10 }}
            >
              {project.codename}
            </span>
          </div>
          <button
            onClick={close}
            className="dossier-close-btn"
            aria-label="Close dossier"
            style={{
              background: 'none',
              border: '1px solid var(--border-med)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '6px 12px',
              letterSpacing: '0.1em',
              cursor: 'none',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            [ ESC ]
          </button>
        </div>

        <Divider />

        {/* Meta rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { label: 'ROLE',   value: project.role },
            { label: 'YEAR',   value: String(project.year) },
            { label: 'STATUS', value: 'ARCHIVED' },
          ] as Array<{ label: string; value: string }>).map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span
                className="hud-label"
                style={{ color: 'var(--text-muted)', minWidth: 72, fontSize: 10 }}
              >
                {label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <Divider />

        {dossier ? (
          <>
            {/* MISSION */}
            <div>
              <SectionLabel label="MISSION" />
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {dossier.mission}
              </p>
            </div>

            <Divider />

            {/* ARCHITECTURE */}
            <div>
              <SectionLabel label="ARCHITECTURE" />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dossier.architecture.map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--cyan-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 1, flexShrink: 0 }}>▸</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Divider />

            {/* CORE OPERATIONS */}
            <div>
              <SectionLabel label="CORE OPERATIONS" />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dossier.coreOperations.map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--system-green)', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 1, flexShrink: 0 }}>▸</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Divider />

            {/* METRICS */}
            <div>
              <SectionLabel label="METRICS" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dossier.metrics.map((m, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      padding: '4px 10px',
                      border: '1px solid var(--cyan-dim)',
                      color: 'var(--cyan-pure)',
                      letterSpacing: '0.05em',
                      background: 'rgba(0,212,255,0.04)',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <Divider />

            {/* TECHNICAL SIGNAL */}
            <div>
              <SectionLabel label="TECHNICAL SIGNAL" />
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.75,
                  margin: 0,
                  borderLeft: '2px solid var(--cyan-dim)',
                  paddingLeft: 12,
                  fontStyle: 'italic',
                }}
              >
                {dossier.technicalSignal}
              </p>
            </div>

            <Divider />
          </>
        ) : (
          /* Graceful fallback when no dossier entry exists */
          <>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {project.description}
            </p>
            <Divider />
          </>
        )}

        {/* Tech Stack */}
        <div>
          <SectionLabel label="TECH STACK" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {project.stack.map((tech) => (
              <span
                key={tech}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '4px 10px',
                  border: '1px solid var(--border-med)',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.08em',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8, flexWrap: 'wrap' }}>
          {project.github && (
            <GlowButton href={project.github} target="_blank" rel="noopener noreferrer">
              ↗ GITHUB
            </GlowButton>
          )}
          {project.live && (
            <GlowButton href={project.live} variant="secondary" target="_blank" rel="noopener noreferrer">
              ↗ LIVE DEMO
            </GlowButton>
          )}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
