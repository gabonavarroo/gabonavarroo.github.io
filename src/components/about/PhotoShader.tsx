'use client';

import type { CSSProperties } from 'react';

interface PhotoShaderProps {
  className?: string;
  style?: CSSProperties;
}

export function PhotoShader({ className, style }: PhotoShaderProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        overflow: 'hidden',
        background: 'var(--bg-void)',
        ...style,
      }}
    >
      {/* Desaturated + cyan-graded photo — CSS approach per DESIGN.md §2 */}
      <img
        src="/images/gabriel-photo.jpg"
        alt="Gabriel Navarro"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          filter:
            'grayscale(100%) sepia(20%) hue-rotate(155deg) saturate(1.8) brightness(0.88)',
        }}
      />

      {/* Cyan color-dodge overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(165deg, rgba(0,212,255,0.10) 0%, rgba(0,102,180,0.05) 100%)',
          mixBlendMode: 'color-dodge',
          pointerEvents: 'none',
        }}
      />

      {/* Animated horizontal scan lines — matches DESIGN.md §2 */}
      <div
        aria-hidden
        className="photo-scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 1px, transparent 1px, transparent 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Radial vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(5,8,15,0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
