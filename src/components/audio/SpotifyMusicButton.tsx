'use client';

/**
 * SpotifyMusicButton — HUD-styled bottom-right launcher for the Spotify embed.
 *
 * States:
 *   idle    → "PLAY THE CLASH" — click loads Spotify API + starts playback
 *   loading → "UPLINK…" — waiting for iFrame API to initialize
 *   playing → "PAUSE SIGNAL" — click pauses
 *   paused  → "PLAY THE CLASH" — click resumes
 *   error   → "SPOTIFY UPLINK FAILED" — fallback link to open track
 *
 * Accessibility: button element, aria-pressed, keyboard-focusable, focus ring.
 * Static-export safe.
 */

import { useState, useCallback, useRef } from 'react';
import { SpotifyEmbedController } from './SpotifyEmbedController';
import { useAudio } from './AudioController';
import { SPOTIFY_TRACK_URL } from '@/data/audio';
import type { SpotifyEmbedController as ControllerType } from '@/types/spotify-iframe';

type ButtonState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/** Inline Spotify SVG icon (16×16). */
function SpotifyIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={active ? 'var(--system-green)' : 'var(--text-muted)'}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 15.5c2.5-1 5.5-1 8 0"
        stroke={active ? 'var(--system-green)' : 'var(--text-muted)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 12.5c3-1.2 7-1.2 10 0"
        stroke={active ? 'var(--system-green)' : 'var(--text-muted)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 9.5c3.5-1.4 8.5-1.4 12 0"
        stroke={active ? 'var(--system-green)' : 'var(--text-muted)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpotifyMusicButton() {
  const { setSpotifyPlaying } = useAudio();
  const [state, setState] = useState<ButtonState>('idle');
  const [shouldMount, setShouldMount] = useState(false);
  const controllerRef = useRef<ControllerType | null>(null);
  const pendingPlayRef = useRef(false);

  const handleReady = useCallback(
    (controller: ControllerType) => {
      controllerRef.current = controller;
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        controller.togglePlay();
      }
    },
    [],
  );

  const handleError = useCallback(() => {
    setState('error');
    setSpotifyPlaying(false);
  }, [setSpotifyPlaying]);

  const handlePlaybackUpdate = useCallback(
    (data: { isPaused: boolean }) => {
      if (data.isPaused) {
        setState('paused');
        setSpotifyPlaying(false);
      } else {
        setState('playing');
        setSpotifyPlaying(true);
      }
    },
    [setSpotifyPlaying],
  );

  const handleClick = useCallback(() => {
    switch (state) {
      case 'idle': {
        setState('loading');
        pendingPlayRef.current = true;
        setShouldMount(true);
        break;
      }
      case 'loading': {
        // Still loading — ignore
        break;
      }
      case 'playing':
      case 'paused': {
        controllerRef.current?.togglePlay();
        break;
      }
      case 'error': {
        // Already showing fallback link — ignore button click
        break;
      }
    }
  }, [state]);

  const isActive = state === 'playing' || state === 'paused';
  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';
  const isError = state === 'error';

  const label = (() => {
    switch (state) {
      case 'idle':
      case 'paused':
        return 'PLAY THE CLASH';
      case 'loading':
        return 'UPLINK\u2026';
      case 'playing':
        return 'PAUSE SIGNAL';
      case 'error':
        return 'SPOTIFY UPLINK FAILED';
    }
  })();

  return (
    <>
      {/* Hidden Spotify embed container */}
      <SpotifyEmbedController
        shouldMount={shouldMount}
        onReady={handleReady}
        onError={handleError}
        onPlaybackUpdate={handlePlaybackUpdate}
      />

      {/* Visible button */}
      {isError ? (
        <a
          href={SPOTIFY_TRACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="spotify-btn"
          data-cursor="lock"
          id="spotify-music-button"
        >
          <span style={{ color: 'var(--alert-amber)' }}>⚠</span>
          <span>{label}</span>
          <span style={{ color: 'var(--cyan-pure)', marginLeft: 4 }}>
            — OPEN TRACK
          </span>
        </a>
      ) : (
        <button
          type="button"
          className="spotify-btn"
          onClick={handleClick}
          aria-pressed={isPlaying}
          aria-label={
            isPlaying
              ? 'Pause Spotify playback'
              : 'Play The Clash on Spotify'
          }
          data-cursor="lock"
          id="spotify-music-button"
        >
          {isLoading ? (
            <span className="spotify-btn__spinner" />
          ) : (
            <>
              {isPlaying && <span className="spotify-btn__pulse" />}
              <SpotifyIcon active={isActive} />
            </>
          )}
          <span>{label}</span>
        </button>
      )}
    </>
  );
}
