import type { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

type ButtonProps = BaseProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = BaseProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;

type GlowButtonProps = ButtonProps | AnchorProps;

const styles = (variant: Variant) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 20px',
  border: variant === 'primary'
    ? '1px solid var(--cyan-pure)'
    : '1px solid var(--border-med)',
  color: variant === 'primary' ? 'var(--cyan-pure)' : 'var(--text-secondary)',
  background: variant === 'primary' ? 'var(--cyan-ghost)' : 'transparent',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  cursor: 'none',
  transition: 'box-shadow 0.18s, background 0.18s, color 0.18s',
});

const hoverClass = `
  .glow-btn-primary:hover {
    box-shadow: 0 0 8px var(--cyan-glow), 0 0 24px var(--cyan-ghost);
    background: var(--cyan-ghost);
    color: var(--cyan-pure);
  }
  .glow-btn-secondary:hover {
    border-color: var(--cyan-dim);
    color: var(--text-primary);
  }
`;

export function GlowButton({ children, variant = 'primary', className = '', href, ...rest }: GlowButtonProps) {
  const cls = `glow-btn-${variant} ${className}`;
  const s = styles(variant);

  if (href !== undefined) {
    return (
      <>
        <style>{hoverClass}</style>
        <a
          href={href}
          className={cls}
          style={s}
          data-cursor="lock"
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      </>
    );
  }

  return (
    <>
      <style>{hoverClass}</style>
      <button
        className={cls}
        style={s}
        data-cursor="lock"
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    </>
  );
}
