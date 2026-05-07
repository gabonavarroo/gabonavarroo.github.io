'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap, SplitText } from '@/lib/gsap';
import { OPERATOR } from '@/data/operator';

function useTypewriter(text: string, active: boolean, speed = 45) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active || !text) return;
    let i = 0;
    setDisplayed('');
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);

  return displayed;
}

export function HeroText() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const dividerTopRef = useRef<HTMLDivElement>(null);
  const dividerBotRef = useRef<HTMLDivElement>(null);
  const [typewriterActive, setTypewriterActive] = useState(false);
  const displayed = useTypewriter(OPERATOR.role, typewriterActive);
  const [firstName, lastName] = OPERATOR.name.split(' ');

  useEffect(() => {
    const name = nameRef.current;
    const divTop = dividerTopRef.current;
    const divBot = dividerBotRef.current;
    if (!name || !divTop || !divBot) return;

    let split: InstanceType<typeof SplitText> | null = null;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline();
      let revealTarget: Element[] | HTMLHeadingElement = name;

      try {
        split = new SplitText(name, { type: 'chars' });
        if (split.chars.length > 0) {
          revealTarget = split.chars;
        }
      } catch {
        split = null;
      }

      timeline
        .fromTo(
          revealTarget,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: Array.isArray(revealTarget) ? 0.04 : 0,
            duration: 0.6,
            ease: 'expo.out',
            onComplete: () => setTypewriterActive(true),
          }
        )
        .fromTo(
          divTop,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'expo.inOut' },
          '-=0.2'
        )
        .fromTo(
          divBot,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'expo.inOut' },
          '-=0.5'
        );
    }, nameRef);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div
      data-section="hero-text"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'clamp(24px, 5vw, 80px)',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      {/* Top divider */}
      <div
        ref={dividerTopRef}
        aria-hidden
        style={{
          width: 'clamp(200px, 40vw, 480px)',
          height: 1,
          background:
            'linear-gradient(90deg, transparent 0%, var(--cyan-dim) 50%, transparent 100%)',
          marginBottom: 28,
          clipPath: 'inset(0 100% 0 0)',
        }}
      />

      {/* Name */}
      <h1
        ref={nameRef}
        style={{
          fontFamily: 'var(--font-orbitron)',
          fontWeight: 900,
          fontSize: 'clamp(48px, 8vw, 96px)',
          color: 'var(--text-primary)',
          lineHeight: 1.08,
          letterSpacing: 0,
          margin: '0 0 20px',
          textShadow: '0 0 60px var(--cyan-ghost)',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'block' }}>{firstName}</span>
        <span style={{ display: 'block' }}>{lastName}</span>
      </h1>

      {/* Role — typewriter */}
      <p
        className="cursor-blink"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
          height: '1.6em',
          margin: '0 0 28px',
          minWidth: '1ch',
        }}
      >
        {displayed}
      </p>

      {/* Bottom divider */}
      <div
        ref={dividerBotRef}
        aria-hidden
        style={{
          width: 'clamp(200px, 40vw, 480px)',
          height: 1,
          background:
            'linear-gradient(90deg, transparent 0%, var(--cyan-dim) 50%, transparent 100%)',
          marginBottom: 56,
          clipPath: 'inset(0 100% 0 0)',
        }}
      />

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 5vh, 56px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        <span>[ SCROLL TO INITIALIZE ]</span>
        <span
          aria-hidden
          className="hero-chevron"
          style={{ color: 'var(--cyan-dim)', fontSize: 16 }}
        >
          ▾
        </span>
      </div>
    </div>
  );
}
