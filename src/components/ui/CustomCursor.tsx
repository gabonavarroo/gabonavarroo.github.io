'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const xToOuter = gsap.quickTo(outer, 'x', { duration: 0.15, ease: 'power3.out' });
    const yToOuter = gsap.quickTo(outer, 'y', { duration: 0.15, ease: 'power3.out' });
    const xToInner = gsap.quickTo(inner, 'x', { duration: 0.05, ease: 'power3.out' });
    const yToInner = gsap.quickTo(inner, 'y', { duration: 0.05, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      xToOuter(e.clientX);
      yToOuter(e.clientY);
      xToInner(e.clientX);
      yToInner(e.clientY);
    };

    const onEnterInteractive = (e: Event) => {
      const target = e.target as HTMLElement;
      const mode = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      outer.classList.toggle('cursor-lock', mode === 'lock');
      outer.classList.toggle('cursor-text', mode === 'text');
    };

    const onLeaveInteractive = () => {
      outer.classList.remove('cursor-lock', 'cursor-text');
    };

    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', onEnterInteractive);
      el.addEventListener('mouseleave', onLeaveInteractive);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <>
      <div
        ref={outerRef}
        className="cursor-outer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 20,
          height: 20,
          marginLeft: -10,
          marginTop: -10,
          borderRadius: '50%',
          border: '1px solid var(--cyan-pure)',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-100px, -100px)',
          transition: 'width 0.15s var(--ease-expo), height 0.15s var(--ease-expo), opacity 0.15s, margin 0.15s',
        }}
      />
      <div
        ref={innerRef}
        className="cursor-inner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          borderRadius: '50%',
          background: 'var(--cyan-pure)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-100px, -100px)',
        }}
      />
      <style>{`
        .cursor-outer.cursor-lock {
          width: 36px;
          height: 36px;
          margin-left: -18px;
          margin-top: -18px;
          opacity: 1;
          box-shadow: 0 0 8px var(--cyan-glow), 0 0 16px var(--cyan-ghost);
        }
        .cursor-outer.cursor-text {
          width: 12px;
          height: 12px;
          margin-left: -6px;
          margin-top: -6px;
        }
        @media (pointer: coarse) {
          .cursor-outer, .cursor-inner { display: none; }
        }
      `}</style>
    </>
  );
}
