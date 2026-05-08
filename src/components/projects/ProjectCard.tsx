'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import type { Project } from '@/data/types';
import { GlowButton } from '@/components/ui/GlowButton';
import { SceneSkeleton } from './SceneSkeleton';
import { ProjectDossierOverlay } from './ProjectDossierOverlay';
import { getScene } from './scenes/sceneRegistry';

interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  isMobile: boolean;
}

export function ProjectCard({ project, index, total, isMobile }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);

  // IntersectionObserver — gate scene mount to visible cards only
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const SceneComponent = getScene(project.sceneId);
  const shouldMountScene = isInView && !isMobile && SceneComponent !== null;

  const idxLabel = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div
      ref={cardRef}
      className={`project-card${isMobile ? ' project-card--mobile' : ''}`}
      data-project-id={project.id}
    >
      {/* ── Scene / Poster ────────────────────────── */}
      <div className="project-scene">
        {shouldMountScene && SceneComponent ? (
          <Suspense fallback={<SceneSkeleton label="LOADING SCENE..." />}>
            <SceneComponent inView={isInView} />
          </Suspense>
        ) : !posterError ? (
          <img
            src={project.posterPath}
            alt={`${project.title} visualization`}
            className="project-poster"
            onError={() => setPosterError(true)}
          />
        ) : (
          <SceneSkeleton label={`${project.sceneId.toUpperCase()} // SCENE PENDING`} />
        )}

        {/* FUI counter overlay */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 16,
            left: 20,
            fontFamily: 'var(--font-orbitron)',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--cyan-dim)',
            letterSpacing: '0.15em',
            pointerEvents: 'none',
          }}
        >
          {idxLabel}
        </span>

        {/* Project codename — top right of scene */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          {project.codename}
        </span>
      </div>

      {/* ── Meta panel ───────────────────────────── */}
      <div className="project-meta">
        <span
          className="hud-label"
          style={{ color: 'var(--text-muted)', fontSize: 10 }}
        >
          {project.id}
        </span>

        <div>
          <h3
            style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: 'clamp(15px, 1.6vw, 22px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            {project.title}
          </h3>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {project.description}
        </p>

        {/* Tech stack chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {project.stack.map((tech) => (
            <span
              key={tech}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '2px 8px',
                border: '1px solid var(--border-dim)',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
          <GlowButton onClick={() => setDossierOpen(true)}>
            OPEN DOSSIER →
          </GlowButton>
          {project.github && (
            <GlowButton
              href={project.github}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ GH
            </GlowButton>
          )}
          {project.live && (
            <GlowButton
              href={project.live}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ LIVE
            </GlowButton>
          )}
        </div>
      </div>

      {/* Dossier overlay — rendered via portal to document.body */}
      {dossierOpen && (
        <ProjectDossierOverlay
          project={project}
          onClose={() => setDossierOpen(false)}
        />
      )}
    </div>
  );
}
