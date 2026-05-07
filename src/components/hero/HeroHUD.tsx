'use client';

import { useEffect, useState } from 'react';
import { HUDFrame } from '@/components/ui/HUDFrame';
import { StatusDot } from '@/components/ui/StatusDot';
import { useAudio } from '@/components/audio/AudioController';

function useLiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const yyyy = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
      setDate(`${yyyy}.${mo}.${dd}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, date };
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {muted ? (
        <>
          <path
            d="M11 5L6 9H2v6h4l5 4V5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path
            d="M11 5L6 9H2v6h4l5 4V5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.54 8.46a5 5 0 0 1 0 7.07"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M19.07 4.93a10 10 0 0 1 0 14.14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function MuteToggle() {
  const { isMuted, mute, unmute } = useAudio();

  return (
    <button
      type="button"
      onClick={isMuted ? unmute : mute}
      aria-label={isMuted ? 'Unmute boot SFX' : 'Mute boot SFX'}
      aria-pressed={!isMuted}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        padding: '4px 0',
        cursor: 'none',
        color: isMuted ? 'var(--text-muted)' : 'var(--cyan-pure)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        transition: 'color 180ms',
      }}
    >
      <SpeakerIcon muted={isMuted} />
      <span>{isMuted ? 'SFX: OFF' : 'SFX: ON'}</span>
    </button>
  );
}

export function HeroHUD() {
  const { time, date } = useLiveClock();

  return (
    <div
      data-section="hero-hud"
      style={{
        position: 'absolute',
        top: 'clamp(24px, 3vw, 40px)',
        right: 'clamp(24px, 3vw, 40px)',
        zIndex: 4,
        minWidth: 200,
      }}
    >
      <HUDFrame label="SYS.STATUS" status="ACTIVE">
        {/* Status row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            className="hud-label"
            style={{ color: 'var(--text-secondary)' }}
          >
            OPERATOR
          </span>
          <StatusDot label="ONLINE" />
        </div>

        {/* Live clock */}
        <div
          className="font-variant-tabular"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--cyan-pure)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            marginBottom: 6,
            textShadow: '0 0 16px var(--cyan-glow)',
          }}
        >
          {time || ' '}
        </div>

        {/* Date */}
        <div
          className="font-variant-tabular"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}
        >
          {date || ' '}
        </div>

        {/* Blinking cursor terminator */}
        <div
          className="cursor-blink hud-label"
          style={{
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          {'> '}
        </div>

        {/* Mute toggle */}
        <MuteToggle />
      </HUDFrame>
    </div>
  );
}
