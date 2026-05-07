import type { ReactNode } from 'react';

interface HUDFrameProps {
  children: ReactNode;
  label?: string;
  status?: 'ACTIVE' | 'STANDBY' | 'OFFLINE' | string;
  className?: string;
}

export function HUDFrame({ children, label, status, className = '' }: HUDFrameProps) {
  return (
    <div
      className={`hud-frame relative ${className}`}
      style={{
        border: '1px solid var(--border-med)',
        borderTop: '1px solid var(--cyan-dim)',
        background: 'var(--bg-surface)',
        padding: '24px',
      }}
    >
      {/* Top-left accent dot */}
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

      {/* Corner brackets */}
      <svg
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16 }}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M 0 16 L 0 0 L 16 0" stroke="var(--cyan-pure)" strokeWidth="1.5" />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16 }}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M 16 16 L 16 0 L 0 0" stroke="var(--cyan-pure)" strokeWidth="1.5" />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16 }}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M 0 0 L 0 16 L 16 16" stroke="var(--cyan-pure)" strokeWidth="1.5" />
      </svg>
      <svg
        aria-hidden
        style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16 }}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M 16 0 L 16 16 L 0 16" stroke="var(--cyan-pure)" strokeWidth="1.5" />
      </svg>

      {/* Header row */}
      {(label || status) && (
        <div
          className="hud-label"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            color: 'var(--text-secondary)',
          }}
        >
          {label && <span>{label}</span>}
          {status && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="status-dot" />
              <span style={{ color: 'var(--system-green)' }}>{status}</span>
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
