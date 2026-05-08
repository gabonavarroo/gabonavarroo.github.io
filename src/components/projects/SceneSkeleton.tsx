interface SceneSkeletonProps {
  label?: string;
}

export function SceneSkeleton({ label }: SceneSkeletonProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid var(--cyan-dim)',
          borderTopColor: 'var(--cyan-pure)',
          animation: 'scene-skeleton-spin 1.4s linear infinite',
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
