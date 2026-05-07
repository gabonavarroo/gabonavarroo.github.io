interface StatusDotProps {
  color?: string;
  label?: string;
}

export function StatusDot({ color = 'var(--system-green)', label }: StatusDotProps) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      aria-label={label}
    >
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }}
      />
      {label && (
        <span
          className="hud-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
